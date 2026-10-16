import Link from "next/link";
import { asc, count, desc, eq } from "drizzle-orm";
import { CalendarCheck, Clock3, UserRoundPlus, Users } from "lucide-react";
import { requireUser } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { moduleEntries, participants, users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export default async function PeoplePage() {
  await requireUser();
  const db = getDb();
  const [rows, imported, activeCount, journey] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, status: users.status, createdAt: users.createdAt }).from(users).orderBy(asc(users.name)),
    db.select().from(participants).orderBy(asc(participants.name)).limit(300),
    db.select({ value: count() }).from(users).where(eq(users.status, "ACTIVE")),
    db.select({ id: moduleEntries.id, title: moduleEntries.title, category: moduleEntries.category, status: moduleEntries.status, metadata: moduleEntries.metadata, updatedAt: moduleEntries.updatedAt }).from(moduleEntries).where(eq(moduleEntries.module, "pessoas")).orderBy(desc(moduleEntries.updatedAt)).limit(8),
  ]);
  const present = imported.filter((person) => person.attendanceStatus && /presen|presente|sim/i.test(person.attendanceStatus)).length;
  return <>
    <div className="workspace-breadcrumb"><Link href="/dashboard">PIXEL Hub</Link><span>·</span><span>Pessoas &amp; Jornada</span></div>
    <div className="heading"><p className="eyebrow">CICLO DE VIDA DA COMUNIDADE</p><h1>Pessoas &amp; Jornada</h1><p>Acompanhe integrantes, vínculos da planilha, presença, alocação e etapas de desenvolvimento.</p></div>
    <section className="metric-grid workspace-metrics">
      <div className="metric-card metric-blue"><span>Contas ativas</span><strong>{activeCount[0]?.value ?? 0}</strong><i><Users size={19}/></i><small>Pessoas com acesso ao Hub</small></div>
      <div className="metric-card metric-green"><span>Integrantes importados</span><strong>{imported.length}</strong><i><UserRoundPlus size={19}/></i><small>Registros da planilha vinculada</small></div>
      <div className="metric-card metric-purple"><span>Presenças registradas</span><strong>{present}</strong><i><CalendarCheck size={19}/></i><small>Com situação de presença informada</small></div>
      <Link className="metric-card metric-amber" href="/dashboard/modules/pessoas"><span>Jornada</span><strong>{journey.length} etapas</strong><i><Clock3 size={19}/></i><small>Vagas, onboarding, alocação e competências</small></Link>
    </section>
    <div className="section-title"><h2>Diretório de integrantes</h2><span>{rows.length} contas</span></div>
    {rows.length ? <div className="people-grid">{rows.map((person) => <article className="card person-card" key={person.id}><div className="avatar">{person.name.split(/\s+/).slice(0, 2).map((name) => name[0]).join("").toUpperCase()}</div><div><strong>{person.name}</strong><span>{person.email}</span><small>{person.status === "ACTIVE" ? "Conta ativa" : `Conta ${person.status.toLowerCase()}`}</small></div><i className={`status-dot ${person.status.toLowerCase()}`} title={person.status}/></article>)}</div> : <div className="card empty"><Users size={26}/><strong>Nenhuma conta ainda</strong><span>Compartilhe o código de cadastro para que a equipe crie as primeiras contas.</span></div>}
    <section className="dashboard-columns people-columns">
      <div className="card dash-panel"><div className="panel-head"><div><h2>Integrantes da planilha</h2><p>Nomes, matrículas, projeto e presença importados</p></div><Link href="/dashboard/modules/pessoas">Gerenciar jornada →</Link></div>
        {imported.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Nome</th><th>Matrícula</th><th>Projeto</th><th>Presença</th></tr></thead><tbody>{imported.map((person) => <tr key={person.id}><td>{person.name}</td><td>{person.matricula || "—"}</td><td>{person.linkedProject || person.currentAffiliation || "—"}</td><td>{person.attendanceStatus || "—"}{person.attendanceDate ? ` · ${new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${person.attendanceDate}T12:00:00Z`))}` : ""}</td></tr>)}</tbody></table></div> : <div className="empty compact"><Users size={21}/><span>Ainda não há pessoas importadas da planilha.</span></div>}
      </div>
      <div className="card dash-panel"><div className="panel-head"><div><h2>Jornada em andamento</h2><p>Atualizações recentes do módulo Pessoas</p></div><Link href="/dashboard/modules/pessoas">Abrir módulo →</Link></div>
        {journey.length ? journey.map((item) => <div className="mini-row" key={item.id}><Clock3 size={16}/><div><strong>{item.title}</strong><span>{item.category} · {item.status.replaceAll("_", " ")}</span></div></div>) : <div className="empty compact"><Clock3 size={21}/><span>Cadastre etapas de onboarding, presença, competências ou orientação no módulo de jornada.</span></div>}
      </div>
    </section>
  </>;
}

