/**
 * Teams react-query hooks (admin). Reads are cached by team / by-team
 * squad; the mutations keep the cache in sync **and** invalidate so the admin
 * sees writes immediately (changes appear instantly). The cache is patched
 * optimistically-on-success (write the returned object straight in) so the
 * selected-team view doesn't flicker while the refetch is in flight.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as teamsService from "@/services/teams.service";
import type { Player, PlayerInput, Team, TeamInput } from "@/types/team";

export const teamKeys = {
  all: ["teams"] as const,
  list: ["teams", "list"] as const,
  players: (teamPid: string) => ["teams", "players", teamPid] as const,
};

/** Every club (admin list). */
export function useTeams() {
  return useQuery({ queryKey: teamKeys.list, queryFn: teamsService.getTeams });
}

/** A team's squad; disabled until a team is selected (no pid → no fetch). */
export function usePlayers(teamPid: string | null) {
  return useQuery({
    queryKey: teamKeys.players(teamPid ?? ""),
    queryFn: () => teamsService.getPlayers(teamPid as string),
    enabled: Boolean(teamPid),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TeamInput) => teamsService.createTeam(input),
    onSuccess: (team) => {
      queryClient.setQueryData<Team[]>(teamKeys.list, (old = []) => [team, ...old]);
      void queryClient.invalidateQueries({ queryKey: teamKeys.list });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pid, input }: { pid: string; input: TeamInput }) =>
      teamsService.updateTeam(pid, input),
    onSuccess: (team) => {
      queryClient.setQueryData<Team[]>(teamKeys.list, (old = []) =>
        old.map((t) => (t.pid === team.pid ? team : t)),
      );
      void queryClient.invalidateQueries({ queryKey: teamKeys.list });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pid: string) => teamsService.deleteTeam(pid),
    onSuccess: (_response, pid) => {
      queryClient.setQueryData<Team[]>(teamKeys.list, (old = []) =>
        old.filter((t) => t.pid !== pid),
      );
      void queryClient.invalidateQueries({ queryKey: teamKeys.list });
    },
  });
}

export function useCreatePlayer(teamPid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlayerInput) => teamsService.createPlayer(input),
    onSuccess: (player) => {
      queryClient.setQueryData<Player[]>(teamKeys.players(teamPid), (old = []) => [...old, player]);
      void queryClient.invalidateQueries({ queryKey: teamKeys.players(teamPid) });
    },
  });
}

export function useUpdatePlayer(teamPid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pid, input }: { pid: string; input: PlayerInput }) =>
      teamsService.updatePlayer(pid, input),
    onSuccess: (player) => {
      queryClient.setQueryData<Player[]>(teamKeys.players(teamPid), (old = []) =>
        old.map((p) => (p.pid === player.pid ? player : p)),
      );
      void queryClient.invalidateQueries({ queryKey: teamKeys.players(teamPid) });
    },
  });
}

export function useDeletePlayer(teamPid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pid: string) => teamsService.deletePlayer(pid),
    onSuccess: (_response, pid) => {
      queryClient.setQueryData<Player[]>(teamKeys.players(teamPid), (old = []) =>
        old.filter((p) => p.pid !== pid),
      );
      void queryClient.invalidateQueries({ queryKey: teamKeys.players(teamPid) });
    },
  });
}
