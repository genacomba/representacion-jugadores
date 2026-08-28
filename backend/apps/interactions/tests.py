from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.contacts.models import Person


class InteractionAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="Sup3rSecret!")
        self.client.force_authenticate(self.owner)
        self.person = Person.objects.create(owner=self.owner, first_name="Juan", category="agent")

    def test_create_interaction_updates_last_contact_date(self):
        response = self.client.post("/api/interactions/", {
            "entity_type": "person", "entity_id": str(self.person.id),
            "date": "2026-01-15", "interaction_type": "whatsapp", "text": "Hablamos por WhatsApp.",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        detail = self.client.get(f"/api/people/{self.person.id}/")
        self.assertEqual(detail.data["last_contact_date"], "2026-01-15")

    def test_cannot_attach_interaction_to_another_users_contact(self):
        other = User.objects.create_user(username="other", password="Sup3rSecret!")
        stranger = Person.objects.create(owner=other, first_name="Ajeno", category="agent")
        response = self.client.post("/api/interactions/", {
            "entity_type": "person", "entity_id": str(stranger.id),
            "date": "2026-01-15", "interaction_type": "note", "text": "x",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
