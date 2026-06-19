# Real-time broadcasting

A small, **pluggable, transport-agnostic** layer for pushing live match updates to subscribers.

It ships as a **no-op by default** — the project runs with zero config and broadcasts nothing. To go
live, drop in a client that talks to your transport of choice (AWS AppSync, Pusher, a WebSocket
gateway, Redis pub-sub, …) and point one setting at it. Nothing vendor-specific is baked into the
repo; that is the whole point of this package being a "hollow shell".

## How it fits together

```
match service write ──► broadcast(match, event_type)   ◄── the one domain entry point
                              │  (serializes the full match, defers to on_commit)
                              ▼
                        get_broadcaster()               ◄── resolves BROADCAST_BACKEND
                              │
                              ▼
                     Broadcaster.publish(channel, events)   ◄── the one interface
                              │
                   ┌──────────┴───────────┐
              NoOpBroadcaster       YourClient (AppSync / Pusher / WS / …)
```

- `base.py` — the **interface**: `Broadcaster` (ABC) + the `BroadcastEvent` envelope.
- `loading.py` — `get_broadcaster()`, which resolves and caches the configured client.
- `messages.py` — the **one domain function** `broadcast()` and the `BroadcastEventType` enum.
- `clients/` — **where implementations live.** Only `NoOpBroadcaster` ships; add yours here.

## The interface

A client implements exactly one method:

```python
class Broadcaster(ABC):
    def __init__(self, **options) -> None:        # options come from BROADCAST_OPTIONS
        self.options = options

    @abstractmethod
    def publish(self, channel: str, events: list[BroadcastEvent]) -> None: ...
```

- **`channel`** — a vendor-neutral string. For a match it is `matches/{pid}` (see `match_channel()`).
  Map it onto whatever your transport calls a channel/topic/room inside `publish`.
- **`events`** — a list of `BroadcastEvent(type: str, data: dict)`. `data` is already camelCased and
  JSON-serializable. Batching, signing, retries and serialization-to-bytes are **your client's job** —
  they must not leak into the interface.

## The domain entry point

Domain code never touches a client directly — it calls one function:

```python
from src.matches.broadcast import broadcast, BroadcastEventType

broadcast(match)                                  # generic MATCH_UPDATE snapshot
broadcast(match, BroadcastEventType.MATCH_STARTED)  # labelled snapshot
```

Every call publishes the **full current match snapshot** (the same payload the matchroom `retrieve`
endpoint returns). There is **no diffing** — each write re-sends the whole state and subscribers
replace what they hold. The `event_type` is just a label on the envelope so clients can route or
animate (e.g. play a goal animation on `MATCH_EVENT_ADDED`).

Guarantees:

- **Best-effort.** A failing client is caught and logged (`matchroom.broadcast`); a broadcast never
  breaks the request that triggered it.
- **After commit.** The publish is deferred with `transaction.on_commit`, so it reflects committed
  state and never fires on a rolled-back write.

## Writing a custom client

1. Add a file under `clients/` whose class subclasses `Broadcaster`.
2. Read configuration from `self.options` (populated from `BROADCAST_OPTIONS`).
3. Implement `publish`.
4. Point `BROADCAST_BACKEND` at it.

### Example — Pusher (sketch)

```python
# src/matches/broadcast/clients/pusher.py
import pusher
from src.matches.broadcast.base import Broadcaster

class PusherBroadcaster(Broadcaster):
    def __init__(self, **options):
        super().__init__(**options)
        self._client = pusher.Pusher(**options)   # app_id, key, secret, cluster

    def publish(self, channel, events):
        for event in events:                      # batching/transport is the client's concern
            self._client.trigger(channel, event.type, event.data)
```

### Example — AWS AppSync (sketch)

```python
# src/matches/broadcast/clients/appsync.py
from src.matches.broadcast.base import Broadcaster

class AppSyncBroadcaster(Broadcaster):
    def __init__(self, **options):
        super().__init__(**options)               # api_url, region, namespace
        # build a signed HTTP/boto session here

    def publish(self, channel, events):
        # SigV4-sign, batch (AppSync caps ~5/req) and POST — all internal here
        ...
```

## Registering it

Configuration is env-driven (django-environ), like the rest of the project:

```bash
# .env
BROADCAST_BACKEND=src.matches.broadcast.clients.pusher.PusherBroadcaster
BROADCAST_OPTIONS={"app_id": "123", "key": "…", "secret": "…", "cluster": "eu"}
```

`BROADCAST_OPTIONS` is parsed as JSON and passed to the client's `__init__` as keyword arguments.
The default (`NoOpBroadcaster`) needs no options.

## Event catalog

Every event carries the **full `MatchroomSerializer` snapshot** as `data` (camelCase): teams,
scores, status, minute, formations, lineup, stats, scorers and the events timeline. Only the
envelope `type` differs:

| `type`               | Emitted when                          |
| -------------------- | ------------------------------------- |
| `MATCH_UPDATE`       | generic / manual clock correction (default) |
| `MATCH_STARTED`      | the clock starts or resumes           |
| `MATCH_PAUSED`       | the clock pauses (e.g. half-time)     |
| `MATCH_FINISHED`     | the match ends                        |
| `MATCH_EVENT_ADDED`  | a timeline event is created (incl. goals) |
| `MATCH_EVENT_REMOVED`| a timeline event is deleted           |
| `LINEUP_UPDATED`     | a side's lineup is set                |
| `TEAM_STATS_UPDATED` | a team's stats are upserted           |

The values come from the `BroadcastEventType` `StrEnum`. Any plain string is also accepted, so a
custom caller can define its own labels.
