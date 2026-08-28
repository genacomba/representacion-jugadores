import django_filters
from django.db.models import Q

from .models import Person


class PersonFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category")
    is_favorite = django_filters.BooleanFilter(field_name="is_favorite")
    current_club = django_filters.UUIDFilter(field_name="current_club_id")
    nationality = django_filters.CharFilter(field_name="nationality")
    current_country = django_filters.CharFilter(field_name="current_country")
    # Lightweight name typeahead for pickers (referido por, representante),
    # distinct from the multi-field global search in apps.search.
    name = django_filters.CharFilter(method="filter_name")

    class Meta:
        model = Person
        fields = ["category", "is_favorite", "current_club", "nationality", "current_country", "name"]

    def filter_name(self, queryset, name, value):
        return queryset.filter(
            Q(first_name__icontains=value) | Q(last_name__icontains=value) | Q(nickname__icontains=value)
        )
