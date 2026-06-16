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
 * The featured fixture pulled to the very top of the schedule (`.fx-hero`): a
 * larger, highlighted card for the live or nearest-upcoming match. Like
 * `FixtureRow`, the whole card links to the match center (`/matches/{pid}`);
 * the live accent (red glow + minute pill) kicks in via the `is-live` class.
 */
export function FixtureHero({ match }: { match: MatchCard }) {
  const { homeTeam, awayTeam, status } = match;
  const isLive = status === "LIVE";
  const isScheduled = status === "SCHEDULED";
  const dateLabel = formatMatchDate(match.kickoffAt);
  const timeLabel = formatMatchTime(match.kickoffAt);
  const when = [dateLabel, timeLabel].filter(Boolean).join(" · ");
  const hasPenalties = match.homePenaltyScore != null && match.awayPenaltyScore != null;

  return (
    <Link href={`/matches/${match.pid}`} className={cn("fx-hero", isLive && "is-live")}>
      <div className="relative px-[22px] pt-[18px] pb-4 max-[760px]:px-3.5 max-[760px]:pt-3.5 max-[760px]:pb-3">
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-[12px] text-muted max-[760px]:gap-2 max-[760px]:text-[11.5px]">
          {match.competition && (
            <span className="flex items-center gap-1.5 font-semibold text-ink-2">
              <Icon name="shield" size={15} />
              {match.competition}
            </span>
          )}
          {match.round && (
            <>
              <span className="h-1 w-1 rounded-full bg-line" />
              <span>{match.round}</span>
            </>
          )}
          {when && (
            <>
              <span className="h-1 w-1 rounded-full bg-line" />
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" size={14} />
                {when}
              </span>
            </>
          )}
          {match.venue && (
            <>
              <span className="h-1 w-1 rounded-full bg-line" />
              <span>{match.venue}</span>
            </>
          )}
        </div>

        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-[760px]:gap-2.5">
          <div className="flex flex-col items-center gap-[9px] text-center">
            <Emblem team={homeTeam} size={48} radius={12} />
            <span className="font-display font-semibold text-[15px] max-[760px]:text-[13px]">
              {homeTeam.shortName}
            </span>
          </div>

          <div className="flex flex-col items-center gap-[7px]">
            {isScheduled ? (
              <div className="font-bold font-score text-[24px] text-ink-2 tracking-[-0.01em] max-[760px]:text-[20px]">
                {timeLabel || "vs"}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 font-bold font-score text-[32px] leading-[0.9] tracking-[-0.02em] max-[760px]:gap-2 max-[760px]:text-[28px]">
                <span>{match.homeScore}</span>
                <span className="font-medium text-muted">:</span>
                <span>{match.awayScore}</span>
              </div>
            )}
            {hasPenalties && (
              <div className="font-bold font-score text-[14px] text-muted">
                ({match.homePenaltyScore} : {match.awayPenaltyScore})
              </div>
            )}
            <Badge variant={BADGE_VARIANT[status]}>{isLive ? `${match.minute}′` : undefined}</Badge>
          </div>

          <div className="flex flex-col items-center gap-[9px] text-center">
            <Emblem team={awayTeam} size={48} radius={12} />
            <span className="font-display font-semibold text-[15px] max-[760px]:text-[13px]">
              {awayTeam.shortName}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 font-semibold text-[12.5px] text-brand-strong">
          <Icon name="eye" size={16} />
          <span>{isLive ? "Watch live" : "View match"}</span>
        </div>
      </div>
    </Link>
  );
}
