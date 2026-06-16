"""Idempotent demo seed: four LaLiga clubs, squads, fixtures and timelines.

Loads four real LaLiga 2025/26 clubs (Real Madrid, FC Barcelona, Atlético de
Madrid and Athletic Club), each a squad of 11 starters + 6 subs in pitch order,
and four LaLiga fixtures — one live, one finished, two scheduled — with lineups,
per-team statistics and event timelines. Squads and shirt numbers follow each
club's published 2025/26 list; the fixtures and timelines are illustrative.

Goal/penalty events run through ``services.events.create_event`` so the stored
score is bumped exactly as it would be from the admin live console: fixtures are
created 0-0 and the goals add up to the intended final score.

Re-running is safe. Clubs and players are upserted on a natural key
(``abbreviation`` / ``(team, number)``); each match is upserted on
``(home, away, round)`` and its child rows (events, stats, lineup) are rebuilt
from scratch, with the score reset to 0 before the goals replay.

Run via ``make seed`` (``manage.py seed_demo``).
"""

from datetime import datetime
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from src.matches.models import Event
from src.matches.models import Match
from src.matches.services import events as events_service
from src.matches.services import lineup as lineup_service
from src.matches.services import stats as stats_service
from src.teams.models import Player
from src.teams.models import Team

# ---- demo tokens -> model enums (the source data uses lowercase tokens) ------
STATUS_MAP = {
    "scheduled": Match.Status.SCHEDULED,
    "live": Match.Status.LIVE,
    "finished": Match.Status.FINISHED,
}
SIDE_MAP = {"home": Event.Side.HOME, "away": Event.Side.AWAY}
EVENT_TYPE_MAP = {
    "goal": Event.Type.GOAL,
    "penalty": Event.Type.PENALTY,
    "yellow": Event.Type.YELLOW,
    "red": Event.Type.RED,
    "sub": Event.Type.SUB,
    "chance": Event.Type.CHANCE,
    "corner": Event.Type.CORNER,
    "foul": Event.Type.FOUL,
    "var": Event.Type.VAR,
    "whistle": Event.Type.WHISTLE,
}

# ---- clubs + squads (squad listed in pitch order: 11 starters, then 6 subs) -
# Shirt numbers follow each club's published 2025/26 LaLiga list.
DEMO_TEAMS = [
    {
        "abbr": "RMA",
        "name": "Real Madrid CF",
        "short": "Real Madrid",
        "city": "Madrid",
        "color": "#00529f",
        # 4-3-3
        "squad": [
            (1, "Courtois", "GK"),
            (12, "Alexander-Arnold", "DF"),
            (24, "Huijsen", "DF"),
            (22, "Rüdiger", "DF"),
            (18, "Carreras", "DF"),
            (8, "Valverde", "MF"),
            (6, "Camavinga", "MF"),
            (5, "Bellingham", "MF"),
            (11, "Rodrygo", "FW"),
            (10, "Mbappé", "FW"),
            (7, "Vinícius Jr.", "FW"),
            (13, "Lunin", "GK"),
            (2, "Carvajal", "DF"),
            (23, "Mendy", "DF"),
            (14, "Tchouaméni", "MF"),
            (15, "Arda Güler", "MF"),
            (16, "Gonzalo García", "FW"),
        ],
    },
    {
        "abbr": "BAR",
        "name": "FC Barcelona",
        "short": "Barcelona",
        "city": "Barcelona",
        "color": "#a50044",
        # 4-3-3
        "squad": [
            (13, "Joan García", "GK"),
            (23, "Koundé", "DF"),
            (5, "Cubarsí", "DF"),
            (4, "Araújo", "DF"),
            (3, "Balde", "DF"),
            (21, "De Jong", "MF"),
            (8, "Pedri", "MF"),
            (16, "Fermín López", "MF"),
            (11, "Raphinha", "FW"),
            (9, "Lewandowski", "FW"),
            (10, "Lamine Yamal", "FW"),
            (1, "Ter Stegen", "GK"),
            (15, "Christensen", "DF"),
            (24, "Eric García", "DF"),
            (6, "Gavi", "MF"),
            (20, "Dani Olmo", "MF"),
            (14, "Rashford", "FW"),
        ],
    },
    {
        "abbr": "ATM",
        "name": "Atlético de Madrid",
        "short": "Atlético",
        "city": "Madrid",
        "color": "#cb3524",
        # 4-4-2
        "squad": [
            (13, "Oblak", "GK"),
            (16, "Molina", "DF"),
            (24, "Le Normand", "DF"),
            (2, "Giménez", "DF"),
            (17, "Hancko", "DF"),
            (20, "Giuliano Simeone", "FW"),
            (5, "Cardoso", "MF"),
            (8, "Barrios", "MF"),
            (10, "Baena", "MF"),
            (19, "Julián Álvarez", "FW"),
            (7, "Griezmann", "FW"),
            (1, "Musso", "GK"),
            (15, "Lenglet", "DF"),
            (14, "Llorente", "MF"),
            (6, "Koke", "MF"),
            (11, "Almada", "MF"),
            (9, "Sørloth", "FW"),
        ],
    },
    {
        "abbr": "ATH",
        "name": "Athletic Club",
        "short": "Athletic",
        "city": "Bilbao",
        "color": "#ee2523",
        # 4-2-3-1
        "squad": [
            (1, "Unai Simón", "GK"),
            (2, "Gorosabel", "DF"),
            (3, "Vivian", "DF"),
            (14, "Laporte", "DF"),
            (17, "Yuri Berchiche", "DF"),
            (16, "Ruiz de Galarreta", "MF"),
            (18, "Jauregizar", "MF"),
            (7, "Berenguer", "FW"),
            (8, "Sancet", "MF"),
            (10, "Nico Williams", "FW"),
            (9, "Iñaki Williams", "FW"),
            (27, "Padilla", "GK"),
            (4, "Paredes", "DF"),
            (20, "Unai Gómez", "MF"),
            (6, "Vesga", "MF"),
            (11, "Guruzeta", "FW"),
            (21, "Sannadi", "FW"),
        ],
    },
]

# ---- fixtures (stats arrays are [home, away]; possession is the home %) ------
DEMO_MATCHES = [
    {
        "home": "RMA",
        "away": "ATM",
        "competition": "LaLiga EA Sports",
        "round": "Matchday 37",
        "venue": "Santiago Bernabéu",
        "date": "2026-06-15",
        "time": "20:00",
        "status": "live",
        "minute": 67,
        "formations": {"home": "4-3-3", "away": "4-4-2"},
        "stats": {
            "possession": 56,
            "shots": [13, 9],
            "shotsOnTarget": [6, 4],
            "corners": [5, 4],
            "fouls": [9, 12],
            "yellow": [0, 2],
            "red": [0, 0],
            "offsides": [2, 1],
        },
        "events": [
            {
                "minute": 4,
                "type": "corner",
                "team": "home",
                "text": "Early corner for Real Madrid after a deflected cross.",
            },
            {
                "minute": 12,
                "type": "goal",
                "team": "home",
                "player": "Mbappé",
                "assist": "Vinícius Jr.",
                "text": "GOAL! Mbappé sweeps in Vinícius Jr.'s low cutback.",
            },
            {
                "minute": 23,
                "type": "yellow",
                "team": "away",
                "player": "Barrios",
                "text": "Booked for a tactical foul to stop the counter.",
            },
            {
                "minute": 34,
                "type": "goal",
                "team": "away",
                "player": "Julián Álvarez",
                "assist": "Griezmann",
                "text": "GOAL! Julián Álvarez levels it from Griezmann's pass.",
            },
            {
                "minute": 45,
                "type": "whistle",
                "text": "Half-time — Real Madrid 1, Atlético de Madrid 1.",
            },
            {
                "minute": 52,
                "type": "chance",
                "team": "home",
                "player": "Bellingham",
                "text": "Bellingham's header from a corner clips the top of the bar.",
            },
            {
                "minute": 58,
                "type": "sub",
                "team": "away",
                "player": "Sørloth",
                "playerOut": "Griezmann",
                "text": "Atlético freshen the attack up front.",
            },
            {
                "minute": 63,
                "type": "goal",
                "team": "home",
                "player": "Bellingham",
                "assist": "Valverde",
                "text": "GOAL! Bellingham arrives late to head in Valverde's cross.",
            },
            {
                "minute": 66,
                "type": "yellow",
                "team": "away",
                "player": "Le Normand",
                "text": "Booked for hauling down the runner.",
            },
        ],
    },
    {
        "home": "BAR",
        "away": "ATH",
        "competition": "LaLiga EA Sports",
        "round": "Matchday 37",
        "venue": "Spotify Camp Nou",
        "date": "2026-06-13",
        "time": "21:00",
        "status": "finished",
        "minute": 90,
        "formations": {"home": "4-3-3", "away": "4-2-3-1"},
        "stats": {
            "possession": 61,
            "shots": [16, 8],
            "shotsOnTarget": [8, 3],
            "corners": [7, 2],
            "fouls": [10, 13],
            "yellow": [1, 1],
            "red": [0, 0],
            "offsides": [2, 3],
        },
        "events": [
            {
                "minute": 8,
                "type": "goal",
                "team": "home",
                "player": "Lewandowski",
                "assist": "Lamine Yamal",
                "text": "GOAL! Lewandowski tucks away Lamine Yamal's clipped pass.",
            },
            {
                "minute": 22,
                "type": "goal",
                "team": "away",
                "player": "Iñaki Williams",
                "assist": "Nico Williams",
                "text": "GOAL! Iñaki Williams finishes his brother's cross.",
            },
            {
                "minute": 31,
                "type": "yellow",
                "team": "away",
                "player": "Vivian",
                "text": "Booked for a foul just outside the box.",
            },
            {
                "minute": 40,
                "type": "goal",
                "team": "home",
                "player": "Raphinha",
                "assist": "Pedri",
                "text": "GOAL! Raphinha curls in Pedri's lay-off from the edge.",
            },
            {
                "minute": 45,
                "type": "whistle",
                "text": "Half-time — Barcelona 2, Athletic Club 1.",
            },
            {
                "minute": 57,
                "type": "yellow",
                "team": "home",
                "player": "De Jong",
                "text": "Booked for a cynical trip in midfield.",
            },
            {
                "minute": 64,
                "type": "sub",
                "team": "away",
                "player": "Guruzeta",
                "playerOut": "Berenguer",
                "text": "Athletic send on Guruzeta to chase the game.",
            },
            {
                "minute": 78,
                "type": "goal",
                "team": "home",
                "player": "Lamine Yamal",
                "assist": "Lewandowski",
                "text": "GOAL! Lamine Yamal seals it with a low drive into the corner.",
            },
            {
                "minute": 90,
                "type": "whistle",
                "text": "Full-time — Barcelona 3, Athletic Club 1.",
            },
        ],
    },
    {
        "home": "ATM",
        "away": "BAR",
        "competition": "LaLiga EA Sports",
        "round": "Matchday 38",
        "venue": "Riyadh Air Metropolitano",
        "date": "2026-06-20",
        "time": "19:00",
        "status": "scheduled",
        "minute": 0,
        "formations": {"home": "4-4-2", "away": "4-3-3"},
        "stats": {
            "possession": 50,
            "shots": [0, 0],
            "shotsOnTarget": [0, 0],
            "corners": [0, 0],
            "fouls": [0, 0],
            "yellow": [0, 0],
            "red": [0, 0],
            "offsides": [0, 0],
        },
        "events": [],
    },
    {
        "home": "ATH",
        "away": "RMA",
        "competition": "LaLiga EA Sports",
        "round": "Matchday 38",
        "venue": "San Mamés",
        "date": "2026-06-21",
        "time": "21:00",
        "status": "scheduled",
        "minute": 0,
        "formations": {"home": "4-2-3-1", "away": "4-3-3"},
        "stats": {
            "possession": 50,
            "shots": [0, 0],
            "shotsOnTarget": [0, 0],
            "corners": [0, 0],
            "fouls": [0, 0],
            "yellow": [0, 0],
            "red": [0, 0],
            "offsides": [0, 0],
        },
        "events": [],
    },
]


def _kickoff(date_str: str, time_str: str):
    """Combine the demo date + time into a timezone-aware datetime."""
    naive = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")  # noqa: DTZ007
    return timezone.make_aware(naive)


# Real club crests bundled alongside this command (see seed_logos/README.md).
LOGO_DIR = Path(__file__).resolve().parent / "seed_logos"


class Command(BaseCommand):
    help = "Load the white-label demo data (4 clubs, 4 fixtures). Idempotent."

    @transaction.atomic
    def handle(self, *args, **options):
        teams = self._seed_teams()
        self._seed_matches(teams)
        self.stdout.write(self.style.SUCCESS("Demo data ready."))

    def _seed_teams(self) -> dict:
        """Upsert clubs + squads, returning ``{abbr: {team, squad-in-order}}``."""
        result = {}
        for data in DEMO_TEAMS:
            team, created = Team.objects.update_or_create(
                abbreviation=data["abbr"],
                defaults={
                    "name": data["name"],
                    "short_name": data["short"],
                    "city": data["city"],
                    "color": data["color"],
                },
            )
            self._set_logo(team, data["abbr"])
            squad = [
                Player.objects.update_or_create(
                    team=team,
                    number=number,
                    defaults={"name": name, "position": position},
                )[0]
                for number, name, position in data["squad"]
            ]
            result[data["abbr"]] = {"team": team, "squad": squad}
            verb = "Created" if created else "Updated"
            self.stdout.write(f"{verb} {team.name} ({len(squad)} players).")
        return result

    def _set_logo(self, team, abbr: str) -> None:
        """Attach the bundled club crest (``seed_logos/<abbr>.png``), if present.

        Re-seeding is idempotent: the media file is deleted then rewritten at the
        same ``teams/logos/<abbr>.png`` so re-runs don't pile up suffixed copies.
        A missing crest is skipped — the frontend ``Emblem`` shows the initials
        placeholder instead.
        """
        source = LOGO_DIR / f"{abbr.lower()}.png"
        if not source.exists():
            return
        name = f"{abbr.lower()}.png"
        path = f"teams/logos/{name}"
        if team.logo.storage.exists(path):
            team.logo.storage.delete(path)
        team.logo.save(name, ContentFile(source.read_bytes()), save=True)

    def _seed_matches(self, teams: dict) -> None:
        for data in DEMO_MATCHES:
            home, away = teams[data["home"]], teams[data["away"]]
            match, created = Match.objects.update_or_create(
                home_team=home["team"],
                away_team=away["team"],
                round=data["round"],
                defaults={
                    "competition": data["competition"],
                    "venue": data["venue"],
                    "kickoff_at": _kickoff(data["date"], data["time"]),
                    "status": STATUS_MAP[data["status"]],
                    "minute": data["minute"],
                    # Start 0-0; goal events replay the score back up.
                    "home_score": 0,
                    "away_score": 0,
                    "home_formation": data["formations"]["home"],
                    "away_formation": data["formations"]["away"],
                },
            )
            # Rebuild child rows so a re-seed lands on the same final state.
            match.events.all().delete()
            self._seed_lineups(match, home, away, data["formations"])
            self._seed_stats(match, home["team"], away["team"], data["stats"])
            self._seed_events(match, home, away, data["events"])

            verb = "Created" if created else "Updated"
            self.stdout.write(
                f"{verb} {match} — {match.home_score}-{match.away_score} "
                f"({match.get_status_display()}).",
            )

    def _seed_lineups(self, match, home, away, formations) -> None:
        for side, club, formation in (
            (Event.Side.HOME, home, formations["home"]),
            (Event.Side.AWAY, away, formations["away"]),
        ):
            squad = club["squad"]
            starters = [p.pid for p in squad[:11]]
            subs = [p.pid for p in squad[11:]]
            lineup_service.set_lineup(match, side, formation, starters, subs)

    def _seed_stats(self, match, home_team, away_team, s) -> None:
        for team, idx, possession in (
            (home_team, 0, s["possession"]),
            (away_team, 1, 100 - s["possession"]),
        ):
            stats_service.upsert_team_stats(
                match,
                team,
                possession=possession,
                total_shots=s["shots"][idx],
                shots_on_target=s["shotsOnTarget"][idx],
                corners=s["corners"][idx],
                fouls=s["fouls"][idx],
                offsides=s["offsides"][idx],
                yellow_cards=s["yellow"][idx],
                red_cards=s["red"][idx],
            )

    def _seed_events(self, match, home, away, raw_events) -> None:
        squad_by_name = {
            Event.Side.HOME: {p.name: p for p in home["squad"]},
            Event.Side.AWAY: {p.name: p for p in away["squad"]},
        }
        # Created in listed (ascending-minute) order so goals bump the score
        # in sequence; `is_major` is left to the service's type-based default.
        for ev in raw_events:
            side = SIDE_MAP.get(ev.get("team"))
            squad = squad_by_name.get(side, {})
            data = {
                "type": EVENT_TYPE_MAP[ev["type"]],
                "minute": ev["minute"],
                "text": ev.get("text", ""),
            }
            if side:
                data["side"] = side
            if ev.get("player"):
                data["primary_player"] = squad[ev["player"]]
            secondary = ev.get("assist") or ev.get("playerOut")
            if secondary:
                data["secondary_player"] = squad[secondary]
            events_service.create_event(match, **data)
