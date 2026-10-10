import { requireAdmin } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { projectMembers, projects, users } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { Users } from "lucide-react";
import { updateUserAssignments } from "@/lib/actions";
import { InviteForm } from "./invite-form";

export const dynamic = "force-dynamic";
const roles: Record<string, string> = { ADMIN:"Administração", GESTOR:"Gestão", COORDENADOR:"Coordenação", PROFESSOR:"Professor(a)", INTEGRANTE:"Integrante", COLABORADOR:"Colaborador(a)", JOGADOR_ASSOCIADO:"PIXEL Sports", VISUALIZADOR:"Visualizador" };
export default async function PeoplePage() {
  await requireAdmin();
  const db = getDb();
  const [rows, projectRows, assignmentRows] = await Promise.all([
    db.select({id:users.id,name:users.name,email:users.email,role:users.primaryRole,status:users.status}).from(users).orderBy(asc(users.name)),
    db.select({id:projects.id,name:projects.name}).from(projects).orderBy(asc(projects.name)),
    db.select({userId:projectMembers.userId,projectId:projectMembers.projectId}).from(projectMembers),
  ]);
  const projectsByUser = new Map<string, Set<string>>();
  for (const assignment of assignmentRows) {
    const current = projectsByUser.get(assignment.userId) ?? new Set<string>();
    current.add(assignment.projectId);
    projectsByUser.set(assignment.userId, current);
  }
  return <><div className="heading"><p className="eyebrow">COMUNIDADE</p><h1>Pessoas</h1><p>Convide integrantes e escolha em quais projetos cada pessoa pode trabalhar.</p></div>
    <section className="card form-card"><h2>Adicionar pessoa</h2><p className="muted">A pessoa recebe um convite de uso único, válido por sete dias, e cria a própria senha.</p><InviteForm projects={projectRows}/></section>
    <div className="section-title"><h2>Contas e projetos atribuídos</h2><span>{rows.length} pessoas</span></div>
    {rows.length?<div className="people-admin-list">{rows.map((person)=><article className="card person-admin-card" key={person.id}>
      <div className="person-admin-heading"><div className="avatar">{person.name.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()}</div><div><strong>{person.name}</strong><span>{person.email}</span><small>{roles[person.role] || person.role} · {person.status === "ACTIVE" ? "Ativa" : person.status}</small></div><i className={"status-dot " + person.status.toLowerCase()} title={person.status}/></div>
      {person.role === "ADMIN" ? <p className="muted">Administradores podem editar todos os projetos.</p> : <details className="assignment-details"><summary>Atribuir projetos</summary><form action={updateUserAssignments} className="assignment-form"><input type="hidden" name="userId" value={person.id}/><div className="assignment-options">{projectRows.map((project)=><label key={project.id}><input type="checkbox" name="projectIds" value={project.id} defaultChecked={projectsByUser.get(person.id)?.has(project.id)}/>{project.name}</label>)}</div><button className="btn btn-small" type="submit">Salvar atribuições</button></form></details>}
    </article>)}</div>:<div className="card empty"><Users size={26}/><strong>Nenhuma conta ainda</strong><span>Envie um convite para começar a configurar a equipe.</span></div>}
  </>;
}
