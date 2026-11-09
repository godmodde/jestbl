import "server-only";

import postgres from "postgres";

// Один пул на процесс: в dev Next перезагружает модули, поэтому пул держим в globalThis.
const g = globalThis as unknown as { vidnoSql?: postgres.Sql };

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не задан — скопируйте .env.example в .env.local");
  return postgres(url, { max: 5, onnotice: () => {} });
}

export const sql = g.vidnoSql ?? connect();
if (process.env.NODE_ENV !== "production") g.vidnoSql = sql;
