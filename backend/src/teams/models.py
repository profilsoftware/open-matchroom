from django.db import models
from django.utils.translation import gettext_lazy as _

from src.shared.django.models import BaseModel


class Position(models.TextChoices):
    GOALKEEPER = "GK", _("Goalkeeper")
    DEFENDER = "DF", _("Defender")
    MIDFIELDER = "MF", _("Midfielder")
    FORWARD = "FW", _("Forward")


class Team(BaseModel):
    """A football club: branding + squad (via the ``players`` reverse relation)."""

    PID_PREFIX = "tm"

    name = models.CharField(_("name"), max_length=255)
    short_name = models.CharField(_("short name"), max_length=255)
    abbreviation = models.CharField(_("abbreviation"), max_length=8)
    city = models.CharField(_("city"), max_length=255, blank=True)
    color = models.CharField(_("crest colour"), max_length=7, blank=True)
    logo = models.ImageField(
        _("logo"),
        upload_to="teams/logos/",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("team")
        verbose_name_plural = _("teams")
        ordering = ["name"]

    def __str__(self):
        return self.name


class Player(BaseModel):
    """A squad member of exactly one team (a single display name)."""

    PID_PREFIX = "pl"

    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="players",
        verbose_name=_("team"),
    )
    name = models.CharField(_("name"), max_length=255)
    number = models.PositiveSmallIntegerField(_("squad number"), null=True, blank=True)
    position = models.CharField(_("position"), max_length=2, choices=Position.choices)
    photo = models.ImageField(
        _("photo"),
        upload_to="players/photos/",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("player")
        verbose_name_plural = _("players")
        ordering = ["team", "number", "name"]

    def __str__(self):
        return self.name
