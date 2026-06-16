/**
 * Teams & squad wire types — mirror `teams/api/serializers.py` verbatim
 * (camelCased on the wire). `TeamBrief` is the embedded branding object the
 * match payload carries; `Team` is the full club record from `/api/teams/`.
 */

export type Position = "GK" | "DF" | "MF" | "FW";

/** Club branding embedded in match payloads (TeamBriefSerializer). */
export interface TeamBrief {
  pid: string;
  name: string;
  shortName: string;
  abbreviation: string;
  color: string;
  logo: string | null;
}

/** Full club record from the teams endpoint (TeamSerializer = brief + city). */
export interface Team extends TeamBrief {
  city: string;
}

/** A squad member (PlayerSerializer); `team` is a team pid. */
export interface Player {
  pid: string;
  team: string;
  name: string;
  number: number | null;
  position: Position;
  photo: string | null;
}

/**
 * Write payload for team create/update. `pid` is server-assigned. `logo` is an
 * optional image upload (a `File`) — omitted/undefined leaves the existing crest
 * untouched. The service serialises this as `multipart/form-data`.
 */
export type TeamInput = Omit<Team, "pid" | "logo"> & {
  logo?: File | null;
};

/**
 * Write payload for player create/update; `team` is a team pid. `photo` is an
 * out-of-scope media upload (backend §13), so it is not written here.
 */
export type PlayerInput = Omit<Player, "pid" | "photo">;
