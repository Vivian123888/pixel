import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [user] = await getDb().select({ id: users.id, name: users.name, email: users.email, status: users.status })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.status !== "ACTIVE") redirect("/login?blocked=1");
  return user;
}
