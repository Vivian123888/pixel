import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowUpRight, Clock3, FileText, History, Plus, Layers3, CheckCircle2, Eye, ChevronRight, Download, ExternalLink, Users as UsersIcon } from "lucide-react";
import { requireUser } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { moduleEntries, moduleFileVersions, users } from "@/lib/db/schema";
import { isWorkspaceKey, workspaces } from "@/lib/modules";
import { createModuleEntry, updateModuleEntry } from "@/lib/actions";

export const dynamic = "force-dynamic";
const statuses = ["PLANEJAMENTO", "EM_ANDAMENTO", "EM_REVISAO", "PENDENTE", "APROVADO", "CONCLUIDO", "ARQUIVADO"] as const;
const statusLabel: Record<string, string> = { PLANEJAMENTO: "Planejamento", EM_ANDAMENTO: "Em andamento", EM_REVISAO: "Em revisão", PENDENTE: "Pendente", APROVADO: "Aprovado", CONCLUIDO: "Concluído", ARQUIVADO: "Arquivado" };
const lanes = [
  { title: "A fazer", statuses: ["PLANEJAMENTO", "PENDENTE"] },
  { title: "Em andamento", statuses: ["EM_ANDAMENTO"] },
  { title: "Em revisão", statuses: ["EM_REVISAO"] },
  { title: "Concluído", statuses: ["APROVADO", "CONCLUIDO", "ARQUIVADO"] },
];
const customFields: Record<string, { label: string; type: string; placeholder?: string }> = {
  dueDate: { label: "Prazo", type: "date" },
  progress: { label: "Progresso (%)", type: "number", placeholder: "0–100" },
  points: { label: "XP", type: "number", placeholder: "Pontos da missão" },
  beneficiaries: { label: "Beneficiários alcançados", type: "number" },
  link: { label: "Link ou referência", type: "url", placeholder: "https://..." },
  version: { label: "Versão", type: "text", placeholder: "v1.0" },
  platform: { label: "Plataforma", type: "text", placeholder: "PC, Android, Web..." },
  team: { label: "Equipe", type: "text", placeholder: "Nome da equipe" },
  target: { label: "Meta", type: "text", placeholder: "Meta planejada" },
  metricLabel: { label: "Indicador", type: "text", placeholder: "Indicador acompanhado" },
  partner: { label: "Parceiro", type: "text", placeholder: "Instituição parceira" },
  competency: { label: "Competência", type: "text", placeholder: "Competência avaliada" },
  hours: { label: "Carga horária semanal", type: "number", placeholder: "Horas" },
  score: { label: "Nota / desempenho", type: "number", placeholder: "0–5" },
};

function ExtraFields({ fields, metadata = {} }: { fields: readonly string[]; metadata?: Record<string, unknown> }) {
  return <>{fields.map((name) => {
    const field = customFields[name];
    if (!field) return null;
    return <label className="field" key={name}><span>{field.label}</span><input name={name} type={field.type} min={field.type === "number" ? 0 : undefined} max={name === "progress" ? 100 : undefined} maxLength={field.type === "text" ? 100 : undefined} defaultValue={metadata[name] == null ? "" : String(metadata[name])} placeholder={field.placeholder}/></label>;
  })}</>;
}

function AssigneeField({ people, value }: { people: { id: string; name: string }[]; value?: string | null }) {
  return <label className="field"><span>Responsável</span><select name="assigneeId" defaultValue={value ?? ""}><option value="">Quem criou</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>;
}

export default async function WorkspacePage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<{ categoria?: string }> }) {
  await requireUser();
  const [{ module }, query] = await Promise.all([params, searchParams]);
  if (!isWorkspaceKey(module)) return <div className="card empty"><FileText size={28}/><strong>Módulo não encontrado</strong><Link href="/dashboard">Voltar ao início</Link></div>;
  const workspace = workspaces[module];
  const categories: readonly string[] = workspace.categories;
  const fields: readonly string[] = workspace.fields;
  const category = categories.includes(query.categoria ?? "") ? query.categoria : undefined;
  const db = getDb();
  const [allRows, people, fileVersions] = await Promise.all([
    db.select({ id: moduleEntries.id, category: moduleEntries.category, title: moduleEntries.title, description: moduleEntries.description, status: moduleEntries.status, metadata: moduleEntries.metadata, assigneeId: moduleEntries.assigneeId, updatedAt: moduleEntries.updatedAt, owner: users.name }).from(moduleEntries).leftJoin(users, eq(moduleEntries.ownerId, users.id)).where(eq(moduleEntries.module, module)).orderBy(desc(moduleEntries.updatedAt)).limit(300),
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.status, "ACTIVE")).orderBy(users.name),
    db.select({ entryId: moduleFileVersions.entryId, version: moduleFileVersions.version, fileName: moduleFileVersions.fileName, createdAt: moduleFileVersions.createdAt }).from(moduleFileVersions).innerJoin(moduleEntries, eq(moduleFileVersions.entryId, moduleEntries.id)).where(eq(moduleEntries.module, module)).orderBy(desc(moduleFileVersions.version)).limit(400),
  ]);
  const rows = category ? allRows.filter((row) => row.category === category) : allRows;
  const active = allRows.filter((row) => !["CONCLUIDO", "ARQUIVADO", "APROVADO"].includes(row.status)).length;
  const review = allRows.filter((row) => row.status === "EM_REVISAO").length;
  const completed = allRows.filter((row) => ["CONCLUIDO", "APROVADO"].includes(row.status)).length;
  const peopleById = new Map(people.map((person) => [person.id, person.name]));
  const fileVersionsByEntry = new Map<string, typeof fileVersions>();
  for (const version of fileVersions) fileVersionsByEntry.set(version.entryId, [...(fileVersionsByEntry.get(version.entryId) ?? []), version]);
  const totalPoints = allRows.reduce((sum, row) => sum + (typeof row.metadata.points === "number" ? row.metadata.points : 0), 0);
  const totalBeneficiaries = allRows.reduce((sum, row) => sum + (typeof row.metadata.beneficiaries === "number" ? row.metadata.beneficiaries : 0), 0);
  const progressValues = allRows.map((row) => row.metadata.progress).filter((value): value is number => typeof value === "number");
  const averageProgress = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;
  const Icon = workspace.Icon;
  const formatDate = (value: unknown) => typeof value === "string" ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`)) : "";

  return <>
    <div className="workspace-breadcrumb"><Link href="/dashboard">PIXEL Hub</Link><ChevronRight size={13}/><span>{workspace.title}</span><span className="breadcrumb-dot">·</span><span>{category ?? "Visão geral"}</span></div>
    <div className="workspace-hero"><div className="workspace-title"><div className="workspace-icon"><Icon size={25}/></div><div><div className="workspace-title-line"><p className="eyebrow">{workspace.eyebrow}</p><span className="coverage-pill">Cobertura: {workspace.coverage}</span></div><h1>{workspace.title}</h1><p>{workspace.description}</p></div></div><div className="coverage-card"><Icon size={27}/><div><strong>{allRows.length} registros</strong><span>no espaço de trabalho</span></div><ChevronRight size={16}/></div></div>
    <nav className="workspace-tabs"><Link className={!category ? "selected" : ""} href={`/dashboard/modules/${module}`}><Layers3 size={15}/> Visão geral</Link>{categories.map((item, index) => <Link key={item} className={category === item ? "selected" : ""} href={`/dashboard/modules/${module}?categoria=${encodeURIComponent(item)}`}>{index === 0 ? <FileText size={14}/> : <span className="tab-dot"/>}{item}</Link>)}</nav>
    <section className="metric-grid workspace-metrics"><div className="metric-card metric-blue"><span>{module === "gamificacao" ? "XP registrado" : module === "extensao" ? "Beneficiários" : module === "pessoas" ? "Etapas de jornada" : "Registros ativos"}</span><strong>{module === "gamificacao" ? totalPoints.toLocaleString("pt-BR") : module === "extensao" ? totalBeneficiaries.toLocaleString("pt-BR") : module === "pessoas" ? allRows.length : active}</strong><i><Layers3 size={19}/></i><small>{module === "gamificacao" ? "Pontos nas missões registradas" : module === "extensao" ? "Pessoas alcançadas nas ações" : module === "pessoas" ? "Vagas, onboarding e desenvolvimento" : "Em planejamento e andamento"}</small></div><div className="metric-card metric-green"><span>{module === "projetos" ? "Progresso médio" : "Concluídos"}</span><strong>{module === "projetos" ? `${averageProgress}%` : completed}</strong><i><CheckCircle2 size={19}/></i><small>{module === "projetos" ? `${progressValues.length} projetos com progresso informado` : "Itens aprovados ou concluídos"}</small></div><div className="metric-card metric-purple"><span>{module === "sports" ? "Equipes" : module === "pesquisa" ? "Artigos e projetos" : "Em revisão"}</span><strong>{module === "sports" ? new Set(allRows.map((row) => row.metadata.team).filter((team): team is string => typeof team === "string" && !!team)).size : module === "pesquisa" ? allRows.filter((row) => /artigo|manuscrito|projeto/i.test(`${row.category} ${row.title}`)).length : review}</strong><i><Eye size={19}/></i><small>{module === "sports" ? "Equipes com registros no módulo" : module === "pesquisa" ? "Itens de pesquisa cadastrados" : "Aguardando análise da equipe"}</small></div><Link href="/dashboard/history" className="metric-card metric-amber"><span>Rastreabilidade</span><strong>Histórico</strong><i><History size={19}/></i><small>Consulte alterações e responsáveis</small></Link></section>
    <section className="workspace-list-head"><div><h2>{category ?? "Fluxo de trabalho"}</h2><p>Quadro atualizado pela comunidade PIXEL</p></div><details className="workspace-new"><summary><Plus size={16}/> Novo registro</summary><div className="workspace-popover"><form action={createModuleEntry} className="workspace-form" encType="multipart/form-data"><input type="hidden" name="module" value={module}/><label className="field"><span>Área</span><select name="category" required>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field workspace-wide"><span>Título</span><input name="title" required minLength={2} maxLength={220} placeholder="Título do registro"/></label><label className="field workspace-description"><span>Descrição</span><textarea name="description" rows={2} maxLength={3000} placeholder="Contexto, próximos passos ou observações"/></label><AssigneeField people={people}/><ExtraFields fields={fields}/>{module === "arquivos" && <label className="field workspace-wide"><span>Arquivo (máximo 3 MB)</span><input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,.xlsx,.pptx"/></label>}<label className="field"><span>Status</span><select name="status" defaultValue="PLANEJAMENTO">{statuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></label><button className="btn" type="submit">Adicionar ao fluxo <ArrowUpRight size={16}/></button></form></div></details></section>
    <section className="workspace-board" aria-label="Quadro de trabalho">
      {lanes.map((lane) => {
        const laneStatuses: readonly string[] = lane.statuses;
        const laneRows = rows.filter((row) => laneStatuses.includes(row.status));
        return <div className="workspace-lane" key={lane.title}><header><span className={`lane-indicator ${lane.title.toLowerCase().replaceAll(" ", "-")}`}/><h3>{lane.title}</h3><span className="lane-count">{laneRows.length}</span></header><div className="lane-cards">{laneRows.map((row) => {
          const metadata = row.metadata ?? {};
          const progress = typeof metadata.progress === "number" ? Math.max(0, Math.min(metadata.progress, 100)) : null;
          const fileName = typeof metadata.fileName === "string" ? metadata.fileName : null;
          const assignee = row.assigneeId ? peopleById.get(row.assigneeId) : row.owner;
          return <article className="card workspace-record" key={row.id}><div className="record-top"><span className="record-category">{row.category}</span><span className={`badge record-status ${row.status.toLowerCase()}`}>{statusLabel[row.status] ?? row.status}</span></div><h2>{row.title}</h2>{row.description && <p>{row.description}</p>}{progress !== null && <div className="record-progress"><div><span>Progresso</span><b>{progress}%</b></div><span><i style={{ width: `${progress}%` }}/></span></div>}<div className="record-meta">{metadata.dueDate && <span><Clock3 size={12}/>{formatDate(metadata.dueDate)}</span>}{typeof metadata.points === "number" && <span className="xp-pill">✦ {metadata.points} XP</span>}{typeof metadata.beneficiaries === "number" && <span><UsersIcon size={12}/>{metadata.beneficiaries} pessoas</span>}{typeof metadata.team === "string" && <span>{metadata.team}</span>}{typeof metadata.platform === "string" && <span>{metadata.platform}</span>}{typeof metadata.version === "string" && <span>v{metadata.version.replace(/^v/, "")}</span>}{typeof metadata.hours === "number" && <span>{metadata.hours} h/semana</span>}{typeof metadata.competency === "string" && <span>{metadata.competency}</span>}{typeof metadata.partner === "string" && <span>{metadata.partner}</span>}{typeof metadata.metricLabel === "string" && <span>{metadata.metricLabel}</span>}</div>{typeof metadata.link === "string" && <a className="record-link" href={metadata.link} target="_blank" rel="noreferrer"><ExternalLink size={12}/> Abrir referência</a>}{fileName && <div className="record-file"><FileText size={14}/><span>{fileName}</span><a href={`/api/files/${row.id}?inline=1`} target="_blank" aria-label="Visualizar arquivo"><Eye size={14}/></a><a href={`/api/files/${row.id}`} aria-label="Baixar arquivo"><Download size={14}/></a></div>}{fileName && (fileVersionsByEntry.get(row.id)?.length ?? 0) > 0 && <details className="file-history"><summary>Histórico de versões · v{String(metadata.fileVersion ?? 1)}</summary>{fileVersionsByEntry.get(row.id)?.map((version) => <a key={version.version} href={`/api/files/${row.id}?version=${version.version}`}><span>v{version.version} · {version.fileName}</span><time>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(version.createdAt)}</time></a>)}</details>}<div className="record-bottom"><span className="record-owner"><i>{(assignee ?? "I").slice(0,1).toUpperCase()}</i>{assignee ?? "Sem responsável"}</span><time dateTime={row.updatedAt.toISOString()}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(row.updatedAt)}</time></div><details className="record-edit"><summary>Editar ou mover <ChevronRight size={13}/></summary><form action={updateModuleEntry} className="workspace-form" encType="multipart/form-data"><input type="hidden" name="module" value={module}/><input type="hidden" name="id" value={row.id}/><label className="field"><span>Área</span><select name="category" defaultValue={row.category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field workspace-wide"><span>Título</span><input name="title" required defaultValue={row.title}/></label><label className="field workspace-description"><span>Descrição</span><textarea name="description" rows={2} defaultValue={row.description ?? ""}/></label><AssigneeField people={people} value={row.assigneeId}/><ExtraFields fields={fields} metadata={metadata}/>{module === "arquivos" && <label className="field workspace-wide"><span>Substituir arquivo (nova versão)</span><input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,.xlsx,.pptx"/></label>}<label className="field"><span>Status</span><select name="status" defaultValue={row.status}>{statuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></label><button className="btn" type="submit">Salvar alterações</button></form></details></article>;
        })}{!laneRows.length && <div className="lane-empty">Nenhum item nesta etapa</div>}</div></div>;
      })}
    </section>
    {!rows.length && <div className="card empty workspace-empty"><FileText size={27}/><strong>{category ? `Nenhum registro em “${category}”` : "Este fluxo ainda está vazio"}</strong><span>Adicione o primeiro item pelo botão “Novo registro”.</span></div>}
  </>;
}

