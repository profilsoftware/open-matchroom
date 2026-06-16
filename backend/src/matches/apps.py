from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class MatchesConfig(AppConfig):
    name = "src.matches"
    verbose_name = _("Matches")
