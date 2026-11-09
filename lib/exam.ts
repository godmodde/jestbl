// Экзамен по категории и практика (ТЗ, п. 5): чистые функции, проверяются в exam.test.ts.
// Правила ТЗ: только жесты категории, вопросы и варианты перемешаны, слово-цель не повторяется,
// не больше пяти типов вопросов, похожие жесты — только если они есть в категории.

export type ExamSign = { slug: string; title: string; meaning: string; kind: string; similar: string[] };

export type Question =
  | { type: "recognize"; sign: string; options: string[] } // видео → значение
  | { type: "find"; sign: string; options: string[] } // слово → видео
  | { type: "meaning"; sign: string; options: string[] } // толкование → видео
  | { type: "similar"; sign: string; options: string[] } // слово → видео, рядом похожий жест
  | { type: "match"; signs: string[]; order: string[] } // три видео ↔ три слова
  | { type: "recall"; sign: string }; // только практика: вспомнить до раскрытия

export const EXAM_SIZE = 10;
const TYPES = ["recognize", "find", "meaning", "similar", "match"] as const;

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
    } else if (type === "similar" && similar.length) {
      // Похожий жест обязателен среди вариантов, остальные — из той же категории.
      const rest = others(sign.slug, 3).filter((s) => s !== similar[0]).slice(0, 1);
      questions.push({ type, sign: sign.slug, options: shuffle([sign.slug, similar[0], ...rest], rand) });
    } else {
      const kind = type === "similar" || type === "match" ? "recognize" : type;
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

/** Детский экзамен (ТЗ, п. 5): 1–3 звезды по доле ответов с первой попытки; дошёл до конца — хотя бы одна. */
export function stars(correct: number, total: number): 1 | 2 | 3 {
  const share = total ? correct / total : 0;
  return share >= 0.9 ? 3 : share >= 0.6 ? 2 : 1;
}

/** Рекомендация по правилам (ТЗ, п. 7): не ИИ, а заранее заданные условия. */
export function recommend(result: ExamResult, next: { slug: string; title: string } | null) {
  if (result.correct / result.total >= 0.8) {
    return next ? { kind: "next" as const, ...next } : { kind: "done" as const };
  }
  return { kind: "review" as const, count: result.mistakes.length };
}
