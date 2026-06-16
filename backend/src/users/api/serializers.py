from dj_rest_auth.jwt_auth import (
    CookieTokenRefreshSerializer as DjRestAuthTokenRefreshSerializer,
)
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenBlacklistSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only view of the authenticated user (returned by login + `/me`)."""

    class Meta:
        model = User
        fields = ["pid", "email", "name", "is_staff", "is_superuser", "last_login"]
        read_only_fields = fields


class LoginSerializer(serializers.Serializer):
    """Plain email + password login (no 2FA). Used by dj-rest-auth's LoginView."""

    email = serializers.EmailField()
    password = serializers.CharField(
        style={"input_type": "password"},
        write_only=True,
    )

    default_error_messages = {
        "invalid_credentials": _("Unable to log in with the provided credentials."),
        "inactive_account": _("This account is not active."),
    }

    def validate(self, attrs):
        user = User.objects.filter(email=attrs["email"]).first()

        if not user or not user.check_password(attrs["password"]):
            self.fail("invalid_credentials")

        if not user.is_active:
            self.fail("inactive_account")

        # dj-rest-auth's LoginView reads the authenticated user from here.
        attrs["user"] = user
        return attrs


class CookieTokenBlacklistSerializer(TokenBlacklistSerializer):
    """Blacklist the refresh token taken from the request body or the `rt` cookie."""

    refresh = serializers.CharField(write_only=True, required=False)

    def extract_refresh_token(self):
        request = self.context["request"]

        if request.data.get("refresh"):
            return request.data["refresh"]

        cookie_name = settings.REST_AUTH["JWT_AUTH_REFRESH_COOKIE"]
        if cookie_name and cookie_name in request.COOKIES:
            return request.COOKIES.get(cookie_name)

        raise InvalidToken(_("No valid refresh token found."))

    def validate(self, attrs):
        attrs["refresh"] = self.extract_refresh_token()
        return super().validate(attrs)


class CookieTokenRefreshSerializer(DjRestAuthTokenRefreshSerializer):
    """Refresh from the `rt` cookie, mapping a stale user to a clean auth error."""

    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except User.DoesNotExist as e:
            raise InvalidToken(_("Token is invalid or expired.")) from e
