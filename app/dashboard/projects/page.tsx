import { createProject, updateProject } from "@/lib/actions";
import { requireUser } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { ClipboardList, FolderKanban, Plus } from "lucide-react";

export const dynamic = "force-dynamic";
const states: Record<string, string> = { PLANNING: "Planejamento", ACTIVE: "Ativo", PAUSED: "Pausado", COMPLETED: "Concluído", ARCHIVED: "Arquivado" };
export default async function ProjectsPage() {
  await requireUser();
  const rows = await getDb().select().from(projects).orderBy(desc(projects.createdAt));
  const [openTasks] = await getDb().select({ value: count() }).from(tasks).where(eq(tasks.status, "TODO"));
  const active = rows.filter((project) => project.status === "ACTIVE").length;
  const planning = rows.filter((project) => project.status === "PLANNING").length;
  return <><div className="heading"><div><p className="eyebrow">PORTFÓLIO</p><h1>Projetos &amp; Produtos</h1><p>Acompanhe iniciativas, equipes e entregas do grupo, da concepção ao pós-lançamento.</p><Link className="btn btn-small" href="/dashboard/modules/projetos"><ClipboardList size={16}/> Abrir ciclo de vida G3.01–G3.30</Link></div></div>
    <section className="metric-grid workspace-metrics"><div className="metric-card metric-blue"><span>Projetos cadastrados</span><strong>{rows.length}</strong><i><FolderKanban size={19}/></i><small>Portfólio atual do PIXEL</small></div><div className="metric-card metric-green"><span>Ativos</span><strong>{active}</strong><i><FolderKanban size={19}/></i><small>Em execução</small></div><div className="metric-card metric-purple"><span>Em planejamento</span><strong>{planning}</strong><i><Plus size={19}/></i><small>Preparação e concepção</small></div><Link className="metric-card metric-amber" href="/dashboard/tasks"><span>Tarefas abertas</span><strong>{openTasks.value}</strong><i><ClipboardList size={19}/></i><small>Entregas aguardando ação</small></Link></section>
    <section className="card form-card"><h2><Plus size={18}/> Novo projeto</h2><form action={createProject} className="form-grid">
      <label className="field">Nome<input name="name" required minLength={2} maxLength={180} placeholder="Ex.: Laboratório de jogos acessíveis"/></label>
      <label className="field">Status<select name="status" defaultValue="PLANNING"><option value="PLANNING">Planejamento</option><option value="ACTIVE">Ativo</option><option value="PAUSED">Pausado</option><option value="COMPLETED">Concluído</option></select></label>
      <label className="field">Sigla<input name="sheetAcronym" maxLength={180}/></label><label className="field">Tipo<input name="sheetType" maxLength={120}/></label><label className="field wide">Público-alvo<input name="sheetTargetAudience" maxLength={1000}/></label>
      <label className="field wide">Descrição<textarea name="description" rows={2} maxLength={2000} placeholder="Objetivo e escopo do projeto"/></label><button className="btn">Criar projeto</button>
    </form></section>
    <div className="section-title"><h2>Todos os projetos</h2><span>{rows.length} iniciativas</span></div>
    {rows.length ? <div className="project-grid">{rows.map((p)=><article className="card project-card" key={p.id}><div className="project-icon"><FolderKanban size={20}/></div><span className={"badge " + p.status.toLowerCase()}>{states[p.status]}</span><h3>{p.name}</h3><p className="muted">{p.description || "Sem descrição adicionada."}</p>{(p.sheetAcronym || p.sheetType || p.sheetTargetAudience) && <p className="muted">{[p.sheetAcronym && `Sigla: ${p.sheetAcronym}`, p.sheetType && `Tipo: ${p.sheetType}`, p.sheetTargetAudience && `Público: ${p.sheetTargetAudience}`].filter(Boolean).join(" · ")}</p>}
      <details className="project-edit"><summary>Editar projeto</summary><form action={updateProject} className="form-grid"><input type="hidden" name="id" value={p.id}/><label className="field">Nome<input name="name" required minLength={2} maxLength={180} defaultValue={p.name}/></label><label className="field">Status<select name="status" defaultValue={p.status}><option value="PLANNING">Planejamento</option><option value="ACTIVE">Ativo</option><option value="PAUSED">Pausado</option><option value="COMPLETED">Concluído</option><option value="ARCHIVED">Arquivado</option></select></label><label className="field">Sigla<input name="sheetAcronym" maxLength={180} defaultValue={p.sheetAcronym ?? ""}/></label><label className="field">Tipo<input name="sheetType" maxLength={120} defaultValue={p.sheetType ?? ""}/></label><label className="field wide">Público-alvo<input name="sheetTargetAudience" maxLength={1000} defaultValue={p.sheetTargetAudience ?? ""}/></label><label className="field wide">Descrição<textarea name="description" rows={3} maxLength={2000} defaultValue={p.description ?? ""}/></label><button className="btn btn-small" type="submit">Salvar alterações</button></form></details>
      <div className="project-footer">Criado em {new Intl.DateTimeFormat("pt-BR").format(p.createdAt)}</div></article>)}</div> : <div className="card empty"><FolderKanban size={26}/><strong>Nenhum projeto ainda</strong><span>Crie a primeira iniciativa do PIXEL.</span></div>}
  </>;
}

