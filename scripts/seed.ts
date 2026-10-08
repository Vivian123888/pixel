import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db";
import { hashPassword } from "../lib/auth/password";
import { users } from "../lib/db/schema";

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.SEED_ADMIN_NAME?.trim() || "Administração PIXEL";
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Set a valid SEED_ADMIN_EMAIL.");
if (!password || password.length < 12 || password.length > 72 || password === "change-me-now") {
  throw new Error("Set a unique SEED_ADMIN_PASSWORD between 12 and 72 characters. No default password is accepted.");
}
if (name.length < 2 || name.length > 160) throw new Error("SEED_ADMIN_NAME must be between 2 and 160 characters.");

try {
  const db = getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new Error("An account already exists for SEED_ADMIN_EMAIL; the bootstrap command does not change existing accounts.");
  const passwordHash = await hashPassword(password);
  await db.insert(users).values({ name, email, passwordHash, primaryRole: "ADMIN", status: "ACTIVE" });
  console.log("Initial PIXEL Hub administrator created. Remove SEED_ADMIN_PASSWORD from the environment after use.");
} finally {
  await closeDb();
}
