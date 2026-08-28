from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.clubs.models import Club
from apps.contacts.models import Person
from apps.interactions.models import Interaction


class DashboardActivityAPITests(APITestCase):
    """Covers the "Últimos movimientos" feed on Home: it must be built only
    from real, derivable events (contacts/clubs added or updated, recent
    interactions) -- never invented data."""

    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="Sup3rSecret!")
        self.client.force_authenticate(self.owner)

    def test_newly_created_person_is_reported_as_added(self):
        Person.objects.create(owner=self.owner, first_name="Juan", category="agent")
        response = self.client.get("/api/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        kinds = [e["kind"] for e in response.data["activity"]]
        self.assertIn("person_created", kinds)

    def test_editing_an_existing_person_is_reported_as_updated(self):
        person = Person.objects.create(owner=self.owner, first_name="Juan", category="agent")
        # created_at is auto_now_add and always forced to "now" on INSERT,
        # so backdate it via a raw update() (bypasses pre_save) to simulate
        # an edit happening well after creation, rather than in the same
        # instant a fast test would otherwise produce.
        Person.objects.filter(pk=person.pk).update(created_at=timezone.now() - timedelta(minutes=5))
        person.refresh_from_db()
        person.notes = "Actualizado a mano"
        person.save(update_fields=["notes", "updated_at"])

        response = self.client.get("/api/dashboard/")
        activity = {e["target"]["id"]: e for e in response.data["activity"]}
        self.assertEqual(activity[str(person.id)]["kind"], "person_updated")

    def test_a_new_interaction_appears_in_the_feed(self):
        person = Person.objects.create(owner=self.owner, first_name="Juan", category="agent")
        Interaction.objects.create(
            owner=self.owner,
            content_type=ContentType.objects.get_for_model(Person),
            object_id=person.id,
            interaction_type="whatsapp",
            text="Hablamos por WhatsApp.",
        )
        response = self.client.get("/api/dashboard/")
        kinds = [e["kind"] for e in response.data["activity"]]
        self.assertIn("interaction", kinds)

    def test_activity_is_scoped_to_the_authenticated_owner(self):
        other = User.objects.create_user(username="other", password="Sup3rSecret!")
        Person.objects.create(owner=other, first_name="Ajeno", category="agent")
        response = self.client.get("/api/dashboard/")
        self.assertEqual(response.data["activity"], [])

    def test_club_events_also_appear(self):
        Club.objects.create(owner=self.owner, name="Club Demo", country="AR")
        response = self.client.get("/api/dashboard/")
        kinds = [e["kind"] for e in response.data["activity"]]
        self.assertIn("club_created", kinds)
