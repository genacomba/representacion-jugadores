from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.core.models import OwnedModel


class Resource(OwnedModel):
    """
    Generic external reference attached to a Person or Club: a Wyscout/
    Transfermarkt profile, a YouTube highlight reel, a contract file, etc.
    Kept as a single flexible model (type + optional URL + optional file)
    instead of one table per resource kind, since the only real difference
    between them is a label and where the content lives.
    """

    class ResourceType(models.TextChoices):
        WYSCOUT = "wyscout", "Wyscout"
        TRANSFERMARKT = "transfermarkt", "Transfermarkt"
        YOUTUBE = "youtube", "Video de YouTube"
        DOCUMENT = "document", "Documento"
        CONTRACT = "contract", "Contrato"
        FOLDER = "folder", "Carpeta externa"
        OTHER = "other", "Otro"

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    entity = GenericForeignKey("content_type", "object_id")

    resource_type = models.CharField(max_length=20, choices=ResourceType.choices)
    title = models.CharField(max_length=150)
    url = models.URLField(blank=True)
    file = models.FileField(upload_to="resources/", null=True, blank=True)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["content_type", "object_id"])]

    def __str__(self):
        return self.title

    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.url and not self.file:
            raise ValidationError("Debe indicar una URL o subir un archivo.")
