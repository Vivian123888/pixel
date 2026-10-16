"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BriefcaseBusiness, Users, CalendarDays, ListTodo, History, BarChart3, FlaskConical, Gamepad2, Megaphone, FileCheck2, Trophy } from "lucide-react";

const links = [["/dashboard","Início",LayoutDashboard],["/dashboard/tasks","Meu Trabalho",ListTodo],["/dashboard/projects","Projetos",BriefcaseBusiness],["/dashboard/people","Pessoas",Users],["/dashboard/modules/governanca","Governança",BarChart3],["/dashboard/modules/pesquisa","Pesquisa",FlaskConical],["/dashboard/modules/sports","PIXEL Sports",Gamepad2],["/dashboard/modules/extensao","Extensão",Megaphone],["/dashboard/modules/arquivos","Arquivos & Aprovações",FileCheck2],["/dashboard/modules/gamificacao","Gamificação",Trophy],["/dashboard/calendar","Calendário",CalendarDays],["/dashboard/history","Histórico",History]] as const;

export function DashboardNav() {
  const pathname = usePathname();
  return <nav className="nav">{links.map(([href,label,Icon]) => {
    const active = href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    return <Link href={href} key={href} aria-current={active ? "page" : undefined}><Icon size={18}/>{label}</Link>;
  })}</nav>;
}

