import Link from "next/link";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Emblem } from "@/components/ui/Emblem";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatMatchDate, formatMatchTime } from "@/lib/format";
import type { MatchCard, MatchStatus } from "@/types/match";

/** Map the match status onto the fixtures badge variant (live / FT / Soon). */
const BADGE_VARIANT: Record<MatchStatus, BadgeVariant> = {
  LIVE: "live",
  FINISHED: "finished",
  SCHEDULED: "scheduled",
};

/**
 * One fixture row (`.fx-row`). The whole row is a `<Link>` to the match center
 * (`/matches/{pid}`). Layout: `when` (date · venue) · home (name + crest,
 * right-aligned) · centre (score for played/live, kickoff time for scheduled) ·
 * away (crest + name) · status badge + View/Watch.
 */
export function FixtureRow({ match }: { match: MatchCard }) {
  const { homeTeam, awayTeam, status } = match;
  const isLive = status === "LIVE";
  const isScheduled = status === "SCHEDULED";
  const dateLabel = formatMatchDate(match.kickoffAt);
  const timeLabel = formatMatchTime(match.kickoffAt);

  return (
    <Link
      href={`/matches/${match.pid}`}
      className={cn("fx-row", isLive && "is-live", isScheduled && "is-scheduled")}
    >
      <div className="flex min-w-0 flex-col gap-[3px] text-[12px] text-muted max-[760px]:hidden">
        <span className="max-w-full truncate font-semibold text-ink-2">
          {dateLabel || "Date TBD"}
        </span>
        {match.venue && <span className="max-w-full truncate">{match.venue}</span>}
      </div>

      <div className="flex items-center justify-end gap-[11px]">
        <span className="font-semibold text-[15px] max-[760px]:text-[13px]">
          {homeTeam.shortName}
        </span>
        <Emblem team={homeTeam} size={34} radius={9} />
      </div>

      {isScheduled ? (
        <div className="flex h-[42px] flex-col items-center justify-center gap-px rounded-[10px] border border-line bg-surface-2 px-2 font-body font-semibold text-[14px] text-ink-2">
          {timeLabel || "vs"}
        </div>
      ) : (
        <div className="flex h-[42px] flex-col items-center justify-center gap-px rounded-[10px] border border-line bg-surface-2 px-2 font-bold font-score text-[22px]">
          <span className="flex items-center gap-2 leading-none">
            <span>{match.homeScore}</span>
            <span className="font-body font-semibold text-[12px] text-muted">–</span>
            <span>{match.awayScore}</span>
          </span>
          {match.homePenaltyScore != null && match.awayPenaltyScore != null && (
            <span className="whitespace-nowrap font-body font-semibold text-[10px] text-muted leading-none">
              ({match.homePenaltyScore}–{match.awayPenaltyScore})
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-[11px]">
        <Emblem team={awayTeam} size={34} radius={9} />
        <span className="font-semibold text-[15px] max-[760px]:text-[13px]">
          {awayTeam.shortName}
        </span>
      </div>

      <div className="flex items-center justify-end gap-2.5">
        <Badge variant={BADGE_VARIANT[status]} />
        <span className="inline-flex items-center gap-1.5 font-semibold text-[12.5px] text-brand-strong">
          <Icon name="eye" size={15} />
          <span className="max-[760px]:hidden">{isLive ? "Watch" : "View"}</span>
        </span>
      </div>
    </Link>
  );
}
