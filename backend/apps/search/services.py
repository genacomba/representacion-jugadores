"""
Global search (section 13): predictable, backend-executed, multi-word.

Strategy: split the query into words; for each word build an OR across every
relevant field (name, nickname, position, nationality, club, city, category
label...); AND the per-word results together so "delantero uruguay" only
matches records that satisfy both concepts, even when each concept is
satisfied by a different field. No NLP/AI — plain, reliable substring
matching, case-insensitive.
"""

from django_countries import countries

from apps.clubs.models import Club
from apps.contacts.models import Person
from apps.players.models import Position

from django.db.models import Q


def _matching_country_codes(word):
    word_lower = word.lower()
    return [code for code, name in countries if word_lower in name.lower()]


def _matching_category_codes(word):
    word_lower = word.lower()
    return [
        code for code, label in Person.Category.choices
        if word_lower in label.lower() or word_lower in code.lower()
    ]


def _matching_position_ids(word):
    return list(Position.objects.filter(name__icontains=word).values_list("id", flat=True))


def _person_word_query(word, country_codes, category_codes, position_ids):
    q = (
        Q(first_name__icontains=word)
        | Q(last_name__icontains=word)
        | Q(nickname__icontains=word)
        | Q(role_title__icontains=word)
        | Q(current_club__name__icontains=word)
        | Q(current_city__name__icontains=word)
    )
    if country_codes:
        q |= Q(nationality__in=country_codes) | Q(current_country__in=country_codes) \
            | Q(current_club__country__in=country_codes)
    if category_codes:
        q |= Q(category__in=category_codes)
    if position_ids:
        q |= Q(player_profile__primary_position_id__in=position_ids) \
            | Q(player_profile__secondary_position_id__in=position_ids)
    return q


def _club_word_query(word, country_codes):
    q = Q(name__icontains=word) | Q(city__name__icontains=word)
    if country_codes:
        q |= Q(country__in=country_codes)
    return q


def search_people(owner, query):
    qs = Person.objects.filter(owner=owner).select_related(
        "current_club", "player_profile__primary_position", "player_profile__status"
    )
    for word in query.split():
        country_codes = _matching_country_codes(word)
        category_codes = _matching_category_codes(word)
        position_ids = _matching_position_ids(word)
        qs = qs.filter(_person_word_query(word, country_codes, category_codes, position_ids))
    return qs.distinct()


def search_clubs(owner, query):
    qs = Club.objects.filter(owner=owner).select_related("city")
    for word in query.split():
        country_codes = _matching_country_codes(word)
        qs = qs.filter(_club_word_query(word, country_codes))
    return qs.distinct()
