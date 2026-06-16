# Optional `just` mirror of the Makefile. The default compose file
# (docker-compose.yml at the repo root) needs no COMPOSE_FILE override.

## Just does not yet manage signals for subprocesses reliably, which can lead to unexpected behavior.
## Exercise caution before expanding its usage in production environments.
## For more information, see https://github.com/casey/just/issues/2473 .


# Default command to list all available commands.
default:
    @just --list

# build: Build images.
build *args:
    @docker compose build {{args}}

# up: Build + start postgres, backend, frontend.
up:
    @docker compose up --build

# down: Stop containers.
down:
    @docker compose down

# prune: Remove containers and their volumes.
prune *args:
    @docker compose down -v {{args}}

# logs: View container logs.
logs *args:
    @docker compose logs -f {{args}}

# seed: Load demo data (run after `up`).
seed:
    @docker compose run --rm backend python manage.py seed_demo

# manage: Execute a `manage.py` command.
manage +args:
    @docker compose run --rm backend python ./manage.py {{args}}

# migrate: Apply database migrations.
migrate:
    @docker compose run --rm backend python manage.py migrate

# test: Run tests with pytest.
test *args:
    @docker compose run --rm backend pytest {{args}}
