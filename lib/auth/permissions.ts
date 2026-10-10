import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { projectMembers, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [user] = await getDb().select({ id: users.id, name: users.name, email: users.email, role: users.primaryRole, status: users.status })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.status !== "ACTIVE") redirect("/login?blocked=1");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function canEditProject(userId: string, role: string, projectId: string) {
  if (role === "ADMIN") return true;
  const [assignment] = await getDb().select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)))
    .limit(1);
  return Boolean(assignment);
}

export async function getEditableProjectIds(userId: string) {
  const rows = await getDb().select({ projectId: projectMembers.projectId })
    .from(projectMembers).where(eq(projectMembers.userId, userId));
  return rows.map((row) => row.projectId);
}
