"use client";

import { useState } from "react";

import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useMatchroom } from "@/hooks/use-matchroom";
import { cn } from "@/lib/cn";
import { useToast } from "@/providers/toast-provider";
import type { Matchroom } from "@/types/match";
import { Hero } from "./Hero";
import { LineupPanel } from "./LineupPanel";
import { LivePanel } from "./LivePanel";
import { type MatchTab, MatchTabs } from "./MatchTabs";
import { StatsPanel } from "./StatsPanel";

/**
 * The match-center client island. Seeded with the SSR `initialMatchroom`
 * so the first paint is fully server-rendered (SEO + speed), then `useMatchroom`
 * polls the detail every 15 s while the match is live. Owns the active tab; a
 * `LIVE` match opens on the Live feed, otherwise on the Lineup.
 *
 * A manual **Refresh** button `refetch()`es on demand — the only way to pull
 * updates for `SCHEDULED` / `FINISHED` matches (their poll is off) and a
 * "force now" while `LIVE`; it spins + disables while the request is in flight.
 */
export function MatchroomView({ initialMatchroom }: { initialMatchroom: Matchroom }) {
  const { data, refetch, isFetching } = useMatchroom(initialMatchroom.pid, initialMatchroom);
  const match = data ?? initialMatchroom;
  const toast = useToast();
  const [tab, setTab] = useState<MatchTab>(initialMatchroom.status === "LIVE" ? "live" : "lineup");

  // A failed background poll keeps the last good snapshot (react-query retains
  // `data`), so it stays silent; only an explicit Refresh surfaces a failure.
  async function onRefresh() {
    const result = await refetch();
    if (result.isError) toast("Couldn't refresh — showing the last update.");
  }

  return (
    <div className="matchroom mx-auto max-w-[1180px] px-[22px] pt-2 pb-[60px] max-[620px]:px-[14px]">
      <Hero match={match} />

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className={buttonClasses("ghost", true)}
          onClick={onRefresh}
          disabled={isFetching}
          aria-label="Refresh match"
        >
          <Icon name="refresh" size={15} className={cn(isFetching && "animate-spin")} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <MatchTabs active={tab} onChange={setTab} />
      {/* `key` re-triggers the fade animation on each tab switch. */}
      <div className="animate-[fade_0.28s_ease]" key={tab} role="tabpanel">
        {tab === "lineup" && <LineupPanel match={match} />}
        {tab === "live" && <LivePanel match={match} />}
        {tab === "stats" && <StatsPanel match={match} />}
      </div>
    </div>
  );
}
