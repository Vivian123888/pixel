"use server";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { auditLogs, calendarEvents, moduleEntries, moduleFileVersions, projects, tasks, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const projectInput = z.object({
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]),
  sheetAcronym: z.string().trim().max(180).optional(),
  sheetType: z.string().trim().max(120).optional(),
  sheetTargetAudience: z.string().trim().max(1000).optional(),
});

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const data = projectInput.parse(Object.fromEntries(formData));
  const slug = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + randomBytes(4).toString("hex");
  const db = getDb();
  await db.transaction(async (tx) => {
    const [created] = await tx.insert(projects).values({ ...data, slug, coordinatorId: user.id }).returning({ id: projects.id });
    await tx.insert(auditLogs).values({ actorId: user.id, action: "project.created", objectType: "project", objectId: created.id, details: { name: { before: null, after: data.name } } });
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/history");
  redirect("/dashboard/projects?created=1");
}

export async function updateProject(formData: FormData) {
  const user = await requireUser();
  const id = z.string().uuid().parse(formData.get("id"));
  const data = projectInput.parse(Object.fromEntries(formData));
  const db = getDb();
  await db.transaction(async (tx) => {
    const [before] = await tx.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!before) throw new Error("Projeto não encontrado.");
    const [after] = await tx.update(projects).set(data).where(eq(projects.id, id)).returning();
    const details = Object.fromEntries(Object.entries(data)
      .filter(([key, value]) => (before[key as keyof typeof before] ?? "") !== (value ?? ""))
      .map(([key, value]) => [key, { before: before[key as keyof typeof before] ?? null, after: value ?? null }]));
    if (Object.keys(details).length) await tx.insert(auditLogs).values({ actorId: user.id, action: "project.updated", objectType: "project", objectId: after.id, details });
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/history");
}

const taskInput = z.object({
  title: z.string().trim().min(2).max(220),
  description: z.string().trim().max(2000).optional(),
  projectId: z.string().uuid().optional().or(z.literal("")),
  dueAt: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const data = taskInput.parse(Object.fromEntries(formData));
  const dueAt = data.dueAt ? new Date(data.dueAt) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) throw new Error("Confira a data da tarefa.");
  const db = getDb();
  await db.transaction(async (tx) => {
    const [created] = await tx.insert(tasks).values({ title: data.title, description: data.description || null, projectId: data.projectId || null, responsibleId: user.id, dueAt, priority: data.priority }).returning({ id: tasks.id });
    await tx.insert(auditLogs).values({ actorId: user.id, action: "task.created", objectType: "task", objectId: created.id, details: { title: { before: null, after: data.title } } });
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/history");
  redirect("/dashboard/tasks?created=1");
}

const eventInput = z.object({
  title: z.string().trim().min(2).max(180),
  startsAt: z.string().min(1),
  endsAt: z.string().optional(),
  kind: z.enum(["MEETING", "DEADLINE", "EVENT", "TRAINING"]),
});

export async function createCalendarEvent(formData: FormData) {
  const user = await requireUser();
  const data = eventInput.parse(Object.fromEntries(formData));
  const startsAt = new Date(data.startsAt);
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  if (Number.isNaN(startsAt.getTime()) || (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt < startsAt))) throw new Error("Confira as datas do evento.");
  const db = getDb();
  await db.transaction(async (tx) => {
    const [created] = await tx.insert(calendarEvents).values({ ...data, startsAt, endsAt, createdBy: user.id }).returning({ id: calendarEvents.id });
    await tx.insert(auditLogs).values({ actorId: user.id, action: "calendar_event.created", objectType: "calendar_event", objectId: created.id, details: { title: { before: null, after: data.title } } });
  });
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
  redirect("/dashboard/calendar?created=1");
}

export async function markTaskDone(formData: FormData) {
  const user = await requireUser();
  const id = z.string().uuid().parse(formData.get("id"));
  const db = getDb();
  await db.transaction(async (tx) => {
    const [task] = await tx.select({ title: tasks.title, status: tasks.status }).from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!task || task.status === "DONE") return;
    await tx.update(tasks).set({ status: "DONE" }).where(eq(tasks.id, id));
    await tx.insert(auditLogs).values({ actorId: user.id, action: "task.completed", objectType: "task", objectId: id, details: { title: { before: task.title, after: task.title }, status: { before: task.status, after: "DONE" } } });
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/history");
}

const optionalCount = (max: number) => z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.number().int().min(0).max(max).optional());
const moduleEntryInput = z.object({
  module: z.enum(["projetos", "governanca", "pesquisa", "sports", "extensao", "arquivos", "gamificacao", "pessoas"]),
  category: z.string().trim().min(2).max(100),
  title: z.string().trim().min(2).max(220),
  description: z.string().trim().max(3000).optional(),
  status: z.enum(["PLANEJAMENTO", "EM_ANDAMENTO", "EM_REVISAO", "PENDENTE", "APROVADO", "CONCLUIDO", "ARQUIVADO"]),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  dueDate: z.string().optional(),
  progress: optionalCount(100),
  points: optionalCount(100000),
  beneficiaries: optionalCount(10000000),
  link: z.string().trim().max(1000).optional(),
  version: z.string().trim().max(40).optional(),
  platform: z.string().trim().max(100).optional(),
  team: z.string().trim().max(120).optional(),
  target: z.string().trim().max(180).optional(),
  metricLabel: z.string().trim().max(100).optional(),
  partner: z.string().trim().max(180).optional(),
  competency: z.string().trim().max(120).optional(),
  hours: optionalCount(80),
  score: optionalCount(5),
});

const allowedFileTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]);
async function readModuleFile(formData: FormData, module: string) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  if (module !== "arquivos") throw new Error("Anexe arquivos apenas no módulo Arquivos & Aprovações.");
  if (file.size > 3 * 1024 * 1024) throw new Error("O limite por arquivo é 3 MB.");
  if (!allowedFileTypes.has(file.type)) throw new Error("Tipo de arquivo não permitido. Use PDF, imagem, texto, Word, Excel ou PowerPoint.");
  const fileName = file.name.replace(/[\\/\r\n\0]/g, "_").slice(0, 180);
  return { data: Buffer.from(await file.arrayBuffer()), fileName, contentType: file.type, fileSize: file.size };
}

function moduleMetadata(data: z.infer<typeof moduleEntryInput>, file?: { fileName: string; contentType: string; fileSize: number; fileVersion: number } | null) {
  const metadata: Record<string, unknown> = {};
  for (const key of ["dueDate", "progress", "points", "beneficiaries", "link", "version", "platform", "team", "target", "metricLabel", "partner", "competency", "hours", "score"] as const) {
    const value = data[key];
    if (value !== undefined && value !== "") metadata[key] = value;
  }
  if (file) Object.assign(metadata, file);
  return metadata;
}

export async function createModuleEntry(formData: FormData) {
  const user = await requireUser();
  const data = moduleEntryInput.parse(Object.fromEntries(formData));
  const file = await readModuleFile(formData, data.module);
  const metadata = moduleMetadata(data, file ? { fileName: file.fileName, contentType: file.contentType, fileSize: file.fileSize, fileVersion: 1 } : null);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [entry] = await tx.insert(moduleEntries).values({ module: data.module, category: data.category, title: data.title, description: data.description || null, status: data.status, metadata, ownerId: user.id, assigneeId: data.assigneeId || user.id, fileData: file?.data ?? null }).returning({ id: moduleEntries.id });
    if (file) await tx.insert(moduleFileVersions).values({ entryId: entry.id, version: 1, fileName: file.fileName, contentType: file.contentType, fileSize: file.fileSize, fileData: file.data, uploadedBy: user.id });
    const details = Object.fromEntries(Object.entries({ title: data.title, category: data.category, status: data.status, ...metadata, assigneeId: data.assigneeId || user.id }).map(([key, value]) => [key, { before: null, after: value }]));
    await tx.insert(auditLogs).values({ actorId: user.id, action: "module_entry.created", objectType: data.module, objectId: entry.id, details });
  });
  revalidatePath(`/dashboard/modules/${data.module}`);
  revalidatePath("/dashboard/history");
}

export async function updateModuleEntry(formData: FormData) {
  const user = await requireUser();
  const id = z.string().uuid().parse(formData.get("id"));
  const data = moduleEntryInput.parse(Object.fromEntries(formData));
  const file = await readModuleFile(formData, data.module);
  const db = getDb();
  await db.transaction(async (tx) => {
    const [before] = await tx.select({ id: moduleEntries.id, module: moduleEntries.module, category: moduleEntries.category, title: moduleEntries.title, description: moduleEntries.description, status: moduleEntries.status, metadata: moduleEntries.metadata, assigneeId: moduleEntries.assigneeId, fileData: moduleEntries.fileData }).from(moduleEntries).where(eq(moduleEntries.id, id)).limit(1);
    if (!before || before.module !== data.module) throw new Error("Registro não encontrado neste módulo.");
    const previousMeta = before.metadata ?? {};
    const currentFileVersion = Number(previousMeta.fileVersion ?? (before.fileData ? 1 : 0));
    if (file && before.fileData && typeof previousMeta.fileName === "string" && typeof previousMeta.contentType === "string") {
      await tx.insert(moduleFileVersions).values({ entryId: id, version: currentFileVersion, fileName: previousMeta.fileName, contentType: previousMeta.contentType, fileSize: Number(previousMeta.fileSize ?? 0), fileData: before.fileData, uploadedBy: user.id }).onConflictDoNothing();
    }
    const nextMeta = moduleMetadata(data, file ? { fileName: file.fileName, contentType: file.contentType, fileSize: file.fileSize, fileVersion: currentFileVersion + 1 } : null);
    if (!file) for (const key of ["fileName", "contentType", "fileSize", "fileVersion"]) if (previousMeta[key] !== undefined) nextMeta[key] = previousMeta[key];
    const assigneeId = data.assigneeId || user.id;
    const [after] = await tx.update(moduleEntries).set({ category: data.category, title: data.title, description: data.description || null, status: data.status, assigneeId, metadata: nextMeta, ...(file ? { fileData: file.data } : {}), updatedAt: new Date() }).where(eq(moduleEntries.id, id)).returning({ id: moduleEntries.id });
    if (file) await tx.insert(moduleFileVersions).values({ entryId: id, version: currentFileVersion + 1, fileName: file.fileName, contentType: file.contentType, fileSize: file.fileSize, fileData: file.data, uploadedBy: user.id });
    const beforeValues: Record<string, unknown> = { category: before.category, title: before.title, description: before.description, status: before.status, assigneeId: before.assigneeId, ...previousMeta };
    const afterValues: Record<string, unknown> = { category: data.category, title: data.title, description: data.description || null, status: data.status, assigneeId, ...nextMeta };
    const keys = new Set([...Object.keys(beforeValues), ...Object.keys(afterValues)]);
    const changed = Object.fromEntries([...keys].filter((key) => JSON.stringify(beforeValues[key] ?? null) !== JSON.stringify(afterValues[key] ?? null)).map((key) => [key, { before: beforeValues[key] ?? null, after: afterValues[key] ?? null }]));
    if (Object.keys(changed).length) await tx.insert(auditLogs).values({ actorId: user.id, action: "module_entry.updated", objectType: data.module, objectId: after.id, details: changed });
  });
  revalidatePath(`/dashboard/modules/${data.module}`);
  revalidatePath("/dashboard/history");
}

export type RegistrationState = { error?: string };
export async function registerAccount(_previous: RegistrationState, formData: FormData): Promise<RegistrationState> {
  const parsed = z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().toLowerCase().email().max(320),
    password: z.string().min(12).max(72),
    confirmPassword: z.string().min(12).max(72),
    signupCode: z.string().min(1).max(256),
  }).safeParse({
    name: formData.get("name"), email: formData.get("email"), password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"), signupCode: formData.get("signupCode"),
  });
  if (!parsed.success) return { error: "Confira os dados. A senha precisa ter pelo menos 12 caracteres." };
  if (parsed.data.password !== parsed.data.confirmPassword) return { error: "As senhas não conferem." };
  const configuredCode = process.env.PIXEL_SIGNUP_CODE;
  if (!configuredCode || configuredCode.length < 16) return { error: "O cadastro ainda não foi configurado com um código seguro. Peça à equipe responsável para definir o código compartilhado." };
  const provided = Buffer.from(parsed.data.signupCode);
  const expected = Buffer.from(configuredCode);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return { error: "Código de cadastro inválido." };
  const db = getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing) return { error: "Já existe uma conta com esse e-mail." };
  const passwordHash = await hashPassword(parsed.data.password);
  try {
    const [created] = await db.transaction(async (tx) => {
      const inserted = await tx.insert(users).values({ name: parsed.data.name, email: parsed.data.email, passwordHash, primaryRole: "INTEGRANTE", status: "ACTIVE" }).returning({ id: users.id });
      await tx.insert(auditLogs).values({ actorId: inserted[0].id, action: "user.registered", objectType: "user", objectId: inserted[0].id, details: { name: { before: null, after: parsed.data.name } } });
      return inserted;
    });
    if (!created) return { error: "Não foi possível criar a conta. Tente novamente." };
  } catch {
    return { error: "Já existe uma conta com esse e-mail ou não foi possível concluir o cadastro." };
  }
  redirect("/login?registered=1");
}

export async function getRecentActivity() {
  await requireUser();
  const db = getDb();
  const [projectRows, taskRows, eventRows] = await Promise.all([
    db.select({ name: projects.name, status: projects.status, createdAt: projects.createdAt }).from(projects).orderBy(desc(projects.createdAt)).limit(4),
    db.select({ title: tasks.title, status: tasks.status, dueAt: tasks.dueAt }).from(tasks).orderBy(desc(tasks.createdAt)).limit(5),
    db.select({ title: calendarEvents.title, startsAt: calendarEvents.startsAt, kind: calendarEvents.kind }).from(calendarEvents).orderBy(calendarEvents.startsAt).limit(4),
  ]);
  return { projectRows, taskRows, eventRows };
}

