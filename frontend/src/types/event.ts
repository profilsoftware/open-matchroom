/**
 * Timeline event wire types — mirror `matches/api/serializers.py`
 * `EventSerializer`. Named `MatchEvent` to avoid clashing with the DOM `Event`.
 * Enums are UPPERCASE; display names come from `*PlayerName`, while writes send
 * player pids.
 */

export type Side = "HOME" | "AWAY";

export type EventType =
  | "GOAL"
  | "PENALTY"
  | "YELLOW"
  | "RED"
  | "SUB"
  | "CHANCE"
  | "CORNER"
  | "FOUL"
  | "VAR"
  | "WHISTLE";

export interface MatchEvent {
  pid: string;
  /** `null` marks a neutral event (e.g. whistle) — a `team: null` event. */
  side: Side | null;
  type: EventType;
  /** Player pid (scorer / booked / sub-in), or `null`. */
  primaryPlayer: string | null;
  /** Player pid (assist / sub-out), or `null`. */
  secondaryPlayer: string | null;
  primaryPlayerName: string | null;
  secondaryPlayerName: string | null;
  minute: number;
  text: string;
  isMajor: boolean;
}

/** Write payload for creating an event (server bumps the score on GOAL/PENALTY). */
export interface EventInput {
  side?: Side | null;
  type: EventType;
  primaryPlayer?: string | null;
  secondaryPlayer?: string | null;
  minute?: number;
  text?: string;
  isMajor?: boolean;
}
