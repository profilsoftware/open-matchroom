from __future__ import annotations

from django.test import override_settings

from src.matches.broadcast import get_broadcaster
from src.matches.broadcast.base import Broadcaster
from src.matches.broadcast.base import BroadcastEvent
from src.matches.broadcast.clients.noop import NoOpBroadcaster

_BACKEND = "src.matches.broadcast.tests.test_loading.OptionsBroadcaster"


class OptionsBroadcaster(Broadcaster):
    """A configurable double; remembers the options it was built with."""

    def publish(self, channel, events):
        return


def test_default_backend_is_noop():
    assert isinstance(get_broadcaster(), NoOpBroadcaster)


def test_override_swaps_singleton_and_reverts():
    with override_settings(BROADCAST_BACKEND=_BACKEND):
        assert isinstance(get_broadcaster(), OptionsBroadcaster)
    # leaving the override clears the cache again → back to the default
    assert isinstance(get_broadcaster(), NoOpBroadcaster)


def test_options_are_forwarded_to_init():
    options = {"token": "abc", "cluster": "eu"}
    with override_settings(BROADCAST_BACKEND=_BACKEND, BROADCAST_OPTIONS=options):
        assert get_broadcaster().options == options


def test_noop_publish_is_a_safe_no_op():
    # Must not raise with an arbitrary channel/events.
    NoOpBroadcaster().publish("matches/mt_x", [BroadcastEvent("MATCH_UPDATE", {})])
