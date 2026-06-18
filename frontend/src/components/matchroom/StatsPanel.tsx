import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { Matchroom, TeamStats } from "@/types/match";

/** The two-sided count metrics, in row order (possession is the donut). */
const STAT_ROWS: { key: keyof TeamStats; label: string }[] = [
  { key: "totalShots", label: "Shots" },
  { key: "shotsOnTarget", label: "Shots on target" },
  { key: "corners", label: "Corners" },
  { key: "fouls", label: "Fouls" },
  { key: "offsides", label: "Offsides" },
  { key: "yellowCards", label: "Yellow cards" },
  { key: "redCards", label: "Red cards" },
];

/**
 * Statistics tab (`.poss-ring` donut + `.stat-bar` two-sided bars). Possession
 * is the home % (away = 100 − home); each metric bar splits its width by the
 * home/away share. Shows an empty state until stats exist (e.g. a SCHEDULED
 * match).
 */
export function StatsPanel({ match }: { match: Matchroom }) {
  const home = match.stats.home;
  const away = match.stats.away;

  if (!home || !away) {
    return (
      <div className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
        <div className="card-head flex items-center gap-2.5 border-line border-b px-5 py-4">
          <Icon name="stats" size={16} />
          <h3 className="m-0 font-display font-semibold text-[15px]">Statistics</h3>
        </div>
        <div className="px-6 py-[60px] text-center text-muted">
          <div className="mx-auto mb-3.5 grid h-[54px] w-[54px] place-items-center rounded-[14px] bg-surface-2 text-brand-soft">
            <Icon name="stats" size={26} />
          </div>
          No statistics yet.
        </div>
      </div>
    );
  }

  const homePoss = home.possession;
  const awayPoss = away.possession || 100 - homePoss;

  return (
    <div className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
      <div className="card-head flex items-center gap-2.5 border-line border-b px-5 py-4">
        <Icon name="stats" size={16} />
        <h3 className="m-0 font-display font-semibold text-[15px]">Statistics</h3>
      </div>

      <div className="flex items-center justify-center gap-[30px] p-6 max-[620px]:gap-3 max-[620px]:p-4">
        <div
          className="font-bold font-score text-[34px] max-[620px]:text-[26px]"
          style={{ color: "var(--brand)" }}
        >
          {homePoss}%
        </div>
        <div
          className="relative grid h-[120px] w-[120px] shrink-0 place-items-center rounded-full max-[620px]:h-[96px] max-[620px]:w-[96px]"
          style={{
            background: `conic-gradient(var(--brand) 0 ${homePoss}%, var(--brand-soft) ${homePoss}% 100%)`,
          }}
        >
          <div className="grid h-20 w-20 place-items-center rounded-full bg-surface text-center text-[11px] text-muted leading-[1.3] max-[620px]:h-[68px] max-[620px]:w-[68px]">
            Possession
          </div>
        </div>
        <div
          className="font-bold font-score text-[34px] max-[620px]:text-[26px]"
          style={{ color: "var(--brand-soft)" }}
        >
          {awayPoss}%
        </div>
      </div>

      <div className="px-[22px] pt-2 pb-[18px]">
        {STAT_ROWS.map((row) => (
          <StatRow key={row.key} label={row.label} home={home[row.key]} away={away[row.key]} />
        ))}
      </div>
    </div>
  );
}

function StatRow({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away;
  const homePct = total === 0 ? 50 : (home / total) * 100;
  const awayPct = total === 0 ? 50 : 100 - homePct;

  return (
    <div className="stat-row border-line border-b py-[13px] last:border-b-0">
      <div className="flex items-center justify-between font-bold font-score text-[18px]">
        <span className={cn(home > away && "text-brand")}>{home}</span>
        <span className="font-body font-semibold text-[12px] text-muted uppercase tracking-[0.04em]">
          {label}
        </span>
        <span className={cn(away > home && "text-brand")}>{away}</span>
      </div>
      <div className="mt-[9px] flex h-[7px] gap-[2px] overflow-hidden rounded-full bg-line">
        <div
          className="rounded-l-full bg-brand transition-[width] duration-500"
          style={{ width: `${homePct}%` }}
        />
        <div
          className="rounded-r-full bg-brand-soft transition-[width] duration-500"
          style={{ width: `${awayPct}%` }}
        />
      </div>
    </div>
  );
}
