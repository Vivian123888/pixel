"use server";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { auditLogs, calendarEvents, projects, tasks, users } from "@/lib/db/schema";
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
