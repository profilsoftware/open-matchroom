# OpenMatchroom — backend

REST API for OpenMatchroom (Django 6 + DRF on PostgreSQL).

[![Built with Cookiecutter Django](https://img.shields.io/badge/built%20with-Cookiecutter%20Django-ff69b4.svg?logo=cookiecutter)](https://github.com/cookiecutter/cookiecutter-django/)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)

License: MIT

> The recommended way to run the whole stack is from the repo root: `make up` (see the
> [root README](../README.md)). The notes below cover working on the backend directly.

## Settings

`config/settings/{base,local,production,test}.py`. The default module is `config.settings.local`
for development and `config.settings.test` for pytest. Lean stack: Postgres + Django, in-memory
cache locally, no Celery.

## Basic commands

### Dependencies

Managed with [uv](https://docs.astral.sh/uv/). Building `psycopg[c]` locally needs `libpq` /
`pg_config`; otherwise run tooling inside the container (`docker compose exec backend ...`).

```bash
uv sync            # install deps into .venv
uv lock            # update the lockfile after editing pyproject.toml
```

### Admin user

```bash
uv run python manage.py createsuperuser
```

(`make up` also creates the default admin automatically once the `createadmin` command lands.)

### Tests & coverage

```bash
uv run pytest
uv run coverage run -m pytest && uv run coverage html
```

### Linting

```bash
pre-commit run -a   # ruff check + format (run from the repo root)
```

## Sentry

Error logging aggregator, configured in `config/settings/production.py`. Set `SENTRY_DSN` in
production.

## Deployment

Production stack: `docker-compose.production.yml` at the repo root (Django + Postgres + Redis +
Traefik + nginx).
