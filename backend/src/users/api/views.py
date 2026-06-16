from dj_rest_auth.jwt_auth import set_jwt_access_cookie
from dj_rest_auth.jwt_auth import set_jwt_refresh_cookie
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.views import TokenRefreshView

from src.users.models import User

from .serializers import UserSerializer


class RefreshViewWithCookieSupport(TokenRefreshView):
    """Refresh access/refresh tokens and re-set them as httpOnly cookies."""

    permission_classes = [AllowAny]

    def finalize_response(self, request, response, *args, **kwargs):
        if response.status_code == status.HTTP_200_OK:
            if "access" in response.data:
                set_jwt_access_cookie(response, response.data["access"])
            if "refresh" in response.data:
                set_jwt_refresh_cookie(response, response.data["refresh"])
                # Refresh token lives in the httpOnly cookie only, never the body.
                response.data.pop("refresh")
        return super().finalize_response(request, response, *args, **kwargs)


class UserViewSet(GenericViewSet):
    """Exposes the authenticated user only — no public user listing."""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = "pid"

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
