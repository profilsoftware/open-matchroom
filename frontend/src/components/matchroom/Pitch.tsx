import { positionsFor } from "@/lib/pitch";
import type { LineupPlayer } from "@/types/match";

interface Dot {
  player: LineupPlayer;
  x: number;
  y: number;
  color: string;
}

/**
 * The lineup pitch (`.pitch`). Draws the striped grass + markings, then places
 * one `.player-dot` per starter. Pitch x/y come from
 * `positionsFor(formation, side)` (the backend never computes them): away on
 * top, home on the bottom, each starter zipped to its formation slot by
 * `order`.
 */
export function Pitch({
  homeStarters,
  awayStarters,
  homeFormation,
  awayFormation,
  homeColor,
  awayColor,
}: {
  homeStarters: LineupPlayer[];
  awayStarters: LineupPlayer[];
  homeFormation: string;
  awayFormation: string;
  homeColor: string;
  awayColor: string;
}) {
  const dots = [
    ...placeDots(awayStarters, awayFormation, "away", awayColor),
    ...placeDots(homeStarters, homeFormation, "home", homeColor),
  ];

  return (
    <div className="pitch">
      <div className="lines" />
      <div className="center-c" />
      <div className="pbox top" />
      <div className="pbox bot" />
      {dots.map((d) => (
        <PlayerDot key={d.player.player} dot={d} />
      ))}
    </div>
  );
}

function placeDots(
  starters: LineupPlayer[],
  formation: string,
  side: "home" | "away",
  color: string,
): Dot[] {
  const points = positionsFor(formation, side);
  // `order` is the pitch slot (GK = 0); guard against more starters than the
  // formation has slots (a malformed lineup) by dropping the overflow.
  return [...starters]
    .sort((a, b) => a.order - b.order)
    .map((player, i) => ({ player, point: points[i], color }))
    .filter((d): d is { player: LineupPlayer; point: { x: number; y: number }; color: string } =>
      Boolean(d.point),
    )
    .map((d) => ({ player: d.player, x: d.point.x, y: d.point.y, color: d.color }));
}

function PlayerDot({ dot }: { dot: Dot }) {
  return (
    <div className="player-dot" style={{ left: `${dot.x}%`, top: `${dot.y}%` }}>
      <div className="num" style={{ background: dot.color }}>
        {dot.player.number ?? ""}
      </div>
      <div className="pn">{dot.player.name}</div>
    </div>
  );
}
