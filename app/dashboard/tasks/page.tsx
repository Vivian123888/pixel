import { createTask, markTaskDone } from "@/lib/actions";
import { getDb } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { Check, Circle, ListTodo } from "lucide-react";

export const dynamic = "force-dynamic";
const priorities: Record<string, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", URGENT: "Urgente" };
export default async function TasksPage() {
  const db = getDb();
  const [rows, projectRows] = await Promise.all([
    db.select({ id: tasks.id, title: tasks.title, description: tasks.description, status: tasks.status, priority: tasks.priority, dueAt: tasks.dueAt, projectName: projects.name }).from(tasks).leftJoin(projects, eq(tasks.projectId, projects.id)).orderBy(asc(tasks.dueAt), desc(tasks.createdAt)),
    db.select({ id: projects.id, name: projects.name }).from(projects).orderBy(asc(projects.name)),
  ]);
  return <><div className="heading"><p className="eyebrow">EXECUÇÃO</p><h1>Tarefas</h1><p>Organize próximos passos e acompanhe o que já foi concluído.</p></div>
    <section className="card form-card"><h2>Adicionar tarefa</h2><form action={createTask} className="form-grid">
      <label className="field">Tarefa<input name="title" required maxLength={220} placeholder="O que precisa ser feito?"/></label>
      <label className="field">Prioridade<select name="priority" defaultValue="MEDIUM"><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select></label>
      <label className="field">Projeto<select name="projectId" defaultValue=""><option value="">Sem projeto</option>{projectRows.map((p)=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
      <label className="field">Prazo<input type="date" name="dueAt"/></label>
      <label className="field wide">Detalhes<textarea name="description" rows={2} maxLength={2000}/></label><button className="btn">Adicionar tarefa</button>
    </form></section>
    <div className="section-title"><h2>Lista de tarefas</h2><span>{rows.filter(t=>t.status!=="DONE").length} em aberto</span></div>
    <div className="task-list">{rows.map((task)=><article className={"card task-row " + (task.status==="DONE"?"done":"")} key={task.id}>
      {task.status==="DONE" ? <span className="task-check checked"><Check size={15}/></span> : <form action={markTaskDone}><input type="hidden" name="id" value={task.id}/><button className="task-check" aria-label={"Concluir " + task.title}><Circle size={20}/></button></form>}
      <div className="task-main"><strong>{task.title}</strong><span>{task.projectName || "Pessoal"}{task.dueAt ? " · Prazo " + new Intl.DateTimeFormat("pt-BR").format(task.dueAt) : ""}</span>{task.description&&<small>{task.description}</small>}</div><span className={"badge priority-" + task.priority.toLowerCase()}>{priorities[task.priority]}</span>
    </article>)}{!rows.length&&<div className="card empty"><ListTodo size={26}/><strong>Sua lista começa aqui</strong><span>Registre uma tarefa para organizar o trabalho do grupo.</span></div>}</div>
  </>;
}
