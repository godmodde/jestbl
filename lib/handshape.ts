// Сравнение руки с образцами дактильных букв. Чистые функции без DOM: 21 точка руки MediaPipe → признаки → буква.
// Точки — worldLandmarks (метры, оси камеры): они не искажены пропорциями кадра, в отличие от экранных.

export type Point = { x: number; y: number; z: number };
/** Метка руки от MediaPipe для того кадра, который ему дали. */
export type Hand = "Left" | "Right";
export type Features = number[];
export type Templates = Record<string, Features[]>;

// ponytail: пороги подобраны на кадрах демо-видео surdo.media (один носитель, одна камера) — см. lib/handshape.test.ts.
// Руки разных людей перед разными камерами разбросаны сильнее; перекалибровать на записях учеников, когда они появятся.
/** Дальше этого рука не похожа на букву (расстояние до ближайшего образца). Кадры одной буквы между собой: 90% ближе 0,11;
 *  кадры, где рука поднимается или опускается и буквы ещё нет: 90% дальше 0,29. */
export const MAX_DISTANCE = 0.3;
/** Насколько нужная буква может уступать лучшему совпадению: почти ничья у близких по форме букв (Ж/Ф, Л/П) — не ошибка ученика. */
export const TIE_MARGIN = 0.03;
/** Буквы с одной формой руки различаются только движением, а проверка смотрит на форму. Ё на surdo.media нет — проверяем по Е. */
export const SAME_SHAPE: Record<string, string> = { И: "Й", Й: "И", Ш: "Щ", Щ: "Ш", Ь: "Ъ", Ъ: "Ь", Е: "Ё", Ё: "Е" };

/** Образцы сняты с правой руки носителя; MediaPipe метит её на этих кадрах как "Right". */
export const TEMPLATE_HAND: Hand = "Right";

// Вес групп признаков в расстоянии: сгиб пальцев, положение кончиков, поворот кисти.
const W_BEND = 1;
const W_TIPS = 1;
const W_TURN = 1;

const CHAINS = [[0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [0, 9, 10, 11, 12], [0, 13, 14, 15, 16], [0, 17, 18, 19, 20]];
const TIPS = [4, 8, 12, 16, 20];

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z;
const len = (a: Point) => Math.sqrt(dot(a, a));
const unit = (a: Point): Point => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; };
const cross = (a: Point, b: Point): Point => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const angle = (a: Point, b: Point) => Math.acos(Math.max(-1, Math.min(1, dot(unit(a), unit(b)))));

/** Точки относительно запястья, в размерах ладони. Левая рука отражается в правую — так её можно сравнить с образцами.
 *  Зеркало фронтальной камеры отдельно учитывать не нужно: в зеркальном кадре MediaPipe меняет и метку руки. */
export function normalize(points: Point[], hand: Hand): Point[] {
  const w = points[0];
  const flip = hand === TEMPLATE_HAND ? 1 : -1;
  const rel = points.map((p) => ({ x: (p.x - w.x) * flip, y: p.y - w.y, z: p.z - w.z }));
  // Запястье → основания пальцев: жёсткая часть ладони, не зависит от того, как согнуты пальцы.
  const size = (len(rel[5]) + len(rel[9]) + len(rel[17])) / 3;
  return rel.map((p) => ({ x: p.x / size, y: p.y / size, z: p.z / size }));
}

/** 15 углов сгиба (доли π) · кончики пальцев в осях ладони (15) · направление пальцев и ладони в осях камеры (6). */
export function features(p: Point[]): Features {
  const bends = CHAINS.flatMap((c) => [1, 2, 3].map((i) => angle(sub(p[c[i]], p[c[i - 1]]), sub(p[c[i + 1]], p[c[i]])) / Math.PI));
  const along = unit(p[9]);
  const normal = unit(cross(along, sub(p[5], p[17])));
  const across = cross(normal, along);
  const tips = TIPS.flatMap((t) => [dot(p[t], across), dot(p[t], along), dot(p[t], normal)]);
  // Поворот кисти — часть буквы: Г, П, Т отличаются от похожих форм тем, куда смотрят пальцы.
  return [...bends, ...tips, along.x, along.y, along.z, normal.x, normal.y, normal.z];
}

const meanDiff = (a: Features, b: Features, from: number, to: number) => {
  let s = 0;
  for (let i = from; i < to; i++) s += Math.abs(a[i] - b[i]);
  return s / (to - from);
};

export function distance(a: Features, b: Features) {
  return W_BEND * meanDiff(a, b, 0, 15) + W_TIPS * meanDiff(a, b, 15, 30) + W_TURN * meanDiff(a, b, 30, 36);
}

/** Буквы по близости: для каждой — расстояние до её ближайшего образца. */
export function match(f: Features, templates: Templates) {
  const ranked = Object.entries(templates)
    .map(([letter, samples]) => ({ letter, distance: Math.min(...samples.map((s) => distance(f, s))) }))
    .sort((a, b) => a.distance - b.distance);
  return { letter: ranked[0]?.letter ?? null, distance: ranked[0]?.distance ?? Infinity, ranked };
}

export function isLetter(f: Features, templates: Templates, target: string) {
  const { distance: best, ranked } = match(f, templates);
  const d = Math.min(...ranked.filter((r) => r.letter === target || r.letter === SAME_SHAPE[target]).map((r) => r.distance));
  return { ok: d <= MAX_DISTANCE && d - best <= TIE_MARGIN, confidence: Math.max(0, 1 - d / MAX_DISTANCE) };
}
