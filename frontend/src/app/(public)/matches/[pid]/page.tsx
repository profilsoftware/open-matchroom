import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { MatchroomView } from "@/components/matchroom/MatchroomView";
import { getMatch } from "@/services/matches.service";
import type { Matchroom } from "@/types/match";

/**
 * Cached matchroom fetch — `generateMetadata` and the page both need the
 * payload; `cache()` dedupes them to a single request-scoped fetch.
 */
const loadMatch = cache((pid: string) => getMatch(pid));

/** Per-match SEO: "Home vs Away · competition" + a venue/round description. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ pid: string }>;
}): Promise<Metadata> {
  const { pid } = await params;
  let match: Matchroom;
  try {
    match = await loadMatch(pid);
  } catch {
    return { title: "Match · OpenMatchroom" };
  }
  const fixture = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
  const title = match.competition ? `${fixture} · ${match.competition}` : fixture;
  const detail = [match.round, match.venue].filter(Boolean).join(" · ");
  return {
    title,
    description: detail ? `${fixture} — ${detail}` : fixture,
    openGraph: { title, description: detail || fixture },
  };
}

/**
 * Match center for a specific fixture (`/matches/[pid]`) — SSR-first.
 * Server-renders the full matchroom for the initial paint, then the
 * `MatchroomView` island polls while the match is live. A missing/invalid pid
 * → 404. Route `params` are async in Next 16 (awaited before use).
 */
export default async function MatchPage({ params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;

  let match: Matchroom;
  try {
    match = await loadMatch(pid);
  } catch {
    notFound();
  }

  return <MatchroomView initialMatchroom={match} />;
}
