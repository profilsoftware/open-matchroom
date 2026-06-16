/**
 * Match wire types — mirror `matches/api/serializers.py`. The backend keys
 * lineup/stats **by side** (it normalises the flat per-team arrays) and
 * embeds related objects, so the client never reconstructs a team dict.
 */

import type { MatchEvent, Side } from "./event";
import type { Position, TeamBrief } from "./team";

export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";
export type LineupRole = "STARTER" | "SUBSTITUTE";

/** Per-side count metrics (TeamStatsSerializer — no pid/team; keyed by side). */
export interface TeamStats {
  possession: number;
  totalShots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  offsides: number;
  yellowCards: number;
  redCards: number;
}

/** A positioned player in a lineup (LineupPlayerSerializer). */
export interface LineupPlayer {
  /** Player pid. */
  player: string;
  name: string;
  number: number | null;
  /** Snapshot position; may be blank (`""`). */
  position: Position | "";
  role: LineupRole;
  /** Starters: pitch slot (passed to `positionsFor`); subs: bench order. */
  order: number;
}

export interface SideLineup {
  starters: LineupPlayer[];
  subs: LineupPlayer[];
}

/** Derived Hero scorer entry (scoreboard.goal_scorers). */
export interface Scorer {
  side: Side;
  minute: number;
  name: string | null;
  /** Player pid, or `null` when no player is attached to the goal. */
  player: string | null;
}

/** Compact fixture row (MatchCardSerializer / list) — no lineup/stats/events. */
export interface MatchCard {
  pid: string;
  competition: string;
  round: string;
  venue: string;
  /** ISO datetime (UTC); split into date + time for the admin's two inputs. */
  kickoffAt: string | null;
  status: MatchStatus;
  minute: number;
  homeScore: number;
  awayScore: number;
  /** Penalty-shootout result, separate from the score; `null` = no shootout. */
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
  homeTeam: TeamBrief;
  awayTeam: TeamBrief;
}

/** Full match-center payload the Viewer consumes (MatchroomSerializer). */
export interface Matchroom extends MatchCard {
  homeFormation: string;
  awayFormation: string;
  lineup: { home: SideLineup; away: SideLineup };
  stats: { home: TeamStats | null; away: TeamStats | null };
  scorers: Scorer[];
  /** Already sorted -minute,-created (reverse-chronological). */
  events: MatchEvent[];
}

/** Write payload for match details CRUD (MatchWriteSerializer); teams by pid. */
export interface MatchInput {
  homeTeam: string;
  awayTeam: string;
  competition?: string;
  round?: string;
  venue?: string;
  kickoffAt?: string | null;
  status?: MatchStatus;
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  homeFormation?: string;
  awayFormation?: string;
}

/**
 * Response of a match create/update (MatchWriteSerializer) — unlike `MatchCard`
 * it carries the **team pids** (SlugRelatedField), not embedded briefs, plus the
 * formations. The admin only needs the new `pid` off it (the list + detail are
 * then refetched), so this stays a thin echo of the write payload.
 */
export interface MatchWritten extends Required<MatchInput> {
  pid: string;
}

/** Input for the `lineup` action (LineupWriteSerializer); ids are player pids. */
export interface LineupInput {
  side: Side;
  formation?: string;
  starters?: string[];
  subs?: string[];
}

/** Input for the `team-stats` action (TeamStatsWriteSerializer); `team` is a pid. */
export interface TeamStatsInput extends TeamStats {
  team: string;
}
