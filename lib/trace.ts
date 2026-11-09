import { sampleStroke, type Stroke } from "./letters";

// Проверка одной черты при обведении буквы. Чистая функция: точки следа в координатах поля 100×140.

// Пороги в единицах поля (на телефоне 1 единица ≈ 3–4 px): допуск под палец ребёнка, а не под стилус.
const TOLERANCE = 9; // точка черты пройдена, если след прошёл не дальше
const MIN_COVERAGE = 0.85; // доля пройденных точек черты
const START_RADIUS = 14; // начинать у номера черты
const OFF_PATH = 18; // дальше — след уже не на черте
const MAX_OFF_SHARE = 0.25; // столько следа можно увести в сторону: дрожь руки, съезд в конце
const MIN_PROGRESS = 0.5; // чистое продвижение по черте от её длины — отсекает «туда и обратно»
const DOT = 12; // черта короче — точка (Ё): направление у неё не проверяем
const JUMP = 8; // скачок ближайшей точки дальше 8 шагов — не движение, а переход на соседний участок черты (е, б)

type Point = { x: number; y: number };
export type TraceReason = "short" | "wrong-direction" | "off-path";
export type TraceResult = { ok: true; coverage: number; reason: null } | { ok: false; coverage: number; reason: TraceReason };

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function checkStroke(points: Point[], stroke: Stroke, { tolerance = TOLERANCE }: { tolerance?: number } = {}): TraceResult {
  const ref = sampleStroke(stroke, 2);
  const user = densify(points);
  if (!user.length) return { ok: false, coverage: 0, reason: "short" };

  const coverage = ref.filter((r) => user.some((p) => dist(p, r) <= tolerance)).length / ref.length;
  const nearest = user.map((p) => ref.reduce((best, r, i) => { const d = dist(p, r); return d < best.d ? { i, d } : best; }, { i: 0, d: Infinity }));
  const fail = (reason: TraceReason): TraceResult => ({ ok: false, coverage, reason });

  if (nearest.filter((n) => n.d > OFF_PATH).length / user.length > MAX_OFF_SHARE) return fail("off-path");

  // Направление: сумма маленьких сдвигов ближайшей точки черты вдоль следа. У замкнутой (О) сдвиг через шов — по кругу.
  const last = ref.length - 1;
  const closed = last > 2 && dist(ref[0], ref[last]) <= tolerance;
  const dot = last * 2 < DOT;
  let progress = 0;
  let prev = -1;
  for (const { i, d } of nearest) {
    if (d > OFF_PATH) continue;
    if (prev >= 0) {
      let delta = i - prev;
      if (closed && Math.abs(delta) > last / 2) delta -= Math.sign(delta) * last;
      if (Math.abs(delta) <= JUMP) progress += delta;
    }
    prev = i;
  }

  if (!dot && progress < 0) return fail("wrong-direction");
  if (dist(user[0], ref[0]) > START_RADIUS || coverage < MIN_COVERAGE) return fail("short");
  if (!dot && progress < MIN_PROGRESS * last) return fail("wrong-direction");
  return { ok: true, coverage, reason: null };
}

// Быстрое движение даёт редкие точки: досыпаем через каждую единицу, иначе покрытие занижается.
function densify(points: Point[]): Point[] {
  const out = points.slice(0, 1);
  for (let k = 1; k < points.length; k++) {
    const [a, b] = [points[k - 1], points[k]];
    const n = Math.ceil(dist(a, b));
    for (let s = 1; s <= n; s++) out.push({ x: a.x + ((b.x - a.x) * s) / n, y: a.y + ((b.y - a.y) * s) / n });
  }
  return out;
}
