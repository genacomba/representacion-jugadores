"""
Real, backend-derived "Últimos movimientos" feed for Home (no invented
events): recently added/updated contacts and clubs, plus recently logged
interactions. Distinguishing "agregado" from "actualizado" is a heuristic
(created_at and updated_at within a couple seconds of each other means the
edit that triggered the timestamp WAS the creation) since the models don't
carry a separate change history -- deliberately not adding one just for this
widget, per the brief's instruction not to fabricate data the current model
doesn't actually support.
"""

from datetime import timedelta

from apps.clubs.models import Club
from apps.contacts.models import Person
from apps.interactions.models import Interaction

_CREATED_VS_UPDATED_TOLERANCE = timedelta(seconds=2)


def _person_event(person):
    is_new = person.updated_at - person.created_at < _CREATED_VS_UPDATED_TOLERANCE
    return {
        "kind": "person_created" if is_new else "person_updated",
        "timestamp": person.updated_at,
        "title": person.full_name,
        "subtitle": "Contacto agregado" if is_new else "Contacto actualizado",
        "target": {"type": "person", "id": str(person.id)},
    }


def _club_event(club):
    is_new = club.updated_at - club.created_at < _CREATED_VS_UPDATED_TOLERANCE
    return {
        "kind": "club_created" if is_new else "club_updated",
        "timestamp": club.updated_at,
        "title": club.name,
        "subtitle": "Club agregado" if is_new else "Club actualizado",
        "target": {"type": "club", "id": str(club.id)},
    }


def _interaction_event(interaction):
    entity = interaction.entity
    entity_name = getattr(entity, "full_name", None) or getattr(entity, "name", "")
    target_type = "club" if entity.__class__.__name__ == "Club" else "person"
    return {
        "kind": "interaction",
        "timestamp": interaction.created_at,
        "title": entity_name,
        "subtitle": f"Interacción registrada: {interaction.text[:60]}",
        "target": {"type": target_type, "id": str(interaction.object_id)},
    }


def recent_activity(owner, limit=8):
    people = Person.objects.filter(owner=owner).order_by("-updated_at")[:limit]
    clubs = Club.objects.filter(owner=owner).order_by("-updated_at")[:limit]
    interactions = (
        Interaction.objects.filter(owner=owner).select_related("content_type").order_by("-created_at")[:limit]
    )

    events = (
        [_person_event(p) for p in people]
        + [_club_event(c) for c in clubs]
        + [_interaction_event(i) for i in interactions]
    )
    events.sort(key=lambda e: e["timestamp"], reverse=True)
    return events[:limit]
