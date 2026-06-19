from __future__ import annotations

import logging

import pytest
from django.test import override_settings

from src.matches.broadcast import broadcast
from src.matches.broadcast import match_channel
from src.matches.broadcast.base import Broadcaster
from src.matches.broadcast.messages import BroadcastEventType
from src.matches.tests.factories import MatchFactory

pytestmark = pytest.mark.django_db

_RAISING_BACKEND = "src.matches.broadcast.tests.test_messages.RaisingBroadcaster"


class RaisingBroadcaster(Broadcaster):
    def publish(self, channel, events):
        msg = "boom"
        raise RuntimeError(msg)


def test_match_channel_uses_pid():
    match = MatchFactory()
    assert match_channel(match) == f"matches/{match.pid}"


def test_default_event_type_is_match_update(
    recording_broadcaster,
    django_capture_on_commit_callbacks,
):
    match = MatchFactory()
    with django_capture_on_commit_callbacks(execute=True):
        broadcast(match)

    (channel, events) = recording_broadcaster.published[0]
    assert channel == f"matches/{match.pid}"
    assert len(events) == 1
    assert events[0].type == BroadcastEventType.MATCH_UPDATE


def test_caller_event_type_passes_through(
    recording_broadcaster,
    django_capture_on_commit_callbacks,
):
    match = MatchFactory()
    with django_capture_on_commit_callbacks(execute=True):
        broadcast(match, BroadcastEventType.MATCH_FINISHED)

    _channel, events = recording_broadcaster.published[0]
    assert events[0].type == "MATCH_FINISHED"


def test_arbitrary_string_event_type_is_accepted(
    recording_broadcaster,
    django_capture_on_commit_callbacks,
):
    match = MatchFactory()
    with django_capture_on_commit_callbacks(execute=True):
        broadcast(match, "CUSTOM_THING")

    _channel, events = recording_broadcaster.published[0]
    assert events[0].type == "CUSTOM_THING"


def test_payload_is_camelcased_full_snapshot(
    recording_broadcaster,
    django_capture_on_commit_callbacks,
):
    match = MatchFactory()
    with django_capture_on_commit_callbacks(execute=True):
        broadcast(match)

    _channel, events = recording_broadcaster.published[0]
    data = events[0].data
    assert "homeTeam" in data
    assert "home_team" not in data
    assert data["pid"] == match.pid


def test_broadcast_isolates_a_failing_client(
    caplog,
    django_capture_on_commit_callbacks,
):
    match = MatchFactory()
    with (
        override_settings(BROADCAST_BACKEND=_RAISING_BACKEND),
        caplog.at_level(logging.ERROR, logger="matchroom.broadcast"),
        django_capture_on_commit_callbacks(execute=True),
    ):
        broadcast(match)  # must not raise

    assert any("broadcast failed" in record.message for record in caplog.records)
