from __future__ import annotations

import pytest
from django.test import override_settings

from src.matches.broadcast.tests.recording import RecordingBroadcaster

RECORDING_BACKEND = "src.matches.broadcast.tests.recording.RecordingBroadcaster"


@pytest.fixture
def recording_broadcaster():
    """Swap the broadcaster for one that records publishes, cleared each test.

    ``override_settings`` flips ``BROADCAST_BACKEND``; the ``setting_changed``
    receiver in ``loading`` clears the cached singleton so the next
    ``get_broadcaster()`` returns the recorder.
    """
    RecordingBroadcaster.reset()
    with override_settings(BROADCAST_BACKEND=RECORDING_BACKEND, BROADCAST_OPTIONS={}):
        yield RecordingBroadcaster
    RecordingBroadcaster.reset()
