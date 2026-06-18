"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { useCreateMatch, useUpdateMatch } from "@/hooks/use-matches";
import { useTeams } from "@/hooks/use-teams";
import { FORMATIONS } from "@/lib/events";
import { joinKickoff, splitKickoff } from "@/lib/format";
import { useToast } from "@/providers/toast-provider";
import type { MatchInput, Matchroom, MatchStatus } from "@/types/match";

const STATUS_OPTIONS: { value: MatchStatus; label: string }[] = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "LIVE", label: "Live" },
  { value: "FINISHED", label: "Finished" },
];

/**
 * Match details form. Creates or updates a fixture's identity: the two clubs
 * (picked from the teams list by pid), competition / round / venue, the kickoff
 * (split into separate date + time inputs, joined back to one UTC ISO datetime —
 * `lib/format`), status, and the per-side formations. Score/minute are owned by
 * the Live console, so on update they are passed straight through (a full PUT
 * would otherwise reset them to zero — MatchWriteSerializer's defaults).
 */
export function DetailsSection({
  match,
  onCreated,
}: {
  match: Matchroom | null;
  onCreated: (pid: string) => void;
}) {
  const { data: teams = [], isPending: teamsLoading, isError: teamsError } = useTeams();
  const teamPlaceholder = teamsError
    ? "Couldn't load clubs"
    : teamsLoading
      ? "Loading clubs…"
      : "Select a club…";
  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();
  const toast = useToast();

  const initialKickoff = splitKickoff(match?.kickoffAt ?? null);
  const [homeTeam, setHomeTeam] = useState(match?.homeTeam.pid ?? "");
  const [awayTeam, setAwayTeam] = useState(match?.awayTeam.pid ?? "");
  const [competition, setCompetition] = useState(match?.competition ?? "");
  const [round, setRound] = useState(match?.round ?? "");
  const [venue, setVenue] = useState(match?.venue ?? "");
  const [date, setDate] = useState(initialKickoff.date);
  const [time, setTime] = useState(initialKickoff.time);
  const [status, setStatus] = useState<MatchStatus>(match?.status ?? "SCHEDULED");
  const [homeFormation, setHomeFormation] = useState(match?.homeFormation ?? FORMATIONS[0]);
  const [awayFormation, setAwayFormation] = useState(match?.awayFormation ?? FORMATIONS[0]);

  const saving = createMatch.isPending || updateMatch.isPending;
  const sameTeam = Boolean(homeTeam) && homeTeam === awayTeam;
  const valid = Boolean(homeTeam) && Boolean(awayTeam) && !sameTeam;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    const input: MatchInput = {
      homeTeam,
      awayTeam,
      competition: competition.trim(),
      round: round.trim(),
      venue: venue.trim(),
      kickoffAt: joinKickoff(date, time),
      status,
      homeFormation,
      awayFormation,
    };
    if (match) {
      updateMatch.mutate(
        {
          pid: match.pid,
          // preserve the live scoreboard (edited in the Live console). The
          // match clock is server-derived and untouched by this PUT.
          input: {
            ...input,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            homePenaltyScore: match.homePenaltyScore,
            awayPenaltyScore: match.awayPenaltyScore,
          },
        },
        { onSuccess: () => toast("Match saved"), onError: () => toast("Could not save match") },
      );
    } else {
      createMatch.mutate(input, {
        onSuccess: (written) => {
          toast("Match created");
          onCreated(written.pid);
        },
        onError: () => toast("Could not create match"),
      });
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Home team" htmlFor="m-home">
          <Select
            id="m-home"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            required
          >
            <option value="">{teamPlaceholder}</option>
            {teams.map((t) => (
              <option key={t.pid} value={t.pid}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Away team" htmlFor="m-away">
          <Select
            id="m-away"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            required
          >
            <option value="">{teamPlaceholder}</option>
            {teams.map((t) => (
              <option key={t.pid} value={t.pid}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {sameTeam && (
        <p className="mx-0 mt-[-6px] mb-3 text-[12px] text-danger">
          Home and away must be different clubs.
        </p>
      )}

      <Field label="Competition" htmlFor="m-comp">
        <Input
          id="m-comp"
          value={competition}
          onChange={(e) => setCompetition(e.target.value)}
          placeholder="Coastal Premier League"
          maxLength={255}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Round" htmlFor="m-round">
          <Input
            id="m-round"
            value={round}
            onChange={(e) => setRound(e.target.value)}
            placeholder="Matchday 29"
            maxLength={255}
          />
        </Field>
        <Field label="Venue" htmlFor="m-venue">
          <Input
            id="m-venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Harbor Park"
            maxLength={255}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Kickoff date" htmlFor="m-date">
          <Input id="m-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Kickoff time" htmlFor="m-time">
          <Input id="m-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>

      <Field label="Status">
        <Segmented
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          aria-label="Match status"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Home formation" htmlFor="m-hform">
          <Select
            id="m-hform"
            value={homeFormation}
            onChange={(e) => setHomeFormation(e.target.value)}
          >
            {FORMATIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Away formation" htmlFor="m-aform">
          <Select
            id="m-aform"
            value={awayFormation}
            onChange={(e) => setAwayFormation(e.target.value)}
          >
            {FORMATIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-1.5 flex justify-end">
        <Button variant="primary" sm type="submit" disabled={saving || !valid}>
          {saving ? "Saving…" : match ? "Save details" : "Create fixture"}
        </Button>
      </div>
    </form>
  );
}
