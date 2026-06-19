# OpenMatchroom — contributor & agent guide

This is the single guide for anyone — a person or an AI coding agent — working on OpenMatchroom.
It is written so you can extend the project by **describing what you want in plain language** and
letting an AI agent follow the patterns that already exist in the code.

## What OpenMatchroom is

An open-source, **white-label** live football match-center. Two parts:

- a **public site** — a match center (scoreboard + Lineup / Live timeline / Statistics tabs) and a
  fixtures schedule;
- a **gated admin** — manage teams, squads, fixtures, lineups, a live console and statistics.

It ships as two apps that talk over a REST API:

- **`backend/`** — the data + REST API (Django 6 + Django REST Framework on PostgreSQL).
- **`frontend/`** — the website + admin UI (Next.js 16 + React 19 + Tailwind v4).

Everything runs locally with one command (see **Run it**).

## Working AI-driven (how to add or change things)

You do not need to know Django or React to extend OpenMatchroom. The codebase is built from a few
repeating patterns, so the most reliable way to make a change is:

1. **Describe the outcome** you want in plain language — e.g. *"add a `referee` field to a match and
   show it on the match center."*
2. **Point the agent at the closest existing example** and ask it to mirror that shape. Almost every
   kind of change already exists somewhere:
   - a new **data field** → copy an existing field on a model in `backend/src/<app>/models.py`;
   - a new **API endpoint** → copy an existing ViewSet + serializer in `backend/src/<app>/api/`;
   - a new piece of **business logic** → add a function under `backend/src/<app>/services/`;
   - a new **screen or component** → copy a sibling in `frontend/src/app/` or `frontend/src/components/`.
3. **Run it and the tests** (`make up`, `make test`) to confirm nothing broke.

Keep every change consistent with the code around it — same naming, same structure. When in doubt,
find the nearest existing thing and follow it rather than inventing a new style.

## Run it

Requirements: Docker + Docker Compose and `make`.

```bash
make up      # build + start postgres, backend, frontend
make seed    # load demo data (4 clubs + fixtures) — run once the stack is up
```

- Public site: http://localhost:3000
- API docs (Swagger): http://localhost:8000/api/docs/
- Admin sign-in: the demo admin is `admin@club.example` (password from env; a demo default is used locally).

Other targets: `make down`, `make logs`, `make test`, `make coverage`, `make migrate`,
`make makemigrations`, `make shell`. Run `make help` for the full list.

## Repo layout

```
open-matchroom/
├── docker-compose.yml            # local dev: postgres + backend + frontend
├── docker-compose.production.yml
├── Makefile                      # dev entrypoints
├── backend/                      # Django 6 + DRF (uv, Python 3.14)
│   ├── compose/ .envs/ .dockerignore   # Docker build assets (build context = ./backend)
│   ├── config/{settings,urls,api_router}
│   └── src/{users,teams,matches,shared}
└── frontend/                     # Next.js 16 + React 19 + Tailwind v4
```

Docker build assets (`compose/`, `.envs/`, `.dockerignore`) live under `backend/` because the
Dockerfiles build from a `./backend` context. Orchestration files (`docker-compose*.yml`,
`Makefile`, `.pre-commit-config.yaml`) live at the repo root.

## How the backend is organised

Each domain is its own app under `backend/src/<app>/`:

- **`users`** — accounts + cookie-JWT auth.
- **`teams`** — clubs and their squad members (players).
- **`matches`** — fixtures, timeline events, per-team stats, and lineups.
- **`shared`** — reusable bases (e.g. the public-id model).

Within an app:

| File / folder | What goes there |
| --- | --- |
| `models.py` | The data shape. `TextChoices` enums live **inside** the model that uses them (e.g. `Match.Status`, `Event.Type`), unless more than one model shares an enum (then it sits at module level, like `Position`). |
| `api/serializers.py` | How models are turned into / read from JSON. |
| `api/views.py` | Thin ViewSets — they wire URLs to serializers and services; no business logic. |
| `api/filters.py` | Query-string filtering (e.g. `?status=LIVE`). |
| `services/` | All business logic, written as plain functions. Keep logic out of the views. |
| `tests/` | `pytest` + `factory_boy`. Per app: `test_models.py` (the data shape) and `test_api.py` (ViewSets, URL routing, OpenAPI access). Service logic is tested under `tests/services/test_<name>.py`. Factories live in `tests/factories.py`. Run `make coverage` for a report. |

Conventions worth keeping:

- **Public ids.** Every record exposes an opaque `pid` (e.g. `mt_a1B2c3...`) instead of its database
  id, and the API looks records up by `pid`. Defined once in `src/shared/django/models.py`.
- **camelCase on the wire** (`homeTeam`), snake_case in Python (`home_team`) — handled automatically.
- **Translatable text** is wrapped in `_()`.
- **Lean stack:** Postgres + Django, in-memory cache locally. **No Celery / background workers.**
- **Real-time broadcasting.** Match changes are pushed to subscribers through a single, pluggable
  `broadcast()` function — no-op by default, so nothing real-time runs without config. Swap in your
  own transport (AppSync, Pusher, WebSocket…) behind one interface. See
  [`backend/src/matches/broadcast/README.md`](./backend/src/matches/broadcast/README.md).

Settings live in `backend/config/settings/{base,local,production,test}.py`. The default is
`config.settings.local` for development and `config.settings.test` for pytest. Run backend tooling
inside the container (`docker compose run --rm backend ...`) or via `uv` in `backend/`.

## How the frontend is organised

`frontend/src/` holds the Next.js app:

- `app/` — routes (the public site under `(public)`, the admin under `admin/(panel)`).
- `components/` — UI, grouped by area (`layout`, `matchroom`, `admin`, `fixtures`, `ui`).
- `services/` — typed API calls (one file per domain) over a shared cookie-JWT HTTP client.
- `hooks/` — React Query hooks (caching, live polling, admin mutations).
- `lib/`, `types/`, `providers/` — helpers, shared types, and app-wide providers (theme, auth, query, toast).

Theming is **white-label and config-driven**: brand colour, theme, font and density all come from
`NEXT_PUBLIC_*` environment variables at build time — nothing brand-specific is hard-coded.

> ⚠️ The frontend uses **Next.js 16**, whose APIs differ from older versions. Read
> [`frontend/AGENTS.md`](./frontend/AGENTS.md) before writing frontend code.

## Guiding principles

- **The design is the visual source of truth.** Match the intended look, and the data shape it implies.
- **White-label / agnostic.** No club, company or deployment is baked in — branding is configurable.
- **Keep it lean.** Prefer the existing patterns and the existing stack over new dependencies.
