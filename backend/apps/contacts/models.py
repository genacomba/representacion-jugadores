from datetime import date

from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django_countries.fields import CountryField

from apps.core.models import OwnedModel


class Person(OwnedModel):
    """
    Any human contact in the agenda (players, agents, directors, coaching
    staff, ex-players, football-environment people). Clubs are intentionally
    a separate model (see clubs.Club) rather than a Person subtype/category,
    since a club is an institution with its own fields (crest, website) and
    should never show up where a person is expected (e.g. "represented by").
    """

    class Category(models.TextChoices):
        PLAYER = "player", "Jugador"
        AGENT = "agent", "Representante"
        DIRECTOR = "director", "Dirigente"
        SPORTING_DIRECTOR = "sporting_director", "Director deportivo"
        COACHING_STAFF = "coaching_staff", "Cuerpo técnico"
        EX_PLAYER = "ex_player", "Ex jugador"
        ENVIRONMENT = "environment", "Ambiente del fútbol"

    class RelationshipLevel(models.TextChoices):
        CLOSE = "close", "Cercana"
        MEDIUM = "medium", "Media"
        DISTANT = "distant", "Distante"

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    nickname = models.CharField(max_length=100, blank=True)
    photo = models.ImageField(upload_to="people/", null=True, blank=True)
    category = models.CharField(max_length=30, choices=Category.choices)

    birth_date = models.DateField(null=True, blank=True)
    nationality = CountryField(null=True, blank=True)
    current_country = CountryField(null=True, blank=True)
    current_city = models.ForeignKey(
        "locations.City", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="residents",
    )

    phone = models.CharField(max_length=40, blank=True)
    whatsapp = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    instagram = models.CharField(max_length=100, blank=True)

    current_club = models.ForeignKey(
        "clubs.Club", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="staff_members",
    )
    role_title = models.CharField(
        "Cargo o función", max_length=120, blank=True,
        help_text="Ej: Director deportivo, Ayudante de campo, Presidente.",
    )

    is_favorite = models.BooleanField(default=False)
    notes = models.TextField("Observaciones generales", blank=True)
    how_met = models.TextField("Cómo lo conocí", blank=True)
    referred_by = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="referrals",
        help_text="Quién me pasó este contacto.",
    )
    relationship_level = models.CharField(
        max_length=10, choices=RelationshipLevel.choices, blank=True
    )

    interactions = GenericRelation(
        "interactions.Interaction", content_type_field="content_type", object_id_field="object_id"
    )
    resources = GenericRelation(
        "resources.Resource", content_type_field="content_type", object_id_field="object_id"
    )

    class Meta:
        ordering = ["first_name", "last_name"]
        verbose_name_plural = "people"
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["last_name", "first_name"]),
        ]

    def __str__(self):
        return self.full_name

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def age(self):
        if not self.birth_date:
            return None
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )

    @property
    def last_contact_date(self):
        latest = self.interactions.order_by("-date").values_list("date", flat=True).first()
        return latest


class RelationshipType(models.Model):
    """
    Extensible catalogue of relationship kinds (e.g. "recomendado por",
    "conoce en el club", "familiar de"). Kept out of code so the
    representative can grow their own vocabulary of connections over time.
    """

    code = models.SlugField(max_length=40, unique=True)
    label = models.CharField(max_length=80)
    inverse_label = models.CharField(
        max_length=80, blank=True,
        help_text="Cómo describir el vínculo visto desde el otro lado (opcional).",
    )

    def __str__(self):
        return self.label


class Relationship(OwnedModel):
    """
    Generic, symmetric-capable link between any two entities in the agenda
    (Person<->Person, Person<->Club, Club<->Club), on top of the direct FKs
    already on Person/PlayerProfile (current_club, referred_by,
    represented_by) that cover the most common, performance-sensitive
    lookups. This model exists for everything else: arbitrary, ad-hoc
    connections the representative wants to remember, without needing a new
    field/migration for every new kind of relationship.
    """

    # UUIDField (not PositiveIntegerField) because the only two possible
    # targets, Person and Club, both use UUID primary keys (via OwnedModel).
    from_content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, related_name="+"
    )
    from_object_id = models.UUIDField()
    from_entity = GenericForeignKey("from_content_type", "from_object_id")

    to_content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, related_name="+"
    )
    to_object_id = models.UUIDField()
    to_entity = GenericForeignKey("to_content_type", "to_object_id")

    relationship_type = models.ForeignKey(
        RelationshipType, on_delete=models.PROTECT, related_name="relationships"
    )
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["from_content_type", "from_object_id"]),
            models.Index(fields=["to_content_type", "to_object_id"]),
        ]

    def __str__(self):
        return f"{self.from_entity} -[{self.relationship_type}]-> {self.to_entity}"
