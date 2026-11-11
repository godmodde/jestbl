import "server-only";

import { buildPlan, type Step } from "@/lib/lesson-plan";
import { sql } from "@/lib/db";

// Видео surdo.media — только для локального показа (docs/CHECKPOINT.md). Без флага везде заглушка.
export const demoVideos = process.env.DEMO_VIDEOS === "surdo";

export type Sign = {
  slug: string;
  title: string;
  gloss: string;
  meaning: string;
  howTo: string | null;
  context: string | null;
  notice: string | null;
  category: string;
  categoryTitle: string;
  videoUrl: string | null;
  sourceUrl: string | null;
  needsReview: boolean;
  kind: string;
  picture: string | null;
};

export type SignState = { favorite: boolean; learned: boolean; inReview: boolean; due: boolean };

export type SignRow = {
  kind: string; picture: string | null;
  slug: string; title: string; gloss: string; meaning: string; how_to: string | null; context: string | null;
  notice: string | null; category: string; category_title: string; video_url: string | null; source_url: string | null;
  needs_review: boolean; favorite: boolean | null; learned_at: Date | null; due_at: Date | null;
};

// Функция, а не константа: фрагмент запроса создаётся при запросе — импорт модуля не требует базы (сборка на Vercel).
export const signColumns = () => sql`s.kind, s.picture, s.slug, s.title, s.gloss, s.meaning, s.how_to, s.context, s.notice, s.category,
  c.title as category_title, s.video_url, s.source_url, s.needs_review, st.favorite, st.learned_at, st.due_at`;

export const signJoins = (device: string | null) => sql`
  join categories c on c.slug = s.category
  left join sign_state st on st.sign_id = s.id and st.device_id = ${device}::uuid`;

export function toSign(r: SignRow): Sign {
  return {
    slug: r.slug, title: r.title, gloss: r.gloss, meaning: r.meaning, howTo: r.how_to, context: r.context,
    notice: r.notice, category: r.category, categoryTitle: r.category_title,
    videoUrl: demoVideos ? r.video_url : null, sourceUrl: demoVideos ? r.source_url : null, needsReview: r.needs_review,
    kind: r.kind, picture: r.picture,
  };
}

export function toState(r: SignRow): SignState {
  return {
    favorite: !!r.favorite,
    learned: !!r.learned_at,
    inReview: !!r.due_at,
    due: !!r.due_at && r.due_at.getTime() <= Date.now(),
  };
}

export async function getCategories() {
  return sql<{ slug: string; title: string }[]>`select slug, title from categories order by position`;
}

export type DictionaryTab = "all" | "learned" | "favorites" | "review";

export async function searchSigns(device: string | null, opts: { q?: string; category?: string; tab?: DictionaryTab; kind?: string; sort?: "az" }) {
  const q = opts.q?.trim().toLowerCase().replace(/[\\%_]/g, "\\$&");
  const rows = await sql<SignRow[]>`
    select ${signColumns()} from signs s ${signJoins(device)}
    where true
      ${q ? sql`and s.search like ${"%" + q + "%"} escape '\\'` : sql``}
      ${opts.category ? sql`and exists (select 1 from sign_categories sc where sc.sign_id = s.id and sc.category = ${opts.category})` : sql``}
      ${opts.tab === "learned" ? sql`and st.learned_at is not null` : sql``}
      ${opts.tab === "favorites" ? sql`and st.favorite` : sql``}
      ${opts.tab === "review" ? sql`and st.due_at is not null` : sql``}
      ${opts.kind ? sql`and s.kind = ${opts.kind}` : sql``}
      ${opts.category === "alfavit" ? sql`` : sql`and s.kind <> 'letter'`}
    order by ${opts.sort === "az" ? sql`s.sort_key` : sql`c.position, s.sort_key`}`;
  return rows.map((r) => ({ ...toSign(r), state: toState(r) }));
}

export async function getSign(device: string | null, slug: string) {
  const [row] = await sql<SignRow[]>`select ${signColumns()} from signs s ${signJoins(device)} where s.slug = ${slug}`;
  if (!row) return null;
  const [similar, lessons] = await Promise.all([
    sql<{ slug: string; title: string; note: string }[]>`
      select o.slug, o.title, ss.note from sign_similar ss
      join signs s on s.id = ss.sign_id join signs o on o.id = ss.similar_id
      where s.slug = ${slug} order by o.title`,
    sql<{ slug: string; title: string }[]>`
      select l.slug, l.title from lesson_signs ls
      join lessons l on l.id = ls.lesson_id join signs s on s.id = ls.sign_id
      where s.slug = ${slug} order by l.position`,
  ]);
  return { sign: toSign(row), state: toState(row), similar, lessons };
}

export type LessonSummary = {
  slug: string; title: string; summary: string; position: number; signCount: number;
  totalSteps: number; step: number; completed: boolean;
};

export async function getLearnHome(device: string | null) {
  const [topics, lessons, [{ due }]] = await Promise.all([
    sql<{ slug: string; title: string; description: string; status: "open" | "soon" }[]>`
      select slug, title, description, status from topics where direction = 'adults' order by position`,
    sql<{ slug: string; title: string; summary: string; position: number; topic: string; sign_count: number; step: number | null; completed_at: Date | null }[]>`
      select l.slug, l.title, l.summary, l.position, t.slug as topic,
        (select count(*) from lesson_signs ls where ls.lesson_id = l.id)::int as sign_count, p.step, p.completed_at
      from lessons l join topics t on t.id = l.topic_id
      left join lesson_progress p on p.lesson_id = l.id and p.device_id = ${device}::uuid
      where t.direction = 'adults'
      order by t.position, l.position`,
    sql<{ due: number }[]>`select count(*)::int as due from sign_state where device_id = ${device}::uuid and due_at <= now()`,
  ]);
  const toSummary = (l: (typeof lessons)[number]): LessonSummary => ({
    slug: l.slug, title: l.title, summary: l.summary, position: l.position + 1, signCount: l.sign_count,
    totalSteps: l.sign_count * 4, step: l.step ?? 0, completed: !!l.completed_at,
  });
  return {
    topics: topics.map((t) => ({ ...t, lessons: lessons.filter((l) => l.topic === t.slug).map(toSummary) })),
    dueCount: due,
  };
}

export type LessonSign = Sign & { similar: { slug: string; title: string; note: string }[]; state: SignState };

export async function getLesson(device: string | null, slug: string) {
  const [lesson] = await sql<{ id: number; slug: string; title: string; summary: string; position: number; topic_id: number; topic_title: string; step: number | null; completed_at: Date | null }[]>`
    select l.id, l.slug, l.title, l.summary, l.position, l.topic_id, t.title as topic_title, p.step, p.completed_at
    from lessons l join topics t on t.id = l.topic_id
    left join lesson_progress p on p.lesson_id = l.id and p.device_id = ${device}::uuid
    where l.slug = ${slug}`;
  if (!lesson) return null;

  const [signRows, pool, similar, next] = await Promise.all([
    sql<SignRow[]>`select ${signColumns()} from lesson_signs ls join signs s on s.id = ls.sign_id ${signJoins(device)}
      where ls.lesson_id = ${lesson.id} order by ls.position`,
    sql<{ slug: string; title: string; video_url: string | null }[]>`
      select distinct s.slug, s.title, s.video_url from lessons l
      join lesson_signs ls on ls.lesson_id = l.id join signs s on s.id = ls.sign_id
      where l.topic_id = ${lesson.topic_id} order by s.slug`,
    sql<{ sign: string; slug: string; title: string; note: string }[]>`
      select s.slug as sign, o.slug, o.title, ss.note from lesson_signs ls
      join sign_similar ss on ss.sign_id = ls.sign_id join signs s on s.id = ls.sign_id join signs o on o.id = ss.similar_id
      where ls.lesson_id = ${lesson.id}`,
    sql<{ slug: string; title: string }[]>`
      select slug, title from lessons where topic_id = ${lesson.topic_id} and position > ${lesson.position}
      order by position limit 1`,
  ]);

  const signs: LessonSign[] = signRows.map((r) => ({
    ...toSign(r),
    state: toState(r),
    similar: similar.filter((x) => x.sign === r.slug).map(({ slug, title, note }) => ({ slug, title, note })),
  }));
  const steps: Step[] = buildPlan(lesson.slug, signs.map((s) => s.slug), pool.map((p) => p.slug));
  return {
    lesson: { slug: lesson.slug, title: lesson.title, summary: lesson.summary, position: lesson.position + 1, topicTitle: lesson.topic_title },
    signs,
    pool: Object.fromEntries(pool.map((p) => [p.slug, { title: p.title, videoUrl: demoVideos ? p.video_url : null }])),
    steps,
    // Пройденный урок открываем с начала: человек пришёл его пересмотреть.
    initialStep: lesson.completed_at ? 0 : Math.min(lesson.step ?? 0, steps.length - 1),
    completed: !!lesson.completed_at,
    next: next[0] ?? null,
  };
}

export async function getReviewQueue(device: string | null) {
  if (!device) return [];
  const rows = await sql<SignRow[]>`select ${signColumns()} from signs s ${signJoins(device)}
    where st.due_at <= now() order by st.due_at limit 30`;
  return rows.map(toSign);
}

export async function getSignCount() {
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from signs`;
  return n;
}
