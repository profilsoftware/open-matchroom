"""Account-management helpers (used by the `createadmin` command)."""

from django.contrib.auth import get_user_model

User = get_user_model()


def create_admin(email: str, password: str, name: str = "") -> tuple:
    """Idempotently ensure a superuser with ``email`` exists.

    Returns ``(user, created)``. The password is only set on first creation so
    re-running (e.g. on every ``make up``) never clobbers a changed password.
    """
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "name": name,
            "is_staff": True,
            "is_superuser": True,
            "is_active": True,
        },
    )

    if created:
        user.set_password(password)
        user.save(update_fields=["password"])

    return user, created
