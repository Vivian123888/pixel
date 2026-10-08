"use server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { calendarEvents, projects, tasks } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

const projectInput = z.object({
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "PAUSED", "COMPLETED"]),
});
export async function createProject(formData: FormData) {
  const user = await requireUser();
  const data = projectInput.parse(Object.fromEntries(formData));
  const slug = data.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + crypto.randomUUID().slice(0, 8);
  await getDb().insert(projects).values({ ...data, slug, coordinatorId: user.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects?created=1");
}

const taskInput = z.object({
  title: z.string().trim().min(2).max(220),
  description: z.string().trim().max(2000).optional(),
  projectId: z.string().uuid().optional().or(z.literal("")),
  dueAt: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
});
export async function createTask(formData: FormData) {
  await requireUser();
  const data = taskInput.parse(Object.fromEntries(formData));
  await getDb().insert(tasks).values({
    title: data.title,
    description: data.description || null,
    projectId: data.projectId || null,
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
  await requireUser();
  const id = z.string().uuid().parse(formData.get("id"));
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
    db.select({ title: calendarEvents.title, startsAt: calendarEvents.startsAt, kind: calendarEvents.kind }).from(calendarEvents).where(and(eq(calendarEvents.startsAt, calendarEvents.startsAt))).orderBy(calendarEvents.startsAt).limit(4),
  ]);
  return { projectRows, taskRows, eventRows };
}
