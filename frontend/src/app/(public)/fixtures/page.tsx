import { FixturesList } from "@/components/fixtures/FixturesList";
import { getAllMatches } from "@/services/matches.service";
import type { MatchCard } from "@/types/match";

/**
 * Fixtures (`/fixtures`) — SSR-first. Pages through the whole schedule on
 * the server and renders it grouped by round. The fetch is wrapped so a down or
 * empty backend (e.g. at build time) degrades to an empty state instead of
 * failing the render — same posture as the match center.
 */
export default async function FixturesPage() {
  let matches: MatchCard[] = [];
  try {
    matches = await getAllMatches();
  } catch {
    matches = [];
  }

  return <FixturesList matches={matches} />;
}
