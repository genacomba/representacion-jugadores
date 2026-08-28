from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django_countries.fields import CountryField

from apps.core.models import OwnedModel


class Club(OwnedModel):
    """
    A football club/institution. Deliberately NOT a Person subtype: clubs
    have their own identity (crest, website) and must never appear where a
    person is expected (e.g. as a "represented by" value), while still
    being a first-class result in the global search.
    """

    name = models.CharField(max_length=150)
    crest = models.ImageField(upload_to="clubs/", null=True, blank=True)
    country = CountryField(null=True, blank=True)
    city = models.ForeignKey(
        "locations.City", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="clubs",
    )
    website = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    is_favorite = models.BooleanField(default=False)

    interactions = GenericRelation(
        "interactions.Interaction", content_type_field="content_type", object_id_field="object_id"
    )
    resources = GenericRelation(
        "resources.Resource", content_type_field="content_type", object_id_field="object_id"
    )

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["name"])]

    def __str__(self):
        return self.name

    @property
    def last_contact_date(self):
        latest = self.interactions.order_by("-date").values_list("date", flat=True).first()
        return latest
