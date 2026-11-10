// Экзамен по категории и практика (ТЗ, п. 5): чистые функции, проверяются в exam.test.ts.
// Правила ТЗ: только жесты категории, вопросы и варианты перемешаны, слово-цель не повторяется,
// до семи типов вопросов (сверка с заказчиком 2026-11-10), похожие жесты — только если они есть в категории.

export type ExamSign = { slug: string; title: string; meaning: string; kind: string; similar: string[] };

export type Question =
  | { type: "recognize"; sign: string; options: string[] } // видео → значение
  | { type: "find"; sign: string; options: string[] } // слово → видео
  | { type: "meaning"; sign: string; options: string[] } // толкование → видео
  | { type: "similar"; sign: string; options: string[] } // слово → видео, рядом похожий жест
  | { type: "match"; signs: string[]; order: string[] } // три видео ↔ три слова
  | { type: "explain"; sign: string; options: string[] } // видео → толкование
  | { type: "truefalse"; sign: string; shown: string } // видео и слово: верно ли подписано
  | { type: "recall"; sign: string }; // только практика: вспомнить до раскрытия

export const EXAM_SIZE = 10;
const TYPES = ["recognize", "find", "meaning", "similar", "match", "explain", "truefalse"] as const;

export function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Толкование без самого слова: «Бабушка — мама мамы или папы.» → «Мама мамы или папы.»; пусто, если толкование — только слово.
 *  Иначе вопрос «жест → толкование» повторял бы «жест → слово». */
export function explanation(s: { title: string; meaning: string }) {
  const word = s.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rest = s.meaning.replace(new RegExp(`^${word}\\s*[—–-]\\s*`, "i"), "").trim();
  if (!rest || rest.replace(/[.\s]/g, "").toLowerCase() === s.title.replace(/\s/g, "").toLowerCase()) return "";
  return rest[0].toUpperCase() + rest.slice(1);
}

/** Экзамен нельзя собрать честно меньше чем из четырёх жестов: варианты стали бы угадайкой. */
export const canExam = (pool: ExamSign[]) => pool.length >= 4;

export function buildQuestions(pool: ExamSign[], seed: string, { size = EXAM_SIZE, practice = false, types: only }: { size?: number; practice?: boolean; types?: readonly Question["type"][] } = {}): Question[] {
  const rand = rng(seed);
  const slugs = new Set(pool.map((s) => s.slug));
  const queue = shuffle(pool, rand);
  const others = (slug: string, count: number) =>
    shuffle(pool.filter((s) => s.slug !== slug).map((s) => s.slug), rand).slice(0, count);
  // Для букв толкование выдало бы ответ («Буква А…»), поэтому набор типов можно сузить.
  const types = only ?? (practice ? [...TYPES, "recall" as const] : TYPES);

  const questions: Question[] = [];
  for (let t = Math.floor(rand() * types.length); queue.length && questions.length < size; t++) {
    const type = types[t % types.length];
    const sign = queue.shift()!;
    const similar = sign.similar.filter((s) => slugs.has(s));
    if (type === "match" && queue.length >= 2) {
      const signs = [sign, ...queue.splice(0, 2)].map((s) => s.slug);
      questions.push({ type, signs, order: shuffle(signs, rand) });
    } else if (type === "recall") {
      questions.push({ type, sign: sign.slug });
    } else if (type === "explain" && explanation(sign)) {
      // Варианты — только жесты, у которых есть толкование помимо слова.
      const rest = shuffle(pool.filter((s) => s.slug !== sign.slug && explanation(s)).map((s) => s.slug), rand).slice(0, 2);
      questions.push({ type, sign: sign.slug, options: shuffle([sign.slug, ...rest], rand) });
    } else if (type === "truefalse") {
      // Подпись верна в половине случаев, иначе — другое слово той же категории.
      questions.push({ type, sign: sign.slug, shown: rand() < 0.5 ? sign.slug : others(sign.slug, 1)[0] });
    } else if (type === "similar" && similar.length) {
      // Похожий жест обязателен среди вариантов, остальные — из той же категории.
      const rest = others(sign.slug, 3).filter((s) => s !== similar[0]).slice(0, 1);
      questions.push({ type, sign: sign.slug, options: shuffle([sign.slug, similar[0], ...rest], rand) });
    } else {
      const kind = type === "similar" || type === "match" || type === "explain" ? "recognize" : type;
      const count = kind === "recognize" ? 4 : 3;
      questions.push({ type: kind, sign: sign.slug, options: shuffle([sign.slug, ...others(sign.slug, count - 1)], rand) });
    }
  }
  return questions;
}

/** Слова-цели вопроса: у сопоставления их три. */
export const targets = (q: Question) => (q.type === "match" ? q.signs : [q.sign]);

export type ExamResult = {
  total: number;
  correct: number;
  mistakes: string[];
  /** Ошибки по типу материала: предметы, действия, взаимодействия… */
  byKind: { kind: string; total: number; wrong: number }[];
};

/** wrong — слова-цели, на которых человек ошибся хотя бы раз. Каждое слово-цель — один балл. */
export function scoreExam(questions: Question[], wrong: Set<string>, kinds: Record<string, string>): ExamResult {
  const all = questions.flatMap(targets);
  const byKind = new Map<string, { total: number; wrong: number }>();
  for (const slug of all) {
    const k = byKind.get(kinds[slug]) ?? { total: 0, wrong: 0 };
    k.total++;
    if (wrong.has(slug)) k.wrong++;
    byKind.set(kinds[slug], k);
  }
  const mistakes = all.filter((s) => wrong.has(s));
  return {
    total: all.length,
    correct: all.length - mistakes.length,
    mistakes,
    byKind: [...byKind].map(([kind, v]) => ({ kind, ...v })).filter((k) => k.wrong > 0),
  };
}

/** Детский экзамен (сверка с заказчиком 2026-11-10): ступени 3 / 5 / 10 звёзд по ответам с первой попытки —
 *  дошёл до конца — 3, хорошо (от 60 %) — 5, без ошибок — 10. */
export const STAR_TIERS = [3, 5, 10] as const;
export function stars(correct: number, total: number): 3 | 5 | 10 {
  const share = total ? correct / total : 0;
  return share >= 1 ? 10 : share >= 0.6 ? 5 : 3;
}

/** Рекомендация по правилам (ТЗ, п. 7): не ИИ, а заранее заданные условия. */
export function recommend(result: ExamResult, next: { slug: string; title: string } | null) {
  if (result.correct / result.total >= 0.8) {
    return next ? { kind: "next" as const, ...next } : { kind: "done" as const };
  }
  return { kind: "review" as const, count: result.mistakes.length };
}
