import { Icon } from "@/components/ui/Icon";
import type { LineupPlayer, Matchroom } from "@/types/match";
import type { TeamBrief } from "@/types/team";
import { Pitch } from "./Pitch";

/**
 * Lineup tab (`.lineup-grid`): a formation header, the `Pitch` with both XIs,
 * and the two benches below. Away is shown on the left throughout (matching the
 * pitch, where away is the top half), home on the right.
 */
export function LineupPanel({ match }: { match: Matchroom }) {
  const { homeTeam, awayTeam, lineup } = match;
  const hasStarters = lineup.home.starters.length > 0 || lineup.away.starters.length > 0;

  if (!hasStarters) {
    return (
      <div className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
        <div className="px-6 py-[60px] text-center text-muted">
          <div className="mx-auto mb-3.5 grid h-[54px] w-[54px] place-items-center rounded-[14px] bg-surface-2 text-brand-soft">
            <Icon name="shirt" size={26} />
          </div>
          Lineups haven&apos;t been published yet.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
      <div className="card-head flex items-center gap-2.5 border-line border-b px-5 py-4">
        <span className="formation-tag">{match.awayFormation}</span>
        <h3 className="m-0 mx-auto font-display font-semibold text-[15px]">Starting XI</h3>
        <span className="formation-tag">{match.homeFormation}</span>
      </div>
      <div className="grid grid-cols-1 gap-[18px] px-5 pt-4 pb-5">
        <div className="rounded-lg border border-line bg-surface p-3.5 shadow-[var(--shadow-sm)]">
          <Pitch
            homeStarters={lineup.home.starters}
            awayStarters={lineup.away.starters}
            homeFormation={match.homeFormation}
            awayFormation={match.awayFormation}
            homeColor={homeTeam.color || "var(--brand)"}
            awayColor={awayTeam.color || "var(--brand-soft)"}
          />
        </div>
        <div className="grid grid-cols-2 gap-3.5 max-[620px]:grid-cols-1">
          <SubsList team={awayTeam} subs={lineup.away.subs} />
          <SubsList team={homeTeam} subs={lineup.home.subs} />
        </div>
      </div>
    </div>
  );
}

function SubsList({ team, subs }: { team: TeamBrief; subs: LineupPlayer[] }) {
  return (
    <div>
      <h4 className="m-0 mb-2 flex items-center gap-2 px-[9px] text-[11px] text-muted uppercase tracking-[0.08em]">
        <Icon name="users" size={13} />
        {team.shortName} bench
      </h4>
      {subs.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-[8px] px-[9px] py-[7px] text-[13px] text-muted">
          No substitutes listed
        </div>
      ) : (
        [...subs]
          .sort((a, b) => a.order - b.order)
          .map((p) => (
            <div
              className="flex items-center gap-2.5 rounded-[8px] px-[9px] py-[7px] text-[13px] hover:bg-surface-2"
              key={p.player}
            >
              <span className="w-6 font-mono font-semibold text-[12px] text-muted">
                {p.number ?? "–"}
              </span>
              <span>{p.name}</span>
              {p.position && (
                <span className="ml-auto rounded-[5px] bg-surface-2 px-[7px] py-0.5 font-bold text-[10px] text-muted">
                  {p.position}
                </span>
              )}
            </div>
          ))
      )}
    </div>
  );
}
