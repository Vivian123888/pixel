import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL must be configured to apply PIXEL Hub access-control tables.");
const sql = postgres(url, { prepare: false, max: 1 });

try {
  const migration = await readFile(path.join(process.cwd(), "migrations", "0004_project_permissions.sql"), "utf8");
  await sql.begin(async (transaction) => {
    await transaction.unsafe(migration);
  });
  console.log("PIXEL Hub project access tables are ready.");
} finally {
  await sql.end();
}
