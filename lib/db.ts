import "server-only";

import postgres from "postgres";

// Один пул на процесс: в dev Next перезагружает модули, поэтому пул держим в globalThis.
const g = globalThis as unknown as { vidnoSql?: postgres.Sql };

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не задан — скопируйте .env.example в .env.local");
  return postgres(url, { max: 5, onnotice: () => {} });
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
