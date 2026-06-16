"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Emblem } from "@/components/ui/Emblem";
import { useDeleteMatch, useMatchDetail } from "@/hooks/use-matches";
import { cn } from "@/lib/cn";
import { useToast } from "@/providers/toast-provider";
import { DetailsSection } from "./DetailsSection";
import { LineupSection } from "./LineupSection";
import { LiveConsole } from "./LiveConsole";
import { StatsSection } from "./StatsSection";

type SubTab = "details" | "lineups" | "live" | "stats";

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "lineups", label: "Lineups" },
  { key: "live", label: "Live" },
  { key: "stats", label: "Stats" },
];

interface MatchEditorProps {
  /** The fixture being edited, or `null` to create a new one. */
  pid: string | null;
  /** Called with the freshly created fixture's pid so the parent can select it. */
  onCreated: (pid: string) => void;
  /** Called after a successful delete so the parent can clear its selection. */
  onDeleted: () => void;
}

/**
 * Fixture editor: a header + `.seg` sub-tabs (Details / Lineups / Live / Stats).
 * A new fixture only exposes Details — the other sections need a saved pid
 * (lineups/events/stats are keyed by the match), so they unlock once it exists.
 * The full matchroom detail is loaded once here and handed to each section.
 */
export function MatchEditor({ pid, onCreated, onDeleted }: MatchEditorProps) {
  const creating = pid === null;
  const { data: match, isPending } = useMatchDetail(pid);
  const deleteMatch = useDeleteMatch();
  const toast = useToast();
  const [tab, setTab] = useState<SubTab>("details");

  const headerEmblem = match ? match.homeTeam : { name: creating ? "New" : "—" };
  const title = creating
    ? "New fixture"
    : match
      ? `${match.homeTeam.shortName || match.homeTeam.name} v ${match.awayTeam.shortName || match.awayTeam.name}`
      : "Loading fixture…";

  function onDelete() {
    if (!match) return;
    if (
      !window.confirm(
        `Delete ${match.homeTeam.name} v ${match.awayTeam.name}? This cannot be undone.`,
      )
    ) {
      return;
    }
    deleteMatch.mutate(match.pid, {
      onSuccess: () => {
        toast("Match deleted");
        onDeleted();
      },
      onError: () => toast("Could not delete match"),
    });
  }

  return (
    <div className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3 border-line border-b px-5 py-4">
        {match ? (
          <>
            <Emblem team={match.homeTeam} size={40} radius={10} />
            <h2 className="m-0 font-display font-semibold text-[18px]">{title}</h2>
            <Emblem team={match.awayTeam} size={40} radius={10} />
          </>
        ) : (
          <>
            <Emblem team={headerEmblem} size={40} radius={10} />
            <h2 className="m-0 font-display font-semibold text-[18px]">{title}</h2>
          </>
        )}
        {!creating && (
          <div className="ml-auto">
            <Button variant="danger" sm onClick={onDelete} disabled={deleteMatch.isPending}>
              {deleteMatch.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        )}
      </div>

      <div className="editor-body p-5">
        <nav
          className="mb-[18px] inline-flex gap-[2px] rounded-[9px] border border-line bg-surface-2 p-[3px]"
          aria-label="Match editor sections"
        >
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={cn(
                "rounded-[6px] border-0 bg-transparent px-3 py-1.5 font-semibold text-[12.5px]",
                tab === t.key ? "bg-brand text-white" : "text-ink-2",
              )}
              disabled={creating && t.key !== "details"}
              title={creating && t.key !== "details" ? "Save the fixture first" : undefined}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "details" && <DetailsSection match={match ?? null} onCreated={onCreated} />}

        {!creating && !match && isPending && (
          <p className="text-[13px] text-muted">Loading fixture…</p>
        )}

        {match && tab === "lineups" && <LineupSection match={match} />}
        {match && tab === "live" && <LiveConsole match={match} />}
        {match && tab === "stats" && <StatsSection match={match} />}
      </div>
    </div>
  );
}
