/**
 * Matches react-query hooks (admin). The detail key is **`["match",
 * pid]` — the same key `use-matchroom` polls**, so every admin write that
 * invalidates it makes the public match center reflect the edit (changes appear
 * instantly). The admin list is its own key; mutations patch it on success and
 * invalidate to reconcile ordering / server-derived fields.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as matchesService from "@/services/matches.service";
import type { EventInput } from "@/types/event";
import type { LineupInput, MatchCard, MatchInput, Matchroom, TeamStatsInput } from "@/types/match";

export const matchKeys = {
  all: ["matches"] as const,
  list: ["matches", "admin-list"] as const,
  /** Aligned with `use-matchroom` so admin edits invalidate the public cache. */
  detail: (pid: string) => ["match", pid] as const,
};

/** Every fixture (admin list, all pages). */
export function useMatchesList() {
  return useQuery({ queryKey: matchKeys.list, queryFn: () => matchesService.getAllMatches() });
}

/**
 * One match's full detail for editing. `staleTime: 0` forces a fresh load on
 * select (the shared `["match", pid]` cache may hold older public data); the
 * query is disabled until a real (saved) pid is selected.
 */
export function useMatchDetail(pid: string | null) {
  return useQuery({
    queryKey: matchKeys.detail(pid ?? ""),
    queryFn: () => matchesService.getMatch(pid as string),
    enabled: Boolean(pid),
    staleTime: 0,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MatchInput) => matchesService.createMatch(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: matchKeys.list }),
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pid, input }: { pid: string; input: MatchInput }) =>
      matchesService.updateMatch(pid, input),
    onSuccess: (_written, { pid }) => {
      void queryClient.invalidateQueries({ queryKey: matchKeys.list });
      void queryClient.invalidateQueries({ queryKey: matchKeys.detail(pid) });
    },
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pid: string) => matchesService.deleteMatch(pid),
    onSuccess: (_response, pid) => {
      queryClient.setQueryData<MatchCard[]>(matchKeys.list, (old = []) =>
        old.filter((m) => m.pid !== pid),
      );
      void queryClient.invalidateQueries({ queryKey: matchKeys.list });
    },
  });
}

/** Set a side's lineup; the action returns the whole matchroom, so seed it in. */
export function useSetLineup(pid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LineupInput) => matchesService.setLineup(pid, input),
    onSuccess: (matchroom) => {
      queryClient.setQueryData<Matchroom>(matchKeys.detail(pid), matchroom);
    },
  });
}

export function useSetTeamStats(pid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TeamStatsInput) => matchesService.setTeamStats(pid, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: matchKeys.detail(pid) }),
  });
}

/** Add an event; refetch detail + list because a goal bumps the score. */
export function useCreateEvent(pid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EventInput) => matchesService.createEvent(pid, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matchKeys.detail(pid) });
      void queryClient.invalidateQueries({ queryKey: matchKeys.list });
    },
  });
}

export function useDeleteEvent(pid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventPid: string) => matchesService.deleteEvent(pid, eventPid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matchKeys.detail(pid) });
      void queryClient.invalidateQueries({ queryKey: matchKeys.list });
    },
  });
}
