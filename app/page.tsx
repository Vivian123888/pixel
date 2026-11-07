import Link from "next/link";
import { asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { ArrowRight, Award, BriefcaseBusiness, CalendarDays, Gamepad2, LockKeyhole, Users } from "lucide-react";
import { getDb } from "@/lib/db";
import { moduleEntries, participants, projects, publicVisibility, users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function PublicHome() {
  if (!process.env.DATABASE_URL) return <main className="public-shell"><header className="public-top"><Link className="public-brand" href="/"><span className="brand-symbol"><i/><i/><i/><i/></span>PIXEL <b>Hub</b></Link><Link className="public-login" href="/login">Login dos membros <ArrowRight size={16}/></Link></header><section className="public-hero"><p className="eyebrow">CEFET/RJ · COMUNIDADE PIXEL</p><h1>Pesquisa, inovação<br/>e impacto em jogos.</h1><p>Conheça o portfólio e a comunidade do PIXEL Hub.</p><Link className="btn" href="/login">Entrar como membro</Link></section></main>;
  const db = getDb();
  const [visibility] = await db.select().from(publicVisibility).where(eq(publicVisibility.id, 1)).limit(1);
  const showActive = visibility?.showActiveMembers ?? true;
  const showFormer = visibility?.showFormerMembers ?? true;
  const showPortfolio = visibility?.showPortfolio ?? true;
  const showAwards = visibility?.showAwards ?? true;
  const [activeMembers, importedActive, formerMembers, portfolio, awardRows] = await Promise.all([
    showActive ? db.select({ id: users.id, name: users.name, pixelRole: users.pixelRole, enteredYear: users.enteredYear, projectName: projects.name, hasPhoto: isNotNull(users.profilePhotoData) }).from(users).leftJoin(projects, eq(users.profileProjectId, projects.id)).where(eq(users.status, "ACTIVE")).orderBy(asc(users.name)).limit(200) : [],
    showActive ? db.select({ id: participants.id, name: participants.name, linkedProject: participants.linkedProject, currentAffiliation: participants.currentAffiliation }).from(participants).where(isNull(participants.exitDate)).orderBy(asc(participants.name)).limit(500) : [],
    showFormer ? db.select({ id: participants.id, name: participants.name, linkedProject: participants.linkedProject, currentAffiliation: participants.currentAffiliation, exitDate: participants.exitDate }).from(participants).where(isNotNull(participants.exitDate)).orderBy(desc(participants.exitDate)).limit(200) : [],
    showPortfolio ? db.select({ id: projects.id, name: projects.name, description: projects.description, status: projects.status, sheetType: projects.sheetType }).from(projects).orderBy(asc(projects.name)).limit(100) : [],
    showAwards ? db.select({ id: moduleEntries.id, title: moduleEntries.title, description: moduleEntries.description, category: moduleEntries.category, status: moduleEntries.status, metadata: moduleEntries.metadata }).from(moduleEntries).where(eq(moduleEntries.module, "gamificacao")).orderBy(desc(moduleEntries.updatedAt)).limit(200) : [],
  ]);
  const keyForName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
  const linkedUserNames = new Set(importedActive.map((member) => keyForName(member.name)));
  const usersByName = new Map(activeMembers.map((member) => [keyForName(member.name), member]));
  const publicMembers = [
    ...importedActive.map((member) => {
      const linked = usersByName.get(keyForName(member.name));
      return { id: `sheet:${member.id}`, profileId: linked?.id ?? null, name: member.name, pixelRole: linked?.pixelRole || member.currentAffiliation, enteredYear: linked?.enteredYear ?? null, projectName: linked?.projectName || member.linkedProject, hasPhoto: linked?.hasPhoto ?? false };
    }),
    ...activeMembers.filter((member) => !linkedUserNames.has(keyForName(member.name))).map((member) => ({ ...member, profileId: member.id })),
  ];
  const awards = awardRows.filter((award) => /conquista|prêmio|premio|recompensa/i.test(award.category) && !["ARQUIVADO", "PENDENTE"].includes(award.status));
  const counts = [showActive && publicMembers.length ? { label: "Membros ativos", value: publicMembers.length, icon: Users } : null, showFormer && formerMembers.length ? { label: "Ex-membros", value: formerMembers.length, icon: Users } : null, showPortfolio ? { label: "Portfólio", value: portfolio.length, icon: BriefcaseBusiness } : null, showAwards ? { label: "Prêmios e conquistas", value: awards.length, icon: Award } : null].filter((item) => item !== null);

  return <main className="public-shell">
    <header className="public-top"><Link className="public-brand" href="/"><span className="brand-symbol"><i/><i/><i/><i/></span><span>PIXEL <b>Hub</b></span></Link><nav><a href="#portfolio">Portfólio</a><a href="#comunidade">Comunidade</a><a href="#premios">Prêmios</a></nav><Link className="public-login" href="/login"><LockKeyhole size={15}/> Login dos membros</Link></header>
    <section className="public-hero"><div><p className="eyebrow">CEFET/RJ · COMUNIDADE PIXEL</p><h1>Pesquisa, inovação<br/>e impacto em jogos.</h1><p>Um espaço de colaboração que conecta pessoas, projetos, ciência e desenvolvimento de jogos.</p><Link className="btn" href="/login">Entrar como membro <ArrowRight size={16}/></Link></div><div className="public-hero-art"><div className="public-orbit orbit-one"/><div className="public-orbit orbit-two"/><div className="public-game"><Gamepad2 size={64}/><span>PIXEL</span></div><div className="public-spark spark-one">✦</div><div className="public-spark spark-two">✧</div></div></section>
    {counts.length > 0 && <section className="public-metrics" aria-label="Resumo público">{counts.map(({ label, value, icon: Icon }) => <article className="public-stat" key={label}><i><Icon size={19}/></i><span>{label}</span><strong>{value}</strong></article>)}</section>}
    {showPortfolio && <section id="portfolio" className="public-section"><div className="public-section-head"><div><p className="eyebrow">PORTFÓLIO</p><h2>Projetos em destaque</h2></div><span>{portfolio.length} ativos</span></div>{portfolio.length ? <div className="public-projects">{portfolio.map((project) => <article className="public-project" key={project.id}><i><BriefcaseBusiness size={19}/></i><span>{project.sheetType || "Projeto PIXEL"}</span><h3>{project.name}</h3><p>{project.description || "Iniciativa em desenvolvimento pela comunidade PIXEL."}</p><a href="/login">Conheça a equipe <ArrowRight size={13}/></a></article>)}</div> : <div className="public-empty">Os projetos públicos aparecerão aqui quando forem cadastrados.</div>}</section>}
    {showActive && <section id="comunidade" className="public-section"><div className="public-section-head"><div><p className="eyebrow">COMUNIDADE</p><h2>Membros ativos</h2></div><span>{publicMembers.length} integrantes</span></div>{publicMembers.length ? <div className="public-people">{publicMembers.map((person) => <article className="public-person" key={person.id}>{person.hasPhoto && person.profileId ? <img src={`/api/profile-photo/${person.profileId}`} alt=""/> : <i>{person.name.split(/\s+/).slice(0,2).map((part)=>part[0]).join("").toUpperCase()}</i>}<strong>{person.name}</strong><span>{person.pixelRole || "Integrante PIXEL"}</span><small>{[person.enteredYear && `Desde ${person.enteredYear}`, person.projectName].filter(Boolean).join(" · ")}</small></article>)}</div> : <div className="public-empty">A lista de integrantes será exibida quando estiver disponível.</div>}</section>}
    {showFormer && <section className="public-section"><div className="public-section-head"><div><p className="eyebrow">TRAJETÓRIAS</p><h2>Quem já fez parte</h2></div><span>{formerMembers.length} pessoas</span></div>{formerMembers.length ? <div className="public-former">{formerMembers.map((person) => <article key={person.id}><strong>{person.name}</strong><span>{[person.linkedProject, person.currentAffiliation, person.exitDate && `Até ${person.exitDate}`].filter(Boolean).join(" · ")}</span></article>)}</div> : <div className="public-empty">Ex-membros serão exibidos nesta seção quando houver registros de saída.</div>}</section>}
    {showAwards && <section id="premios" className="public-section"><div className="public-section-head"><div><p className="eyebrow">RECONHECIMENTO</p><h2>Prêmios e conquistas</h2></div><span>{awards.length} registros</span></div>{awards.length ? <div className="public-awards">{awards.map((award) => <article key={award.id}><i><Award size={21}/></i><div><strong>{award.title}</strong><span>{award.description || award.category}</span></div>{typeof award.metadata.points === "number" && <b>{award.metadata.points} XP</b>}</article>)}</div> : <div className="public-empty">Prêmios e conquistas serão exibidos quando registrados no PIXEL Hub.</div>}</section>}
    <footer className="public-footer"><span>PIXEL Hub · CEFET/RJ</span><span>As informações públicas são escolhidas pela equipe do PIXEL.</span><Link href="/register">Cadastro de membros por código</Link></footer>
  </main>;
}

