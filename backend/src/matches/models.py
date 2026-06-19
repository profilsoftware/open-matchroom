from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from src.shared.django.models import BaseModel
from src.teams.models import Player
from src.teams.models import Position
from src.teams.models import Team


class Match(BaseModel):
    """A fixture between two clubs: scoreboard, timing, formations, lineup."""

    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", _("Scheduled")
        LIVE = "LIVE", _("Live")
        FINISHED = "FINISHED", _("Finished")

    PID_PREFIX = "mt"

    home_team = models.ForeignKey(
        Team,
        on_delete=models.PROTECT,
        related_name="home_matches",
        verbose_name=_("home team"),
    )
    away_team = models.ForeignKey(
        Team,
        on_delete=models.PROTECT,
        related_name="away_matches",
        verbose_name=_("away team"),
    )
    competition = models.CharField(_("competition"), max_length=255, blank=True)
    round = models.CharField(_("round"), max_length=255, blank=True)
    venue = models.CharField(_("venue"), max_length=255, blank=True)
    kickoff_at = models.DateTimeField(_("kickoff at"), null=True, blank=True)
    status = models.CharField(
        _("status"),
        max_length=10,
        choices=Status.choices,
        default=Status.SCHEDULED,
    )
    # Match clock as a stopwatch: it is *running* iff ``clock_started_at`` is
    # set; ``clock_elapsed_seconds`` accumulates time from previous segments
    # (folded in on every pause). The displayed minute is derived from these —
    # never stored — so a live match advances on its own (see services/clock.py).
    clock_started_at = models.DateTimeField(
        _("clock started at"), null=True, blank=True
    )
    clock_elapsed_seconds = models.PositiveIntegerField(
        _("clock elapsed seconds"), default=0
    )
    home_score = models.PositiveSmallIntegerField(_("home score"), default=0)
    away_score = models.PositiveSmallIntegerField(_("away score"), default=0)
    home_penalty_score = models.PositiveSmallIntegerField(
        _("home penalty score"),
        null=True,
        blank=True,
    )
    away_penalty_score = models.PositiveSmallIntegerField(
        _("away penalty score"),
        null=True,
        blank=True,
    )
    home_formation = models.CharField(
        _("home formation"),
        max_length=10,
        default="4-3-3",
    )
    away_formation = models.CharField(
        _("away formation"),
        max_length=10,
        default="4-3-3",
    )

    class Meta:
        verbose_name = _("match")
        verbose_name_plural = _("matches")
        ordering = ["-kickoff_at"]

    def __str__(self):
        return f"{self.home_team} vs {self.away_team}"

    @property
    def is_clock_running(self) -> bool:
        return self.clock_started_at is not None

    @property
    def elapsed_seconds(self) -> int:
        """Total played seconds, including the segment in progress if running."""
        elapsed = self.clock_elapsed_seconds
        if self.clock_started_at is not None:
            elapsed += (timezone.now() - self.clock_started_at).total_seconds()
        return int(elapsed)

    @property
    def current_minute(self) -> int:
        """The live match minute, derived from the clock (0 when not started)."""
        return self.elapsed_seconds // 60


class Event(BaseModel):
    """A timeline entry (goal, card, sub, ...). Goal/penalty events move the score."""

    class Side(models.TextChoices):
        HOME = "HOME", _("Home")
        AWAY = "AWAY", _("Away")

    class Type(models.TextChoices):
        GOAL = "GOAL", _("Goal")
        PENALTY = "PENALTY", _("Penalty")
        YELLOW = "YELLOW", _("Yellow card")
        RED = "RED", _("Red card")
        SUB = "SUB", _("Substitution")
        CHANCE = "CHANCE", _("Chance")
        CORNER = "CORNER", _("Corner")
        FOUL = "FOUL", _("Foul")
        VAR = "VAR", _("VAR")
        WHISTLE = "WHISTLE", _("Whistle")

    PID_PREFIX = "ev"

    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="events",
        verbose_name=_("match"),
    )
    # null (not "") marks a neutral event with no side, e.g. the whistle.
    side = models.CharField(  # noqa: DJ001
        _("side"),
        max_length=4,
        choices=Side.choices,
        null=True,
        blank=True,
    )
    type = models.CharField(_("type"), max_length=10, choices=Type.choices)
    primary_player = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name=_("primary player"),
    )
    secondary_player = models.ForeignKey(
        Player,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name=_("secondary player"),
    )
    minute = models.PositiveSmallIntegerField(_("minute"), default=0)
    text = models.CharField(_("commentary"), max_length=500, blank=True)
    is_major = models.BooleanField(_("major"), default=False)

    class Meta:
        verbose_name = _("event")
        verbose_name_plural = _("events")
        ordering = ["-minute", "-created"]

    def __str__(self):
        return f"{self.get_type_display()} {self.minute}'"


# Event types that move the scoreboard (+1 on create, -1 on delete).
GOAL_EVENT_TYPES = frozenset({Event.Type.GOAL, Event.Type.PENALTY})
# Event types flagged as highlights by default when `is_major` is not given.
MAJOR_EVENT_TYPES = frozenset(
    {Event.Type.GOAL, Event.Type.PENALTY, Event.Type.RED, Event.Type.WHISTLE},
)


class TeamStatsInMatch(BaseModel):
    """Per-team match statistics — one row per ``(match, team)``."""

    PID_PREFIX = "ts"

    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="team_stats",
        verbose_name=_("match"),
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.PROTECT,
        related_name="+",
        verbose_name=_("team"),
    )
    possession = models.PositiveSmallIntegerField(_("possession %"), default=0)
    total_shots = models.PositiveSmallIntegerField(_("total shots"), default=0)
    shots_on_target = models.PositiveSmallIntegerField(_("shots on target"), default=0)
    corners = models.PositiveSmallIntegerField(_("corners"), default=0)
    fouls = models.PositiveSmallIntegerField(_("fouls"), default=0)
    offsides = models.PositiveSmallIntegerField(_("offsides"), default=0)
    yellow_cards = models.PositiveSmallIntegerField(_("yellow cards"), default=0)
    red_cards = models.PositiveSmallIntegerField(_("red cards"), default=0)

    class Meta:
        verbose_name = _("team stats")
        verbose_name_plural = _("team stats")
        ordering = ["match", "team"]
        constraints = [
            models.UniqueConstraint(
                fields=["match", "team"],
                name="unique_team_stats_per_match",
            ),
        ]

    def __str__(self):
        return f"{self.team} — {self.match}"


class PlayerPositionInMatch(BaseModel):
    """A player's role/slot in a match lineup (starter pitch slot or bench)."""

    class Role(models.TextChoices):
        STARTER = "STARTER", _("Starter")
        SUBSTITUTE = "SUBSTITUTE", _("Substitute")

    PID_PREFIX = "pp"

    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name="player_positions",
        verbose_name=_("match"),
    )
    player = models.ForeignKey(
        Player,
        on_delete=models.PROTECT,
        related_name="+",
        verbose_name=_("player"),
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.PROTECT,
        related_name="+",
        verbose_name=_("team"),
    )
    role = models.CharField(_("role"), max_length=10, choices=Role.choices)
    order = models.PositiveSmallIntegerField(_("order"), default=0)
    position = models.CharField(
        _("position"),
        max_length=2,
        choices=Position.choices,
        blank=True,
    )

    class Meta:
        verbose_name = _("player position")
        verbose_name_plural = _("player positions")
        ordering = ["match", "team", "role", "order"]
        constraints = [
            models.UniqueConstraint(
                fields=["match", "player"],
                name="unique_player_position_per_match",
            ),
        ]

    def __str__(self):
        return f"{self.player} ({self.get_role_display()})"
