from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.contacts.models import Person

from .models import Club


class ClubAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="Sup3rSecret!")
        self.client.force_authenticate(self.owner)

    def test_create_and_retrieve_club(self):
        response = self.client.post("/api/clubs/", {"name": "Club Demo", "country": "AR"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        club_id = response.data["id"]

        detail = self.client.get(f"/api/clubs/{club_id}/")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data["name"], "Club Demo")

    def test_blank_name_is_rejected(self):
        response = self.client.post("/api/clubs/", {"name": "   ", "country": "AR"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_people_action_lists_staff_and_players_at_the_club(self):
        club = Club.objects.create(owner=self.owner, name="Club Demo", country="AR")
        Person.objects.create(owner=self.owner, first_name="Jugador", category="player", current_club=club)
        Person.objects.create(owner=self.owner, first_name="Suelto", category="player")

        response = self.client.get(f"/api/clubs/{club.id}/people/")
        names = [p["full_name"] for p in response.data]
        self.assertIn("Jugador", names)
        self.assertNotIn("Suelto", names)

    def test_other_users_clubs_are_not_visible(self):
        other = User.objects.create_user(username="other", password="Sup3rSecret!")
        Club.objects.create(owner=other, name="Ajeno", country="AR")
        response = self.client.get("/api/clubs/")
        self.assertEqual(response.data["count"], 0)
