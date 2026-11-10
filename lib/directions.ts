import "server-only";

import { demoVideos, signColumns, signJoins, toSign, toState, type Sign, type SignRow, type SignState } from "@/lib/data";
import { sql } from "@/lib/db";
import type { ExamSign } from "@/lib/exam";

// Три направления на одной базе жестов (ТЗ, п. 5–6): алфавит, взрослым, детям.

/** Статусы из ТЗ: не изучена, изучена, требует повторения. */
export type Status = "new" | "learned" | "review";
const statusOf = (s: SignState): Status => (s.due ? "review" : s.learned ? "learned" : "new");

type Item = Sign & { state: SignState; status: Status };
const toItem = (r: SignRow): Item => {
  const state = toState(r);
  return { ...toSign(r), state, status: statusOf(state) };
};

// ——— Алфавит ———

export async function getAlphabet(device: string | null) {
  const [rows, checks] = await Promise.all([
    sql<(SignRow & { group_slug: string; group_title: string })[]>`
      select ${signColumns}, l.slug as group_slug, l.title as group_title
      from topics t join lessons l on l.topic_id = t.id join lesson_signs ls on ls.lesson_id = l.id
      join signs s on s.id = ls.sign_id ${signJoins(device)}
      where t.direction = 'alphabet' order by l.position, ls.position`,
    sql<{ slug: string; correct: number; total: number }[]>`
      select distinct on (l.slug) l.slug, a.correct, a.total from exam_attempts a join lessons l on l.id = a.lesson_id
      where a.device_id = ${device}::uuid order by l.slug, a.created_at desc`,
  ]);
  const groups: { slug: string; title: string; letters: Item[]; check: { correct: number; total: number } | null }[] = [];
  for (const r of rows) {
    let g = groups.find((x) => x.slug === r.group_slug);
    if (!g) groups.push((g = { slug: r.group_slug, title: r.group_title, letters: [], check: checks.find((c) => c.slug === r.group_slug) ?? null }));
    g.letters.push(toItem(r));
  }
  return groups;
}

export async function getLetter(device: string | null, slug: string) {
  const groups = await getAlphabet(device);
  const letters = groups.flatMap((g) => g.letters.map((l) => ({ ...l, group: g.slug })));
  const i = letters.findIndex((l) => l.slug === slug);
  if (i < 0) return null;
  const group = groups.find((g) => g.slug === letters[i].group)!;
  return { letter: letters[i], group, prev: letters[i - 1] ?? null, next: letters[i + 1] ?? null };
}

// ——— Взрослым ———

/** «Все слова А–Я» — первая категория библиотеки взрослым (сверка с заказчиком 2026-11-10): вся база без букв.
 *  Не строка в таблице категорий — иначе она попала бы в списки категорий словаря и карточек жестов. */
export const ALL_WORDS = { slug: "a-ya", title: "Все слова А–Я", position: -1 };

export async function getLibrary(device: string | null) {
  const [categories, kinds, [all]] = await Promise.all([
    sql<{ slug: string; title: string; total: number; learned: number; picture: string | null }[]>`
      select c.slug, c.title, count(*)::int as total, count(st.learned_at)::int as learned,
        (array_agg(s.picture order by s.sort_key) filter (where s.picture is not null))[1] as picture
      from categories c join sign_categories sc on sc.category = c.slug join signs s on s.id = sc.sign_id
      left join sign_state st on st.sign_id = s.id and st.device_id = ${device}::uuid
      where s.kind <> 'letter'
      group by c.slug, c.title, c.position order by c.position`,
    sql<{ kind: string; total: number }[]>`
      select kind, count(*)::int as total from signs where kind not in ('letter', 'other') group by kind order by total desc`,
    sql<{ total: number; learned: number }[]>`
      select count(*)::int as total, count(st.learned_at)::int as learned from signs s
      left join sign_state st on st.sign_id = s.id and st.device_id = ${device}::uuid where s.kind <> 'letter'`,
  ]);
  return { categories, kinds, all: { ...ALL_WORDS, ...all } };
}

export async function getCategory(device: string | null, slug: string) {
  const all = slug === ALL_WORDS.slug;
  const [category] = all ? [ALL_WORDS] : await sql<{ slug: string; title: string; position: number }[]>`
    select slug, title, position from categories where slug = ${slug}`;
  if (!category) return null;
  const inCategory = (id: ReturnType<typeof sql>) => (all ? sql`` : sql`and exists (select 1 from sign_categories x where x.sign_id = ${id} and x.category = ${slug})`);
  const [rows, similar, attempts, next] = await Promise.all([
    sql<SignRow[]>`select ${signColumns} from signs s ${signJoins(device)}
      where s.kind <> 'letter' ${inCategory(sql`s.id`)} order by s.sort_key`,
    sql<{ sign: string; other: string }[]>`
      select a.slug as sign, b.slug as other from sign_similar ss
      join signs a on a.id = ss.sign_id join signs b on b.id = ss.similar_id
      where ss.kind = 'similar' ${inCategory(sql`a.id`)}`,
    // ponytail: экзамен «Все слова А–Я» не сохраняется — exam_attempts ссылается на таблицу категорий. Балл виден в итоге.
    all ? Promise.resolve([]) : sql<{ correct: number; total: number; created_at: Date }[]>`
      select correct, total, created_at from exam_attempts where device_id = ${device}::uuid and category = ${slug}
      order by created_at desc limit 1`,
    sql<{ slug: string; title: string }[]>`
      select c.slug, c.title from categories c where c.position > ${category.position} and c.slug <> 'alfavit'
        and (select count(*) from sign_categories sc join signs s on s.id = sc.sign_id
             where sc.category = c.slug and s.kind <> 'letter') >= 4
      order by c.position limit 1`,
  ]);
  const signs = rows.map(toItem);
  const pool: ExamSign[] = signs.map((s) => ({
    slug: s.slug, title: s.title, meaning: s.meaning, kind: s.kind,
    similar: similar.filter((x) => x.sign === s.slug).map((x) => x.other),
  }));
  return { category, signs, pool, last: attempts[0] ?? null, next: next[0] ?? null };
}

export const KIND_TITLES: Record<string, string> = {
  object: "Предметы", action: "Действия", interaction: "Взаимодействия", phrase: "Фразы", letter: "Буквы", other: "Другое",
};

// ——— Детям ———

export type Station = { slug: string; kind: string; title: string; completed: boolean; open: boolean };
export type Sticker = { slug: string; title: string; picture: string | null; videoUrl: string | null; earned: boolean };
export type KidsTopic = {
  slug: string; title: string; status: "open" | "soon"; open: boolean;
  stations: Station[]; stickers: Sticker[]; stars: number;
};

/** Два альбома детского мира: темы (семья, животные…) и буквы (решение заказчика 2026-11-10). */
export type KidsWorld = "kids" | "kids-alphabet";

/** small — малыши 3–5: без «Найди отличие» (сверка с заказчиком 2026-11-10). */
export async function getKids(device: string | null, world: KidsWorld = "kids", small = false): Promise<KidsTopic[]> {
  const [topics, stations, signs, stars, shown] = await Promise.all([
    sql<{ id: number; slug: string; title: string; status: "open" | "soon" }[]>`
      select id, slug, title, status from topics where direction = ${world} order by position`,
    sql<{ topic_id: number; slug: string; kind: string; title: string; completed: boolean }[]>`
      select l.topic_id, l.slug, l.kind, l.title, p.completed_at is not null as completed
      from lessons l join topics t on t.id = l.topic_id
      left join lesson_progress p on p.lesson_id = l.id and p.device_id = ${device}::uuid
      where t.direction = ${world} order by l.position`,
    // Наклейки темы — жесты первой станции по порядку: i-я пройденная станция вклеивает i-ю наклейку.
    sql<{ topic_id: number; slug: string; title: string; picture: string | null; video_url: string | null }[]>`
      select distinct on (l.topic_id, ls.position) l.topic_id, s.slug, s.title, s.picture, s.video_url
      from lessons l join topics t on t.id = l.topic_id join lesson_signs ls on ls.lesson_id = l.id join signs s on s.id = ls.sign_id
      where t.direction = ${world} order by l.topic_id, ls.position, l.position`,
    sql<{ topic_id: number; stars: number }[]>`
      select l.topic_id, max(a.stars)::int as stars from exam_attempts a join lessons l on l.id = a.lesson_id
      where a.device_id = ${device}::uuid and l.kind in ('exam', 'show') group by l.topic_id`,
    // Букву вклеивает тест «Покажи букву»: она есть в попытке и не попала в её ошибки.
    world === "kids-alphabet" ? sql<{ slug: string }[]>`
      select distinct s.slug from exam_attempts a join lessons l on l.id = a.lesson_id
      join lesson_signs ls on ls.lesson_id = l.id join signs s on s.id = ls.sign_id
      where a.device_id = ${device}::uuid and l.kind = 'show' and not (s.slug = any(a.mistakes))` : Promise.resolve([]),
  ]);
  const passed = new Set(shown.map((r) => r.slug));
  let prevDone = true;
  // Темы — на выбор, игры в теме тоже (сверка с заказчиком 2026-11-10); буквы — по очереди: группа и задание открываются после предыдущих.
  const free = world === "kids";
  return topics.map((t) => {
    const own = stations.filter((s) => s.topic_id === t.id && !(small && s.kind === "diff"));
    const done = own.filter((s) => s.completed).length;
    const topicStars = stars.find((s) => s.topic_id === t.id)?.stars ?? 0;
    const open = t.status === "open" && (free || prevDone);
    prevDone = open && topicStars > 0;
    return {
      slug: t.slug, title: t.title, status: t.status, open, stars: topicStars,
      stations: own.map((s, i) => ({ slug: s.slug, kind: s.kind, title: s.title, completed: s.completed, open: open && (free || i === 0 || own[i - 1].completed) })),
      stickers: signs.filter((s) => s.topic_id === t.id).map((s, i) => ({
        slug: s.slug, title: s.title, picture: s.picture, videoUrl: demoVideos ? s.video_url : null,
        // Все игры темы пройдены — вклеены все наклейки: у малышей игр на одну меньше, чем наклеек.
        earned: free ? i < done || (own.length > 0 && done === own.length) : passed.has(s.slug),
      })),
    };
  });
}

/** Альбом, к которому относится тема: её мир и все темы этого мира. */
export async function getKidsAlbum(device: string | null, topicSlug: string, small = false) {
  const [row] = await sql<{ direction: KidsWorld }[]>`
    select direction from topics where slug = ${topicSlug} and direction in ('kids', 'kids-alphabet')`;
  return row ? { world: row.direction, topics: await getKids(device, row.direction, small) } : null;
}

export async function getKidsStation(device: string | null, topicSlug: string, stationSlug: string, small = false) {
  const album = await getKidsAlbum(device, topicSlug, small);
  const topic = album?.topics.find((t) => t.slug === topicSlug);
  const station = topic?.stations.find((s) => s.slug === stationSlug);
  if (!topic || !station) return null;
  const rows = await sql<SignRow[]>`select ${signColumns} from lessons l join lesson_signs ls on ls.lesson_id = l.id
    join signs s on s.id = ls.sign_id ${signJoins(device)} where l.slug = ${stationSlug} order by ls.position`;
  const index = topic.stations.indexOf(station);
  return { world: album!.world, topic, station, index, signs: rows.map(toSign), next: topic.stations[index + 1] ?? null };
}

/** Копилка звёзд (сверка с заказчиком 2026-11-10): лучший итог каждой темы и группы букв — повтор того же результата не добавляет. */
export async function getStarBank(device: string | null) {
  const [row] = await sql<{ stars: number }[]>`
    select coalesce(sum(best), 0)::int as stars from (
      select max(a.stars) as best from exam_attempts a join lessons l on l.id = a.lesson_id join topics t on t.id = l.topic_id
      where a.device_id = ${device}::uuid and t.direction in ('kids', 'kids-alphabet') group by t.id) b`;
  return row.stars;
}

// ——— Главный экран обучения ———

/** Где человек остановился: последний начатый и не законченный урок в любом направлении. */
export async function getContinue(device: string | null) {
  const [last] = await sql<{ slug: string; title: string; kind: string; direction: string; topic_slug: string; topic_title: string }[]>`
    select l.slug, l.title, l.kind, t.direction, t.slug as topic_slug, t.title as topic_title
    from lesson_progress p join lessons l on l.id = p.lesson_id join topics t on t.id = l.topic_id
    where p.device_id = ${device}::uuid and p.completed_at is null and l.kind <> 'exam'
    order by p.updated_at desc limit 1`;
  return last ?? null;
}

export async function getDirectionsSummary(device: string | null) {
  const [[letters], kids, stars] = await Promise.all([
    sql<{ total: number; learned: number }[]>`
      select count(*)::int as total, count(st.learned_at)::int as learned from signs s
      left join sign_state st on st.sign_id = s.id and st.device_id = ${device}::uuid where s.kind = 'letter'`,
    getKids(device),
    getStarBank(device),
  ]);
  return {
    alphabet: letters,
    kids: {
      stickers: kids.reduce((n, t) => n + t.stickers.filter((s) => s.earned).length, 0),
      total: kids.reduce((n, t) => n + t.stickers.length, 0),
      stars,
      pictures: kids.map((t) => t.stickers[0]?.picture).filter((p): p is string => !!p).slice(0, 3),
    },
  };
}

// ——— Прогресс ———

/** Слабые места: жесты, в которых ошибались на экзаменах за последний месяц. */
export async function getProgressExtras(device: string | null) {
  const [weak, exams] = await Promise.all([
    sql<{ slug: string; title: string; misses: number }[]>`
      select s.slug, s.title, count(*)::int as misses from exam_attempts a cross join unnest(a.mistakes) as m(slug)
      join signs s on s.slug = m.slug
      where a.device_id = ${device}::uuid and a.created_at > now() - interval '30 days'
      group by s.slug, s.title order by misses desc, s.title limit 8`,
    sql<{ slug: string; title: string; correct: number; total: number }[]>`
      select distinct on (a.category) a.category as slug, c.title, a.correct, a.total
      from exam_attempts a join categories c on c.slug = a.category
      where a.device_id = ${device}::uuid order by a.category, a.created_at desc`,
  ]);
  return { weak, exams };
}
