from django.db import models
from django_countries.fields import CountryField


class City(models.Model):
    """
    Reference table of cities with pre-resolved coordinates.

    Countries use django-countries' structured ISO list. Cities are our own
    curated table (rather than free text) specifically to avoid ending up
    with "Buenos Aires" / "Bs As" / "CABA" as unrelated records: contacts and
    clubs always point at one canonical City row, selected through an
    autocomplete backed by this table.

    New cities can still be added on the fly (see CityViewSet.create) when a
    contact lives somewhere not yet in the dataset; those rows are simply
    created without coordinates until an admin fills them in, so they are
    omitted from the map rather than mis-placed.
    """

    name = models.CharField(max_length=120)
    country = CountryField()
    admin_area = models.CharField(
        "Provincia / estado", max_length=120, blank=True,
        help_text="Opcional, útil para desambiguar ciudades homónimas.",
    )
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    is_capital = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "country", "admin_area"], name="unique_city_per_country_area"
            )
        ]
        indexes = [models.Index(fields=["name"])]

    def __str__(self):
        return f"{self.name}, {self.country.name}"

    @property
    def has_coordinates(self):
        return self.latitude is not None and self.longitude is not None
