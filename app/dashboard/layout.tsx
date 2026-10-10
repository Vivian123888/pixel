import Link from "next/link";
import { LayoutDashboard, BriefcaseBusiness, Users, CalendarDays, ListTodo } from "lucide-react";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/auth/permissions";

const links = [["/dashboard","Início",LayoutDashboard],["/dashboard/tasks","Meu trabalho",ListTodo],["/dashboard/projects","Projetos",BriefcaseBusiness],["/dashboard/people","Pessoas",Users],["/dashboard/calendar","Calendário",CalendarDays]] as const;

export default async function DashboardLayout({children}:{children:React.ReactNode}) {
  const user = await requireUser();
  const visibleLinks = user.role === "ADMIN" ? links : links.filter(([href]) => href !== "/dashboard/people");
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }
  return <div className="shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><span className="brand-mark">P</span><span>PIXEL<span className="brand-light">Hub</span></span></Link><div className="subbrand">Sistema operacional do grupo</div><div className="nav-label">ESPAÇO DE TRABALHO</div><nav className="nav">{visibleLinks.map(([href,label,Icon])=><Link href={href} key={href}><Icon size={18}/>{label}</Link>)}</nav><div className="sidebar-bottom"><div className="sidebar-person"><div className="avatar small-avatar">{user.name.slice(0,1).toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.role === "ADMIN" ? "Administração" : "Integrante"}</span></div></div><form action={logout}><button className="logout" type="submit">Sair da conta</button></form></div></aside><div className="main"><header className="topbar"><div><span className="topbar-kicker">PIXEL HUB</span><strong>Área de trabalho</strong></div><span className="top-user">{user.name} <i className="online-dot"/></span></header><main className="content">{children}</main></div></div>;
}
