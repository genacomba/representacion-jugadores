from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.clubs.models import Club
from apps.contacts.models import Person
from apps.locations.models import City


class MapCountriesAPITests(APITestCase):
    """Covers the flat "Mapa global" summary on Home, distinct from the
    city-level 3D globe endpoint."""

    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="Sup3rSecret!")
        self.client.force_authenticate(self.owner)

    def test_counts_contacts_per_country_even_without_a_city(self):
        # No City set on purpose: per-country totals must not require a
        # resolved/geocoded city, unlike the 3D globe's city aggregation.
        Person.objects.create(owner=self.owner, first_name="A", category="agent", current_country="AR")
        Person.objects.create(owner=self.owner, first_name="B", category="player", current_country="AR")
        Person.objects.create(owner=self.owner, first_name="C", category="agent", current_country="UY")

        response = self.client.get("/api/map/countries/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        by_code = {row["country"]: row["total"] for row in response.data["countries"]}
        self.assertEqual(by_code.get("AR"), 2)
        self.assertEqual(by_code.get("UY"), 1)

    def test_country_names_are_correctly_encoded(self):
        # Regression test: django-countries' translated names are lazy
        # proxies; caching them in a module-level dict at import time (as
        # this endpoint originally did) evaluates them outside any
        # request's i18n context and mangles accented characters (e.g.
        # "España" -> "Espa�a"). Names must be resolved fresh per call.
        Person.objects.create(owner=self.owner, first_name="A", category="agent", current_country="ES")
        Person.objects.create(owner=self.owner, first_name="B", category="agent", current_country="MX")

        response = self.client.get("/api/map/countries/")
        by_code = {row["country"]: row["country_name"] for row in response.data["countries"]}
        self.assertEqual(by_code["ES"], "España")
        self.assertEqual(by_code["MX"], "México")

    def test_includes_clubs_in_the_country_total(self):
        city = City.objects.create(name="Madrid", country="ES", latitude=40.4, longitude=-3.7)
        Club.objects.create(owner=self.owner, name="Club Demo", country="ES", city=city)
        Person.objects.create(owner=self.owner, first_name="D", category="agent", current_country="ES")

        response = self.client.get("/api/map/countries/")
        by_code = {row["country"]: row["total"] for row in response.data["countries"]}
        self.assertEqual(by_code.get("ES"), 2)

    def test_scoped_to_the_authenticated_owner(self):
        other = User.objects.create_user(username="other", password="Sup3rSecret!")
        Person.objects.create(owner=other, first_name="Ajeno", category="agent", current_country="BR")

        response = self.client.get("/api/map/countries/")
        self.assertEqual(response.data["countries"], [])

    def test_contacts_without_a_country_are_not_counted(self):
        Person.objects.create(owner=self.owner, first_name="SinPais", category="agent")
        response = self.client.get("/api/map/countries/")
        self.assertEqual(response.data["countries"], [])
