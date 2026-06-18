/**
 * Pitch geometry — `positionsFor`. The backend deliberately does NOT compute
 * pitch x/y; the frontend derives it from `formation` + starter `order`.
 *
 * `side` is the pitch geometry side ('home' = bottom, 'away' = top) — lowercase,
 * distinct from the API's uppercase `Side`; callers lowercase before calling.
 */

export type PitchSide = "home" | "away";

export interface PitchPoint {
  /** Horizontal percent (0-100). */
  x: number;
  /** Vertical percent (0-100). */
  y: number;
}

/**
 * One point per starter, in formation order (GK first). E.g. `"4-3-3"` →
 * 1 + 4 + 3 + 3 = 11 points. Lines are kept off the halfway line (the `0.86`).
 */
export function positionsFor(formation: string, side: PitchSide): PitchPoint[] {
  const lines = formation
    .split("-")
    .map(Number)
    .filter((n) => n > 0);
  const rows = [1, ...lines]; // GK + outfield lines
  const R = rows.length;
  const pad = 13;
  const innerW = 100 - pad * 2;
  const yBack = side === "home" ? 91 : 9;
  const yFront = 50;
  const out: PitchPoint[] = [];
  rows.forEach((n, r) => {
    const t = R === 1 ? 0 : r / (R - 1);
    const y = yBack + (yFront - yBack) * t * 0.86; // keep off the halfway line
    for (let i = 0; i < n; i++) {
      const x = pad + ((i + 0.5) / n) * innerW;
      out.push({ x, y });
    }
  });
  return out;
}
