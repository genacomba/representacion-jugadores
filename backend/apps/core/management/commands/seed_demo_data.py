"""
Populates the database with fictional demo data (section 25): enough
players, agents, directors, coaching staff, ex-players, football-environment
contacts and clubs -- spread across Argentina, Uruguay, Brazil, Spain, Italy
and Mexico -- to exercise search, filters, the map, relationships, favorites
and interaction history end to end. No real people are represented.

Idempotent-ish: safe to re-run, but re-running will create additional
duplicate people/clubs since matching is done loosely by name; intended to
be run once against a fresh database (see README).
"""

import random
from datetime import date, timedelta

from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.clubs.models import Club
from apps.contacts.models import Person, Relationship, RelationshipType
from apps.interactions.models import Interaction
from apps.locations.models import City
from apps.players.models import PlayerProfile, PlayerStatus, Position
from apps.resources.models import Resource

RNG = random.Random(42)

POSITIONS = [
    ("gk", "Arquero"), ("rb", "Lateral derecho"), ("lb", "Lateral izquierdo"),
    ("cb", "Defensor central"), ("dm", "Mediocampista defensivo"),
    ("cm", "Mediocampista central"), ("am", "Mediocampista ofensivo"),
    ("rw", "Extremo derecho"), ("lw", "Extremo izquierdo"),
    ("fw", "Delantero"), ("cf", "Delantero centro"),
]

PLAYER_STATUSES = [
    ("free", "Libre"), ("in_folder", "En carpeta"), ("offered", "Ofrecido"),
    ("negotiating", "En negociación"), ("represented", "Representado"),
    ("discarded", "Descartado"),
]

RELATIONSHIP_TYPES = [
    ("recommended", "Recomendó a", "Recomendado por"),
    ("knows_at_club", "Conoce en el club a", "Conocido en el club por"),
    ("family", "Familiar de", "Familiar de"),
    ("friend", "Amigo de", "Amigo de"),
    ("former_teammate", "Ex compañero de", "Ex compañero de"),
    ("trusted_contact", "Contacto de confianza en", "Tiene como contacto de confianza a"),
]

CITIES = {
    "AR": [
        ("Buenos Aires", -34.6037, -58.3816), ("Córdoba", -31.4201, -64.1888),
        ("Rosario", -32.9468, -60.6393), ("La Plata", -34.9215, -57.9545),
    ],
    "UY": [("Montevideo", -34.9011, -56.1645), ("Salto", -31.3833, -57.9667)],
    "BR": [
        ("São Paulo", -23.5505, -46.6333), ("Rio de Janeiro", -22.9068, -43.1729),
        ("Porto Alegre", -30.0346, -51.2177), ("Belo Horizonte", -19.9167, -43.9345),
    ],
    "ES": [
        ("Madrid", 40.4168, -3.7038), ("Barcelona", 41.3851, 2.1734),
        ("Sevilla", 37.3891, -5.9845), ("Valencia", 39.4699, -0.3763),
    ],
    "IT": [
        ("Roma", 41.9028, 12.4964), ("Milán", 45.4642, 9.1900),
        ("Turín", 45.0703, 7.6869), ("Nápoles", 40.8518, 14.2681),
    ],
    "MX": [
        ("Ciudad de México", 19.4326, -99.1332), ("Guadalajara", 20.6597, -103.3496),
        ("Monterrey", 25.6866, -100.3161),
    ],
}

CLUBS = [
    ("Club Atlético Provincial", "AR", "Buenos Aires"),
    ("Deportivo Sarmiento del Sur", "AR", "Rosario"),
    ("Club Oriental de Montevideo", "UY", "Montevideo"),
    ("Deportivo Salto FC", "UY", "Salto"),
    ("Estrela do Sul FC", "BR", "São Paulo"),
    ("Porto Alegre Atlético Clube", "BR", "Porto Alegre"),
    ("Real Unión Castilla", "ES", "Madrid"),
    ("Club Deportivo Mediterráneo", "ES", "Valencia"),
    ("Associazione Calcio Vesuvio", "IT", "Nápoles"),
    ("Torino Nord Calcio", "IT", "Turín"),
    ("Águilas del Bajío FC", "MX", "Guadalajara"),
    ("Deportivo Pacífico", "MX", "Ciudad de México"),
]

NAME_POOLS = {
    "AR": {
        "first": ["Juan", "Mateo", "Lautaro", "Franco", "Nicolás", "Tomás", "Agustín", "Bruno",
                  "Ezequiel", "Ignacio", "Valentino", "Thiago", "Santino", "Ramiro"],
        "last": ["Pérez", "Gómez", "Fernández", "Rodríguez", "Sosa", "Acosta", "Medina", "Silva",
                 "Molina", "Ferreyra", "Aguirre", "Benítez", "Cardozo", "Villalba"],
    },
    "UY": {
        "first": ["Diego", "Federico", "Rodrigo", "Nahuel", "Maximiliano", "Joaquín", "Bruno"],
        "last": ["Methol", "Pereira", "Cabrera", "Olivera", "Techera", "Bentancor", "Machado"],
    },
    "BR": {
        "first": ["Gabriel", "Lucas", "Matheus", "Pedro", "Rafael", "Gustavo", "Vinícius", "Caio"],
        "last": ["Silva", "Souza", "Oliveira", "Santos", "Costa", "Pereira", "Almeida", "Carvalho"],
    },
    "ES": {
        "first": ["Álvaro", "Sergio", "Pablo", "Iker", "Marcos", "Adrián", "Diego", "Hugo"],
        "last": ["García", "Martínez", "López", "Sánchez", "Romero", "Torres", "Navarro", "Iglesias"],
    },
    "IT": {
        "first": ["Matteo", "Lorenzo", "Andrea", "Francesco", "Marco", "Davide", "Alessandro"],
        "last": ["Rossi", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci"],
    },
    "MX": {
        "first": ["Santiago", "Emiliano", "Diego", "Ángel", "Jesús", "Iván", "Carlos"],
        "last": ["Hernández", "García", "Martínez", "López", "González", "Ramírez", "Torres"],
    },
}

NICKNAMES = ["Tato", "Cuchu", "Toro", "Chino", "Pipa", "Fideo", "Colo", "Vasco", "Negro", "Flaco"]

COUNTRIES = list(NAME_POOLS.keys())

AMBIENTE_ROLES = [
    "Periodista deportivo", "Preparador físico independiente", "Nutricionista deportivo",
    "Abogado especializado en fútbol", "Empresario vinculado al fútbol", "Fotógrafo deportivo",
]
STAFF_ROLES = ["Entrenador principal", "Ayudante de campo", "Preparador de arqueros", "Analista de video"]
DIRECTOR_ROLES = ["Presidente", "Vicepresidente", "Secretario general", "Vocal"]

INTERACTION_SNIPPETS = [
    ("whatsapp", "Hablamos por WhatsApp, está buscando opciones para el próximo semestre."),
    ("call", "Llamada breve para coordinar una videollamada con el club."),
    ("meeting", "Nos reunimos para charlar sobre su situación contractual."),
    ("note", "Me comentaron que podría quedar libre a fin de temporada."),
    ("email", "Envió por email la ficha actualizada y videos recientes."),
    ("whatsapp", "Consultó si tengo laterales izquierdos Sub-23 disponibles."),
]


def used_full_names():
    return set()


class Command(BaseCommand):
    help = "Loads lookup tables and fictional demo data."

    def handle(self, *args, **options):
        owner = User.objects.filter(is_superuser=True).order_by("date_joined").first()
        if not owner:
            self.stderr.write("No superuser found. Run createsuperuser first.")
            return

        positions = self._seed_positions()
        statuses = self._seed_statuses()
        self._seed_relationship_types()
        cities = self._seed_cities()
        clubs = self._seed_clubs(owner, cities)
        people = self._seed_people(owner, cities, clubs, positions, statuses)
        self._seed_relationships(owner, people, clubs)
        self._seed_interactions(owner, people, clubs)
        self._seed_resources(owner, people)

        self.stdout.write(self.style.SUCCESS(
            f"Seed completo: {len(clubs)} clubes, {len(people)} personas."
        ))

    def _seed_positions(self):
        result = {}
        for order, (code, name) in enumerate(POSITIONS):
            obj, _ = Position.objects.get_or_create(code=code, defaults={"name": name, "order": order})
            result[code] = obj
        return result

    def _seed_statuses(self):
        result = {}
        for order, (code, name) in enumerate(PLAYER_STATUSES):
            obj, _ = PlayerStatus.objects.get_or_create(code=code, defaults={"name": name, "order": order})
            result[code] = obj
        return result

    def _seed_relationship_types(self):
        for code, label, inverse in RELATIONSHIP_TYPES:
            RelationshipType.objects.get_or_create(
                code=code, defaults={"label": label, "inverse_label": inverse}
            )

    def _seed_cities(self):
        result = {}
        for country, city_list in CITIES.items():
            for name, lat, lng in city_list:
                obj, _ = City.objects.get_or_create(
                    name=name, country=country, admin_area="",
                    defaults={"latitude": lat, "longitude": lng},
                )
                result[(country, name)] = obj
        return result

    def _seed_clubs(self, owner, cities):
        clubs = []
        for name, country, city_name in CLUBS:
            club, _ = Club.objects.get_or_create(
                name=name, owner=owner,
                defaults={
                    "country": country,
                    "city": cities[(country, city_name)],
                    "website": f"https://www.{name.lower().replace(' ', '')}.example.com",
                    "notes": "Club ficticio de demostración.",
                },
            )
            clubs.append(club)
        return clubs

    def _random_city(self, cities, country):
        candidates = [c for (co, _), c in cities.items() if co == country]
        return RNG.choice(candidates)

    def _make_name(self, country, seen):
        pool = NAME_POOLS[country]
        for _ in range(20):
            first = RNG.choice(pool["first"])
            last = RNG.choice(pool["last"])
            key = (country, first, last)
            if key not in seen:
                seen.add(key)
                return first, last
        return first, f"{last}-{RNG.randint(100, 999)}"

    def _seed_people(self, owner, cities, clubs, positions, statuses):
        seen_names = set()
        people = []
        clubs_by_country = {}
        for club in clubs:
            clubs_by_country.setdefault(str(club.country), []).append(club)

        today = date.today()

        def birth_date_for_age(age):
            return today.replace(year=today.year - age, day=min(today.day, 28)) - timedelta(days=RNG.randint(0, 300))

        # --- Players: ~4 per position across the six countries ---
        position_codes = list(positions.keys())
        players_created = 0
        for i in range(46):
            country = COUNTRIES[i % len(COUNTRIES)]
            pos_code = position_codes[i % len(position_codes)]
            first, last = self._make_name(country, seen_names)
            age = RNG.randint(17, 33)
            club = RNG.choice(clubs_by_country[country]) if RNG.random() < 0.8 else None
            status_code = RNG.choice(["free", "in_folder", "offered", "negotiating", "represented", "discarded"])

            person = Person.objects.create(
                owner=owner,
                first_name=first, last_name=last,
                nickname=RNG.choice(NICKNAMES) if RNG.random() < 0.3 else "",
                category=Person.Category.PLAYER,
                birth_date=birth_date_for_age(age),
                nationality=country,
                current_country=country,
                current_city=self._random_city(cities, country),
                phone=f"+{RNG.randint(1,99)} {RNG.randint(1000000,9999999)}",
                whatsapp=f"+{RNG.randint(1,99)} {RNG.randint(1000000,9999999)}",
                email=f"{first.lower()}.{last.lower()}@example.com",
                current_club=club,
                is_favorite=RNG.random() < 0.12,
                notes="Jugador ficticio generado para demostración." if RNG.random() < 0.3 else "",
                how_met=RNG.choice([
                    "Lo vi jugar en un torneo juvenil.",
                    "Me lo recomendó un colega representante.",
                    "Contacto directo por Instagram.",
                    "Lo conocí en una gira de scouting.",
                ]),
            )
            contract_until = None
            if status_code != "free" and RNG.random() < 0.7:
                contract_until = today + timedelta(days=RNG.randint(-200, 900))

            PlayerProfile.objects.create(
                person=person,
                primary_position=positions[pos_code],
                secondary_position=RNG.choice(list(positions.values())) if RNG.random() < 0.4 else None,
                preferred_foot=RNG.choice(["right", "left", "both"]),
                has_eu_passport=country in ("ES", "IT") or RNG.random() < 0.15,
                contract_until=contract_until,
                status=statuses[status_code],
            )
            people.append(person)
            players_created += 1

        # --- Agents/representatives ---
        agents = []
        for i in range(10):
            country = COUNTRIES[i % len(COUNTRIES)]
            first, last = self._make_name(country, seen_names)
            person = Person.objects.create(
                owner=owner,
                first_name=first, last_name=last,
                category=Person.Category.AGENT,
                nationality=country,
                current_country=country,
                current_city=self._random_city(cities, country),
                phone=f"+{RNG.randint(1,99)} {RNG.randint(1000000,9999999)}",
                whatsapp=f"+{RNG.randint(1,99)} {RNG.randint(1000000,9999999)}",
                email=f"{first.lower()}.{last.lower()}@agencia.example.com",
                role_title="Representante FIFA",
                is_favorite=RNG.random() < 0.2,
            )
            agents.append(person)
            people.append(person)

        # Assign some players a representative + status "represented"
        represented_status = statuses["represented"]
        for person in RNG.sample([p for p in people if p.category == Person.Category.PLAYER], 18):
            agent = RNG.choice(agents)
            profile = person.player_profile
            profile.represented_by = agent
            profile.status = represented_status
            profile.save(update_fields=["represented_by", "status"])

        # --- Directors (dirigentes) ---
        for i in range(8):
            country = COUNTRIES[i % len(COUNTRIES)]
            first, last = self._make_name(country, seen_names)
            club = RNG.choice(clubs_by_country[country])
            person = Person.objects.create(
                owner=owner,
                first_name=first, last_name=last,
                category=Person.Category.DIRECTOR,
                nationality=country, current_country=country,
                current_city=self._random_city(cities, country),
                phone=f"+{RNG.randint(1,99)} {RNG.randint(1000000,9999999)}",
                email=f"{first.lower()}.{last.lower()}@{club.name.lower().replace(' ', '')}.example.com",
                current_club=club,
                role_title=RNG.choice(DIRECTOR_ROLES),
            )
            people.append(person)

        # --- Sporting directors ---
        for i in range(8):
            country = COUNTRIES[i % len(COUNTRIES)]
            first, last = self._make_name(country, seen_names)
            club = RNG.choice(clubs_by_country[country])
            person = Person.objects.create(
                owner=owner,
                first_name=first, last_name=last,
                category=Person.Category.SPORTING_DIRECTOR,
                nationality=country, current_country=country,
                current_city=self._random_city(cities, country),
                phone=f"+{RNG.randint(1,99)} {RNG.randint(1000000,9999999)}",
                email=f"{first.lower()}.{last.lower()}@{club.name.lower().replace(' ', '')}.example.com",
                current_club=club,
                role_title="Director deportivo",
                is_favorite=RNG.random() < 0.15,
            )
            people.append(person)

        # --- Coaching staff ---
        for i in range(8):
            country = COUNTRIES[i % len(COUNTRIES)]
            first, last = self._make_name(country, seen_names)
            club = RNG.choice(clubs_by_country[country])
            person = Person.objects.create(
                owner=owner,
                first_name=first, last_name=last,
                category=Person.Category.COACHING_STAFF,
                nationality=country, current_country=country,
                current_city=self._random_city(cities, country),
                phone=f"+{RNG.randint(1,99)} {RNG.randint(1000000,9999999)}",
                current_club=club,
                role_title=RNG.choice(STAFF_ROLES),
            )
            people.append(person)

        # --- Ex players ---
        for i in range(6):
            country = COUNTRIES[i % len(COUNTRIES)]
            first, last = self._make_name(country, seen_names)
            person = Person.objects.create(
                owner=owner,
                first_name=first, last_name=last,
                category=Person.Category.EX_PLAYER,
                birth_date=birth_date_for_age(RNG.randint(38, 55)),
                nationality=country, current_country=country,
                current_city=self._random_city(cities, country),
                phone=f"+{RNG.randint(1,99)} {RNG.randint(1000000,9999999)}",
                role_title="Ex jugador profesional",
                notes="Hoy trabaja como ojeador independiente." if RNG.random() < 0.5 else "",
            )
            people.append(person)

        # --- Football environment ---
        for i in range(6):
            country = COUNTRIES[i % len(COUNTRIES)]
            first, last = self._make_name(country, seen_names)
            person = Person.objects.create(
                owner=owner,
                first_name=first, last_name=last,
                category=Person.Category.ENVIRONMENT,
                nationality=country, current_country=country,
                current_city=self._random_city(cities, country),
                phone=f"+{RNG.randint(1,99)} {RNG.randint(1000000,9999999)}",
                role_title=RNG.choice(AMBIENTE_ROLES),
            )
            people.append(person)

        # --- referred_by: ~35% of people were referred by another contact ---
        all_ids = [p.id for p in people]
        for person in RNG.sample(people, int(len(people) * 0.35)):
            candidate_id = RNG.choice(all_ids)
            if candidate_id != person.id:
                person.referred_by_id = candidate_id
                person.save(update_fields=["referred_by"])

        return people

    def _seed_relationships(self, owner, people, clubs):
        rel_types = {rt.code: rt for rt in RelationshipType.objects.all()}
        person_ct = ContentType.objects.get_for_model(Person)
        club_ct = ContentType.objects.get_for_model(Club)

        directors = [p for p in people if p.category == Person.Category.SPORTING_DIRECTOR]
        players = [p for p in people if p.category == Person.Category.PLAYER]
        agents = [p for p in people if p.category == Person.Category.AGENT]

        pairs = []
        for _ in range(10):
            if directors and players:
                pairs.append((RNG.choice(directors), RNG.choice(players), "knows_at_club"))
        for _ in range(6):
            if players and len(players) > 1:
                a, b = RNG.sample(players, 2)
                pairs.append((a, b, RNG.choice(["friend", "former_teammate"])))
        for _ in range(6):
            if agents and directors:
                pairs.append((RNG.choice(agents), RNG.choice(directors), "trusted_contact"))

        for from_person, to_person, rel_code in pairs:
            Relationship.objects.get_or_create(
                owner=owner,
                from_content_type=person_ct, from_object_id=from_person.id,
                to_content_type=person_ct, to_object_id=to_person.id,
                relationship_type=rel_types[rel_code],
            )

    def _seed_interactions(self, owner, people, clubs):
        today = timezone.localdate()
        sample_people = RNG.sample(people, min(35, len(people)))
        for person in sample_people:
            for _ in range(RNG.randint(1, 3)):
                interaction_type, text = RNG.choice(INTERACTION_SNIPPETS)
                Interaction.objects.create(
                    owner=owner,
                    content_type=ContentType.objects.get_for_model(Person),
                    object_id=person.id,
                    date=today - timedelta(days=RNG.randint(0, 220)),
                    interaction_type=interaction_type,
                    text=text,
                )
        for club in RNG.sample(clubs, min(6, len(clubs))):
            Interaction.objects.create(
                owner=owner,
                content_type=ContentType.objects.get_for_model(Club),
                object_id=club.id,
                date=today - timedelta(days=RNG.randint(0, 180)),
                interaction_type="call",
                text="Charla con el club sobre necesidades del próximo mercado.",
            )

    def _seed_resources(self, owner, people):
        players = [p for p in people if p.category == Person.Category.PLAYER]
        for person in RNG.sample(players, min(15, len(players))):
            Resource.objects.create(
                owner=owner,
                content_type=ContentType.objects.get_for_model(Person),
                object_id=person.id,
                resource_type=RNG.choice(["transfermarkt", "youtube", "wyscout"]),
                title=f"Perfil / video de {person.full_name}",
                url="https://www.example.com/demo-recurso",
                notes="Enlace de demostración.",
            )
