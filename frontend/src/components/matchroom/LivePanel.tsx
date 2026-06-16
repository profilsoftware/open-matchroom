import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { evMeta } from "@/lib/events";
import type { MatchEvent } from "@/types/event";
import type { Matchroom } from "@/types/match";

/**
 * Live tab — the timeline variant (`.tl`), the default live style.
 * Events arrive already reverse-chronological from the API. Each row: minute
 * rail · event icon node · head (label · player — team) + commentary (+ assist).
 * Goals/penalties/reds/whistles render as `major`. The split/ticker variants
 * are not shipped.
 */
export function LivePanel({ match }: { match: Matchroom }) {
  const { events } = match;

  return (
    <div className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
      <div className="card-head flex items-center gap-2.5 border-line border-b px-5 py-4">
        <Icon name="live" size={16} />
        <h3 className="m-0 font-display font-semibold text-[15px]">Live feed</h3>
        {events.length > 0 && (
          <span className="ml-auto text-[12px] text-muted">
            {events.length} {events.length === 1 ? "event" : "events"}
          </span>
        )}
      </div>
      {events.length === 0 ? (
        <div className="px-5 py-[50px] text-center text-muted">
          No events yet — check back once the match kicks off.
        </div>
      ) : (
        <div className="px-5 pt-1.5 pb-4">
          {events.map((ev) => (
            <TimelineItem key={ev.pid} event={ev} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineItem({ event, match }: { event: MatchEvent; match: Matchroom }) {
  const meta = evMeta(event.type);
  const major = event.isMajor || meta.major;
  const teamAbbr =
    event.side === "HOME"
      ? match.homeTeam.abbreviation
      : event.side === "AWAY"
        ? match.awayTeam.abbreviation
        : null;
  const assistLabel = event.type === "SUB" ? "Off" : "Assist";

  return (
    <div className="tl-item">
      <div className="pt-1 text-right font-mono font-semibold text-[13px] text-ink-2">
        {event.minute}′
      </div>
      <div
        className={cn(
          "z-[1] grid h-[30px] w-[30px] place-items-center rounded-full border-2",
          major ? "border-brand bg-brand" : "border-line bg-surface-2",
          meta.cls,
        )}
      >
        {meta.icon ? (
          <Icon name={meta.icon} size={14} />
        ) : (
          <span
            className={cn(
              "inline-block h-[17px] w-[13px] rounded-[2px]",
              meta.card === "y" ? "bg-warn" : "bg-danger",
            )}
          />
        )}
      </div>
      <div className="pt-0.5">
        <div className={cn("font-bold text-[14px]", major && "text-brand-strong")}>
          {meta.label}
          {event.primaryPlayerName && ` · ${event.primaryPlayerName}`}
          {teamAbbr && ` — ${teamAbbr}`}
        </div>
        {(event.text || event.secondaryPlayerName) && (
          <div className="mt-0.5 text-[13px] text-ink-2 leading-[1.45]">
            {event.text}
            {event.secondaryPlayerName && (
              <>
                {event.text && " "}
                <span className="text-muted">
                  ({assistLabel}: {event.secondaryPlayerName})
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
