import { MatchroomView } from "@/components/matchroom/MatchroomView";
import { Icon } from "@/components/ui/Icon";
import { getMatch, getMatches } from "@/services/matches.service";
import type { Matchroom } from "@/types/match";

/**
 * Match center (`/`) — SSR-first. Loads the fixture list, opens the first
 * LIVE match (else the most recent), and server-renders the full matchroom; the
 * `MatchroomView` island then polls while live. Fetches are wrapped so a missing
 * backend (e.g. at build time) or an empty schedule degrades to an empty state
 * instead of failing the render.
 */
export default async function MatchCenterPage() {
  const match = await loadDefaultMatch();
  if (!match) return <NoMatches />;
  return <MatchroomView initialMatchroom={match} />;
}

async function loadDefaultMatch(): Promise<Matchroom | null> {
  try {
    const { results } = await getMatches();
    const target = results.find((m) => m.status === "LIVE") ?? results[0];
    if (!target) return null;
    return await getMatch(target.pid);
  } catch {
    return null;
  }
}

function NoMatches() {
  return (
    <div className="matchroom mx-auto max-w-[1180px] px-[22px] pt-2 pb-[60px] max-[620px]:px-[14px]">
      <div className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]">
        <div className="px-6 py-[60px] text-center text-muted">
          <div className="mx-auto mb-3.5 grid h-[54px] w-[54px] place-items-center rounded-[14px] bg-surface-2 text-brand-soft">
            <Icon name="broadcast" size={26} />
          </div>
          No matches scheduled yet. Once a fixture is added it appears here in the match center.
        </div>
      </div>
    </div>
  );
}
