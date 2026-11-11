// Запись контента в базу — общая для `pnpm db:seed` (postgres.js) и встроенной базы без DATABASE_URL (PGlite, lib/db-demo.ts).
// Повторный запуск обновляет контент по slug и не трогает прогресс учеников.
import { z } from "zod";

import { categories, lessons, signs, similar, topics } from "./content.mts";

/** Тег шаблонных запросов внутри транзакции: postgres.js или переходник PGlite. */
export type Tx = <T = Record<string, unknown>[]>(strings: TemplateStringsArray, ...values: unknown[]) => PromiseLike<T>;

const VIDEO_BASE = "https://surdo.media/wp-content/uploads/";
const SOURCE_BASE = "https://surdo.media";

const slug = z.string().regex(/^[a-z0-9-]+$/);
const Sign = z.object({
  slug, title: z.string().min(1), category: slug, video: z.string().min(1).optional(), source: z.string().startsWith("/").optional(),
  meaning: z.string().min(1), context: z.string().optional(), howTo: z.string().optional(), notice: z.string().optional(),
  kind: z.enum(["object", "action", "interaction", "phrase", "letter", "other"]).optional(), level: z.number().int().min(1).max(3).optional(),
  also: z.array(slug).optional(), picture: z.string().optional(),
});
const signSlugs = new Set(signs.map((s) => s.slug));
const topicSlugs = new Set<string>(topics.map((t) => t.slug));

/** Ссылки между частями контента проверяем до записи, чтобы опечатка не оставила базу наполовину обновлённой. */
export function checkContent() {
  z.array(Sign).parse(signs);
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const problems = [
    ...signs.flatMap((s) => [s.category, ...(s.also ?? [])].filter((c) => !categorySlugs.has(c)).map((c) => `жест ${s.slug}: нет категории ${c}`)),
    ...lessons.flatMap((l) => l.signs.filter((s) => !signSlugs.has(s)).map((s) => `урок ${l.slug}: нет жеста ${s}`)),
    ...lessons.filter((l) => !topicSlugs.has(l.topic)).map((l) => `урок ${l.slug}: нет темы ${l.topic}`),
    ...similar.flatMap(([a, b]) => [a, b].filter((s) => !signSlugs.has(s)).map((s) => `похожие: нет жеста ${s}`)),
  ];
  if (signSlugs.size !== signs.length) problems.push("повторяющийся slug жеста");
  if (problems.length) throw new Error("Контент не прошёл проверку:\n" + problems.join("\n"));
}

/** Записывает контент; вызывать внутри транзакции. */
export async function seedContent(tx: Tx) {
  for (const [i, c] of categories.entries()) {
    await tx`insert into categories (slug, title, position) values (${c.slug}, ${c.title}, ${i})
      on conflict (slug) do update set title = excluded.title, position = excluded.position`;
  }
  for (const s of signs) {
    const [{ id }] = await tx<{ id: number }[]>`
      insert into signs (slug, title, gloss, meaning, how_to, context, notice, category, video_url, source_url, kind, level, picture)
      values (${s.slug}, ${s.title}, ${s.title.toUpperCase()}, ${s.meaning}, ${s.howTo ?? null}, ${s.context ?? null},
              ${s.notice ?? null}, ${s.category}, ${s.video ? VIDEO_BASE + s.video : null}, ${s.source ? SOURCE_BASE + s.source : null},
              ${s.kind ?? "other"}, ${s.level ?? null}, ${s.picture ?? null})
      on conflict (slug) do update set title = excluded.title, gloss = excluded.gloss, meaning = excluded.meaning,
        how_to = excluded.how_to, context = excluded.context, notice = excluded.notice, category = excluded.category,
        video_url = excluded.video_url, source_url = excluded.source_url, kind = excluded.kind, level = excluded.level,
        picture = excluded.picture
      returning id`;
    await tx`delete from sign_categories where sign_id = ${id}`;
    for (const c of new Set([s.category, ...(s.also ?? [])])) {
      await tx`insert into sign_categories (sign_id, category) values (${id}, ${c})`;
    }
  }
  await tx`delete from signs where slug <> all(${[...signSlugs]})`;

  await tx`delete from sign_similar`;
  for (const [a, b, note, kind = "similar"] of similar) {
    await tx`insert into sign_similar (sign_id, similar_id, note, kind)
      select x.id, y.id, ${note}, ${kind} from signs x, signs y where x.slug = ${a} and y.slug = ${b}
      union all
      select y.id, x.id, ${note}, ${kind} from signs x, signs y where x.slug = ${a} and y.slug = ${b}
      on conflict do nothing`;
  }

  for (const [i, t] of topics.entries()) {
    await tx`insert into topics (slug, title, description, position, status, direction)
      values (${t.slug}, ${t.title}, ${t.description}, ${i}, ${t.status}, ${t.direction})
      on conflict (slug) do update set title = excluded.title, description = excluded.description, position = excluded.position,
        status = excluded.status, direction = excluded.direction`;
  }
  await tx`delete from topics where slug <> all(${[...topicSlugs]})`;

  for (const [i, l] of lessons.entries()) {
    const [{ id }] = await tx<{ id: number }[]>`
      insert into lessons (slug, topic_id, title, summary, position, kind)
      values (${l.slug}, (select id from topics where slug = ${l.topic}), ${l.title}, ${l.summary}, ${i}, ${l.kind})
      on conflict (slug) do update set topic_id = excluded.topic_id, title = excluded.title, summary = excluded.summary,
        position = excluded.position, kind = excluded.kind
      returning id`;
    await tx`delete from lesson_signs where lesson_id = ${id}`;
    for (const [pos, s] of l.signs.entries()) {
      await tx`insert into lesson_signs (lesson_id, sign_id, position) values (${id}, (select id from signs where slug = ${s}), ${pos})`;
    }
  }
  await tx`delete from lessons where slug <> all(${lessons.map((l) => l.slug)})`;
}
