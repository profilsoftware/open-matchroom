/**
 * Smoothly tick the match minute between polls. The server derives `minute`
 * from a clock and exposes its anchor (`clockStartedAt` / `clockElapsedSeconds`);
 * while the clock is running we recompute the minute every second so it advances
 * on screen instead of jumping each 15 s poll. When the clock is paused or the
 * match isn't live, we just trust the server snapshot (`minute`).
 *
 * State is seeded with the server `minute` so the first (SSR-matched) render is
 * identical on both sides — the live value is computed client-side in an effect.
 */

import { useEffect, useState } from "react";

import type { MatchCard } from "@/types/match";

type ClockFields = Pick<MatchCard, "minute" | "clockStartedAt" | "clockElapsedSeconds">;

export function computeMinute(
  minute: number,
  clockStartedAt: string | null,
  clockElapsedSeconds: number,
): number {
  if (!clockStartedAt) return minute;
  const elapsedMs = clockElapsedSeconds * 1000 + (Date.now() - new Date(clockStartedAt).getTime());
  return Math.max(0, Math.floor(elapsedMs / 60_000));
}

export function useLiveMinute({
  minute,
  clockStartedAt,
  clockElapsedSeconds,
}: ClockFields): number {
  const [value, setValue] = useState(minute);

  useEffect(() => {
    const tick = () => setValue(computeMinute(minute, clockStartedAt, clockElapsedSeconds));
    tick(); // reconcile immediately after a poll / mount
    if (!clockStartedAt) return; // paused or not live → nothing to tick
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [minute, clockStartedAt, clockElapsedSeconds]);

  return value;
}
