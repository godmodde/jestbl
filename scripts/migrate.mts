// Применяет db/migrations/*.sql по порядку, каждую один раз. Запуск: pnpm db:migrate
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL не задан — скопируйте .env.example в .env.local");

const sql = postgres(url, { max: 1, onnotice: () => {} });
const dir = path.join(import.meta.dirname, "..", "db", "migrations");

try {
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const done = new Set((await sql<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (done.has(file)) continue;
    const body = await readFile(path.join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log("применена", file);
  }
  console.log("миграции актуальны");
} finally {
  await sql.end();
}
