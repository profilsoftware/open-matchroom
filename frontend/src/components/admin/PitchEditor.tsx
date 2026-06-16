"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { positionsFor } from "@/lib/pitch";

/** Minimal player shape the pitch needs to render a dot. */
export interface PitchPlayer {
  name: string;
  number: number | null;
}

interface PitchEditorProps {
  formation: string;
  /** API side; mapped to pitch geometry ('HOME' = bottom, 'AWAY' = top). */
  side: "HOME" | "AWAY";
  /** Starter pids in slot order (index = pitch slot). */
  starters: string[];
  playersByPid: Record<string, PitchPlayer>;
  /** Dot colour (the side's team colour). */
  color: string;
  /** Currently selected slot (for tap-to-swap), or `null`. */
  selectedSlot: number | null;
  onSelectSlot: (slot: number | null) => void;
  /** Swap the players sitting in slots `a` and `b`. */
  onSwap: (a: number, b: number) => void;
}

/**
 * The editable lineup pitch. Draws one slot per
 * `positionsFor(formation, side)` point: a filled slot is a draggable
 * `.player-dot.editable`, an unfilled one is a dashed `.player-dot.empty`
 * placeholder. Slots are reordered by **tap-to-swap** (tap two filled slots) or
 * **HTML5 drag** (drag one dot onto another) — both call `onSwap`, which rewrites
 * the starter order (the order is the slot, so a swap moves players on the pitch).
 */
export function PitchEditor({
  formation,
  side,
  starters,
  playersByPid,
  color,
  selectedSlot,
  onSelectSlot,
  onSwap,
}: PitchEditorProps) {
  const [dragSlot, setDragSlot] = useState<number | null>(null);
  const [overSlot, setOverSlot] = useState<number | null>(null);

  const points = positionsFor(formation, side === "HOME" ? "home" : "away");

  function tapSlot(slot: number) {
    if (selectedSlot === null) {
      onSelectSlot(slot);
    } else if (selectedSlot === slot) {
      onSelectSlot(null);
    } else {
      onSwap(selectedSlot, slot);
      onSelectSlot(null);
    }
  }

  function dropOn(slot: number) {
    if (dragSlot !== null && dragSlot !== slot) onSwap(dragSlot, slot);
    setDragSlot(null);
    setOverSlot(null);
  }

  return (
    <div className="pitch admin-pitch">
      <div className="lines" />
      <div className="center-c" />
      <div className="pbox top" />
      <div className="pbox bot" />

      {points.map((point, slot) => {
        const pid = starters[slot];
        const style = { left: `${point.x}%`, top: `${point.y}%` };

        if (!pid) {
          return (
            <div key={`empty-${slot}`} className="player-dot empty" style={style}>
              <div className="num">+</div>
              <div className="pn">Empty</div>
            </div>
          );
        }

        const player = playersByPid[pid];
        return (
          <div
            key={pid}
            className={cn(
              "player-dot editable",
              selectedSlot === slot && "sel",
              overSlot === slot && "over",
            )}
            style={style}
            draggable
            onClick={() => tapSlot(slot)}
            onDragStart={() => setDragSlot(slot)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverSlot(slot);
            }}
            onDragLeave={() => setOverSlot((s) => (s === slot ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              dropOn(slot);
            }}
            onDragEnd={() => {
              setDragSlot(null);
              setOverSlot(null);
            }}
          >
            <div className="num" style={{ background: color }}>
              {player?.number ?? ""}
            </div>
            <div className="pn">{player?.name ?? "—"}</div>
          </div>
        );
      })}
    </div>
  );
}
