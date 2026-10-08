import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { Users } from "lucide-react";
export const dynamic = "force-dynamic";
const roles: Record<string, string> = { ADMIN:"Administração", GESTOR:"Gestão", COORDENADOR:"Coordenação", PROFESSOR:"Professor(a)", INTEGRANTE:"Integrante", COLABORADOR:"Colaborador(a)", JOGADOR_ASSOCIADO:"PIXEL Sports", VISUALIZADOR:"Visualizador" };
export default async function PeoplePage() {
  const rows = await getDb().select({id:users.id,name:users.name,email:users.email,role:users.primaryRole,status:users.status}).from(users).orderBy(asc(users.name));
  return <><div className="heading"><p className="eyebrow">COMUNIDADE</p><h1>Pessoas</h1><p>Integrantes e colaboradores cadastrados no PIXEL.</p></div>
    <div className="section-title"><h2>Diretório</h2><span>{rows.length} pessoas</span></div>
    {rows.length?<div className="people-grid">{rows.map((person)=><article className="card person-card" key={person.id}><div className="avatar">{person.name.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()}</div><div><strong>{person.name}</strong><span>{person.email}</span><small>{roles[person.role] || person.role}</small></div><i className={"status-dot " + person.status.toLowerCase()} title={person.status}/></article>)}</div>:<div className="card empty"><Users size={26}/><strong>Diretório vazio</strong><span>Os perfis serão exibidos quando o administrador cadastrar integrantes.</span></div>}
  </>;
}
