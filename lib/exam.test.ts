import { describe, expect, it } from "vitest";

import { buildQuestions, canExam, explanation, recommend, scoreExam, stars, targets, type ExamSign } from "./exam";

const pool: ExamSign[] = Array.from({ length: 12 }, (_, i) => ({
  slug: `s${i}`, title: `Жест ${i}`, meaning: i % 3 ? `Толкование номер ${i}.` : `Жест ${i}.`, kind: i % 2 ? "object" : "action", similar: i === 0 ? ["s1"] : i === 1 ? ["s0"] : [],
}));
const slugs = new Set(pool.map((s) => s.slug));

describe("экзамен", () => {
  it("берёт только жесты категории и не повторяет слово-цель", () => {
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const qs = buildQuestions(pool, seed);
      const all = qs.flatMap(targets);
      expect(new Set(all).size).toBe(all.length);
      for (const q of qs) {
        const used = q.type === "match" ? [...q.signs, ...q.order] : q.type === "recall" ? [q.sign] : q.type === "truefalse" ? [q.sign, q.shown] : [q.sign, ...q.options];
        for (const s of used) expect(slugs.has(s)).toBe(true);
        if ("options" in q) {
          expect(q.options).toContain(q.sign);
          expect(new Set(q.options).size).toBe(q.options.length);
        }
      }
      expect(qs.some((q) => q.type === "recall")).toBe(false);
    }
  });

  it("одно зерно — один экзамен, разные зёрна — разные", () => {
    expect(buildQuestions(pool, "x")).toEqual(buildQuestions(pool, "x"));
    expect(buildQuestions(pool, "x")).not.toEqual(buildQuestions(pool, "y"));
  });

  it("в вопросе о похожих среди вариантов есть похожий жест", () => {
    for (let i = 0; i < 40; i++) {
      for (const q of buildQuestions(pool, `seed${i}`)) {
        if (q.type === "similar") expect(q.options).toContain(pool.find((s) => s.slug === q.sign)!.similar[0]);
      }
    }
  });

  it("маленькая категория: экзамен не собирается, вариантов не больше, чем жестов", () => {
    expect(canExam(pool.slice(0, 3))).toBe(false);
    const qs = buildQuestions(pool.slice(0, 4), "z");
    for (const q of qs) if ("options" in q) expect(q.options.length).toBeLessThanOrEqual(4);
  });

  it("считает баллы, ошибки по типу материала и рекомендацию", () => {
    const qs = buildQuestions(pool, "score");
    const kinds = Object.fromEntries(pool.map((s) => [s.slug, s.kind]));
    const all = qs.flatMap(targets);
    const result = scoreExam(qs, new Set(all.slice(0, 3)), kinds);
    expect(result.total).toBe(all.length);
    expect(result.correct).toBe(all.length - 3);
    expect(result.byKind.reduce((n, k) => n + k.wrong, 0)).toBe(3);
    expect(recommend(result, { slug: "next", title: "Дальше" }).kind).toBe(result.correct / result.total >= 0.8 ? "next" : "review");
    expect(recommend({ ...result, correct: 2, total: 10 }, null)).toEqual({ kind: "review", count: 3 });
  });

  it("семь типов вопросов; «верно / неверно» подписан то верно, то неверно", () => {
    const qs = Array.from({ length: 40 }, (_, i) => buildQuestions(pool, `seven${i}`)).flat();
    expect(new Set(qs.map((q) => q.type))).toEqual(new Set(["recognize", "find", "meaning", "similar", "match", "explain", "truefalse"]));
    const tf = qs.filter((q) => q.type === "truefalse");
    expect(tf.some((q) => q.shown === q.sign)).toBe(true);
    expect(tf.some((q) => q.shown !== q.sign)).toBe(true);
  });

  it("толкование без самого слова; только из слова — не годится для вопроса", () => {
    expect(explanation({ title: "Бабушка", meaning: "Бабушка — мама мамы или папы." })).toBe("Мама мамы или папы.");
    expect(explanation({ title: "До свидания", meaning: "Прощание в конце встречи." })).toBe("Прощание в конце встречи.");
    expect(explanation({ title: "Мальчик", meaning: "Мальчик." })).toBe("");
    for (let i = 0; i < 20; i++) {
      for (const q of buildQuestions(pool, `explain${i}`)) {
        if (q.type === "explain") for (const o of q.options) expect(explanation(pool.find((s) => s.slug === o)!)).not.toBe("");
      }
    }
  });

  it("суженный набор типов", () => {
    for (const q of buildQuestions(pool, "letters", { types: ["recognize", "find"] })) expect(["recognize", "find"]).toContain(q.type);
  });

  it("звёзды ступенями: 3 — дошёл до конца, 5 — от 60 %, 10 — без ошибок", () => {
    expect(stars(10, 10)).toBe(10);
    expect(stars(9, 10)).toBe(5);
    expect(stars(6, 10)).toBe(5);
    expect(stars(5, 10)).toBe(3);
    expect(stars(0, 10)).toBe(3);
  });
});
