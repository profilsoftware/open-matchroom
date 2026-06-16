"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Emblem } from "@/components/ui/Emblem";
import { Icon } from "@/components/ui/Icon";
import { useMatchesList } from "@/hooks/use-matches";
import { cn } from "@/lib/cn";
import { formatMatchDate } from "@/lib/format";
import type { MatchCard, MatchStatus } from "@/types/match";
import { MatchEditor } from "./MatchEditor";

const BADGE_VARIANT: Record<MatchStatus, BadgeVariant> = {
  LIVE: "live",
  FINISHED: "finished",
  SCHEDULED: "scheduled",
};

/**
 * Picks the fixture to open by default: the live match if one is in progress,
 * otherwise the nearest upcoming kickoff, otherwise the most recent fixture
 * (the list is already ordered `-kickoff_at`, so `matches[0]` is the latest).
 */
function pickDefaultMatch(matches: MatchCard[]): MatchCard | null {
  if (matches.length === 0) return null;

  const live = matches.find((m) => m.status === "LIVE");
  if (live) return live;

  const now = Date.now();
  const nextUpcoming = matches
    .filter((m) => m.kickoffAt !== null && new Date(m.kickoffAt).getTime() >= now)
    .sort((a, b) => new Date(a.kickoffAt!).getTime() - new Date(b.kickoffAt!).getTime())[0];
  if (nextUpcoming) return nextUpcoming;

  return matches[0];
}

/**
 * Matches admin: a two-column `.admin-grid` —
 * the fixtures list on the left and the `MatchEditor` (Details / Lineups / Live /
 * Stats sub-tabs) on the right. Mirrors `TeamsAdmin`, except the live (or nearest)
 * fixture is auto-selected once on first load — see `pickDefaultMatch`; after that
 * selection is explicit. The editor is keyed by pid so it remounts when the
 * selection changes. A new fixture starts on Details only; the live/lineup/stats
 * sub-tabs unlock once it is saved (they need a pid).
 */
export function MatchesAdmin() {
  const { data: matches = [], isPending, isError } = useMatchesList();
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Auto-select the live (or nearest) fixture once, the first time the list loads.
  const defaultPid = useMemo(() => pickDefaultMatch(matches)?.pid ?? null, [matches]);
  const didAutoSelect = useRef(false);
  useEffect(() => {
    if (didAutoSelect.current || defaultPid === null) return;
    didAutoSelect.current = true;
    setSelectedPid(defaultPid);
  }, [defaultPid]);

  const activeMatch = creating
    ? null
    : selectedPid
      ? (matches.find((m) => m.pid === selectedPid) ?? null)
      : null;
  const showEditor = creating || activeMatch !== null;

  function selectMatch(pid: string) {
    setCreating(false);
    setSelectedPid(pid);
  }

  function startCreate() {
    setCreating(true);
    setSelectedPid(null);
  }

  function handleCreated(pid: string) {
    setCreating(false);
    setSelectedPid(pid);
  }

  function handleDeleted() {
    setCreating(false);
    setSelectedPid(null);
  }

  return (
    <div className="grid grid-cols-[300px_1fr] items-start gap-[18px] max-[880px]:grid-cols-1">
      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2 border-line border-b px-4 py-[13px]">
          <h3 className="m-0 font-bold text-[13px] text-ink-2 uppercase tracking-[0.05em]">
            Fixtures
          </h3>
          <Button variant="primary" sm className="ml-auto" onClick={startCreate}>
            <Icon name="plus" size={14} /> New
          </Button>
        </div>

        {isPending && <div className={cn(LIST_ROW, "text-muted")}>Loading fixtures…</div>}
        {isError && <div className={cn(LIST_ROW, "text-danger")}>Could not load fixtures.</div>}
        {!isPending && !isError && matches.length === 0 && (
          <div className={cn(LIST_ROW, "text-muted")}>No fixtures yet.</div>
        )}

        {matches.map((match) => (
          <MatchRow
            key={match.pid}
            match={match}
            active={!creating && activeMatch?.pid === match.pid}
            onSelect={() => selectMatch(match.pid)}
          />
        ))}
      </div>

      {showEditor ? (
        <MatchEditor
          key={creating ? "new" : activeMatch!.pid}
          pid={creating ? null : activeMatch!.pid}
          onCreated={handleCreated}
          onDeleted={handleDeleted}
        />
      ) : (
        <div className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
          <div className="px-6 py-[60px] text-center text-muted">
            <div className="mx-auto mb-3.5 grid h-[54px] w-[54px] place-items-center rounded-[14px] bg-surface-2 text-brand-soft">
              <Icon name="calendar" size={26} />
            </div>
            Select a fixture to edit its details, lineups, live feed and stats — or create a new
            one.
          </div>
        </div>
      )}
    </div>
  );
}

/** Row base — `list-row` is kept as a hook for the compact-density override. */
const LIST_ROW =
  "list-row flex w-full items-center gap-[11px] border-b border-line px-4 py-[11px] text-left text-ink last:border-b-0";

function MatchRow({
  match,
  active,
  onSelect,
}: {
  match: MatchCard;
  active: boolean;
  onSelect: () => void;
}) {
  const dateLabel = formatMatchDate(match.kickoffAt) || "Date TBC";
  const sub = [match.round, dateLabel].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      className={cn(
        LIST_ROW,
        "border-0 transition-colors hover:bg-surface-2",
        active && "bg-brand-tint shadow-[inset_3px_0_0_var(--brand)]",
      )}
      onClick={onSelect}
    >
      <span className="flex gap-1">
        <Emblem team={match.homeTeam} size={34} radius={9} />
        <Emblem team={match.awayTeam} size={34} radius={9} />
      </span>
      <div>
        <div className="font-semibold text-[14px]">
          {match.homeTeam.abbreviation || match.homeTeam.shortName} v{" "}
          {match.awayTeam.abbreviation || match.awayTeam.shortName}
        </div>
        <div className="text-[12px] text-muted">{sub}</div>
      </div>
      <span className="ml-auto">
        <Badge variant={BADGE_VARIANT[match.status]} />
      </span>
    </button>
  );
}
