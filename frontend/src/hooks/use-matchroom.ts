/**
 * Match-center data hook. Seeds react-query with the SSR payload as
 * `initialData`, then **polls the detail every 15 s while `status === "LIVE"`**
 * and stops for SCHEDULED / FINISHED. The generous `staleTime` (QueryProvider)
 * means the seeded data isn't re-fetched immediately on mount — only the live
 * poll drives updates.
 */

import { useQuery } from "@tanstack/react-query";

import { getMatch, getMatches } from "@/services/matches.service";
import type { Matchroom } from "@/types/match";

/** Poll cadence while a match is live (ms). */
const LIVE_POLL_MS = 15_000;

export function useMatchroom(pid: string, initialData: Matchroom) {
  return useQuery({
    queryKey: ["match", pid],
    queryFn: () => getMatch(pid),
    initialData,
    refetchInterval: (query) => (query.state.data?.status === "LIVE" ? LIVE_POLL_MS : false),
  });
}

/** How often the topbar re-checks whether a match is live (ms). */
const LIVE_FLAG_POLL_MS = 30_000;

/**
 * Whether any match is currently LIVE — drives the topbar's "Match center"
 * pulse. One tiny `?status=LIVE&page_size=1` read (we only need the
 * `count`); polls every 30 s, pausing automatically while the tab is hidden.
 */
export function useHasLiveMatch(): boolean {
  const { data } = useQuery({
    queryKey: ["matches", "live-flag"],
    queryFn: () => getMatches({ status: "LIVE", page_size: 1 }),
    refetchInterval: LIVE_FLAG_POLL_MS,
    staleTime: 0,
  });
  return (data?.count ?? 0) > 0;
}
