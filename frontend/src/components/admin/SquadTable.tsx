"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useCreatePlayer, useDeletePlayer, usePlayers, useUpdatePlayer } from "@/hooks/use-teams";
import { cn } from "@/lib/cn";
import { POSITION_LABELS, POSITIONS } from "@/lib/events";
import { useToast } from "@/providers/toast-provider";
import type { Player, PlayerInput, Position } from "@/types/team";

const DEFAULT_POSITION: Position = "GK";

const SQUAD_ROW =
  "grid grid-cols-[46px_1fr_80px_70px] items-center gap-2.5 border-b border-line px-1.5 py-2 max-[620px]:grid-cols-[40px_1fr_64px]";

/**
 * Squad CRUD for a saved team. The roster reads
 * via `?team=<pid>` (already ordered GK→DF→MF→FW server-side). A single form
 * below the table both adds a new player and edits an existing one (the row's
 * pencil loads it in); writes go through react-query mutations → invalidate.
 */
export function SquadTable({ teamPid }: { teamPid: string }) {
  const { data: players = [], isPending, isError } = usePlayers(teamPid);
  const createPlayer = useCreatePlayer(teamPid);
  const updatePlayer = useUpdatePlayer(teamPid);
  const deletePlayer = useDeletePlayer(teamPid);
  const toast = useToast();

  const [editingPid, setEditingPid] = useState<string | null>(null);
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);

  const saving = createPlayer.isPending || updatePlayer.isPending;

  function resetForm() {
    setEditingPid(null);
    setNumber("");
    setName("");
    setPosition(DEFAULT_POSITION);
  }

  function startEdit(player: Player) {
    setEditingPid(player.pid);
    setNumber(player.number?.toString() ?? "");
    setName(player.name);
    setPosition(player.position);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const input: PlayerInput = {
      team: teamPid,
      name: trimmed,
      number: number.trim() ? Number(number) : null,
      position,
    };
    if (editingPid) {
      updatePlayer.mutate(
        { pid: editingPid, input },
        {
          onSuccess: () => {
            toast("Player saved");
            resetForm();
          },
          onError: () => toast("Could not save player"),
        },
      );
    } else {
      createPlayer.mutate(input, {
        onSuccess: () => {
          toast("Player added");
          resetForm();
        },
        onError: () => toast("Could not add player"),
      });
    }
  }

  function onDelete(player: Player) {
    deletePlayer.mutate(player.pid, {
      onSuccess: () => {
        toast("Player removed");
        if (editingPid === player.pid) resetForm();
      },
      onError: () => toast("Could not remove player"),
    });
  }

  return (
    <>
      <div className="flex flex-col">
        <div
          className={cn(SQUAD_ROW, "font-bold text-[11px] text-muted uppercase tracking-[0.05em]")}
        >
          <span>#</span>
          <span>Name</span>
          <span>Pos</span>
          <span className="max-[620px]:hidden" />
        </div>

        {players.map((player) => (
          <div className={SQUAD_ROW} key={player.pid}>
            <span className="font-mono font-semibold text-brand-strong">
              {player.number ?? "—"}
            </span>
            <span>{player.name}</span>
            <span className={`pos-tag pos-${player.position}`}>{player.position}</span>
            <span className="flex justify-end gap-1.5 max-[620px]:hidden">
              <Button
                variant="ghost"
                sm
                aria-label={`Edit ${player.name}`}
                onClick={() => startEdit(player)}
              >
                <Icon name="pencil" size={14} />
              </Button>
              <Button
                variant="ghost"
                sm
                aria-label={`Remove ${player.name}`}
                onClick={() => onDelete(player)}
                disabled={deletePlayer.isPending}
              >
                <Icon name="trash" size={14} />
              </Button>
            </span>
          </div>
        ))}

        {players.length === 0 && (
          <div className={cn(SQUAD_ROW, "text-[13px]", isError ? "text-danger" : "text-muted")}>
            {isError
              ? "Couldn't load the squad."
              : isPending
                ? "Loading squad…"
                : "No players yet — add the first below."}
          </div>
        )}
      </div>

      <form
        className="mt-3 grid grid-cols-[64px_minmax(0,1fr)_150px_auto] items-center gap-2"
        onSubmit={onSubmit}
      >
        <Input
          type="number"
          min={0}
          max={99}
          inputMode="numeric"
          placeholder="#"
          aria-label="Shirt number"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
        />
        <Input
          placeholder="Player name"
          aria-label="Player name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Select
          aria-label="Position"
          value={position}
          onChange={(event) => setPosition(event.target.value as Position)}
        >
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {POSITION_LABELS[pos]}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Button variant="primary" type="submit" disabled={saving || !name.trim()}>
            {editingPid ? "Save" : "Add"}
          </Button>
          {editingPid && (
            <Button variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
