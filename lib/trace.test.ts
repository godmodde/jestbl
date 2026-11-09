import { describe, expect, it } from "vitest";

import { LETTERS, sampleStroke } from "./letters";
import { checkStroke } from "./trace";

const ALPHABET = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
const all = Object.entries(LETTERS).flatMap(([ch, strokes]) => strokes.map((d, i) => ({ name: `${ch}, черта ${i + 1}`, d })));

// Повторяемый «шум руки» в пределах ±4 по каждой оси.
function noisy(d: string, seed: number) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31) * 8 - 4;
  return sampleStroke(d, 2).map((p) => ({ x: p.x + rnd(), y: p.y + rnd() }));
}

describe("данные букв", () => {
  it("66 букв: 33 заглавные и 33 строчные, у каждой есть черты", () => {
    expect(Object.keys(LETTERS).sort()).toEqual([...ALPHABET, ...ALPHABET.toLowerCase()].sort());
    for (const strokes of Object.values(LETTERS)) expect(strokes.length).toBeGreaterThan(0);
  });

  it("все точки внутри поля 100×140", () => {
    for (const { name, d } of all)
      for (const p of sampleStroke(d)) expect(p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 140, `${name}: ${p.x},${p.y}`).toBe(true);
  });

  it("семплирование равномерное и от начала к концу", () => {
    const p = sampleStroke("M0 0 L10 0 L10 10", 2);
    expect(p).toHaveLength(11);
    expect(p[0]).toEqual({ x: 0, y: 0 });
    expect(p[10]).toEqual({ x: 10, y: 10 });
  });
});

describe("checkStroke", () => {
  it.each(all)("$name: точный обвод засчитывается", ({ d }) => {
    expect(checkStroke(sampleStroke(d, 1), d)).toMatchObject({ ok: true, reason: null });
  });

  it.each(all.filter(({ d }) => sampleStroke(d, 1).length > 12))("$name: обвод в обратную сторону — нет", ({ d }) => {
    expect(checkStroke(sampleStroke(d, 1).reverse(), d)).toMatchObject({ ok: false, reason: "wrong-direction" });
  });

  it.each(all)("$name: прямая через всё поле — нет", ({ d }) => {
    expect(checkStroke([{ x: 0, y: 0 }, { x: 100, y: 140 }], d).ok).toBe(false);
    expect(checkStroke([{ x: 0, y: 70 }, { x: 100, y: 70 }], d).ok).toBe(false);
  });

  it.each(all)("$name: след с дрожью ±4 засчитывается", ({ d }) => {
    for (const seed of [1, 7, 42]) expect(checkStroke(noisy(d, seed), d)).toMatchObject({ ok: true });
  });

  it("подсказки: мимо линии, не с начала, пустой след", () => {
    const d = "M26 20 L26 120";
    expect(checkStroke([{ x: 60, y: 20 }, { x: 60, y: 120 }], d).reason).toBe("off-path");
    expect(checkStroke([{ x: 26, y: 60 }, { x: 26, y: 120 }], d).reason).toBe("short");
    expect(checkStroke([], d).reason).toBe("short");
  });
});
