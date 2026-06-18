/**
 * Event/lineup display metadata + the related enumerations. `evMeta` is
 * **keyed by the API's UPPERCASE types** — the one place event-type styling is
 * centralised, so no string literals leak into JSX.
 */

import type { IconName } from "@/components/ui/Icon";
import type { EventType } from "@/types/event";
import type { Position } from "@/types/team";

// Accents live in lib/theme.ts; re-export so callers can reach the palette
// alongside the other lib enumerations.
export { ACCENTS } from "./theme";

export interface EvMeta {
  label: string;
  /** Timeline/feed icon, or `null` for card events (rendered as a chip). */
  icon: IconName | null;
  /** Extra utility classes for the icon node (fills the goal node green). */
  cls: string;
  /** Card chip colour: `"y"` yellow, `"r"` red (mutually exclusive with icon). */
  card?: "y" | "r";
  /** Highlight flag (`major`); the API also carries `isMajor`. */
  major: boolean;
}

const EV_META: Record<EventType, EvMeta> = {
  GOAL: { label: "Goal", icon: "ball", cls: "border-pos! bg-pos! text-white", major: true },
  PENALTY: { label: "Penalty", icon: "ball", cls: "border-pos! bg-pos! text-white", major: true },
  YELLOW: { label: "Yellow card", icon: null, cls: "", card: "y", major: false },
  RED: { label: "Red card", icon: null, cls: "", card: "r", major: true },
  SUB: { label: "Substitution", icon: "sub", cls: "", major: false },
  CHANCE: { label: "Chance", icon: "target", cls: "", major: false },
  CORNER: { label: "Corner", icon: "flag", cls: "", major: false },
  FOUL: { label: "Foul", icon: "whistle", cls: "", major: false },
  WHISTLE: { label: "Whistle", icon: "whistle", cls: "", major: true },
  VAR: { label: "VAR", icon: "eye", cls: "", major: false },
};

const DEFAULT_META: EvMeta = { label: "Update", icon: "list", cls: "", major: false };

/** Display metadata for an event type (tolerant of unknown values). */
export function evMeta(type: string): EvMeta {
  return EV_META[type as EventType] ?? DEFAULT_META;
}

/** Event types offered in the admin add-event form (display order). */
export const EVENT_TYPES = [
  "GOAL",
  "PENALTY",
  "YELLOW",
  "RED",
  "SUB",
  "CHANCE",
  "CORNER",
  "FOUL",
  "VAR",
  "WHISTLE",
] as const satisfies readonly EventType[];

/** Formations the lineup editor offers. */
export const FORMATIONS = [
  "4-3-3",
  "4-2-3-1",
  "4-4-2",
  "3-5-2",
  "3-4-3",
  "5-3-2",
  "4-1-4-1",
] as const;

export const POSITIONS = ["GK", "DF", "MF", "FW"] as const satisfies readonly Position[];

export const POSITION_LABELS: Record<Position, string> = {
  GK: "Goalkeeper",
  DF: "Defender",
  MF: "Midfielder",
  FW: "Forward",
};
