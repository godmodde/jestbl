import "server-only";

import postgres from "postgres";

import { demoSql } from "@/lib/db-demo";

// Один пул на процесс: в dev Next перезагружает модули, поэтому пул держим в globalThis.
const g = globalThis as unknown as { vidnoSql?: postgres.Sql };

function connect() {
  const url = process.env.DATABASE_URL;
  // Без DATABASE_URL — встроенная база в памяти (lib/db-demo.ts): сайт показывается и без подключённого Postgres.
  return url ? postgres(url, { max: 5, onnotice: () => {} }) : demoSql();
}

// Клиент создаётся при первом запросе, а не при импорте: сборка не падает на страницах, которым база не нужна
// (Vercel собирал /_not-found и падал на отсутствующем DATABASE_URL).
function db() {
  if (!g.vidnoSql) g.vidnoSql = connect();
  return g.vidnoSql;
}
type Call = (...args: unknown[]) => unknown;
export const sql = Object.assign((...args: unknown[]) => (db() as unknown as Call)(...args), {
  begin: (...args: unknown[]) => (db().begin as unknown as Call)(...args),
}) as unknown as postgres.Sql;
