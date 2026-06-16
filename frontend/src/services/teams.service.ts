/**
 * Teams domain service — thin typed wrappers over the ky client (`http.ts`).
 * The admin teams area needs full CRUD for clubs and squad members. Reads page
 * through DRF's pagination so the admin always sees the whole roster; writes are
 * authenticated (the cookie-JWT session) and go through the same proxy.
 */

import type { Paginated } from "@/types/shared";
import type { Player, PlayerInput, Team, TeamInput } from "@/types/team";
import { endpoints } from "./endpoints";
import { destroy, get, post, postForm, put, putForm } from "./http";

/** Largest page DRF allows (DefaultPagination `max_page_size`). */
const MAX_PAGE_SIZE = 100;

/**
 * A team write as `multipart/form-data`. The branding fields are always sent;
 * `logo` is appended only when a new `File` was picked, so saving without
 * touching the logo leaves the existing crest in place. Keys stay camelCase —
 * the backend's `CamelCaseMultiPartParser` maps them to snake_case.
 */
function teamFormData({ logo, ...branding }: TeamInput): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(branding)) {
    form.append(key, value);
  }
  if (logo instanceof File) form.append("logo", logo);
  return form;
}

/** Every club, following pagination to the last page (the list is 24/page). */
export async function getTeams(): Promise<Team[]> {
  const all: Team[] = [];
  for (let page = 1; ; page += 1) {
    const { results, next } = await get<Paginated<Team>>(endpoints.teams.list, {
      searchParams: { page, page_size: MAX_PAGE_SIZE },
    });
    all.push(...results);
    if (!next || results.length === 0) break;
  }
  return all;
}

export function createTeam(input: TeamInput): Promise<Team> {
  return postForm<Team>(endpoints.teams.list, teamFormData(input));
}

export function updateTeam(pid: string, input: TeamInput): Promise<Team> {
  return putForm<Team>(endpoints.teams.detail(pid), teamFormData(input));
}

export function deleteTeam(pid: string): Promise<Response> {
  return destroy(endpoints.teams.detail(pid));
}

/**
 * A team's squad, scoped via `?team=<pid>`. The backend already orders it
 * GK→DF→MF→FW then number (squad.order_squad); a squad is small (≤ a few
 * dozen), so one max-size page covers it.
 */
export async function getPlayers(teamPid: string): Promise<Player[]> {
  const { results } = await get<Paginated<Player>>(endpoints.players.list, {
    searchParams: { team: teamPid, page_size: MAX_PAGE_SIZE },
  });
  return results;
}

export function createPlayer(input: PlayerInput): Promise<Player> {
  return post<Player>(endpoints.players.list, { json: input });
}

export function updatePlayer(pid: string, input: PlayerInput): Promise<Player> {
  return put<Player>(endpoints.players.detail(pid), { json: input });
}

export function deletePlayer(pid: string): Promise<Response> {
  return destroy(endpoints.players.detail(pid));
}
