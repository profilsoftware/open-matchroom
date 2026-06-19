"""Match-clock control. The minute is derived from a stopwatch (see Match);
these are the transitions an admin drives: start/resume, pause, finish, and a
manual minute correction (stoppage time, half-time)."""

from django.utils import timezone

from src.matches.broadcast import BroadcastEventType
from src.matches.broadcast import broadcast
from src.matches.models import Match


def current_minute(match: Match) -> int:
    """The live match minute, derived from the clock."""
    return match.current_minute


def start(match: Match) -> Match:
    """Start (or resume) the clock and mark the match live. Idempotent: a
    second call while already running leaves the running segment untouched."""
    if not match.is_clock_running:
        match.clock_started_at = timezone.now()
    match.status = Match.Status.LIVE
    if match.kickoff_at is None:
        match.kickoff_at = timezone.now()
    match.save(update_fields=["clock_started_at", "status", "kickoff_at", "modified"])
    broadcast(match, BroadcastEventType.MATCH_STARTED)
    return match


def pause(match: Match) -> Match:
    """Stop the clock but stay live (e.g. half-time). Folds the running
    segment into the accumulated total so the minute freezes where it is."""
    if match.is_clock_running:
        match.clock_elapsed_seconds = match.elapsed_seconds
        match.clock_started_at = None
        match.save(update_fields=["clock_elapsed_seconds", "clock_started_at", "modified"])
    broadcast(match, BroadcastEventType.MATCH_PAUSED)
    return match


def finish(match: Match) -> Match:
    """End the match: freeze the clock and mark it finished."""
    match.clock_elapsed_seconds = match.elapsed_seconds
    match.clock_started_at = None
    match.status = Match.Status.FINISHED
    match.save(update_fields=["clock_elapsed_seconds", "clock_started_at", "status", "modified"])
    broadcast(match, BroadcastEventType.MATCH_FINISHED)
    return match


def set_minute(match: Match, minute: int) -> Match:
    """Manually set the clock to a given minute (admin correction). Keeps the
    running/paused state; if running, rebases so it keeps counting from here."""
    match.clock_elapsed_seconds = max(0, minute) * 60
    if match.is_clock_running:
        match.clock_started_at = timezone.now()
    match.save(update_fields=["clock_elapsed_seconds", "clock_started_at", "modified"])
    broadcast(match)
    return match
