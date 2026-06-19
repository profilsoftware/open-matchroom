from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone

from src.matches.models import Match
from src.matches.services import clock
from src.matches.tests.factories import MatchFactory

pytestmark = pytest.mark.django_db


def _at(model_now=None, clock_now=None):
    """Patch ``timezone.now`` in the model (drives current_minute) and/or the
    clock service (drives the transition timestamps)."""
    patches = []
    if model_now is not None:
        patches.append(patch("src.matches.models.timezone.now", return_value=model_now))
    if clock_now is not None:
        patches.append(
            patch("src.matches.services.clock.timezone.now", return_value=clock_now)
        )
    return patches


class TestClockService:
    def test_start_marks_live_running_and_sets_kickoff(self):
        match = MatchFactory(status=Match.Status.SCHEDULED, kickoff_at=None)

        clock.start(match)

        match.refresh_from_db()
        assert match.status == Match.Status.LIVE
        assert match.is_clock_running
        assert match.kickoff_at is not None

    def test_current_minute_advances_while_running(self):
        t0 = timezone.now()
        match = MatchFactory(clock_started_at=t0, clock_elapsed_seconds=0)

        with patch(
            "src.matches.models.timezone.now",
            return_value=t0 + timedelta(minutes=12, seconds=30),
        ):
            assert match.current_minute == 12

    def test_pause_freezes_the_minute(self):
        t0 = timezone.now()
        match = MatchFactory(
            status=Match.Status.LIVE,
            clock_started_at=t0,
            clock_elapsed_seconds=0,
        )

        with patch(
            "src.matches.services.clock.timezone.now",
            return_value=t0 + timedelta(minutes=20),
        ):
            clock.pause(match)

        match.refresh_from_db()
        assert not match.is_clock_running
        assert match.status == Match.Status.LIVE  # paused, still live (half-time)
        assert match.clock_elapsed_seconds == 20 * 60
        assert match.current_minute == 20  # stays put with no clock running

    def test_resume_continues_from_where_it_paused(self):
        # Paused at 20'.
        match = MatchFactory(
            status=Match.Status.LIVE,
            clock_started_at=None,
            clock_elapsed_seconds=20 * 60,
        )
        t1 = timezone.now()

        with patch("src.matches.services.clock.timezone.now", return_value=t1):
            clock.start(match)  # resume

        with patch(
            "src.matches.models.timezone.now",
            return_value=t1 + timedelta(minutes=5),
        ):
            assert match.current_minute == 25

    def test_finish_freezes_and_marks_finished(self):
        t0 = timezone.now()
        match = MatchFactory(
            status=Match.Status.LIVE,
            clock_started_at=t0,
            clock_elapsed_seconds=0,
        )

        with patch(
            "src.matches.services.clock.timezone.now",
            return_value=t0 + timedelta(minutes=95),
        ):
            clock.finish(match)

        match.refresh_from_db()
        assert match.status == Match.Status.FINISHED
        assert not match.is_clock_running
        assert match.current_minute == 95

    def test_set_minute_while_paused(self):
        match = MatchFactory(clock_started_at=None, clock_elapsed_seconds=0)

        clock.set_minute(match, 45)

        match.refresh_from_db()
        assert not match.is_clock_running
        assert match.clock_elapsed_seconds == 45 * 60
        assert match.current_minute == 45

    def test_set_minute_while_running_rebases_and_keeps_ticking(self):
        match = MatchFactory(
            status=Match.Status.LIVE,
            clock_started_at=timezone.now() - timedelta(minutes=80),
            clock_elapsed_seconds=0,
        )
        t1 = timezone.now()

        with patch("src.matches.services.clock.timezone.now", return_value=t1):
            clock.set_minute(match, 45)

        assert match.is_clock_running
        with patch(
            "src.matches.models.timezone.now",
            return_value=t1 + timedelta(minutes=2),
        ):
            assert match.current_minute == 47
