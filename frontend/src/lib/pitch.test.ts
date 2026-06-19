import { describe, expect, it } from "vitest";

import { positionsFor } from "./pitch";

describe("positionsFor", () => {
  it("returns one point per player, GK first (4-3-3 -> 11)", () => {
    const pts = positionsFor("4-3-3", "home");
    expect(pts).toHaveLength(11);
    // GK is centred on the back line.
    expect(pts[0]).toEqual({ x: 50, y: 91 });
  });

  it("counts players across common formations", () => {
    expect(positionsFor("4-4-2", "home")).toHaveLength(11);
    expect(positionsFor("4-2-3-1", "home")).toHaveLength(11);
    expect(positionsFor("3-5-2", "away")).toHaveLength(11);
  });

  it("mirrors home and away around the halfway line", () => {
    const home = positionsFor("4-3-3", "home");
    const away = positionsFor("4-3-3", "away");
    // home GK sits at y=91, away GK at y=9 — symmetric about 50.
    expect(home[0].y + away[0].y).toBeCloseTo(100);
  });

  it("keeps every point inside the pitch bounds", () => {
    for (const p of positionsFor("4-2-3-1", "home")) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(100);
    }
  });

  it("ignores zero / non-numeric segments defensively", () => {
    // "0-1-1" drops the 0 -> GK + 1 + 1 = 3 points.
    expect(positionsFor("0-1-1", "home")).toHaveLength(3);
    // Garbage -> NaN filtered out -> just the GK.
    expect(positionsFor("abc", "home")).toHaveLength(1);
    expect(positionsFor("", "home")).toHaveLength(1);
  });
});
