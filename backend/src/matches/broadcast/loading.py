"""Resolve the configured :class:`Broadcaster` from settings.

Mirrors how Django loads its own pluggable backends (cache/email/storage): a
dotted path in a setting, instantiated once and cached. ``override_settings``
(and the pytest-django ``settings`` fixture) clears the cache via the
``setting_changed`` signal, so tests can swap implementations freely.
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.signals import setting_changed
from django.dispatch import receiver
from django.utils.module_loading import import_string

if TYPE_CHECKING:
    from src.matches.broadcast.base import Broadcaster

DEFAULT_BACKEND = "src.matches.broadcast.clients.noop.NoOpBroadcaster"


@lru_cache(maxsize=1)
def get_broadcaster() -> Broadcaster:
    """Return the process-wide broadcaster singleton.

    The backend dotted path comes from ``BROADCAST_BACKEND`` (defaults to the
    no-op); per-backend configuration comes from the ``BROADCAST_OPTIONS`` dict.
    """
    dotted_path = getattr(settings, "BROADCAST_BACKEND", DEFAULT_BACKEND)
    options = getattr(settings, "BROADCAST_OPTIONS", {})
    broadcaster_class = import_string(dotted_path)
    return broadcaster_class(**options)


@receiver(setting_changed)
def _reset_broadcaster(*, setting, **kwargs) -> None:
    """Drop the cached singleton when broadcast settings change."""
    if setting in {"BROADCAST_BACKEND", "BROADCAST_OPTIONS"}:
        get_broadcaster.cache_clear()
