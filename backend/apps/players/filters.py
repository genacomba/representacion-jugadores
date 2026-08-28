from datetime import date, timedelta

import django_filters
from django.db.models import Q

from apps.contacts.models import Person


def _shift_years(base_date, years):
    """date.replace(year=...) blows up for Feb 29 on non-leap target years;
    fall back to Feb 28 in that case instead of raising."""
    try:
        return base_date.replace(year=base_date.year - years)
    except ValueError:
        return base_date.replace(month=2, day=28, year=base_date.year - years)


class PlayerSearchFilter(django_filters.FilterSet):
    """Backs the "Necesito un jugador" advanced search (section 14). All
    filters combine with AND and are expressed as query params so a search
    is reproducible/shareable, per the brief's explicit requirement."""

    position = django_filters.NumberFilter(method="filter_position")
    secondary_position = django_filters.NumberFilter(field_name="player_profile__secondary_position_id")
    age_min = django_filters.NumberFilter(method="filter_age_min")
    age_max = django_filters.NumberFilter(method="filter_age_max")
    nationality = django_filters.CharFilter(field_name="nationality")
    current_country = django_filters.CharFilter(field_name="current_country")
    club = django_filters.UUIDFilter(field_name="current_club_id")
    has_eu_passport = django_filters.BooleanFilter(field_name="player_profile__has_eu_passport")
    preferred_foot = django_filters.CharFilter(field_name="player_profile__preferred_foot")
    status = django_filters.NumberFilter(field_name="player_profile__status_id")
    contract_situation = django_filters.CharFilter(method="filter_contract_situation")

    class Meta:
        model = Person
        fields = [
            "position", "secondary_position", "age_min", "age_max", "nationality",
            "current_country", "club", "has_eu_passport", "preferred_foot",
            "status", "contract_situation",
        ]

    def filter_position(self, queryset, name, value):
        return queryset.filter(
            Q(player_profile__primary_position_id=value)
            | Q(player_profile__secondary_position_id=value)
        )

    def filter_age_min(self, queryset, name, value):
        max_birth_date = _shift_years(date.today(), int(value))
        return queryset.filter(birth_date__lte=max_birth_date)

    def filter_age_max(self, queryset, name, value):
        min_birth_date = _shift_years(date.today(), int(value) + 1)
        return queryset.filter(birth_date__gte=min_birth_date)

    def filter_contract_situation(self, queryset, name, value):
        today = date.today()
        if value == "free":
            return queryset.filter(player_profile__contract_until__isnull=True)
        if value == "active":
            return queryset.filter(player_profile__contract_until__gt=today + timedelta(days=180))
        if value == "expiring_soon":
            return queryset.filter(
                player_profile__contract_until__gte=today,
                player_profile__contract_until__lte=today + timedelta(days=180),
            )
        if value == "expired":
            return queryset.filter(player_profile__contract_until__lt=today)
        return queryset
