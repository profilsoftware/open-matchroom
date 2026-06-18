/**
 * Matches domain service — thin typed wrappers over the ky client (`http.ts`).
 * The public reads cover the paginated card list + the full matchroom detail.
 * The authenticated admin writes cover match details CRUD plus the dedicated
 * `lineup` / `team-stats` actions and the nested events endpoint.
 */

import type { EventInput, MatchEvent } from "@/types/event";
import type {
  ClockInput,
  LineupInput,
  MatchCard,
  MatchInput,
  Matchroom,
  MatchWritten,
  TeamStats,
  TeamStatsInput,
} from "@/types/match";
import type { Paginated } from "@/types/shared";
import { endpoints } from "./endpoints";
import { destroy, get, post, put } from "./http";

/** List fixtures (compact cards). `?status=`, `?round=`, `?page=` are passed through. */
export function getMatches(
  searchParams?: Record<string, string | number>,
): Promise<Paginated<MatchCard>> {
  return get<Paginated<MatchCard>>(
    endpoints.matches.list,
    searchParams ? { searchParams } : undefined,
  );
}

/** Largest page DRF allows (DefaultPagination `max_page_size`). */
const MAX_PAGE_SIZE = 100;

/**
 * Every fixture, following pagination to the last page (the list is paginated
 * 24/page). The fixtures schedule groups the whole season by round, so it
 * needs all pages, not just the first. Each page is a cacheable GET, so the
 * `revalidate: 30` on the ky instance still applies to the whole route.
 */
export async function getAllMatches(
  searchParams?: Record<string, string | number>,
): Promise<MatchCard[]> {
  const all: MatchCard[] = [];
  for (let page = 1; ; page += 1) {
    const { results, next } = await getMatches({
      ...searchParams,
      page,
      page_size: MAX_PAGE_SIZE,
    });
    all.push(...results);
    if (!next || results.length === 0) break;
  }
  return all;
}

/** Full match-center payload (Hero + lineup + events + stats + scorers). */
export function getMatch(pid: string): Promise<Matchroom> {
  return get<Matchroom>(endpoints.matches.detail(pid));
}

// ── admin writes ─────────────────────────────────────────────────────────────

/** Create a fixture. The response echoes team **pids**, not embedded briefs. */
export function createMatch(input: MatchInput): Promise<MatchWritten> {
  return post<MatchWritten>(endpoints.matches.list, { json: input });
}

/** Replace a fixture's details (full PUT — MatchWriteSerializer requires teams). */
export function updateMatch(pid: string, input: MatchInput): Promise<MatchWritten> {
  return put<MatchWritten>(endpoints.matches.detail(pid), { json: input });
}

export function deleteMatch(pid: string): Promise<Response> {
  return destroy(endpoints.matches.detail(pid));
}

/** Drive the match clock (start/pause/finish/set); returns the full matchroom. */
export function matchClock(pid: string, input: ClockInput): Promise<Matchroom> {
  return post<Matchroom>(endpoints.matches.clock(pid), { json: input });
}

/** Set one side's formation + ordered starters/subs; returns the full matchroom. */
export function setLineup(pid: string, input: LineupInput): Promise<Matchroom> {
  return put<Matchroom>(endpoints.matches.lineup(pid), { json: input });
}

/** Upsert one team's stats row; returns just that side's metrics. */
export function setTeamStats(pid: string, input: TeamStatsInput): Promise<TeamStats> {
  return put<TeamStats>(endpoints.matches.teamStats(pid), { json: input });
}

/** Add a timeline event; a GOAL/PENALTY bumps the score server-side. */
export function createEvent(pid: string, input: EventInput): Promise<MatchEvent> {
  return post<MatchEvent>(endpoints.matches.events(pid), { json: input });
}

/** Remove a timeline event; a removed goal reverts the score server-side. */
export function deleteEvent(pid: string, eventPid: string): Promise<Response> {
  return destroy(endpoints.matches.event(pid, eventPid));
}
