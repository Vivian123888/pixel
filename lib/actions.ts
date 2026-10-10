"use server";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { calendarEvents, inviteProjects, projectMembers, projects, tasks, userInvites, users } from "@/lib/db/schema";
import { canEditProject, requireAdmin, requireUser } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
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
  const user = await requireAdmin();
  const data = projectInput.parse(Object.fromEntries(formData));
  const slug = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + randomBytes(4).toString("hex");
  await getDb().insert(projects).values({ ...data, slug, coordinatorId: user.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects?created=1");
}

export async function updateProject(formData: FormData) {
  const user = await requireUser();
  const id = z.string().uuid().parse(formData.get("id"));
  if (!await canEditProject(user.id, user.role, id)) throw new Error("Você não tem permissão para editar este projeto.");
  const data = projectInput.parse(Object.fromEntries(formData));
  await getDb().update(projects).set(data).where(eq(projects.id, id));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
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
  if (data.projectId && !await canEditProject(user.id, user.role, data.projectId)) throw new Error("Você só pode criar tarefas nos projetos atribuídos à sua conta.");
  await getDb().insert(tasks).values({
    title: data.title,
    description: data.description || null,
    projectId: data.projectId || null,
    responsibleId: user.id,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    priority: data.priority,
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
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
  if (Number.isNaN(startsAt.getTime()) || (endsAt && endsAt < startsAt)) throw new Error("Confira as datas do evento.");
  await getDb().insert(calendarEvents).values({ ...data, startsAt, endsAt, createdBy: user.id });
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  redirect("/dashboard/calendar?created=1");
}

export async function markTaskDone(formData: FormData) {
  const user = await requireUser();
  const id = z.string().uuid().parse(formData.get("id"));
  const [task] = await getDb().select({ projectId: tasks.projectId, responsibleId: tasks.responsibleId }).from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!task) return;
  const allowed = task.projectId
    ? await canEditProject(user.id, user.role, task.projectId)
    : user.role === "ADMIN" || task.responsibleId === user.id;
  if (!allowed) throw new Error("Você não tem permissão para atualizar esta tarefa.");
  await getDb().update(tasks).set({ status: "DONE" }).where(eq(tasks.id, id));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
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

export type InviteState = { inviteUrl?: string; error?: string };
export async function createInvitation(_previous: InviteState, formData: FormData): Promise<InviteState> {
  const admin = await requireAdmin();
  const parsed = z.object({ name: z.string().trim().min(2).max(160), email: z.string().trim().toLowerCase().email().max(320) })
    .safeParse({ name: formData.get("name"), email: formData.get("email") });
  if (!parsed.success) return { error: "Confira o nome e o e-mail da pessoa." };
  const projectIds = [...new Set(formData.getAll("projectIds").map(String))];
  if (projectIds.some((id) => !z.string().uuid().safeParse(id).success)) return { error: "A lista de projetos contém um item inválido." };
  const db = getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing) return { error: "Já existe uma conta com esse e-mail." };
  if (projectIds.length) {
    const found = await db.select({ id: projects.id }).from(projects);
    const valid = new Set(found.map((project) => project.id));
    if (projectIds.some((id) => !valid.has(id))) return { error: "Um dos projetos selecionados não existe." };
  }
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [invite] = await db.insert(userInvites).values({
    tokenHash,
    name: parsed.data.name,
    email: parsed.data.email,
    primaryRole: "INTEGRANTE",
    invitedBy: admin.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }).returning({ id: userInvites.id });
  if (projectIds.length) await db.insert(inviteProjects).values(projectIds.map((projectId) => ({ inviteId: invite.id, projectId })));
  revalidatePath("/dashboard/people");
  const appUrl = (process.env.APP_URL || "https://pixel-blush-alpha.vercel.app").replace(/\/$/, "");
  return { inviteUrl: `${appUrl}/invite?token=${encodeURIComponent(token)}` };
}

export async function updateUserAssignments(formData: FormData) {
  const admin = await requireAdmin();
  const userId = z.string().uuid().parse(formData.get("userId"));
  const projectIds = [...new Set(formData.getAll("projectIds").map(String))];
  if (projectIds.some((id) => !z.string().uuid().safeParse(id).success)) throw new Error("Projeto inválido.");
  const db = getDb();
  const [target] = await db.select({ id: users.id, role: users.primaryRole }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target || target.role === "ADMIN") throw new Error("Não é possível alterar esta conta.");
  if (projectIds.length) {
    const found = await db.select({ id: projects.id }).from(projects);
    const valid = new Set(found.map((project) => project.id));
    if (projectIds.some((id) => !valid.has(id))) throw new Error("Projeto inválido.");
  }
  await db.transaction(async (tx) => {
    await tx.delete(projectMembers).where(eq(projectMembers.userId, userId));
    if (projectIds.length) await tx.insert(projectMembers).values(projectIds.map((projectId) => ({ projectId, userId, assignedBy: admin.id })));
  });
  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard/projects");
}

export async function acceptInvitation(_previous: { error?: string }, formData: FormData) {
  const parsed = z.object({ token: z.string().min(32).max(128), password: z.string().min(12).max(72), confirmPassword: z.string().min(12).max(72) })
    .safeParse({ token: formData.get("token"), password: formData.get("password"), confirmPassword: formData.get("confirmPassword") });
  if (!parsed.success) return { error: "Use uma senha com pelo menos 12 caracteres." };
  if (parsed.data.password !== parsed.data.confirmPassword) return { error: "As senhas não conferem." };
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const passwordHash = await hashPassword(parsed.data.password);
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [invite] = await tx.select().from(userInvites).where(and(eq(userInvites.tokenHash, tokenHash), isNull(userInvites.acceptedAt), gt(userInvites.expiresAt, new Date()))).limit(1);
    if (!invite) return false;
    const [existing] = await tx.select({ id: users.id }).from(users).where(eq(users.email, invite.email)).limit(1);
    if (existing) return false;
    const [newUser] = await tx.insert(users).values({ name: invite.name, email: invite.email, passwordHash, primaryRole: invite.primaryRole, status: "ACTIVE" }).returning({ id: users.id });
    const assignments = await tx.select({ projectId: inviteProjects.projectId }).from(inviteProjects).where(eq(inviteProjects.inviteId, invite.id));
    if (assignments.length) await tx.insert(projectMembers).values(assignments.map((assignment) => ({ projectId: assignment.projectId, userId: newUser.id, assignedBy: invite.invitedBy })));
    await tx.update(userInvites).set({ acceptedAt: new Date() }).where(eq(userInvites.id, invite.id));
    return true;
  });
  if (!result) return { error: "Este convite expirou ou já foi usado. Peça outro ao administrador." };
  redirect("/login?invited=1");
}

export async function bootstrapAdmin(_previous: { error?: string }, formData: FormData) {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  const name = z.string().trim().min(2).max(160).safeParse(formData.get("name"));
  const password = z.string().min(12).max(72).safeParse(formData.get("password"));
  const confirmPassword = z.string().min(12).max(72).safeParse(formData.get("confirmPassword"));
  const token = z.string().min(32).max(128).safeParse(formData.get("setupToken"));
  const configuredEmail = process.env.PIXEL_ADMIN_EMAIL?.trim().toLowerCase();
  const configuredToken = process.env.PIXEL_ADMIN_SETUP_TOKEN;
  if (!configuredEmail || !configuredToken || !process.env.AUTH_SECRET) return { error: "O administrador precisa configurar PIXEL_ADMIN_EMAIL, PIXEL_ADMIN_SETUP_TOKEN e AUTH_SECRET no Vercel antes da ativação." };
  if (!email.success || !name.success || !password.success || !confirmPassword.success || !token.success || email.data !== configuredEmail) return { error: "Confira os dados informados e tente novamente." };
  if (password.data !== confirmPassword.data) return { error: "As senhas não conferem." };
  const provided = Buffer.from(token.data);
  const expected = Buffer.from(configuredToken);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return { error: "Confira os dados informados e tente novamente." };
  const db = getDb();
  const [existingAdmin] = await db.select({ id: users.id }).from(users).where(eq(users.primaryRole, "ADMIN")).limit(1);
  if (existingAdmin) return { error: "A conta de administração já foi ativada. Entre pela tela de login." };
  const passwordHash = await hashPassword(password.data);
  try {
    await db.insert(users).values({ name: name.data, email: email.data, passwordHash, primaryRole: "ADMIN", status: "ACTIVE" });
  } catch {
    return { error: "Não foi possível criar a conta. Confirme se este e-mail já está cadastrado." };
  }
  redirect("/login?setup=complete");
}
