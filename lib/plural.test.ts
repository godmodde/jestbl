import { expect, it } from "vitest";

import { plural } from "./plural";

it("склоняет после числа", () => {
  const f: [string, string, string] = ["жест", "жеста", "жестов"];
  expect([1, 2, 5, 11, 12, 21, 22, 25, 111].map((n) => plural(n, f))).toEqual(
    ["жест", "жеста", "жестов", "жестов", "жестов", "жест", "жеста", "жестов", "жестов"]);
});
