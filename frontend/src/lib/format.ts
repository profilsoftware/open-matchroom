/**
 * Date/time + status formatting helpers. The backend ships a single ISO
 * `kickoffAt`, which the admin splits into a `date`/`time` pair.
 *
 * All formatting is pinned to **UTC**. The backend stored each kickoff as the
 * naive local time made aware in UTC, so an 18:00 kickoff is
 * `…T18:00:00Z`; formatting in UTC echoes the intended wall-clock time **and**
 * makes server (SSR) and client agree, avoiding hydration drift (SSR-first).
 */

import type { MatchStatus } from "@/types/match";

/** "Sat, 10 Jun" — en-GB short date (Hero / fixtures). */
export function formatMatchDate(kickoffAt: string | null): string {
  if (!kickoffAt) return "";
  return new Date(kickoffAt).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

/** "18:00" — 24h kickoff time. */
export function formatMatchTime(kickoffAt: string | null): string {
  if (!kickoffAt) return "";
  return new Date(kickoffAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

/** Split an ISO datetime into the admin's two inputs (`YYYY-MM-DD`, `HH:mm`), UTC. */
export function splitKickoff(kickoffAt: string | null): { date: string; time: string } {
  if (!kickoffAt) return { date: "", time: "" };
  const iso = new Date(kickoffAt).toISOString(); // e.g. 2026-06-10T18:00:00.000Z
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** Join the admin's date + time inputs back into a UTC ISO datetime. */
export function joinKickoff(date: string, time: string): string | null {
  if (!date || !time) return null;
  return new Date(`${date}T${time}:00Z`).toISOString();
}

/** Hero/badge status label (live shows the minute via the caller). */
export function statusLabel(status: MatchStatus): string {
  switch (status) {
    case "LIVE":
      return "Live";
    case "FINISHED":
      return "Full time";
    default:
      return "Upcoming";
  }
}

export const isLive = (status: MatchStatus): boolean => status === "LIVE";
export const isScheduled = (status: MatchStatus): boolean => status === "SCHEDULED";
