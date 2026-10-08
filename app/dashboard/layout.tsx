import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, BriefcaseBusiness, Users, CalendarDays, ListTodo, LogOut } from "lucide-react";
import { signOut } from "@/auth";
const links = [["/dashboard","Início",LayoutDashboard],["/dashboard/tasks","Meu trabalho",ListTodo],["/dashboard/projects","Projetos",BriefcaseBusiness],["/dashboard/people","Pessoas",Users],["/dashboard/calendar","Calendário",CalendarDays]] as const;
export default async function DashboardLayout({children}:{children:React.ReactNode}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <div className="shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><span className="brand-mark">P</span><span>PIXEL<span className="brand-light">Hub</span></span></Link><div className="subbrand">Sistema operacional do grupo</div><div className="nav-label">ESPAÇO DE TRABALHO</div><nav className="nav">{links.map(([href,label,Icon])=><Link href={href} key={href}><Icon size={18}/>{label}</Link>)}</nav><div className="sidebar-bottom"><div className="sidebar-person"><div className="avatar small-avatar">{session.user.name?.[0]?.toUpperCase()??"P"}</div><div><strong>{session.user.name}</strong><span>{session.user.role}</span></div></div><form action={async()=>{"use server";await signOut({redirectTo:"/login"})}}><button className="logout"><LogOut size={16}/> Sair</button></form></div></aside><div className="main"><header className="topbar"><div><span className="topbar-kicker">PIXEL HUB</span><strong>Área de trabalho</strong></div><span className="top-user">{session.user.name} <i className="online-dot"/></span></header><main className="content">{children}</main></div></div>;
}
