"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Stepper } from "@/components/ui/Stepper";
import { useSetTeamStats } from "@/hooks/use-matches";
import { useToast } from "@/providers/toast-provider";
import type { Side } from "@/types/event";
import type { Matchroom, TeamStats } from "@/types/match";

const EMPTY_STATS: TeamStats = {
  possession: 50,
  totalShots: 0,
  shotsOnTarget: 0,
  corners: 0,
  fouls: 0,
  offsides: 0,
  yellowCards: 0,
  redCards: 0,
};

const COUNT_METRICS: { key: keyof TeamStats; label: string }[] = [
  { key: "totalShots", label: "Total shots" },
  { key: "shotsOnTarget", label: "Shots on target" },
  { key: "corners", label: "Corners" },
  { key: "fouls", label: "Fouls" },
  { key: "offsides", label: "Offsides" },
  { key: "yellowCards", label: "Yellow cards" },
  { key: "redCards", label: "Red cards" },
];

const SIDE_OPTIONS: { value: Side; label: string }[] = [
  { value: "HOME", label: "Home" },
  { value: "AWAY", label: "Away" },
];

/**
 * Statistics editor. A Home/Away toggle drives a per-side form (keyed by side
 * so it reinitialises from that team's saved row): a possession slider plus a
 * stepper per count metric. Saving upserts that one team's `TeamStatsInMatch`
 * row via the `team-stats` action (keyed by team).
 */
export function StatsSection({ match }: { match: Matchroom }) {
  const [side, setSide] = useState<Side>("HOME");
  const teamPid = side === "HOME" ? match.homeTeam.pid : match.awayTeam.pid;
  const saved = side === "HOME" ? match.stats.home : match.stats.away;

  return (
    <div>
      <div className="mb-4 flex items-center">
        <Segmented options={SIDE_OPTIONS} value={side} onChange={setSide} aria-label="Stats side" />
        <span className="ml-3 text-[13px] text-muted">
          {side === "HOME" ? match.homeTeam.name : match.awayTeam.name}
        </span>
      </div>

      <StatsForm key={side} matchPid={match.pid} teamPid={teamPid} saved={saved} />
    </div>
  );
}

function StatsForm({
  matchPid,
  teamPid,
  saved,
}: {
  matchPid: string;
  teamPid: string;
  saved: TeamStats | null;
}) {
  const setTeamStats = useSetTeamStats(matchPid);
  const toast = useToast();
  const [stats, setStats] = useState<TeamStats>(saved ?? EMPTY_STATS);

  function setField(key: keyof TeamStats, value: number) {
    setStats((s) => ({ ...s, [key]: value }));
  }

  function save() {
    setTeamStats.mutate(
      { team: teamPid, ...stats },
      {
        onSuccess: () => toast("Statistics saved"),
        onError: () => toast("Could not save statistics"),
      },
    );
  }

  return (
    <div>
      <Field label={`Possession — ${stats.possession}%`}>
        <input
          type="range"
          min={0}
          max={100}
          value={stats.possession}
          onChange={(e) => setField("possession", Number(e.target.value))}
          aria-label="Possession"
          className="w-full accent-brand"
        />
      </Field>

      <div className="editor-section">
        <h4>Counts</h4>
        {COUNT_METRICS.map((metric) => (
          <div key={metric.key} className="flex items-center justify-between py-1.5">
            <span className="font-semibold text-[13.5px] text-ink-2">{metric.label}</span>
            <Stepper
              value={stats[metric.key]}
              onChange={(v) => setField(metric.key, v)}
              min={0}
              max={999}
              aria-label={metric.label}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="primary" sm onClick={save} disabled={setTeamStats.isPending}>
          {setTeamStats.isPending ? "Saving…" : "Save statistics"}
        </Button>
      </div>
    </div>
  );
}
