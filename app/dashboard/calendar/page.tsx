import { createCalendarEvent } from "@/lib/actions";
import { getDb } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { asc, gte } from "drizzle-orm";
import { CalendarDays, Clock3 } from "lucide-react";
export const dynamic = "force-dynamic";
const kinds: Record<string,string> = {MEETING:"Reunião",DEADLINE:"Prazo",EVENT:"Evento",TRAINING:"Treinamento"};
export default async function CalendarPage() {
  const now = new Date();
  const rows = await getDb().select().from(calendarEvents).where(gte(calendarEvents.startsAt, new Date(now.getTime()-86400000))).orderBy(asc(calendarEvents.startsAt)).limit(80);
  return <><div className="heading"><p className="eyebrow">AGENDA DO GRUPO</p><h1>Calendário</h1><p>Reuniões, prazos, eventos e treinamentos em um só lugar.</p></div>
    <section className="card form-card"><h2>Adicionar à agenda</h2><form action={createCalendarEvent} className="form-grid">
      <label className="field">Título<input name="title" required maxLength={180} placeholder="Ex.: Reunião semanal"/></label>
      <label className="field">Tipo<select name="kind" defaultValue="MEETING"><option value="MEETING">Reunião</option><option value="DEADLINE">Prazo</option><option value="EVENT">Evento</option><option value="TRAINING">Treinamento</option></select></label>
      <label className="field">Início<input type="datetime-local" name="startsAt" required/></label><label className="field">Término<input type="datetime-local" name="endsAt"/></label><button className="btn">Salvar evento</button>
    </form></section>
    <div className="section-title"><h2>Próximas datas</h2><span>{rows.length} itens</span></div>
    {rows.length?<div className="agenda">{rows.map(e=><article className="card event-row" key={e.id}><div className="event-date"><strong>{new Intl.DateTimeFormat("pt-BR",{day:"2-digit"}).format(e.startsAt)}</strong><span>{new Intl.DateTimeFormat("pt-BR",{month:"short"}).format(e.startsAt)}</span></div><div><strong>{e.title}</strong><span>{kinds[e.kind]} · {new Intl.DateTimeFormat("pt-BR",{weekday:"long",hour:"2-digit",minute:"2-digit"}).format(e.startsAt)}{e.endsAt?" – "+new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(e.endsAt):""}</span></div><Clock3 size={18}/></article>)}</div>:<div className="card empty"><CalendarDays size={26}/><strong>Agenda livre</strong><span>Cadastre reuniões, prazos e eventos para começar.</span></div>}
  </>;
}
