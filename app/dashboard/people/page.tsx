import { requireUser } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";
export default async function PeoplePage() {
  await requireUser();
  const rows = await getDb().select({ id: users.id, name: users.name, status: users.status }).from(users).orderBy(asc(users.name));
  return <><div className="heading"><p className="eyebrow">COMUNIDADE</p><h1>Pessoas</h1><p>Integrantes com acesso ao PIXEL Hub.</p></div>
    <section className="card form-card"><h2>Adicionar pessoa</h2><p className="muted">Compartilhe o código de cadastro da equipe. Cada pessoa cria a própria conta e senha em <a href="/register">/register</a>. O código fica nas variáveis privadas do Vercel.</p></section>
    <div className="section-title"><h2>Contas cadastradas</h2><span>{rows.length} pessoas</span></div>
    {rows.length ? <div className="people-grid">{rows.map((person) => <article className="card person-card" key={person.id}><div className="avatar">{person.name.split(/\s+/).slice(0, 2).map((name) => name[0]).join("").toUpperCase()}</div><div><strong>{person.name}</strong><span>{person.status === "ACTIVE" ? "Conta ativa" : `Conta ${person.status.toLowerCase()}`}</span></div><i className={`status-dot ${person.status.toLowerCase()}`} title={person.status}/></article>)}</div> : <div className="card empty"><Users size={26}/><strong>Nenhuma conta ainda</strong><span>Compartilhe o código para que a equipe crie as primeiras contas.</span></div>}
  </>;
}
