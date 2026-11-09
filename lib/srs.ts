// Интервальное повторение (docs/DESIGN.md, п. 3). Чистая функция — проверяется в srs.test.ts.
export type Grade = "again" | "hard" | "good";

export const GRADES: { grade: Grade; label: string }[] = [
  { grade: "again", label: "Повторить" },
  { grade: "hard", label: "Почти запомнил" },
  { grade: "good", label: "Знаю" },
];

const MINUTE = 60_000;
const DAY = 86_400_000;

export type CardState = { intervalDays: number; reps: number };

export function schedule(prev: CardState, grade: Grade, now = new Date()): CardState & { dueAt: Date } {
  if (grade === "again") return { intervalDays: 0, reps: 0, dueAt: new Date(now.getTime() + 10 * MINUTE) };
  const intervalDays = grade === "hard" ? Math.max(1, prev.intervalDays * 1.5) : Math.max(3, prev.intervalDays * 2.5);
  return { intervalDays, reps: prev.reps + 1, dueAt: new Date(now.getTime() + intervalDays * DAY) };
}
