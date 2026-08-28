from datetime import date

from django.db import models

from apps.core.models import TimeStampedModel


class Position(models.Model):
    """
    Structured lookup of playing positions (not free text), stored in the DB
    rather than as fixed choices so new positions can be added later via
    admin without a code deploy.
    """

    code = models.SlugField(max_length=40, unique=True)
    name = models.CharField(max_length=60)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class PlayerStatus(models.Model):
    """Extensible lookup of negotiation states for a player."""

    code = models.SlugField(max_length=40, unique=True)
    name = models.CharField(max_length=60)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "player statuses"

    def __str__(self):
        return self.name


class PlayerProfile(TimeStampedModel):
    """
    Extends a Person with the player-specific data described in the brief.
    Kept as a separate one-to-one model (rather than fields on Person)
    because most of these attributes are meaningless for every other
    contact category.
    """

    class PreferredFoot(models.TextChoices):
        RIGHT = "right", "Derecha"
        LEFT = "left", "Izquierda"
        BOTH = "both", "Ambidiestro"

    person = models.OneToOneField(
        "contacts.Person", on_delete=models.CASCADE, related_name="player_profile"
    )
    primary_position = models.ForeignKey(
        Position, on_delete=models.PROTECT, related_name="primary_players"
    )
    secondary_position = models.ForeignKey(
        Position, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="secondary_players",
    )
    preferred_foot = models.CharField(
        max_length=10, choices=PreferredFoot.choices, blank=True
    )
    has_eu_passport = models.BooleanField("Pasaporte comunitario", default=False)
    contract_until = models.DateField(null=True, blank=True)
    represented_by = models.ForeignKey(
        "contacts.Person", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="represented_players",
        help_text="Representante actual del jugador.",
    )
    status = models.ForeignKey(
        PlayerStatus, on_delete=models.PROTECT, related_name="players"
    )

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Perfil de jugador de {self.person}"

    @property
    def age(self):
        birth_date = self.person.birth_date
        if not birth_date:
            return None
        today = date.today()
        return today.year - birth_date.year - (
            (today.month, today.day) < (birth_date.month, birth_date.day)
        )
