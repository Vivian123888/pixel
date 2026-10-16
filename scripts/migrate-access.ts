import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL must be configured to apply PIXEL Hub migrations.");
  const sql = postgres(url, { prepare: false, max: 1 });

  try {
    for (const name of ["0004_project_permissions.sql", "0005_audit_history.sql", "0006_remove_admin_role.sql", "0007_module_workspaces.sql"]) {
      const migration = await readFile(path.join(process.cwd(), "migrations", name), "utf8");
      await sql.begin(async (transaction) => {
        await transaction.unsafe(migration);
      });
      console.log(`Applied ${name}`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

