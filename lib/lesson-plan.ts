// Сценарий урока (docs/DESIGN.md, п. 2): для каждого жеста «смотрим → разбираем → проверка»,
// в конце — практика: найти видео по значению и вспомнить карточку.
import { rng, shuffle } from "./exam";

// Порядок детерминирован (зерно — slug урока), чтобы сохранённый номер шага после перезагрузки вёл туда же.

export type Step =
  | { kind: "watch"; sign: number }
  | { kind: "analyze"; sign: number }
  | { kind: "check"; sign: number; options: string[] }
  | { kind: "find"; sign: number; options: string[] }
  | { kind: "recall"; sign: number };

export const STAGE: Record<Step["kind"], 1 | 2 | 3> = { watch: 1, analyze: 2, check: 3, find: 3, recall: 3 };

/** signs — slug жестов урока по порядку; pool — slug жестов темы, из них берутся неверные варианты. */
export function buildPlan(lessonSlug: string, signs: string[], pool: string[]): Step[] {
  const rand = rng(lessonSlug);
  const options = (i: number, count: number) => {
    const others = shuffle(pool.filter((s) => s !== signs[i]), rand).slice(0, count - 1);
    return shuffle([signs[i], ...others], rand);
  };
  const steps: Step[] = signs.flatMap((_, i): Step[] => [
    { kind: "watch", sign: i },
    { kind: "analyze", sign: i },
    { kind: "check", sign: i, options: options(i, 4) },
  ]);
  shuffle(signs.map((_, i) => i), rand).forEach((i, n) => {
    steps.push(n % 2 === 0 ? { kind: "find", sign: i, options: options(i, 3) } : { kind: "recall", sign: i });
  });
  return steps;
}
