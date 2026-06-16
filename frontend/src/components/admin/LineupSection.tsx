"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { useSetLineup } from "@/hooks/use-matches";
import { usePlayers } from "@/hooks/use-teams";
import { cn } from "@/lib/cn";
import { FORMATIONS } from "@/lib/events";
import { useToast } from "@/providers/toast-provider";
import type { Side } from "@/types/event";
import type { Matchroom, SideLineup } from "@/types/match";
import type { Player, Position } from "@/types/team";
import { PitchEditor, type PitchPlayer } from "./PitchEditor";

const MAX_STARTERS = 11;
const POS_RANK: Record<Position, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };

const SIDE_OPTIONS: { value: Side; label: string }[] = [
  { value: "HOME", label: "Home" },
  { value: "AWAY", label: "Away" },
];

/**
 * Lineup editor. A Home/Away toggle drives a
 * per-side `SideEditor` (keyed by side so it reinitialises from that side's saved
 * lineup). Each side picks its XI from the team's squad, orders them on the
 * `PitchEditor`, sets a formation, and saves via the `lineup` action (which
 * returns the whole matchroom — `use-matches` seeds it straight back).
 */
export function LineupSection({ match }: { match: Matchroom }) {
  const [side, setSide] = useState<Side>("HOME");
  const teamPid = side === "HOME" ? match.homeTeam.pid : match.awayTeam.pid;
  const { data: players = [], isPending, isError } = usePlayers(teamPid);

  return (
    <div>
      <div className="mb-4 flex items-center">
        <Segmented
          options={SIDE_OPTIONS}
          value={side}
          onChange={setSide}
          aria-label="Lineup side"
        />
        <span className="ml-3 text-[13px] text-muted">
          {side === "HOME" ? match.homeTeam.name : match.awayTeam.name}
        </span>
      </div>

      <SideEditor
        key={side}
        match={match}
        side={side}
        players={players}
        squadLoading={isPending}
        squadError={isError}
        color={side === "HOME" ? match.homeTeam.color : match.awayTeam.color}
      />
    </div>
  );
}

/** Derive the ordered starter/sub pids + formation for one side from the detail. */
function deriveSide(match: Matchroom, side: Side) {
  const lineup: SideLineup = side === "HOME" ? match.lineup.home : match.lineup.away;
  const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;
  return {
    starters: [...lineup.starters].sort(byOrder).map((p) => p.player),
    subs: [...lineup.subs].sort(byOrder).map((p) => p.player),
    formation: side === "HOME" ? match.homeFormation : match.awayFormation,
  };
}

function SideEditor({
  match,
  side,
  players,
  squadLoading,
  squadError,
  color,
}: {
  match: Matchroom;
  side: Side;
  players: Player[];
  squadLoading: boolean;
  squadError: boolean;
  color: string;
}) {
  const initial = deriveSide(match, side);
  const setLineup = useSetLineup(match.pid);
  const toast = useToast();

  const [formation, setFormation] = useState(initial.formation);
  const [starters, setStarters] = useState<string[]>(initial.starters);
  const [subs, setSubs] = useState<string[]>(initial.subs);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Name/number/position for any pid on the pitch — the side's saved lineup
  // snapshot as a fallback, overlaid by the live squad (which carries position).
  const sideLineup: SideLineup = side === "HOME" ? match.lineup.home : match.lineup.away;
  const playersByPid: Record<string, PitchPlayer & { position?: Position }> = {};
  for (const lp of [...sideLineup.starters, ...sideLineup.subs]) {
    playersByPid[lp.player] = { name: lp.name, number: lp.number };
  }
  for (const p of players) {
    playersByPid[p.pid] = { name: p.name, number: p.number, position: p.position };
  }

  function stateOf(pid: string): "starter" | "sub" | "out" {
    if (starters.includes(pid)) return "starter";
    if (subs.includes(pid)) return "sub";
    return "out";
  }

  function toggleStarter(pid: string) {
    if (starters.includes(pid)) {
      setStarters((s) => s.filter((p) => p !== pid));
      return;
    }
    if (starters.length >= MAX_STARTERS) {
      toast("The starting XI is full");
      return;
    }
    setSubs((s) => s.filter((p) => p !== pid));
    setStarters((s) => [...s, pid]);
  }

  function toggleSub(pid: string) {
    if (subs.includes(pid)) {
      setSubs((s) => s.filter((p) => p !== pid));
      return;
    }
    setStarters((s) => s.filter((p) => p !== pid));
    setSubs((s) => [...s, pid]);
  }

  function swap(a: number, b: number) {
    setStarters((s) => {
      const next = [...s];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  function autoArrange() {
    setStarters((s) =>
      [...s].sort((a, b) => {
        const ra = POS_RANK[playersByPid[a]?.position as Position] ?? 9;
        const rb = POS_RANK[playersByPid[b]?.position as Position] ?? 9;
        if (ra !== rb) return ra - rb;
        return (playersByPid[a]?.number ?? 99) - (playersByPid[b]?.number ?? 99);
      }),
    );
    setSelectedSlot(null);
  }

  function save() {
    setLineup.mutate(
      { side, formation, starters, subs },
      { onSuccess: () => toast("Lineup saved"), onError: () => toast("Could not save lineup") },
    );
  }

  return (
    <div className="grid grid-cols-[minmax(280px,1fr)_minmax(260px,360px)] items-start gap-[18px] max-[860px]:grid-cols-1">
      <div>
        <div className="mb-3 flex items-center gap-2.5">
          <Select
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            aria-label="Formation"
            className="w-auto"
          >
            {FORMATIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
          <Button variant="ghost" sm onClick={autoArrange} disabled={starters.length === 0}>
            <Icon name="grid" size={14} /> Auto-arrange
          </Button>
          <span
            className={cn(
              "ml-auto font-semibold text-[12px]",
              starters.length === MAX_STARTERS ? "text-brand-strong" : "text-muted",
            )}
          >
            Starters {starters.length}/{MAX_STARTERS}
          </span>
        </div>

        <p className="m-0 mb-3 text-[12px] text-muted leading-[1.45]">
          Tap two players to swap their positions, or drag one onto another. Pick the XI and bench
          from the squad list.
        </p>

        <PitchEditor
          formation={formation}
          side={side}
          starters={starters}
          playersByPid={playersByPid}
          color={color}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
          onSwap={swap}
        />
      </div>

      <div>
        <div className="max-h-[320px] overflow-y-auto rounded-[10px] border border-line">
          {players.map((player) => {
            const state = stateOf(player.pid);
            const on = state === "starter";
            return (
              <div
                key={player.pid}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 border-line border-b px-[11px] py-2 text-[13px] last:border-b-0 hover:bg-surface-2",
                  on && "bg-brand-tint",
                )}
                onClick={() => toggleStarter(player.pid)}
              >
                <span
                  className={cn(
                    "grid h-[18px] w-[18px] flex-none place-items-center rounded-[5px] border-[1.5px]",
                    on ? "border-brand bg-brand text-white" : "border-line-strong",
                  )}
                >
                  {on && <Icon name="check" size={13} />}
                </span>
                <span className="min-w-[22px] font-mono font-semibold text-brand-strong">
                  {player.number ?? "—"}
                </span>
                <span className="flex-1">{player.name}</span>
                <span className={`pos-tag pos-${player.position}`}>{player.position}</span>
                <Button
                  variant={state === "sub" ? "primary" : "ghost"}
                  sm
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSub(player.pid);
                  }}
                >
                  {state === "sub" ? "On bench" : "Bench"}
                </Button>
              </div>
            );
          })}

          {players.length === 0 && (
            <div
              className={cn(
                "flex cursor-default items-center gap-2.5 border-line border-b px-[11px] py-2 text-[13px] last:border-b-0",
                squadError ? "text-danger" : "text-muted",
              )}
            >
              {squadError
                ? "Couldn't load the squad."
                : squadLoading
                  ? "Loading squad…"
                  : "This club has no squad yet — add players under Teams."}
            </div>
          )}
        </div>

        <div className="mt-3.5 flex items-center">
          <span className="text-[12px] text-muted">Bench: {subs.length}</span>
          <Button
            variant="primary"
            sm
            className="ml-auto"
            onClick={save}
            disabled={setLineup.isPending}
          >
            {setLineup.isPending ? "Saving…" : "Save lineup"}
          </Button>
        </div>
      </div>
    </div>
  );
}
