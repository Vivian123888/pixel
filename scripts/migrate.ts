import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL must be set before applying migrations.");
const sql = postgres(url, { prepare: false, max: 1 });

try {
  await sql`CREATE TABLE IF NOT EXISTS _pixel_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;
  await sql`SELECT pg_advisory_lock(hashtext('pixel-hub-migrations'))`;
  const directory = path.join(process.cwd(), "migrations");
  const files = (await readdir(directory)).filter((name) => /^\d+_[\w-]+\.sql$/.test(name)).sort();
  for (const name of files) {
    const [known] = await sql`SELECT name FROM _pixel_migrations WHERE name = ${name}`;
    if (known) continue;
    const contents = await readFile(path.join(directory, name), "utf8");
    await sql.begin(async (transaction) => {
      await transaction.unsafe(contents);
      await transaction`INSERT INTO _pixel_migrations (name) VALUES (${name})`;
    });
    console.log(`Applied ${name}`);
  }
} finally {
  await sql`SELECT pg_advisory_unlock(hashtext('pixel-hub-migrations'))`.catch(() => undefined);
  await sql.end();
}
