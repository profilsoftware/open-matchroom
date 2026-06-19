# OpenMatchroom — one-command dev entrypoint.
# `make up` brings up Postgres + backend + frontend; `make seed` loads demo data.

.DEFAULT_GOAL := help
COMPOSE := docker compose

.PHONY: help up down prune logs seed test coverage manage migrate makemigrations shell build

help: ## Show this help.
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

up: ## Build + start postgres, backend, frontend (backend runs migrate -> createadmin -> runserver).
	$(COMPOSE) up --build

down: ## Stop and remove containers.
	$(COMPOSE) down

prune: ## Stop containers AND delete their volumes (full DB reset).
	$(COMPOSE) down -v

logs: ## Follow container logs.
	$(COMPOSE) logs -f

seed: ## Load the demo data (4 clubs + fixtures). Run after `make up`.
	$(COMPOSE) run --rm backend python manage.py seed_demo

test: ## Run the backend test suite (pytest).
	$(COMPOSE) run --rm backend pytest

coverage: ## Run the backend tests with coverage (terminal report + coverage.xml).
	$(COMPOSE) run --rm backend sh -c "coverage run -m pytest && coverage report && coverage xml"

manage: ## Run any manage.py command, e.g. `make manage ARGS="showmigrations"`.
	$(COMPOSE) run --rm backend python manage.py $(ARGS)

migrate: ## Apply database migrations.
	$(COMPOSE) run --rm backend python manage.py migrate

makemigrations: ## Generate new migrations.
	$(COMPOSE) run --rm backend python manage.py makemigrations

shell: ## Open a shell in the backend container.
	$(COMPOSE) exec backend bash

build: ## Build images without starting.
	$(COMPOSE) build
