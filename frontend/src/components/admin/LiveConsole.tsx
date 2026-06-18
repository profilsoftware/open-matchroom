"use client";

import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Emblem } from "@/components/ui/Emblem";
import { Field, Input, Select } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Stepper } from "@/components/ui/Stepper";
import { useLiveMinute } from "@/hooks/use-live-minute";
import { useCreateEvent, useDeleteEvent, useMatchClock, useUpdateMatch } from "@/hooks/use-matches";
import { cn } from "@/lib/cn";
import { EVENT_TYPES, evMeta } from "@/lib/events";
import { useToast } from "@/providers/toast-provider";
import type { EventInput, EventType, MatchEvent, Side } from "@/types/event";
import type { ClockInput, LineupPlayer, MatchInput, Matchroom } from "@/types/match";

/** A full write payload from a detail record (a PUT resets omitted fields). */
function matchToInput(m: Matchroom): MatchInput {
  return {
    homeTeam: m.homeTeam.pid,
    awayTeam: m.awayTeam.pid,
    competition: m.competition,
    round: m.round,
    venue: m.venue,
    kickoffAt: m.kickoffAt,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homePenaltyScore: m.homePenaltyScore,
    awayPenaltyScore: m.awayPenaltyScore,
    homeFormation: m.homeFormation,
    awayFormation: m.awayFormation,
  };
}

const SHOOTOUT_OPTIONS: { value: "OFF" | "ON"; label: string }[] = [
  { value: "OFF", label: "No shootout" },
  { value: "ON", label: "Penalty shootout" },
];

type EventSide = Side | "NEUTRAL";

const EVENT_SIDE_OPTIONS: { value: EventSide; label: string }[] = [
  { value: "HOME", label: "Home" },
  { value: "AWAY", label: "Away" },
  { value: "NEUTRAL", label: "Neutral" },
];

/** Types where a second player (assist / sub-off) makes sense. */
const SECONDARY_TYPES: ReadonlySet<EventType> = new Set(["GOAL", "PENALTY", "SUB"]);

/**
 * Live console. The scoreboard steppers and penalty shootout write straight
 * through `updateMatch` (held in local state for snappy feedback, re-synced
 * whenever the server detail changes — e.g. a goal event auto-bumping the
 * score). The match clock is driven by Start / Pause / Finish (plus a manual
 * minute adjust) through the dedicated `clock` action; the minute itself is
 * derived server-side and ticks on screen via `useLiveMinute`. The add-event
 * form posts to the nested events endpoint (a GOAL/PENALTY bumps the score
 * server-side); the feed lists events reverse-chronologically with a delete
 * that reverts the score.
 */
export function LiveConsole({ match }: { match: Matchroom }) {
  const updateMatch = useUpdateMatch();
  const clock = useMatchClock(match.pid);
  const createEvent = useCreateEvent(match.pid);
  const deleteEvent = useDeleteEvent(match.pid);
  const toast = useToast();

  const liveMinute = useLiveMinute(match);
  const running = match.clockStartedAt != null;
  const [homeScore, setHomeScore] = useState(match.homeScore);
  const [awayScore, setAwayScore] = useState(match.awayScore);
  // Draft for the manual minute correction; synced from the server snapshot
  // (not the ticking value, so it doesn't jump every second).
  const [adjustMin, setAdjustMin] = useState(match.minute);
  // A shootout is "on" once both penalty scores are recorded (kept apart from
  // the score). The stepper values hold 0 when off so re-enabling starts clean.
  const [shootout, setShootout] = useState(
    match.homePenaltyScore != null && match.awayPenaltyScore != null,
  );
  const [homePens, setHomePens] = useState(match.homePenaltyScore ?? 0);
  const [awayPens, setAwayPens] = useState(match.awayPenaltyScore ?? 0);

  // Re-sync from the server after a refetch (a goal moves the score; a clock
  // action moves the minute/status).
  useEffect(() => {
    setHomeScore(match.homeScore);
    setAwayScore(match.awayScore);
    setAdjustMin(match.minute);
    setShootout(match.homePenaltyScore != null && match.awayPenaltyScore != null);
    setHomePens(match.homePenaltyScore ?? 0);
    setAwayPens(match.awayPenaltyScore ?? 0);
  }, [
    match.homeScore,
    match.awayScore,
    match.minute,
    match.homePenaltyScore,
    match.awayPenaltyScore,
  ]);

  function commit(patch: Partial<MatchInput>) {
    const pens: Partial<MatchInput> = shootout
      ? { homePenaltyScore: homePens, awayPenaltyScore: awayPens }
      : { homePenaltyScore: null, awayPenaltyScore: null };
    updateMatch.mutate(
      {
        pid: match.pid,
        input: { ...matchToInput(match), homeScore, awayScore, ...pens, ...patch },
      },
      { onError: () => toast("Could not update the scoreboard") },
    );
  }

  function runClock(input: ClockInput, errorMsg: string) {
    clock.mutate(input, { onError: () => toast(errorMsg) });
  }

  function changeHome(v: number) {
    setHomeScore(v);
    commit({ homeScore: v });
  }
  function changeAway(v: number) {
    setAwayScore(v);
    commit({ awayScore: v });
  }
  function changeAdjust(v: number) {
    setAdjustMin(v);
    runClock({ action: "set", minute: v }, "Could not set the minute");
  }
  function changeShootout(on: boolean) {
    setShootout(on);
    commit(
      on
        ? { homePenaltyScore: homePens, awayPenaltyScore: awayPens }
        : { homePenaltyScore: null, awayPenaltyScore: null },
    );
  }
  function changeHomePens(v: number) {
    setHomePens(v);
    commit({ homePenaltyScore: v, awayPenaltyScore: awayPens });
  }
  function changeAwayPens(v: number) {
    setAwayPens(v);
    commit({ homePenaltyScore: homePens, awayPenaltyScore: v });
  }

  return (
    <div className="grid grid-cols-[1.1fr_1fr] items-start gap-[18px] max-[880px]:grid-cols-1">
      <div>
        <div className="flex items-center justify-center gap-3.5 py-2">
          <Emblem team={match.homeTeam} size={30} radius={8} />
          <Stepper value={homeScore} onChange={changeHome} aria-label="Home score" />
          <span className="font-bold font-score opacity-50">:</span>
          <Stepper value={awayScore} onChange={changeAway} aria-label="Away score" />
          <Emblem team={match.awayTeam} size={30} radius={8} />
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line bg-surface-2 px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold font-score text-[30px] leading-none tabular-nums">
              {liveMinute}′
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 font-semibold text-[11px] uppercase tracking-[0.06em]",
                match.status === "LIVE" && running && "bg-live-tint text-live",
                match.status === "FINISHED" &&
                  "bg-[color-mix(in_srgb,var(--ink)_8%,transparent)] text-ink-2",
                (match.status === "SCHEDULED" || (match.status === "LIVE" && !running)) &&
                  "bg-brand-tint text-brand-strong",
              )}
            >
              {match.status === "FINISHED"
                ? "Full time"
                : match.status === "LIVE"
                  ? running
                    ? "Live"
                    : "Paused"
                  : "Scheduled"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {running ? (
              <Button
                sm
                onClick={() => runClock({ action: "pause" }, "Could not pause the clock")}
                disabled={clock.isPending}
              >
                Pause
              </Button>
            ) : (
              <Button
                variant="primary"
                sm
                onClick={() => runClock({ action: "start" }, "Could not start the clock")}
                disabled={clock.isPending || match.status === "FINISHED"}
              >
                {match.status === "LIVE" ? "Resume" : "Start"}
              </Button>
            )}
            <Button
              variant="danger"
              sm
              onClick={() => runClock({ action: "finish" }, "Could not finish the match")}
              disabled={clock.isPending || match.status === "FINISHED"}
            >
              Finish
            </Button>
          </div>
        </div>

        <div className="mt-3.5">
          <Field label="Adjust minute">
            <Stepper
              value={adjustMin}
              onChange={changeAdjust}
              min={0}
              max={130}
              aria-label="Adjust match minute"
            />
          </Field>
        </div>

        <div className="mt-3.5">
          <Field label="Penalty shootout">
            <Segmented
              options={SHOOTOUT_OPTIONS}
              value={shootout ? "ON" : "OFF"}
              onChange={(v) => changeShootout(v === "ON")}
              aria-label="Penalty shootout"
            />
          </Field>
          {shootout && (
            <div className="mt-3 flex items-center justify-center gap-3.5 py-2">
              <Emblem team={match.homeTeam} size={30} radius={8} />
              <Stepper value={homePens} onChange={changeHomePens} aria-label="Home penalty score" />
              <span className="font-bold font-score opacity-50">:</span>
              <Stepper value={awayPens} onChange={changeAwayPens} aria-label="Away penalty score" />
              <Emblem team={match.awayTeam} size={30} radius={8} />
            </div>
          )}
        </div>

        <div className="editor-section">
          <h4>Add event</h4>
          <AddEventForm
            match={match}
            pending={createEvent.isPending}
            onSubmit={(input, done) =>
              createEvent.mutate(input, {
                onSuccess: () => {
                  toast("Event added");
                  done();
                },
                onError: () => toast("Could not add event"),
              })
            }
          />
        </div>
      </div>

      <div>
        <h4 className="m-0 mb-3 text-[12px] text-muted uppercase tracking-[0.07em]">
          Timeline · {match.events.length}
        </h4>
        <div className="max-h-[360px] overflow-y-auto">
          {match.events.length === 0 && <p className="text-[13px] text-muted">No events yet.</p>}
          {match.events.map((event) => (
            <FeedRow
              key={event.pid}
              event={event}
              homeAbbr={match.homeTeam.abbreviation}
              awayAbbr={match.awayTeam.abbreviation}
              onDelete={() =>
                deleteEvent.mutate(event.pid, {
                  onSuccess: () => toast("Event removed"),
                  onError: () => toast("Could not remove event"),
                })
              }
              deleting={deleteEvent.isPending}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedRow({
  event,
  homeAbbr,
  awayAbbr,
  onDelete,
  deleting,
}: {
  event: MatchEvent;
  homeAbbr: string;
  awayAbbr: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  const meta = evMeta(event.type);
  const teamAbbr = event.side === "HOME" ? homeAbbr : event.side === "AWAY" ? awayAbbr : null;
  return (
    <div className="grid grid-cols-[44px_1fr_auto] items-center gap-2.5 border-line border-b px-1.5 py-2">
      <span className="font-mono font-semibold text-brand-strong">{event.minute}′</span>
      <span className="text-[13px]">
        {meta.label}
        {event.primaryPlayerName && ` · ${event.primaryPlayerName}`}
        {teamAbbr && <span className="text-muted"> — {teamAbbr}</span>}
      </span>
      <Button variant="ghost" sm aria-label="Remove event" onClick={onDelete} disabled={deleting}>
        <Icon name="trash" size={14} />
      </Button>
    </div>
  );
}

const DEFAULT_TYPE: EventType = "GOAL";

function AddEventForm({
  match,
  pending,
  onSubmit,
}: {
  match: Matchroom;
  pending: boolean;
  onSubmit: (input: EventInput, done: () => void) => void;
}) {
  const [type, setType] = useState<EventType>(DEFAULT_TYPE);
  const [side, setSide] = useState<EventSide>("HOME");
  const [minute, setMinute] = useState("");
  const [primaryPlayer, setPrimaryPlayer] = useState("");
  const [secondaryPlayer, setSecondaryPlayer] = useState("");
  const [text, setText] = useState("");

  const sidePlayers: LineupPlayer[] =
    side === "HOME"
      ? [...match.lineup.home.starters, ...match.lineup.home.subs]
      : side === "AWAY"
        ? [...match.lineup.away.starters, ...match.lineup.away.subs]
        : [];

  const showSecondary = SECONDARY_TYPES.has(type);
  const secondaryLabel = type === "SUB" ? "Player off" : "Assist";

  function reset() {
    setPrimaryPlayer("");
    setSecondaryPlayer("");
    setText("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: EventInput = {
      type,
      side: side === "NEUTRAL" ? null : side,
      minute: minute.trim() ? Number(minute) : 0,
      primaryPlayer: primaryPlayer || null,
      secondaryPlayer: showSecondary && secondaryPlayer ? secondaryPlayer : null,
      text: text.trim(),
    };
    onSubmit(input, reset);
  }

  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type" htmlFor="ev-type">
          <Select id="ev-type" value={type} onChange={(e) => setType(e.target.value as EventType)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {evMeta(t).label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Minute" htmlFor="ev-min">
          <Input
            id="ev-min"
            type="number"
            min={0}
            max={130}
            inputMode="numeric"
            placeholder="0"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Side">
        <Segmented
          options={EVENT_SIDE_OPTIONS}
          value={side}
          onChange={(v) => {
            setSide(v);
            setPrimaryPlayer("");
            setSecondaryPlayer("");
          }}
          aria-label="Event side"
        />
      </Field>

      <div className={showSecondary ? "grid grid-cols-2 gap-3" : undefined}>
        <Field label="Player" htmlFor="ev-p1">
          <Select
            id="ev-p1"
            value={primaryPlayer}
            onChange={(e) => setPrimaryPlayer(e.target.value)}
            disabled={side === "NEUTRAL"}
          >
            <option value="">No player</option>
            {sidePlayers.map((p) => (
              <option key={p.player} value={p.player}>
                {p.number ? `${p.number} · ` : ""}
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        {showSecondary && (
          <Field label={secondaryLabel} htmlFor="ev-p2">
            <Select
              id="ev-p2"
              value={secondaryPlayer}
              onChange={(e) => setSecondaryPlayer(e.target.value)}
              disabled={side === "NEUTRAL"}
            >
              <option value="">None</option>
              {sidePlayers.map((p) => (
                <option key={p.player} value={p.player}>
                  {p.number ? `${p.number} · ` : ""}
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <Field label="Commentary" htmlFor="ev-text">
        <Input
          id="ev-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Optional note"
          maxLength={500}
        />
      </Field>

      <div className="flex justify-end">
        <Button variant="primary" sm type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add event"}
        </Button>
      </div>
    </form>
  );
}
