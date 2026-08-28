"""
Aggregation for the 3D globe (section 18).

Contacts are grouped by City so the globe never renders dozens of markers
stacked on the same point — one marker per city, sized/colored by how many
(and which category of) contacts live there, with the actual list available
on drill-down. Coordinates come exclusively from the curated City table
(country + city only, never device GPS), and cities without coordinates yet
are simply omitted from the map rather than guessed at.
"""

from django.db.models import Count
from django_countries import countries as _countries

from apps.clubs.models import Club
from apps.contacts.models import Person
from apps.locations.models import City

MAP_CATEGORIES = [choice[0] for choice in Person.Category.choices] + ["club"]


def _person_categories(requested):
    all_person_categories = [c[0] for c in Person.Category.choices]
    if requested is None:
        return all_person_categories
    return [c for c in requested if c in all_person_categories]


def city_aggregates(owner, categories=None):
    person_categories = _person_categories(categories)
    include_clubs = categories is None or "club" in categories

    breakdown_by_city = {}

    if person_categories:
        person_rows = (
            Person.objects.filter(
                owner=owner, current_city__isnull=False, category__in=person_categories
            )
            .values("current_city_id", "category")
            .annotate(n=Count("id"))
        )
        for row in person_rows:
            city_bucket = breakdown_by_city.setdefault(row["current_city_id"], {})
            city_bucket[row["category"]] = city_bucket.get(row["category"], 0) + row["n"]

    if include_clubs:
        club_rows = (
            Club.objects.filter(owner=owner, city__isnull=False)
            .values("city_id")
            .annotate(n=Count("id"))
        )
        for row in club_rows:
            city_bucket = breakdown_by_city.setdefault(row["city_id"], {})
            city_bucket["club"] = city_bucket.get("club", 0) + row["n"]

    if not breakdown_by_city:
        return []

    cities = City.objects.filter(
        id__in=breakdown_by_city.keys(), latitude__isnull=False, longitude__isnull=False
    )

    results = []
    for city in cities:
        breakdown = breakdown_by_city[city.id]
        total = sum(breakdown.values())
        dominant_category = max(breakdown, key=breakdown.get)
        results.append({
            "id": city.id,
            "name": city.name,
            "country": str(city.country),
            "country_name": city.country.name,
            "latitude": city.latitude,
            "longitude": city.longitude,
            "total": total,
            "breakdown": breakdown,
            "dominant_category": dominant_category,
        })
    return results


def country_aggregates(owner, categories=None):
    """
    Per-country totals for the flat "Mapa global" summary on Home — a
    coarser, distinct view from city_aggregates' city-level breakdown used
    by the 3D globe. Grouped directly by Person.current_country /
    Club.country (not through City) so a contact still counts here even if
    its city was never picked/geocoded, which matches "cantidad de
    contactos por país" better than requiring a resolved city marker.
    """
    person_categories = _person_categories(categories)
    include_clubs = categories is None or "club" in categories

    breakdown_by_country = {}

    if person_categories:
        person_rows = (
            Person.objects.filter(owner=owner, category__in=person_categories)
            .exclude(current_country="")
            .exclude(current_country__isnull=True)
            .values("current_country", "category")
            .annotate(n=Count("id"))
        )
        for row in person_rows:
            code = str(row["current_country"])
            bucket = breakdown_by_country.setdefault(code, {})
            bucket[row["category"]] = bucket.get(row["category"], 0) + row["n"]

    if include_clubs:
        club_rows = (
            Club.objects.filter(owner=owner)
            .exclude(country="")
            .exclude(country__isnull=True)
            .values("country")
            .annotate(n=Count("id"))
        )
        for row in club_rows:
            code = str(row["country"])
            bucket = breakdown_by_country.setdefault(code, {})
            bucket["club"] = bucket.get("club", 0) + row["n"]

    results = []
    for code, breakdown in breakdown_by_country.items():
        results.append({
            "country": code,
            # Resolved fresh per request (not cached at module import time):
            # django-countries' translated names are lazy proxies, and
            # caching them in a module-level dict evaluates them outside
            # any request's i18n context, which produces mangled encoding.
            "country_name": str(_countries.name(code)) or code,
            "total": sum(breakdown.values()),
            "breakdown": breakdown,
        })
    results.sort(key=lambda r: -r["total"])
    return results


def city_entities(owner, city, categories=None):
    person_categories = _person_categories(categories)
    include_clubs = categories is None or "club" in categories

    entities = []
    if person_categories:
        people = Person.objects.filter(
            owner=owner, current_city=city, category__in=person_categories
        ).select_related("current_club")
        for person in people:
            entities.append({
                "type": "person",
                "id": person.id,
                "name": person.full_name,
                "category": person.category,
                "photo": person.photo.url if person.photo else None,
                "subtitle": person.current_club.name if person.current_club else person.role_title,
            })
    if include_clubs:
        clubs = Club.objects.filter(owner=owner, city=city)
        for club in clubs:
            entities.append({
                "type": "club",
                "id": club.id,
                "name": club.name,
                "category": "club",
                "photo": club.crest.url if club.crest else None,
                "subtitle": club.country.name if club.country else "",
            })
    return entities
