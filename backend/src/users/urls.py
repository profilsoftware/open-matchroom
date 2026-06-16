from django.urls import include
from django.urls import path
from rest_framework.routers import SimpleRouter

from src.users.api.views import UserViewSet

app_name = "users"

router = SimpleRouter()
router.register("", UserViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
]
