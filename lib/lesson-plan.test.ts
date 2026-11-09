import { describe, expect, it } from "vitest";

import { buildPlan } from "./lesson-plan";

const signs = ["a", "b", "c", "d", "e"];
const pool = ["a", "b", "c", "d", "e", "f", "g", "h"];

describe("buildPlan", () => {
  const plan = buildPlan("lesson-1", signs, pool);

  it("на каждый жест — смотрим, разбираем, проверка; потом по одному заданию практики", () => {
    expect(plan).toHaveLength(signs.length * 4);
    expect(plan.slice(0, 3).map((s) => s.kind)).toEqual(["watch", "analyze", "check"]);
    const practice = plan.slice(signs.length * 3);
    expect(practice.every((s) => s.kind === "find" || s.kind === "recall")).toBe(true);
    expect(new Set(practice.map((s) => s.sign)).size).toBe(signs.length);
  });

  it("в вариантах есть правильный ответ, нужное число вариантов и нет повторов", () => {
    for (const step of plan) {
      if (step.kind !== "check" && step.kind !== "find") continue;
      expect(step.options).toContain(signs[step.sign]);
      expect(step.options).toHaveLength(step.kind === "check" ? 4 : 3);
      expect(new Set(step.options).size).toBe(step.options.length);
    }
  });

  it("одинаковый урок даёт одинаковый план — сохранённый номер шага не «уезжает»", () => {
    expect(buildPlan("lesson-1", signs, pool)).toEqual(plan);
  });
});
