import { Emblem } from "@/components/ui/Emblem";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatMatchDate, formatMatchTime } from "@/lib/format";
import type { Matchroom, Scorer } from "@/types/match";

/**
 * Scoreboard Hero (`.hero`). Meta row (competition · round · clock · venue),
 * crest/score/crest, a status tag (live `minute′` / Full time / Upcoming), and
 * the derived `scorers` split under the score — home right-aligned toward the
 * centre, away left-aligned.
 */
export function Hero({ match }: { match: Matchroom }) {
  const { homeTeam, awayTeam } = match;
  const homeScorers = match.scorers.filter((s) => s.side === "HOME");
  const awayScorers = match.scorers.filter((s) => s.side === "AWAY");
  const dateLabel = formatMatchDate(match.kickoffAt);
  const timeLabel = formatMatchTime(match.kickoffAt);
  const when = [dateLabel, timeLabel].filter(Boolean).join(" · ");

  return (
    <section className="hero">
      <div className="hero-inner relative px-[32px] pt-[26px] pb-[30px] max-[620px]:px-4 max-[620px]:pt-5 max-[620px]:pb-[22px]">
        <div className="flex flex-wrap items-center justify-center gap-3.5 text-[#b9c8df] text-[13px]">
          {match.competition && (
            <span className="flex items-center gap-2 font-semibold text-[#dce6f5]">
              <Icon name="shield" size={15} />
              {match.competition}
            </span>
          )}
          {match.round && (
            <>
              <span className="h-1 w-1 rounded-full bg-[#6f86a8]" />
              <span>{match.round}</span>
            </>
          )}
          {when && (
            <>
              <span className="h-1 w-1 rounded-full bg-[#6f86a8]" />
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" size={14} />
                {when}
              </span>
            </>
          )}
          {match.venue && (
            <>
              <span className="h-1 w-1 rounded-full bg-[#6f86a8]" />
              <span>{match.venue}</span>
            </>
          )}
        </div>

        <div className="score-row mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-[18px] max-[620px]:gap-1.5">
          <div className="flex flex-col items-center gap-3 text-center">
            <Emblem team={homeTeam} />
            <div className="font-display font-semibold text-[18px] max-[620px]:text-[14px]">
              {homeTeam.shortName}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2.5">
            <div className="score-nums flex items-center gap-3.5 font-bold font-score text-[62px] leading-[0.9] tracking-[-0.02em] max-[880px]:text-[48px]">
              <span>{match.homeScore}</span>
              <span className="font-medium text-[#7e93b3]">:</span>
              <span>{match.awayScore}</span>
            </div>
            {match.homePenaltyScore != null && match.awayPenaltyScore != null && (
              <div className="-mt-0.5 font-bold font-score text-[#7e93b3] text-[20px] leading-none tracking-[-0.01em]">
                ({match.homePenaltyScore} : {match.awayPenaltyScore})
              </div>
            )}
            <StatusTag match={match} />
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <Emblem team={awayTeam} />
            <div className="font-display font-semibold text-[18px] max-[620px]:text-[14px]">
              {awayTeam.shortName}
            </div>
          </div>
        </div>

        {(homeScorers.length > 0 || awayScorers.length > 0) && (
          <div className="mt-[18px] flex flex-wrap justify-center gap-[34px] text-[#aebfd6] text-[12.5px]">
            <ScorerCol scorers={homeScorers} side="home" />
            <ScorerCol scorers={awayScorers} side="away" />
          </div>
        )}
      </div>
    </section>
  );
}

const STATUS_TAG =
  "inline-flex items-center gap-[7px] whitespace-nowrap rounded-full px-3 py-[5px] text-[12px] font-bold uppercase tracking-[0.06em]";

function StatusTag({ match }: { match: Matchroom }) {
  if (match.status === "LIVE") {
    return (
      <span className={cn(STATUS_TAG, "bg-[rgba(226,58,58,0.16)] text-[#ff8d8d]")}>
        <span className="h-2 w-2 animate-[pulse_1.6s_infinite] rounded-full bg-live shadow-[0_0_0_0_rgba(226,58,58,0.6)]" />
        {match.minute}′
      </span>
    );
  }
  if (match.status === "FINISHED") {
    return (
      <span className={cn(STATUS_TAG, "bg-[rgba(255,255,255,0.1)] text-[#cdd9ec]")}>Full time</span>
    );
  }
  return (
    <span className={cn(STATUS_TAG, "bg-[rgba(123,151,200,0.18)] text-[#cdd9ec]")}>Upcoming</span>
  );
}

function ScorerCol({ scorers, side }: { scorers: Scorer[]; side: "home" | "away" }) {
  return (
    <div className={cn("flex flex-col gap-[3px]", side === "home" ? "text-right" : "text-left")}>
      {scorers.map((s, i) => (
        <div className="whitespace-nowrap" key={`${s.player ?? "goal"}-${s.minute}-${i}`}>
          <b className="font-semibold text-[#eef4fc]">{s.name ?? "Goal"}</b> {s.minute}′
        </div>
      ))}
    </div>
  );
}
