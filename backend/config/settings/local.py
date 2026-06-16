from .base import *  # noqa: F403
from .base import env

# GENERAL
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#debug
DEBUG = True
# https://docs.djangoproject.com/en/dev/ref/settings/#secret-key
SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    default="LqcVeDdzLlSaAAnWJwDa0kkfNG86fKdWe82adU8AhSxXTJRNiTYF6we8obJCdGF6",
)
# https://docs.djangoproject.com/en/dev/ref/settings/#allowed-hosts
# "backend" is the docker compose service hostname: the frontend's SSR fetches
# http://backend:8000 directly, so that Host must be allowed alongside the
# host-side localhost names.
ALLOWED_HOSTS = ["localhost", "0.0.0.0", "127.0.0.1", "backend"]  # noqa: S104

# CACHES
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#caches
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "",
    },
}

# EMAIL
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#email-backend
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Your stuff...
# ------------------------------------------------------------------------------
