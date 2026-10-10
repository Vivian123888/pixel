import { createProject, updateProject } from "@/lib/actions";
import { getEditableProjectIds, requireUser } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { FolderKanban, Plus } from "lucide-react";

export const dynamic = "force-dynamic";
const states: Record<string, string> = { PLANNING: "Planejamento", ACTIVE: "Ativo", PAUSED: "Pausado", COMPLETED: "Concluído", ARCHIVED: "Arquivado" };
export default async function ProjectsPage() {
  const user = await requireUser();
  const rows = await getDb().select().from(projects).orderBy(desc(projects.createdAt));
  const editableIds = user.role === "ADMIN" ? new Set(rows.map((row) => row.id)) : new Set(await getEditableProjectIds(user.id));
  return <><div className="heading"><div><p className="eyebrow">PORTFÓLIO</p><h1>Projetos</h1><p>Acompanhe iniciativas, equipes e entregas do grupo.</p></div></div>
    {user.role === "ADMIN" && <section className="card form-card"><h2><Plus size={18}/> Novo projeto</h2><form action={createProject} className="form-grid">
      <label className="field">Nome<input name="name" required minLength={2} maxLength={180} placeholder="Ex.: Laboratório de jogos acessíveis"/></label>
      <label className="field">Status<select name="status" defaultValue="PLANNING"><option value="PLANNING">Planejamento</option><option value="ACTIVE">Ativo</option><option value="PAUSED">Pausado</option><option value="COMPLETED">Concluído</option></select></label>
      <label className="field">Sigla<input name="sheetAcronym" maxLength={180}/></label><label className="field">Tipo<input name="sheetType" maxLength={120}/></label><label className="field wide">Público-alvo<input name="sheetTargetAudience" maxLength={1000}/></label>
      <label className="field wide">Descrição<textarea name="description" rows={2} maxLength={2000} placeholder="Objetivo e escopo do projeto"/></label><button className="btn">Criar projeto</button>
    </form></section>}
    <div className="section-title"><h2>Todos os projetos</h2><span>{rows.length} iniciativas</span></div>
    {rows.length ? <div className="project-grid">{rows.map((p)=><article className="card project-card" key={p.id}><div className="project-icon"><FolderKanban size={20}/></div><span className={"badge " + p.status.toLowerCase()}>{states[p.status]}</span><h3>{p.name}</h3><p className="muted">{p.description || "Sem descrição adicionada."}</p>{(p.sheetAcronym || p.sheetType || p.sheetTargetAudience) && <p className="muted">{[p.sheetAcronym && `Sigla: ${p.sheetAcronym}`, p.sheetType && `Tipo: ${p.sheetType}`, p.sheetTargetAudience && `Público: ${p.sheetTargetAudience}`].filter(Boolean).join(" · ")}</p>}
      {editableIds.has(p.id) && <details className="project-edit"><summary>Editar projeto</summary><form action={updateProject} className="form-grid"><input type="hidden" name="id" value={p.id}/><label className="field">Nome<input name="name" required minLength={2} maxLength={180} defaultValue={p.name}/></label><label className="field">Status<select name="status" defaultValue={p.status}><option value="PLANNING">Planejamento</option><option value="ACTIVE">Ativo</option><option value="PAUSED">Pausado</option><option value="COMPLETED">Concluído</option><option value="ARCHIVED">Arquivado</option></select></label><label className="field">Sigla<input name="sheetAcronym" maxLength={180} defaultValue={p.sheetAcronym ?? ""}/></label><label className="field">Tipo<input name="sheetType" maxLength={120} defaultValue={p.sheetType ?? ""}/></label><label className="field wide">Público-alvo<input name="sheetTargetAudience" maxLength={1000} defaultValue={p.sheetTargetAudience ?? ""}/></label><label className="field wide">Descrição<textarea name="description" rows={3} maxLength={2000} defaultValue={p.description ?? ""}/></label><button className="btn btn-small" type="submit">Salvar alterações</button></form></details>}
      <div className="project-footer">Criado em {new Intl.DateTimeFormat("pt-BR").format(p.createdAt)}</div></article>)}</div> : <div className="card empty"><FolderKanban size={26}/><strong>Nenhum projeto ainda</strong><span>A administração pode registrar a primeira iniciativa do PIXEL.</span></div>}
  </>;
}
