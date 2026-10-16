import Link from "next/link";
import { ilike, or, desc } from "drizzle-orm";
import { Search, FolderKanban, Users, FileText, Layers3 } from "lucide-react";
import { requireUser } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { moduleEntries, participants, projects, users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser();
  const query = (await searchParams).q?.trim().slice(0, 120) ?? "";
  const db = getDb();
  const [projectRows, peopleRows, participantRows, entryRows] = query ? await Promise.all([
    db.select({ id: projects.id, name: projects.name, description: projects.description }).from(projects).where(or(ilike(projects.name, `%${query}%`), ilike(projects.description, `%${query}%`))).orderBy(desc(projects.createdAt)).limit(30),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`))).limit(30),
    db.select({ id: participants.id, name: participants.name, matricula: participants.matricula, linkedProject: participants.linkedProject }).from(participants).where(or(ilike(participants.name, `%${query}%`), ilike(participants.matricula, `%${query}%`), ilike(participants.linkedProject, `%${query}%`))).limit(30),
    db.select({ id: moduleEntries.id, module: moduleEntries.module, title: moduleEntries.title, category: moduleEntries.category, description: moduleEntries.description }).from(moduleEntries).where(or(ilike(moduleEntries.title, `%${query}%`), ilike(moduleEntries.category, `%${query}%`), ilike(moduleEntries.description, `%${query}%`))).orderBy(desc(moduleEntries.updatedAt)).limit(50),
  ]) : [[], [], [], []];
  const results = [
    ...projectRows.map((item) => ({ title: item.name, detail: item.description || "Projeto", href: "/dashboard/projects", icon: FolderKanban })),
    ...peopleRows.map((item) => ({ title: item.name, detail: item.email, href: "/dashboard/people", icon: Users })),
    ...participantRows.map((item) => ({ title: item.name, detail: [item.matricula && `Matrícula ${item.matricula}`, item.linkedProject].filter(Boolean).join(" · "), href: "/dashboard/people", icon: Users })),
    ...entryRows.map((item) => ({ title: item.title, detail: `${item.category} · ${item.description || "Registro"}`, href: `/dashboard/modules/${item.module}`, icon: item.module === "arquivos" ? FileText : Layers3 })),
  ];
  return <><div className="heading"><p className="eyebrow">BUSCA GLOBAL</p><h1>Pesquisar no PIXEL Hub</h1><p>Encontre projetos, contas, integrantes da planilha e registros dos módulos.</p></div><form action="/dashboard/search" className="search-page-form"><Search size={18}/><input name="q" defaultValue={query} autoFocus placeholder="Digite um nome, projeto, processo ou documento"/><button className="btn" type="submit">Buscar</button></form>{query && <div className="section-title"><h2>Resultados para “{query}”</h2><span>{results.length} encontrados</span></div>}{!query ? <div className="card empty"><Search size={26}/><strong>Digite algo para buscar</strong><span>A busca percorre projetos, pessoas e os oito espaços de trabalho.</span></div> : results.length ? <div className="search-results">{results.map((result,index) => <Link className="card search-result" href={result.href} key={`${result.href}-${result.title}-${index}`}><i><result.icon size={18}/></i><span><strong>{result.title}</strong><small>{result.detail}</small></span><span className="search-open">Abrir →</span></Link>)}</div> : <div className="card empty"><Search size={26}/><strong>Nenhum resultado</strong><span>Tente outro nome, área ou palavra-chave.</span></div>}</>;
}

