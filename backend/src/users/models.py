from django.contrib.auth.models import AbstractUser
from django.db.models import CharField
from django.db.models import EmailField
from django.utils.translation import gettext_lazy as _

from src.shared.django.models import PublicIdModel

from .managers import UserManager


class User(AbstractUser, PublicIdModel):
    PID_PREFIX = "us"

    name = CharField(_("Name of User"), blank=True, max_length=255)
    email = EmailField(_("email address"), unique=True)

    first_name = None
    last_name = None
    username = None

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()
