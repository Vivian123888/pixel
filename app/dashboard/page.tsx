import { getDb } from "@/lib/db";
import { calendarEvents, projects, tasks } from "@/lib/db/schema";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckCircle2, Circle, ClipboardList, FolderKanban, ListTodo, Users } from "lucide-react";

export const dynamic = "force-dynamic";
function saoPauloToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day), 3));
}
export default async function DashboardPage() {
  if (!process.env.DATABASE_URL) {
    return <><div className="welcome"><div><p className="eyebrow">PIXEL HUB</p><h1>Seu espaço de trabalho está pronto</h1><p>O acesso público foi ativado.</p></div></div><section className="card dash-panel"><h2>Conecte o banco de dados</h2><p>Para carregar projetos, tarefas, pessoas e agenda, configure a variável <strong>DATABASE_URL</strong> no projeto da Vercel e aplique as migrations do banco.</p><p>Depois de salvar a variável, faça um novo deployment para ativar os módulos.</p></section></>;
  }
  const db = getDb();
  const today = saoPauloToday();
  const tomorrow = new Date(today); tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  const [projectCount, openTasks, dueToday, projectRows, taskRows, events] = await Promise.all([
    db.select({value:count()}).from(projects),
    db.select({value:count()}).from(tasks).where(eq(tasks.status,"TODO")),
    db.select({value:count()}).from(tasks).where(and(gte(tasks.dueAt,today),lte(tasks.dueAt,tomorrow))),
    db.select({id:projects.id,name:projects.name,status:projects.status}).from(projects).orderBy(desc(projects.createdAt)).limit(3),
    db.select({id:tasks.id,title:tasks.title,dueAt:tasks.dueAt,priority:tasks.priority}).from(tasks).where(eq(tasks.status,"TODO")).orderBy(tasks.dueAt).limit(4),
    db.select({id:calendarEvents.id,title:calendarEvents.title,startsAt:calendarEvents.startsAt,kind:calendarEvents.kind}).from(calendarEvents).where(gte(calendarEvents.startsAt,today)).orderBy(calendarEvents.startsAt).limit(3),
  ]);
  const todayLabel = new Intl.DateTimeFormat("pt-BR", { timeZone:"America/Sao_Paulo", weekday:"long", day:"2-digit", month:"long" }).format(new Date());
  return <><div className="welcome"><div><p className="eyebrow">{todayLabel.toLocaleUpperCase("pt-BR")}</p><h1>O que vamos fazer acontecer?</h1><p>Seu espaço de trabalho para acompanhar o PIXEL.</p></div><Link className="btn" href="/dashboard/tasks"><ClipboardList size={17}/> Ver meu trabalho</Link></div>
    <section className="metric-grid">
      <Link href="/dashboard/projects" className="metric-card"><span>Projetos</span><strong>{projectCount[0]?.value??0}</strong><i><FolderKanban size={18}/></i><small>Iniciativas cadastradas</small></Link>
      <Link href="/dashboard/tasks" className="metric-card"><span>Tarefas em aberto</span><strong>{openTasks[0]?.value??0}</strong><i><ListTodo size={18}/></i><small>{dueToday[0]?.value??0} com prazo hoje</small></Link>
      <Link href="/dashboard/people" className="metric-card"><span>Comunidade</span><strong>PIXEL</strong><i><Users size={18}/></i><small>Pessoas e colaboradores</small></Link>
    </section>
    <section className="dashboard-columns"><div className="card dash-panel"><div className="panel-head"><div><h2>Meu trabalho</h2><p>Próximas tarefas</p></div><Link href="/dashboard/tasks">Ver todas <ArrowUpRight size={15}/></Link></div>
      {taskRows.length?taskRows.map(t=><div className="mini-row" key={t.id}><Circle size={17}/><div><strong>{t.title}</strong><span>{t.dueAt?"Prazo "+new Intl.DateTimeFormat("pt-BR").format(t.dueAt):"Sem prazo"}</span></div><span className={"priority-mark "+t.priority.toLowerCase()} /></div>):<div className="empty compact"><CheckCircle2 size={23}/><span>Nenhuma tarefa em aberto. Bom trabalho!</span></div>}
    </div><div className="card dash-panel"><div className="panel-head"><div><h2>Agenda</h2><p>Próximos compromissos</p></div><Link href="/dashboard/calendar">Calendário <ArrowUpRight size={15}/></Link></div>
      {events.length?events.map(e=><div className="agenda-mini" key={e.id}><div className="event-date small"><strong>{new Intl.DateTimeFormat("pt-BR",{day:"2-digit"}).format(e.startsAt)}</strong><span>{new Intl.DateTimeFormat("pt-BR",{month:"short"}).format(e.startsAt)}</span></div><div><strong>{e.title}</strong><span>{new Intl.DateTimeFormat("pt-BR",{weekday:"short",hour:"2-digit",minute:"2-digit"}).format(e.startsAt)}</span></div></div>):<div className="empty compact"><CalendarDays size={23}/><span>Nenhum compromisso próximo.</span></div>}
    </div></section>
    <section className="card dash-panel portfolio"><div className="panel-head"><div><h2>Projetos recentes</h2><p>O que está em movimento</p></div><Link href="/dashboard/projects">Ver projetos <ArrowUpRight size={15}/></Link></div>
    {projectRows.length?<div className="project-strip">{projectRows.map(p=><div className="project-chip" key={p.id}><BriefcaseBusiness size={17}/><div><strong>{p.name}</strong><span>{p.status==="ACTIVE"?"Ativo":p.status==="PLANNING"?"Planejamento":p.status==="PAUSED"?"Pausado":"Concluído"}</span></div></div>)}</div>:<div className="empty compact"><FolderKanban size={23}/><span>Crie o primeiro projeto para ver seu portfólio aqui.</span></div>}</section>
  </>;
}
