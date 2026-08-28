from datetime import date

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.contacts.models import Person

from .models import PlayerProfile, PlayerStatus, Position


class PlayerSearchAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="Sup3rSecret!")
        self.client.force_authenticate(self.owner)

        self.forward = Position.objects.create(code="fw", name="Delantero", order=1)
        self.keeper = Position.objects.create(code="gk", name="Arquero", order=0)
        self.in_folder = PlayerStatus.objects.create(code="in_folder", name="En carpeta")
        self.free = PlayerStatus.objects.create(code="free", name="Libre")

        self.young_forward = self._make_player(
            "Lautaro", "Sub23", "AR", date(2005, 1, 1), self.forward, self.in_folder
        )
        self.old_forward = self._make_player(
            "Carlos", "Veterano", "AR", date(1990, 1, 1), self.forward, self.in_folder
        )
        self.keeper_person = self._make_player(
            "Diego", "Arco", "UY", date(2003, 1, 1), self.keeper, self.free
        )

    def _make_player(self, first, last, nationality, birth_date, position, player_status):
        person = Person.objects.create(
            owner=self.owner, first_name=first, last_name=last, category="player",
            nationality=nationality, birth_date=birth_date,
        )
        PlayerProfile.objects.create(person=person, primary_position=position, status=player_status)
        return person

    def test_filters_combine_with_and(self):
        response = self.client.get("/api/players/", {
            "position": self.forward.id, "age_max": 23, "nationality": "AR", "status": self.in_folder.id,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [p["full_name"] for p in response.data["results"]]
        self.assertIn("Lautaro Sub23", names)
        self.assertNotIn("Carlos Veterano", names)
        self.assertNotIn("Diego Arco", names)

    def test_only_players_are_returned_not_other_categories(self):
        Person.objects.create(owner=self.owner, first_name="Agente", category="agent")
        response = self.client.get("/api/players/")
        self.assertEqual(response.data["count"], 3)

    def test_advanced_search_is_scoped_to_owner(self):
        other = User.objects.create_user(username="other", password="Sup3rSecret!")
        self.client.force_authenticate(other)
        response = self.client.get("/api/players/")
        self.assertEqual(response.data["count"], 0)
