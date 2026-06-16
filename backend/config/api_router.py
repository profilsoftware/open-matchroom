from dj_rest_auth.views import LoginView
from dj_rest_auth.views import LogoutView
from django.urls import include
from django.urls import path
from rest_framework.routers import DefaultRouter

from src.matches.api.views import MatchEventViewSet
from src.matches.api.views import MatchViewSet
from src.teams.api.views import PlayerViewSet
from src.teams.api.views import TeamViewSet
from src.users.api.views import RefreshViewWithCookieSupport

app_name = "api"

# Cookie JWT auth (email + password). Login/logout come from dj-rest-auth; the
# refresh view re-sets the rotated tokens as httpOnly cookies.
auth_urls = [
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshViewWithCookieSupport.as_view(), name="refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
]

# Events nested under a match — plain DRF URLConf, no drf-nested-routers.
event_urls = [
    path(
        "matches/<match_pid>/events/",
        MatchEventViewSet.as_view({"get": "list", "post": "create"}),
        name="match-events",
    ),
    path(
        "matches/<match_pid>/events/<pid>/",
        MatchEventViewSet.as_view({"get": "retrieve", "delete": "destroy"}),
        name="match-event-detail",
    ),
]

router = DefaultRouter()
router.register("teams", TeamViewSet, basename="team")
router.register("players", PlayerViewSet, basename="player")
router.register("matches", MatchViewSet, basename="match")

urlpatterns = [
    path("auth/", include(auth_urls)),
    path("users/", include("src.users.urls", namespace="users")),
    *event_urls,
    *router.urls,
]
