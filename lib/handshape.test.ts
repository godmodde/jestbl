import { describe, expect, it } from "vitest";

import templates from "../content/dactyl-templates.json";
import { distance, features, isLetter, match, normalize, type Point, type Templates } from "./handshape";

// Настоящий кадр: буква Г с демо-видео surdo.media, worldLandmarks MediaPipe (метры).
const G: Point[] = [[-0.0312, -0.0075, 0.0614], [-0.0021, -0.0044, 0.0512], [0.0108, -0.0054, 0.0441], [0.0189, -0.0204, 0.0296], [0.0374, -0.0404, 0.0193], [0.0003, 0.0014, 0.0036], [0.0001, 0.0087, 0.0033], [0.0144, 0.0256, 0.0205], [0.0249, 0.0442, 0.0367], [-0.0029, -0.0011, 0.0001], [-0.0024, 0.0035, -0.0004], [-0.0001, 0.0047, 0.0235], [0.0008, -0.0077, 0.0447], [0.0006, -0.0018, -0.0016], [-0.0043, -0.0005, 0.0008], [-0.0059, 0.0028, 0.0223], [-0.0089, -0.0031, 0.0429], [-0.0051, -0.0050, 0.0063], [-0.0061, 0.0059, 0.0096], [-0.0079, 0.0041, 0.0285], [-0.0121, -0.0022, 0.0427]]
  .map(([x, y, z]) => ({ x, y, z }));

const expectClose = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 9));
const flat = (ps: Point[]) => ps.flatMap((p) => [p.x, p.y, p.z]);

describe("normalize", () => {
  it("не зависит от положения и размера руки в кадре", () => {
    const moved = G.map((p) => ({ x: p.x * 1.7 + 0.3, y: p.y * 1.7 - 0.2, z: p.z * 1.7 + 0.5 }));
    expectClose(flat(normalize(moved, "Right")), flat(normalize(G, "Right")));
  });

  it("левая рука (или зеркальный кадр) после учёта метки даёт те же признаки, что правая", () => {
    const mirrored = G.map((p) => ({ ...p, x: -p.x }));
    expectClose(features(normalize(mirrored, "Left")), features(normalize(G, "Right")));
    // Без учёта зеркала форма другая — значит, учитывать его действительно нужно.
    expect(distance(features(normalize(mirrored, "Right")), features(normalize(G, "Right")))).toBeGreaterThan(0.1);
  });
});

describe("образцы surdo.media", () => {
  it("кадр Г узнаётся как Г и не засчитывается за другую букву", () => {
    const f = features(normalize(G, "Right"));
    expect(match(f, templates).letter).toBe("Г");
    expect(isLetter(f, templates, "Г").ok).toBe(true);
    expect(isLetter(f, templates, "А").ok).toBe(false);
  });

  it("leave-one-frame-out: каждый кадр узнаётся своей буквой по остальным", () => {
    let right = 0, total = 0;
    const confusions: Record<string, number> = {};
    for (const [letter, samples] of Object.entries(templates as Templates)) {
      samples.forEach((sample, i) => {
        const rest = { ...templates, [letter]: samples.filter((_, j) => j !== i) };
        const got = match(sample, rest).letter;
        total++;
        if (got === letter) right++;
        else confusions[`${letter}→${got}`] = (confusions[`${letter}→${got}`] ?? 0) + 1;
      });
    }
    const accuracy = Math.round((right / total) * 1000) / 1000;
    console.log(`leave-one-frame-out: ${right}/${total} = ${accuracy}; путаницы:`, confusions);
    expect(accuracy).toBeGreaterThanOrEqual(0.8);
    // Фактическое значение: соседние кадры одного ролика почти одинаковы, поэтому оценка завышена — это проверка образцов,
    // а не того, как распознаются руки учеников.
    expect(accuracy).toBe(0.992);
  });
});
