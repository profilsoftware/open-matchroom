"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Emblem } from "@/components/ui/Emblem";
import { Icon } from "@/components/ui/Icon";
import { useTeams } from "@/hooks/use-teams";
import { cn } from "@/lib/cn";
import type { Team } from "@/types/team";
import { TeamEditor } from "./TeamEditor";

/**
 * Teams admin: a two-column `.admin-grid` — the
 * club list on the left (select to edit, "New" to create) and the `TeamEditor`
 * on the right. Selection is explicit (no auto-pick) so creating a club and then
 * landing on it is unambiguous; the editor is keyed by pid so its form resets
 * when the selection changes.
 */
export function TeamsAdmin() {
  const { data: teams = [], isPending, isError } = useTeams();
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const activeTeam = creating
    ? null
    : selectedPid
      ? (teams.find((t) => t.pid === selectedPid) ?? null)
      : null;
  const showEditor = creating || activeTeam !== null;

  function selectTeam(pid: string) {
    setCreating(false);
    setSelectedPid(pid);
  }

  function startCreate() {
    setCreating(true);
    setSelectedPid(null);
  }

  function handleCreated(team: Team) {
    setCreating(false);
    setSelectedPid(team.pid);
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
            Clubs
          </h3>
          <Button variant="primary" sm className="ml-auto" onClick={startCreate}>
            <Icon name="plus" size={14} /> New
          </Button>
        </div>

        {isPending && <div className={cn(LIST_ROW, "text-muted")}>Loading clubs…</div>}
        {isError && <div className={cn(LIST_ROW, "text-danger")}>Could not load clubs.</div>}
        {!isPending && !isError && teams.length === 0 && (
          <div className={cn(LIST_ROW, "text-muted")}>No clubs yet.</div>
        )}

        {teams.map((team) => (
          <button
            key={team.pid}
            type="button"
            className={cn(
              LIST_ROW,
              "border-0 transition-colors hover:bg-surface-2",
              !creating &&
                activeTeam?.pid === team.pid &&
                "bg-brand-tint shadow-[inset_3px_0_0_var(--brand)]",
            )}
            onClick={() => selectTeam(team.pid)}
          >
            <Emblem team={team} size={34} radius={9} />
            <div>
              <div className="font-semibold text-[14px]">{team.name}</div>
              <div className="text-[12px] text-muted">
                {team.city || team.shortName || team.abbreviation}
              </div>
            </div>
          </button>
        ))}
      </div>

      {showEditor ? (
        <TeamEditor
          key={creating ? "new" : activeTeam!.pid}
          team={activeTeam}
          onCreated={handleCreated}
          onDeleted={handleDeleted}
        />
      ) : (
        <div className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
          <div className="px-6 py-[60px] text-center text-muted">
            <div className="mx-auto mb-3.5 grid h-[54px] w-[54px] place-items-center rounded-[14px] bg-surface-2 text-brand-soft">
              <Icon name="shield" size={26} />
            </div>
            Select a club to edit its details and squad, or create a new one.
          </div>
        </div>
      )}
    </div>
  );
}

/** Row base — `list-row` is kept as a hook for the compact-density override. */
const LIST_ROW =
  "list-row flex w-full items-center gap-[11px] border-b border-line px-4 py-[11px] text-left text-ink last:border-b-0";
