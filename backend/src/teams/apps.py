from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class TeamsConfig(AppConfig):
    name = "src.teams"
    verbose_name = _("Teams")
