import Link from "next/link";
import { Search, Bell, ChevronDown, Sparkles } from "lucide-react";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/auth/permissions";
import { DashboardNav } from "./dashboard-nav";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { and, count, eq, isNull } from "drizzle-orm";

export default async function DashboardLayout({children}:{children:React.ReactNode}) {
  const user = await requireUser();
  const unread = await getDb().select({ value: count() }).from(notifications).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }
  return <div className="shell"><header className="topbar"><Link href="/dashboard" className="top-brand"><span className="brand-symbol"><i/><i/><i/><i/></span><span>PIXEL <b>Hub</b></span></Link><span className="top-crumb">Pessoas <i>·</i> Projetos <i>·</i> Pesquisa <i>·</i> Impacto</span><div className="global-search"><Search size={16}/><span>Buscar processos, projetos, pessoas, documentos...</span><kbd>⌘ K</kbd></div><button className="notification-button" aria-label={`Notificações: ${unread[0]?.value ?? 0} não lidas`}><Bell size={19}/>{Boolean(unread[0]?.value) && <i>{unread[0].value}</i>}</button><div className="top-user"><span className="avatar top-avatar">{user.name.slice(0,1).toUpperCase()}</span><span><strong>{user.name}</strong><small>Integrante</small></span><ChevronDown size={16}/></div></header><aside className="sidebar"><div className="nav-label">ESPAÇO DE TRABALHO</div><DashboardNav/><div className="sidebar-bottom"><div className="community-mark"><Sparkles size={16}/><span>Comunidade PIXEL</span></div><form action={logout}><button className="logout" type="submit">{user.name} · Sair da conta</button></form></div></aside><div className="main"><main className="content">{children}</main></div></div>;
}

