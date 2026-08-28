from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.clubs.models import Club
from apps.contacts.models import Person
from apps.players.models import PlayerProfile, PlayerStatus, Position


class GlobalSearchTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="Sup3rSecret!")
        self.client.force_authenticate(self.owner)

        forward = Position.objects.create(code="fw", name="Delantero")
        free = PlayerStatus.objects.create(code="free", name="Libre")

        self.club = Club.objects.create(owner=self.owner, name="River Demo FC", country="AR")

        self.matching_player = Person.objects.create(
            owner=self.owner, first_name="Franco", last_name="Uruguayo", category="player",
            nationality="UY",
        )
        PlayerProfile.objects.create(person=self.matching_player, primary_position=forward, status=free)

        self.non_matching_player = Person.objects.create(
            owner=self.owner, first_name="Diego", last_name="Argentino", category="player",
            nationality="AR",
        )
        PlayerProfile.objects.create(person=self.non_matching_player, primary_position=forward, status=free)

        self.club_staff = Person.objects.create(
            owner=self.owner, first_name="Martín", last_name="Dirigente", category="director",
            current_club=self.club,
        )

    def test_single_word_matches_across_multiple_fields(self):
        response = self.client.get("/api/search/", {"q": "river"})
        club_names = [c["name"] for c in response.data["clubs"]]
        people_names = [p["full_name"] for p in response.data["people"]]
        self.assertIn("River Demo FC", club_names)
        self.assertIn("Martín Dirigente", people_names)

    def test_multi_word_requires_both_concepts_even_across_different_fields(self):
        response = self.client.get("/api/search/", {"q": "delantero uruguay"})
        names = [p["full_name"] for p in response.data["people"]]
        self.assertIn("Franco Uruguayo", names)
        self.assertNotIn("Diego Argentino", names)

    def test_search_is_case_insensitive(self):
        response = self.client.get("/api/search/", {"q": "DELANTERO"})
        names = [p["full_name"] for p in response.data["people"]]
        self.assertIn("Franco Uruguayo", names)

    def test_empty_query_returns_empty_results_not_everything(self):
        response = self.client.get("/api/search/", {"q": ""})
        self.assertEqual(response.data["people"], [])
        self.assertEqual(response.data["clubs"], [])

    def test_search_is_scoped_to_owner(self):
        other = User.objects.create_user(username="other", password="Sup3rSecret!")
        self.client.force_authenticate(other)
        response = self.client.get("/api/search/", {"q": "river"})
        self.assertEqual(response.data["clubs"], [])
