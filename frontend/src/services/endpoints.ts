/**
 * The single endpoint map. Paths are relative to the API root and include
 * the `api/` segment but no leading slash — `services/http.ts` prepends the base
 * (same-origin in the browser, the internal backend URL during SSR). Trailing
 * slashes are kept: DRF requires them.
 */
export const endpoints = {
  auth: {
    login: "api/auth/login/",
    refresh: "api/auth/token/refresh/",
    logout: "api/auth/logout/",
  },
  users: {
    me: "api/users/me/",
  },
  teams: {
    list: "api/teams/",
    detail: (pid: string) => `api/teams/${pid}/`,
  },
  players: {
    list: "api/players/",
    detail: (pid: string) => `api/players/${pid}/`,
  },
  matches: {
    list: "api/matches/",
    detail: (pid: string) => `api/matches/${pid}/`,
    clock: (pid: string) => `api/matches/${pid}/clock/`,
    lineup: (pid: string) => `api/matches/${pid}/lineup/`,
    teamStats: (pid: string) => `api/matches/${pid}/team-stats/`,
    events: (pid: string) => `api/matches/${pid}/events/`,
    event: (pid: string, eventPid: string) => `api/matches/${pid}/events/${eventPid}/`,
  },
} as const;

/** Auth paths excluded from the 401→refresh retry. */
export const AUTH_PATHS: readonly string[] = [
  endpoints.auth.login,
  endpoints.auth.refresh,
  endpoints.auth.logout,
];
