import { describe, expect, it } from "vitest";

import { schedule } from "./srs";

const now = new Date("2026-10-09T12:00:00Z");
const days = (d: Date) => (d.getTime() - now.getTime()) / 86_400_000;

describe("schedule", () => {
  it("«Повторить» возвращает карточку через 10 минут и сбрасывает серию", () => {
    const r = schedule({ intervalDays: 7.5, reps: 3 }, "again", now);
    expect(r.dueAt.getTime() - now.getTime()).toBe(10 * 60_000);
    expect(r).toMatchObject({ intervalDays: 0, reps: 0 });
  });

  it("новая карточка: «Почти» — через день, «Знаю» — через три", () => {
    expect(days(schedule({ intervalDays: 0, reps: 0 }, "hard", now).dueAt)).toBe(1);
    expect(days(schedule({ intervalDays: 0, reps: 0 }, "good", now).dueAt)).toBe(3);
  });

  it("интервал растёт: ×1,5 для «Почти», ×2,5 для «Знаю»", () => {
    expect(schedule({ intervalDays: 4, reps: 2 }, "hard", now)).toMatchObject({ intervalDays: 6, reps: 3 });
    expect(schedule({ intervalDays: 3, reps: 1 }, "good", now)).toMatchObject({ intervalDays: 7.5, reps: 2 });
  });
});
