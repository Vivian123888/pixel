import Link from "next/link";
import { LayoutDashboard, BriefcaseBusiness, Users, CalendarDays, ListTodo, History, BarChart3, FlaskConical, Gamepad2, Megaphone, FileCheck2, Trophy } from "lucide-react";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/auth/permissions";

const links = [["/dashboard","Início",LayoutDashboard],["/dashboard/tasks","Meu Trabalho",ListTodo],["/dashboard/projects","Projetos",BriefcaseBusiness],["/dashboard/people","Pessoas",Users],["/dashboard/modules/governanca","Governança",BarChart3],["/dashboard/modules/pesquisa","Pesquisa",FlaskConical],["/dashboard/modules/sports","PIXEL Sports",Gamepad2],["/dashboard/modules/extensao","Extensão",Megaphone],["/dashboard/modules/arquivos","Arquivos & Aprovações",FileCheck2],["/dashboard/modules/gamificacao","Gamificação",Trophy],["/dashboard/calendar","Calendário",CalendarDays],["/dashboard/history","Histórico",History]] as const;

export default async function DashboardLayout({children}:{children:React.ReactNode}) {
  const user = await requireUser();
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }
  return <div className="shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><span className="brand-mark">P</span><span>PIXEL<span className="brand-light">Hub</span></span></Link><div className="subbrand">Sistema operacional do grupo</div><div className="nav-label">ESPAÇO DE TRABALHO</div><nav className="nav">{links.map(([href,label,Icon])=><Link href={href} key={href}><Icon size={18}/>{label}</Link>)}</nav><div className="sidebar-bottom"><div className="sidebar-person"><div className="avatar small-avatar">{user.name.slice(0,1).toUpperCase()}</div><div><strong>{user.name}</strong><span>Integrante</span></div></div><form action={logout}><button className="logout" type="submit">Sair da conta</button></form></div></aside><div className="main"><header className="topbar"><div><span className="topbar-kicker">PIXEL HUB</span><strong>Área de trabalho</strong></div><span className="top-user">{user.name} <i className="online-dot"/></span></header><main className="content">{children}</main></div></div>;
}

