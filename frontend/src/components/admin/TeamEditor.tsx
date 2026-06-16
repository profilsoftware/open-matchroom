"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Emblem } from "@/components/ui/Emblem";
import { Field, Input } from "@/components/ui/Field";
import { useCreateTeam, useDeleteTeam, useUpdateTeam } from "@/hooks/use-teams";
import { cn } from "@/lib/cn";
import { useToast } from "@/providers/toast-provider";
import type { Team, TeamInput } from "@/types/team";
import { SquadTable } from "./SquadTable";

/** Quick-pick crest colours (the demo palette + the white-label brand). */
const TEAM_COLORS = [
  "#3b6fa6",
  "#2f6ca8",
  "#c0392b",
  "#1f8e5e",
  "#6a4fb0",
  "#0f8a8a",
  "#c2522b",
  "#d4a017",
  "#2c3e50",
  "#16a085",
];

const DEFAULT_COLOR = TEAM_COLORS[0];

interface TeamEditorProps {
  /** The club being edited, or `null` to create a new one. */
  team: Team | null;
  /** Called with the freshly created club so the parent can select it. */
  onCreated: (team: Team) => void;
  /** Called after a successful delete so the parent can clear its selection. */
  onDeleted: () => void;
}

/**
 * Club details form + squad manager. Mounted keyed by team pid (so its field
 * state resets when the selection changes), it creates or updates the club via
 * react-query and — once the club exists — embeds `SquadTable` for roster CRUD.
 * The crest colour is a swatch palette plus a native picker for fully custom
 * white-label colours, and an optional logo upload (a transparent crest sits on
 * top of the colour gradient). With no logo the crest is the initials fallback.
 */
export function TeamEditor({ team, onCreated, onDeleted }: TeamEditorProps) {
  const toast = useToast();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const [name, setName] = useState(team?.name ?? "");
  const [shortName, setShortName] = useState(team?.shortName ?? "");
  const [abbreviation, setAbbreviation] = useState(team?.abbreviation ?? "");
  const [city, setCity] = useState(team?.city ?? "");
  const [color, setColor] = useState(team?.color || DEFAULT_COLOR);

  // A freshly picked logo file (not yet saved) plus an object-URL for previewing
  // it. With nothing picked the preview falls back to the team's saved logo.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoObjectUrl, setLogoObjectUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const logoPreview = logoObjectUrl ?? team?.logo ?? null;
  const saving = createTeam.isPending || updateTeam.isPending;

  function pickLogo(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setLogoFile(file);
  }

  function clearLogo() {
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    const input: TeamInput = {
      name: name.trim(),
      shortName: shortName.trim(),
      abbreviation: abbreviation.trim(),
      city: city.trim(),
      color,
      logo: logoFile,
    };
    if (team) {
      updateTeam.mutate(
        { pid: team.pid, input },
        {
          onSuccess: () => {
            toast("Team saved");
            // Drop the pending file so the preview falls back to the saved logo.
            clearLogo();
          },
          onError: () => toast("Could not save team"),
        },
      );
    } else {
      createTeam.mutate(input, {
        onSuccess: (created) => {
          toast("Team created");
          onCreated(created);
        },
        onError: () => toast("Could not create team"),
      });
    }
  }

  function onDelete() {
    if (!team) return;
    if (!window.confirm(`Delete ${team.name} and its squad? This cannot be undone.`)) return;
    deleteTeam.mutate(team.pid, {
      onSuccess: () => {
        toast("Team deleted");
        onDeleted();
      },
      // A team referenced by a match is PROTECTed server-side.
      onError: () => toast("Could not delete — the team is used by a match"),
    });
  }

  return (
    <form
      className="rounded-lg border border-line bg-surface shadow-[var(--shadow-sm)]"
      onSubmit={onSubmit}
    >
      <div className="flex items-center gap-3 border-line border-b px-5 py-4">
        <Emblem
          team={{ name: name || "New", abbreviation, color, logo: logoPreview }}
          size={40}
          radius={10}
        />
        <h2 className="m-0 font-display font-semibold text-[18px]">
          {team ? name || "Unnamed team" : "New team"}
        </h2>
        <div className="ml-auto flex gap-2">
          {team && (
            <Button variant="danger" sm onClick={onDelete} disabled={deleteTeam.isPending}>
              {deleteTeam.isPending ? "Deleting…" : "Delete"}
            </Button>
          )}
          <Button variant="primary" sm type="submit" disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="editor-body p-5">
        <Field label="Club name" htmlFor="team-name">
          <Input
            id="team-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Harbor City FC"
            maxLength={255}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Short name" htmlFor="team-short">
            <Input
              id="team-short"
              value={shortName}
              onChange={(event) => setShortName(event.target.value)}
              placeholder="Harbor City"
              maxLength={255}
            />
          </Field>
          <Field label="Abbreviation" htmlFor="team-abbr">
            <Input
              id="team-abbr"
              value={abbreviation}
              onChange={(event) => setAbbreviation(event.target.value.toUpperCase())}
              placeholder="HAR"
              maxLength={8}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City" htmlFor="team-city">
            <Input
              id="team-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Harbor City"
              maxLength={255}
            />
          </Field>
          <Field label="Crest colour">
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={cn(
                    "h-7 w-7 rounded-[8px] border-2 border-transparent",
                    swatch.toLowerCase() === color.toLowerCase() &&
                      "border-ink shadow-[0_0_0_2px_var(--surface)_inset]",
                  )}
                  style={{ background: swatch }}
                  aria-label={`Use ${swatch}`}
                  onClick={() => setColor(swatch)}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                aria-label="Custom crest colour"
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  border: 0,
                  background: "none",
                  cursor: "pointer",
                }}
              />
            </div>
          </Field>
        </div>

        <Field label="Club logo">
          <div className="flex items-center gap-3.5">
            <Emblem
              team={{ name: name || "New", abbreviation, color, logo: logoPreview }}
              size={56}
              radius={14}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={pickLogo}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button variant="default" sm onClick={() => fileInputRef.current?.click()}>
                {logoPreview ? "Replace logo" : "Upload logo"}
              </Button>
              {logoFile && (
                <Button variant="ghost" sm onClick={clearLogo}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Field>

        <div className="editor-section">
          <h4>Squad</h4>
          {team ? (
            <SquadTable teamPid={team.pid} />
          ) : (
            <p className="m-0 text-[13px] text-muted">
              Save the club first, then add its squad here.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
