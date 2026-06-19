"""Each match-service write fires exactly one broadcast with the right type.

Broadcasts are deferred to ``transaction.on_commit``, so every call is wrapped in
``django_capture_on_commit_callbacks(execute=True)`` to flush them under the test
transaction.
"""

from __future__ import annotations

import pytest

from src.matches.models import Event
from src.matches.models import Match
from src.matches.services import clock
from src.matches.services import events as events_service
from src.matches.services import lineup
from src.matches.services import stats
from src.matches.tests.factories import EventFactory
from src.matches.tests.factories import MatchFactory
from src.teams.tests.factories import PlayerFactory

pytestmark = pytest.mark.django_db


def _published_types(recorder):
    return [event.type for _channel, events in recorder.published for event in events]


def _only_event(recorder):
    (_channel, events) = recorder.published[0]
    assert len(recorder.published) == 1
    assert len(events) == 1
    return events[0]


class TestClockWiring:
    def test_start_broadcasts_match_started(
        self,
        recording_broadcaster,
        django_capture_on_commit_callbacks,
    ):
        match = MatchFactory()
        with django_capture_on_commit_callbacks(execute=True):
            clock.start(match)
        assert _published_types(recording_broadcaster) == ["MATCH_STARTED"]

    def test_pause_broadcasts_match_paused(
        self,
        recording_broadcaster,
        django_capture_on_commit_callbacks,
    ):
        match = MatchFactory(status=Match.Status.LIVE)
        with django_capture_on_commit_callbacks(execute=True):
            clock.pause(match)
        assert _published_types(recording_broadcaster) == ["MATCH_PAUSED"]

    def test_finish_broadcasts_match_finished(
        self,
        recording_broadcaster,
        django_capture_on_commit_callbacks,
    ):
        match = MatchFactory(status=Match.Status.LIVE)
        with django_capture_on_commit_callbacks(execute=True):
            clock.finish(match)
        assert _published_types(recording_broadcaster) == ["MATCH_FINISHED"]

    def test_set_minute_broadcasts_generic_update(
        self,
        recording_broadcaster,
        django_capture_on_commit_callbacks,
    ):
        match = MatchFactory()
        with django_capture_on_commit_callbacks(execute=True):
            clock.set_minute(match, 45)
        assert _published_types(recording_broadcaster) == ["MATCH_UPDATE"]


class TestEventWiring:
    def test_create_goal_broadcasts_event_added_with_bumped_score(
        self,
        recording_broadcaster,
        django_capture_on_commit_callbacks,
    ):
        match = MatchFactory()
        with django_capture_on_commit_callbacks(execute=True):
            events_service.create_event(
                match,
                type=Event.Type.GOAL,
                side=Event.Side.HOME,
                minute=10,
            )
        event = _only_event(recording_broadcaster)
        assert event.type == "MATCH_EVENT_ADDED"
        assert event.data["homeScore"] == 1

    def test_delete_event_broadcasts_event_removed(
        self,
        recording_broadcaster,
        django_capture_on_commit_callbacks,
    ):
        match = MatchFactory()
        event = EventFactory(match=match, type=Event.Type.YELLOW, side=Event.Side.HOME)
        with django_capture_on_commit_callbacks(execute=True):
            events_service.delete_event(event)
        assert _published_types(recording_broadcaster) == ["MATCH_EVENT_REMOVED"]


class TestLineupWiring:
    def test_set_lineup_broadcasts_lineup_updated(
        self,
        recording_broadcaster,
        django_capture_on_commit_callbacks,
    ):
        match = MatchFactory()
        player = PlayerFactory(team=match.home_team)
        with django_capture_on_commit_callbacks(execute=True):
            lineup.set_lineup(
                match,
                side=Event.Side.HOME,
                formation="4-3-3",
                starter_ids=[player.pid],
                sub_ids=[],
            )
        assert _published_types(recording_broadcaster) == ["LINEUP_UPDATED"]


class TestStatsWiring:
    def test_upsert_team_stats_broadcasts_stats_updated(
        self,
        recording_broadcaster,
        django_capture_on_commit_callbacks,
    ):
        match = MatchFactory()
        with django_capture_on_commit_callbacks(execute=True):
            stats.upsert_team_stats(match, match.home_team, possession=55)
        assert _published_types(recording_broadcaster) == ["TEAM_STATS_UPDATED"]
