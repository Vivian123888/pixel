import { requireUser } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

const actionLabels: Record<string, string> = {
  "project.created": "criou o projeto",
  "project.updated": "editou o projeto",
  "task.created": "criou a tarefa",
  "task.completed": "concluiu a tarefa",
  "calendar_event.created": "criou um compromisso",
  "user.registered": "criou uma conta",
  "module_entry.created": "criou um registro",
  "module_entry.updated": "editou um registro",
};
const fieldLabels: Record<string, string> = {
  name: "Nome", description: "Descrição", status: "Status", sheetAcronym: "Sigla", sheetType: "Tipo", sheetTargetAudience: "Público-alvo", title: "Título", projectId: "Projeto", category: "Área", assigneeId: "Responsável", dueDate: "Prazo", progress: "Progresso", points: "XP", beneficiaries: "Beneficiários", link: "Link", version: "Versão", platform: "Plataforma", team: "Equipe", target: "Meta", metricLabel: "Indicador", partner: "Parceiro", competency: "Competência", hours: "Carga horária semanal", score: "Desempenho", fileName: "Arquivo", fileVersion: "Versão do arquivo",
};
const valueLabels: Record<string, string> = { PLANNING: "Planejamento", ACTIVE: "Ativo", PAUSED: "Pausado", COMPLETED: "Concluído", ARCHIVED: "Arquivado", TODO: "A fazer", IN_PROGRESS: "Em andamento", BLOCKED: "Bloqueado", DONE: "Concluído", CANCELLED: "Cancelado" };
const objectLabels: Record<string, string> = { project: "Projeto", task: "Tarefa", calendar_event: "Agenda", user: "Equipe", projetos: "Projetos & Produtos", pessoas: "Pessoas & Jornada", governanca: "Governança", pesquisa: "Pesquisa", sports: "PIXEL Sports", extensao: "Extensão", arquivos: "Arquivos", gamificacao: "Gamificação" };
function showValue(value: unknown) {
  if (value === null || value === "") return "vazio";
  if (typeof value === "string" && valueLabels[value]) return valueLabels[value];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export default async function HistoryPage() {
  await requireUser();
  const rows = await getDb().select({ id: auditLogs.id, action: auditLogs.action, objectType: auditLogs.objectType, details: auditLogs.details, createdAt: auditLogs.createdAt, actorName: users.name })
    .from(auditLogs).leftJoin(users, eq(auditLogs.actorId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(200);
  return <><div className="heading"><p className="eyebrow">TRANSPARÊNCIA</p><h1>Histórico de modificações</h1><p>Veja quem criou e atualizou informações no PIXEL Hub.</p></div>
    {rows.length ? <div className="audit-list">{rows.map((row) => {
      const details = row.details ?? {};
      const changes = Object.entries(details).map(([field, values]) => `${fieldLabels[field] ?? field}: ${showValue(values.before)} → ${showValue(values.after)}`);
      return <article className="card audit-row" key={row.id}><div className="audit-icon"><History size={17}/></div><div className="audit-main"><strong>{row.actorName ?? "Conta removida"} {actionLabels[row.action] ?? "alterou informações"}</strong><span>{objectLabels[row.objectType] ?? "Registro"}</span>{changes.length > 0 && <small>{changes.join(" · ")}</small>}</div><time dateTime={row.createdAt.toISOString()}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(row.createdAt)}</time></article>;
    })}</div> : <div className="card empty"><History size={26}/><strong>Nenhuma modificação registrada</strong><span>As próximas alterações aparecerão aqui com a pessoa responsável.</span></div>}
  </>;
}

