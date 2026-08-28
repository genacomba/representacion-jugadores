import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base that tracks creation/modification timestamps."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class RecentView(models.Model):
    """
    Tracks the last time each user opened a Person/Club detail screen, to
    power the "consultados recientemente" shortcut on Home (section 15).
    One row per (owner, entity); touched via update_or_create on retrieve.
    """

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    entity = GenericForeignKey("content_type", "object_id")
    viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "content_type", "object_id"], name="unique_recent_view"
            )
        ]
        ordering = ["-viewed_at"]

    @classmethod
    def touch(cls, owner, instance):
        cls.objects.update_or_create(
            owner=owner,
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.pk,
        )


class OwnedModel(TimeStampedModel):
    """
    Abstract base for any record that belongs to a specific user.

    The app currently ships with a single administrator account, but every
    record is scoped to an owner from day one so multi-user support can be
    turned on later without a data migration.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="%(class)s_set",
    )

    class Meta:
        abstract = True
