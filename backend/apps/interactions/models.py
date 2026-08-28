from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone

from apps.core.models import OwnedModel


class Interaction(OwnedModel):
    """
    One entry in a contact's (or club's) history log: a call, a WhatsApp
    chat, a meeting note, etc. Attached generically so the same model serves
    both Person and Club timelines.
    """

    class InteractionType(models.TextChoices):
        CALL = "call", "Llamada"
        WHATSAPP = "whatsapp", "WhatsApp"
        MEETING = "meeting", "Reunión"
        EMAIL = "email", "Email"
        NOTE = "note", "Nota"
        OTHER = "other", "Otro"

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    entity = GenericForeignKey("content_type", "object_id")

    date = models.DateField(default=timezone.localdate)
    interaction_type = models.CharField(
        max_length=20, choices=InteractionType.choices, default=InteractionType.NOTE
    )
    text = models.TextField()

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes = [models.Index(fields=["content_type", "object_id"])]

    def __str__(self):
        return f"{self.date} - {self.text[:40]}"
