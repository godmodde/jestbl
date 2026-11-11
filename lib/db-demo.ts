import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import type postgres from "postgres";

import { checkContent, seedContent, type Tx } from "@/content/seed.mts";

// Встроенная база для показа без DATABASE_URL (Vercel без подключённого Postgres, решение 2026-11-11): PGlite — Postgres в памяти процесса.
// При первом запросе применяет те же миграции и заполняет тем же контентом, что `pnpm db:migrate` и `pnpm db:seed`.
// ponytail: прогресс живёт, пока жив экземпляр сервера (и у каждого экземпляра свой); для настоящего запуска — задать DATABASE_URL (Neon).

type Runner = { query: <T>(text: string, params?: unknown[]) => Promise<{ rows: T[] }> };

/** Запрос-шаблон, как у postgres.js: выполняется при await, а вложенный в другой шаблон — подставляется куском SQL. */
class Query implements PromiseLike<unknown[]> {
  constructor(private strings: readonly string[], private values: unknown[], private runner: () => Promise<Runner>) {}

  compile(params: unknown[]): string {
    let text = this.strings[0];
    this.values.forEach((v, i) => {
      text += v instanceof Query ? v.compile(params) : "$" + params.push(v);
      text += this.strings[i + 1];
    });
    return text;
  }

  then<A = unknown[], B = never>(ok?: ((rows: unknown[]) => A | PromiseLike<A>) | null, fail?: ((e: unknown) => B | PromiseLike<B>) | null) {
    const params: unknown[] = [];
    const text = this.compile(params);
    return this.runner().then((r) => r.query(text, params)).then((res) => res.rows).then(ok, fail);
  }
}

const tag = (runner: () => Promise<Runner>) => (strings: TemplateStringsArray, ...values: unknown[]) => new Query(strings, values, runner);

let ready: Promise<PGlite> | null = null;
function open() {
  ready ??= (async () => {
    const pg = new PGlite();
    const dir = path.join(process.cwd(), "db", "migrations");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) await pg.exec(readFileSync(path.join(dir, file), "utf8"));
    checkContent();
    await pg.transaction((tx) => seedContent(tag(async () => tx) as unknown as Tx));
    return pg;
  })();
  return ready;
}

export function demoSql() {
  return Object.assign(tag(open), {
    begin: (fn: (tx: unknown) => unknown) => open().then((pg) => pg.transaction((tx) => Promise.resolve(fn(tag(async () => tx))))),
  }) as unknown as postgres.Sql;
}
