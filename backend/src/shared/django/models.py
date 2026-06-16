"""Reusable abstract model bases shared across the OpenMatchroom apps."""

import secrets
import string

from django.db import models
from django.utils.translation import gettext_lazy as _
from model_utils.models import TimeStampedModel

__all__ = ["BaseModel", "PublicIdModel", "PublicIdModelManager", "TimeStampedModel"]


class PublicIdModelManager(models.Manager):
    """Manager that assigns collision-free pids during ``bulk_create``."""

    def bulk_create(self, objs, *args, **kwargs):
        obj_list = list(objs)
        if not obj_list:
            return []

        pids = self.model.generate_pids(len(obj_list))
        for obj, pid in zip(obj_list, pids, strict=True):
            if not obj.pid:
                obj.pid = pid

        return super().bulk_create(obj_list, *args, **kwargs)


class PublicIdModel(models.Model):
    """Abstract base that adds an opaque public identifier (``pid``).

    The pid looks like ``<PID_PREFIX>_<random base62 token>`` and is the value
    exposed in the API (``lookup_field="pid"``) instead of the sequential primary
    key, so internal ids never leak and rows are not enumerable.
    """

    PID_PREFIX = "id"
    PID_LENGTH = 12
    PID_CHARS = string.ascii_letters + string.digits  # base62

    pid = models.CharField(
        _("public id"),
        max_length=64,
        unique=True,
        editable=False,
        db_index=True,
    )

    objects = PublicIdModelManager()

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.generate_pid()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_pid_str(cls) -> str:
        token = "".join(secrets.choice(cls.PID_CHARS) for _ in range(cls.PID_LENGTH))
        return f"{cls.PID_PREFIX}_{token}"

    def generate_pid(self) -> None:
        if self.pid:
            return

        while True:
            pid = self._generate_pid_str()
            if not self.__class__.objects.filter(pid=pid).exists():
                self.pid = pid
                break

    @classmethod
    def generate_pids(cls, batch_size: int) -> list[str]:
        """Return ``batch_size`` unique pids, free of in-batch and DB collisions."""
        pids: set[str] = set()
        while len(pids) < batch_size:
            pids.add(cls._generate_pid_str())

        while True:
            conflicts = set(
                cls.objects.filter(pid__in=pids).values_list("pid", flat=True),
            )
            if not conflicts:
                break
            pids.difference_update(conflicts)
            while len(pids) < batch_size:
                pids.add(cls._generate_pid_str())

        return list(pids)


class BaseModel(TimeStampedModel, PublicIdModel):
    """Common base: an opaque ``pid`` plus ``created`` / ``modified`` timestamps."""

    class Meta:
        abstract = True
