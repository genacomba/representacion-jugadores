from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.players.models import PlayerStatus, Position

from .models import Person, RelationshipType


class PersonAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="Sup3rSecret!")
        self.other = User.objects.create_user(username="other", password="Sup3rSecret!")
        self.position = Position.objects.create(code="fw", name="Delantero")
        self.status_free = PlayerStatus.objects.create(code="free", name="Libre")

    def test_list_requires_authentication(self):
        response = self.client.get("/api/people/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_agent_contact(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post("/api/people/", {
            "first_name": "Carlos", "last_name": "López", "category": "agent",
            "phone": "+54 9 11 5555-5555",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Person.objects.count(), 1)
        self.assertEqual(Person.objects.get().owner, self.owner)

    def test_create_contact_with_blank_country_fields_does_not_crash(self):
        # Regression test: a real browser form submits multipart/form-data
        # and sends unset selects as "" rather than omitting the key
        # entirely. DRF's auto-generated ChoiceField for django-countries'
        # CountryField mishandles that ('' compares equal to the wrapped
        # Country('') value and is returned unconverted), which used to
        # blow up JSON rendering with "Object of type Country is not JSON
        # serializable". Fixed via django_countries.serializers.CountryFieldMixin.
        self.client.force_authenticate(self.owner)
        response = self.client.post("/api/people/", {
            "first_name": "Sin", "last_name": "Pais", "category": "agent",
            "nationality": "", "current_country": "",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIsNone(response.data["nationality"])
        self.assertIsNone(response.data["current_country"])

    def test_create_player_with_nested_profile(self):
        self.client.force_authenticate(self.owner)
        payload = {
            "first_name": "Juan", "last_name": "Pérez", "category": "player",
            "birth_date": "2004-05-10", "nationality": "AR",
            "player_profile": {
                "primary_position": self.position.id,
                "status": self.status_free.id,
                "preferred_foot": "right",
                "has_eu_passport": False,
            },
        }
        response = self.client.post("/api/people/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        person = Person.objects.get()
        self.assertTrue(hasattr(person, "player_profile"))
        self.assertEqual(person.player_profile.primary_position, self.position)
        self.assertIsInstance(person.age, int)

    def test_create_player_with_nested_profile_via_multipart(self):
        # Regression test: the real frontend form always submits
        # multipart/form-data (it needs to for the photo upload), sending
        # player_profile as a JSON-encoded string in a single field. DRF
        # treats multipart payloads (QueryDict) as "HTML form input" and a
        # nested Serializer field's get_value() special-cases that by
        # trying to rebuild the object from flattened "player_profile.x"
        # keys, silently ignoring a dict we assign directly onto the
        # QueryDict in to_internal_value. See PersonWriteSerializer.
        import json as _json
        self.client.force_authenticate(self.owner)
        response = self.client.post("/api/people/", {
            "first_name": "Multipart", "last_name": "Player", "category": "player",
            "player_profile": _json.dumps({
                "primary_position": self.position.id,
                "status": self.status_free.id,
                "preferred_foot": "left",
                "has_eu_passport": True,
            }),
        }, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        person = Person.objects.get(last_name="Player")
        self.assertTrue(hasattr(person, "player_profile"))
        self.assertEqual(person.player_profile.primary_position, self.position)
        self.assertTrue(person.player_profile.has_eu_passport)

    def test_non_player_cannot_carry_a_player_profile(self):
        self.client.force_authenticate(self.owner)
        payload = {
            "first_name": "Carlos", "last_name": "Director", "category": "director",
            "player_profile": {"primary_position": self.position.id, "status": self.status_free.id},
        }
        response = self.client.post("/api/people/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_see_or_edit_other_users_contacts(self):
        person = Person.objects.create(
            owner=self.other, first_name="Secreto", last_name="Ajeno", category="agent"
        )
        self.client.force_authenticate(self.owner)

        list_response = self.client.get("/api/people/")
        self.assertEqual(list_response.data["count"], 0)

        detail_response = self.client.get(f"/api/people/{person.id}/")
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

        edit_response = self.client.patch(f"/api/people/{person.id}/", {"first_name": "Hackeado"})
        self.assertEqual(edit_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_toggle_favorite(self):
        person = Person.objects.create(
            owner=self.owner, first_name="Ana", last_name="Gómez", category="agent"
        )
        self.client.force_authenticate(self.owner)
        response = self.client.post(f"/api/people/{person.id}/toggle_favorite/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        person.refresh_from_db()
        self.assertTrue(person.is_favorite)


class RelationshipAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="Sup3rSecret!")
        self.client.force_authenticate(self.owner)
        self.rel_type = RelationshipType.objects.create(code="recommended", label="Recomendó a")
        self.a = Person.objects.create(owner=self.owner, first_name="A", category="agent")
        self.b = Person.objects.create(owner=self.owner, first_name="B", category="player")

    def test_create_and_list_relationship_between_two_people(self):
        response = self.client.post("/api/relationships/", {
            "from_type": "person", "from_id": str(self.a.id),
            "to_type": "person", "to_id": str(self.b.id),
            "relationship_type": self.rel_type.id,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        relationships = self.client.get(f"/api/people/{self.a.id}/relationships/")
        self.assertEqual(len(relationships.data), 1)
        self.assertEqual(relationships.data[0]["to_entity_detail"]["id"], str(self.b.id))

    def test_cannot_relate_to_another_users_person(self):
        stranger_owner = User.objects.create_user(username="stranger", password="Sup3rSecret!")
        stranger = Person.objects.create(owner=stranger_owner, first_name="C", category="agent")
        response = self.client.post("/api/relationships/", {
            "from_type": "person", "from_id": str(self.a.id),
            "to_type": "person", "to_id": str(stranger.id),
            "relationship_type": self.rel_type.id,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
