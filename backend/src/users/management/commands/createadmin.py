from django.conf import settings
from django.core.management.base import BaseCommand

from src.users.services import accounts


class Command(BaseCommand):
    help = "Idempotently create the default admin superuser (creds from settings/env)."

    def handle(self, *args, **options):
        email = settings.ADMIN_EMAIL
        _user, created = accounts.create_admin(
            email=email,
            password=settings.ADMIN_PASSWORD,
            name=settings.ADMIN_NAME,
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created admin {email}."))
        else:
            self.stdout.write(f"Admin {email} already exists; left unchanged.")
