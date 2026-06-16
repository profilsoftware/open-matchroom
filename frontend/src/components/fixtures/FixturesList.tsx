import { Icon } from "@/components/ui/Icon";
import type { MatchCard } from "@/types/match";
import { FixtureHero } from "./FixtureHero";
import { FixtureRow } from "./FixtureRow";

/** Reverse-chronological (newest kickoff first); matches without a kickoff sort last. */
function byKickoffDesc(a: MatchCard, b: MatchCard): number {
  if (!a.kickoffAt) return 1;
  if (!b.kickoffAt) return -1;
  return b.kickoffAt.localeCompare(a.kickoffAt); // reversed operands = newest first
}

/**
 * The fixture pulled to the top as the highlighted hero: a LIVE match if any
 * (latest kickoff wins on ties), else the nearest UPCOMING scheduled match
 * (soonest future kickoff). Returns null when nothing is live or upcoming.
 */
function pickFeatured(matches: MatchCard[], now = Date.now()): MatchCard | null {
  const live = matches.filter((m) => m.status === "LIVE");
  if (live.length) return [...live].sort(byKickoffDesc)[0];
  const upcoming = matches
    .filter((m) => m.status === "SCHEDULED" && m.kickoffAt && Date.parse(m.kickoffAt) >= now)
    .sort((a, b) => a.kickoffAt!.localeCompare(b.kickoffAt!)); // soonest first
  return upcoming[0] ?? null;
}

/** The single competition shared by every match, or "" when they differ/blank. */
function uniformCompetition(matches: MatchCard[]): string {
  const comps = new Set(matches.map((m) => m.competition).filter(Boolean));
  return comps.size === 1 ? [...comps][0] : "";
}

/**
 * Fixtures schedule (`.fixtures`): a header, an optional `FixtureHero` for the
 * live / nearest-upcoming match, then a flat newest-first `.fx-list` of the
 * remaining `FixtureRow`s. Renders an empty state when the schedule is empty.
 */
export function FixturesList({ matches }: { matches: MatchCard[] }) {
  if (matches.length === 0) return <EmptyFixtures />;

  const featured = pickFeatured(matches);
  const rest = (featured ? matches.filter((m) => m.pid !== featured.pid) : [...matches]).sort(
    byKickoffDesc,
  );

  const competition = uniformCompetition(matches);
  const noun = matches.length === 1 ? "match" : "matches";
  const subtitle = competition
    ? `${competition} · ${matches.length} ${noun}`
    : `${matches.length} ${noun}`;

  return (
    <div className="mx-auto max-w-[1080px] px-[22px] pt-[22px] pb-[60px]">
      <div className="mt-[6px] mb-[22px] flex items-end gap-3">
        <h1 className="m-0 font-bold font-display text-[24px] tracking-[-0.02em]">Fixtures</h1>
        <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>
      </div>

      {featured && <FixtureHero match={featured} />}

      <div className="flex flex-col gap-2.5">
        {rest.map((match) => (
          <FixtureRow key={match.pid} match={match} />
        ))}
      </div>
    </div>
  );
}

function EmptyFixtures() {
  return (
    <div className="mx-auto max-w-[1080px] px-[22px] pt-[22px] pb-[60px]">
      <div className="mt-[6px] mb-[22px] flex items-end gap-3">
        <h1 className="m-0 font-bold font-display text-[24px] tracking-[-0.02em]">Fixtures</h1>
      </div>
      <div className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
        <div className="px-6 py-[60px] text-center text-muted">
          <div className="mx-auto mb-3.5 grid h-[54px] w-[54px] place-items-center rounded-[14px] bg-surface-2 text-brand-soft">
            <Icon name="calendar" size={26} />
          </div>
          No fixtures scheduled yet. Once matches are added they appear here, newest first.
        </div>
      </div>
    </div>
  );
}
