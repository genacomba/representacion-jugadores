# SCgroup

CRM privado para un representante de jugadores de fútbol profesional. No es una
red social: no hay perfiles públicos, seguidores ni publicaciones. Es una
herramienta de trabajo pensada para una sola prioridad — encontrar cualquier
contacto de la agenda en segundos, incluso en medio de una llamada.

## Qué resuelve

- **Memoria profesional**: guarda personas (jugadores, representantes,
  dirigentes, directores deportivos, cuerpo técnico, ex jugadores, ambiente
  del fútbol) y clubes, con quién los conoció, quién se los presentó, y todo
  el historial de interacciones.
- **Buscador global**: una barra de búsqueda que cruza nombre, apodo,
  posición, nacionalidad, club y categoría en una sola consulta (ej.
  "delantero uruguay").
- **Búsqueda avanzada de jugadores** ("Necesito un jugador"): filtros
  combinables (posición, edad, nacionalidad, club, pasaporte comunitario,
  situación contractual, estado) reflejados en la URL.
- **Relaciones**: un jugador puede tener representante, club actual, quién lo
  recomendó, y vínculos adicionales arbitrarios (conoce en el club, familiar
  de, ex compañero de, etc.), todos navegables entre fichas.
- **Mapa mundial 3D**: un globo interactivo (react-globe.gl) con los
  contactos agrupados por ciudad — ubicación aproximada por país/ciudad,
  nunca por GPS.
- **PWA**: instalable en el iPhone desde Safari ("Agregar a pantalla de
  inicio"), mobile-first, con safe areas de iOS.

## Arquitectura

```
backend/    Django + Django REST Framework + JWT, SQLite en desarrollo
            (Postgres-ready vía DATABASE_URL)
frontend/   React + Vite + Tailwind CSS v4 (JavaScript, sin TypeScript)
```

### Backend — apps de Django

| App            | Responsabilidad                                                        |
|----------------|-------------------------------------------------------------------------|
| `core`         | Modelos base (`OwnedModel`, timestamps), paginación, `RecentView`, dashboard |
| `accounts`     | Usuario custom, login/refresh/logout con JWT (SimpleJWT)                |
| `locations`    | `City` (con lat/lng curadas) + lista de países (django-countries)       |
| `contacts`     | `Person`, `Relationship` (genérico, vía content types), `RelationshipType` |
| `players`      | `Position`, `PlayerStatus` (lookups editables), `PlayerProfile`, búsqueda avanzada |
| `clubs`        | `Club`                                                                   |
| `interactions` | Historial de actividad (llamadas, WhatsApp, reuniones, notas...)         |
| `resources`    | Enlaces/documentos genéricos (Wyscout, Transfermarkt, YouTube, contratos)|
| `search`       | Buscador global multi-palabra                                           |
| `mapdata`      | Agregación de contactos por ciudad para el globo                        |

**Decisiones de diseño relevantes** (documentadas también como docstrings en el código):

- **Personas vs. clubes son modelos separados**: un club nunca se trata como
  una persona, pero el buscador global devuelve ambos.
- **Autenticación por JWT** (no cookies de sesión): evita fricción de
  CORS/CSRF entre el SPA y la API, y funciona de forma confiable en el modo
  standalone de una PWA en iOS. `POST /api/auth/token/` devuelve
  `access`/`refresh` + los datos del usuario; el logout invalida el refresh
  token (blacklist).
- **Relaciones flexibles**: además de FKs directas y rápidas para los casos
  más comunes (`Person.current_club`, `Person.referred_by`,
  `PlayerProfile.represented_by`), existe un modelo `Relationship` genérico
  (vía `django.contrib.contenttypes`) para vínculos arbitrarios y ampliables
  entre cualquier persona/club.
- **Posiciones y estados de jugador como tablas, no choices fijos**
  (`Position`, `PlayerStatus`): se pueden ampliar desde el admin sin tocar
  código.
- **Ciudades normalizadas**: `City` es una tabla propia con
  latitud/longitud precargadas, para evitar duplicados tipo "Buenos
  Aires"/"CABA"/"Bs As". El país usa la lista ISO estructurada de
  `django-countries` (sin geocodificación externa). Si una ciudad no existe
  en el dataset, se puede crear al vuelo desde el formulario, sin
  coordenadas — no aparecerá en el mapa hasta que un admin le cargue
  latitud/longitud.
- **Mapa agregado por ciudad**: para evitar decenas de marcadores
  superpuestos, el backend agrupa contactos por ciudad y expone conteos por
  categoría; el frontend dibuja un marcador por ciudad con la cantidad, y al
  tocarlo abre el listado real de contactos.
- **Todos los datos pertenecen a un `owner`**: hoy hay un solo usuario
  administrador, pero cada `Person`, `Club`, `Relationship`, `Interaction` y
  `Resource` tiene dueño, para soportar múltiples usuarios en el futuro sin
  migrar datos.

### Frontend — estructura

```
src/
  api/          cliente axios (con refresh automático de JWT) + un módulo por recurso
  context/      AuthContext
  hooks/        useApi, useDebounce, useCountries
  layouts/      AppLayout (bottom nav en mobile, sidebar en desktop)
  components/
    common/     Button, Field/Input/Select, Card, Badge, Avatar, CityPicker,
                PersonPicker, FavoriteButton, EmptyState, ErrorMessage...
    contacts/   PersonCard, PersonForm (formulario adaptable por categoría), QuickActions
    clubs/      ClubCard, ClubForm
    map/        MapLegend, CityPanel
    shared/     InteractionSection, ResourceSection, RelationshipSection
                (reutilizados por fichas de Persona y de Club)
  pages/        una página por ruta (Home, Search, AdvancedPlayerSearch,
                AddContact, ContactForm, ContactDetail, ClubDetail, MapPage,
                More, CategoryList, Favorites, Login, NotFound)
  constants/    categorías (colores/labels compartidos entre badges,
                selector de "Agregar" y leyenda del mapa)
```

El globo 3D (`react-globe.gl` + `three.js`) se carga con `React.lazy()` sólo
al entrar a `/mapa`, para no inflar el bundle inicial en un iPhone. Home tiene
además un mapa plano de resumen ("Mapa global", `components/home/WorldMapPreview.jsx`,
también con `React.lazy()`) con los contactos agrupados por país — es una
vista distinta y más liviana, no un reemplazo del globo. Sus datos
(contorno de países + posición de cada marcador) están precalculados en
`src/constants/worldMap.js` mediante `scripts/generate-world-map.mjs`
(devDependencies `d3-geo`/`topojson-client`/`world-atlas`/`i18n-iso-countries`,
no usadas en runtime); volver a ejecutarlo sólo si hiciera falta cambiar la
resolución/proyección del mapa.

## Requisitos

- Python 3.11+ (probado con 3.14)
- Node.js 20+ (probado con 24)
- PostgreSQL 14+ (opcional en desarrollo; ver más abajo)

## Instalación — Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # completar SECRET_KEY, ver variables abajo

python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo_data   # datos ficticios de demostración (opcional)

python manage.py runserver
```

La API queda en `http://localhost:8000/api/`. El admin de Django en
`http://localhost:8000/admin/` (útil para ampliar `Position`, `PlayerStatus`,
`RelationshipType`, o corregir coordenadas de una `City` creada sin
geocodificar).

### Base de datos

Por defecto, sin `DATABASE_URL` configurada, se usa un archivo SQLite local
(`backend/db.sqlite3`) — suficiente para desarrollo. La arquitectura ya está
lista para PostgreSQL: basta con definir `DATABASE_URL` en `.env`, por
ejemplo:

```
DATABASE_URL=postgres://mercado_user:mercado_pass@localhost:5432/mercado_de_pases
```

y volver a correr `python manage.py migrate`.

### Variables de entorno (`backend/.env`)

Ver `backend/.env.example` para la lista completa y comentada. Las más
relevantes:

| Variable                | Descripción                                                |
|--------------------------|------------------------------------------------------------|
| `SECRET_KEY`             | Clave secreta de Django. Generar una propia en producción. |
| `DEBUG`                  | `True` en desarrollo, `False` en producción.               |
| `DATABASE_URL`           | Vacío = SQLite local. Con valor = Postgres (u otro soportado por `dj-database-url`). |
| `CORS_ALLOWED_ORIGINS`   | Orígenes del frontend autorizados a llamar a la API.        |
| `CSRF_TRUSTED_ORIGINS`   | Idem, para las pocas vistas que usan sesión (admin de Django). |
| `JWT_ACCESS_MINUTES` / `JWT_REFRESH_DAYS` | Vigencia de los tokens.                    |

Nunca se sube `.env` al repositorio (ver `.gitignore`).

## Instalación — Frontend

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL, por defecto http://localhost:8000/api
npm run dev
```

La app queda en `http://localhost:5173/`. Iniciar sesión con el usuario
administrador creado en el backend.

## Datos de demostración

`python manage.py seed_demo_data` carga, además de los catálogos
(posiciones, estados de jugador, tipos de relación), contactos y clubes
**ficticios** distribuidos en Argentina, Uruguay, Brasil, España, Italia y
México, con distintas categorías, posiciones, edades, estados contractuales,
relaciones, historial de interacciones y algunos favoritos — pensado para
poder probar de inmediato el buscador, los filtros, el mapa y las
relaciones. Ningún dato corresponde a personas reales.

## Tests

Backend:

```bash
cd backend
python manage.py test apps
```

Cubre autenticación (login/logout/refresh), aislamiento por `owner` (un
usuario no puede ver ni editar contactos de otro), CRUD de personas y
clubes, el buscador global (multi-palabra, case-insensitive, cruzando
campos), los filtros combinados del buscador avanzado de jugadores, y la
creación/consulta de relaciones e interacciones.

Frontend:

```bash
cd frontend
npm run test
```

Cubre los constructores de enlaces rápidos (tel/WhatsApp/email/Instagram),
el formateo de fechas relativas ("último contacto"), el mapeo de categorías,
y comportamiento de componentes críticos (`PersonCard`, `FavoriteButton`,
`AuthContext`: login, restauración de sesión, logout).

## Build de producción

```bash
cd frontend
npm run build    # genera frontend/dist, incluyendo manifest.json y service worker
npm run preview  # sirve el build localmente para verificarlo
```

El globo 3D se compila en un chunk separado (carga diferida) para mantener
liviano el paquete inicial en conexiones móviles.

Para el backend en producción: configurar `DEBUG=False`, una `DATABASE_URL`
de Postgres, `ALLOWED_HOSTS`, y servir estáticos con
`python manage.py collectstatic`.

## PWA / iPhone

1. Abrir la URL del frontend desplegado en Safari (iOS).
2. Tocar **Compartir** → **Agregar a pantalla de inicio**.
3. La app abre en modo standalone (sin la barra de Safari), con ícono propio
   y respetando los "safe areas" del notch/home indicator.

En desarrollo local el service worker está activo también con `npm run dev`
gracias a `vite-plugin-pwa`; las llamadas a `/api/` nunca se cachean
(`NetworkOnly`), para no mostrar nunca datos desactualizados de la agenda.

## Seguridad y privacidad

- Todas las rutas de la API requieren autenticación JWT; no existe registro
  público de usuarios (el admin se crea por `createsuperuser`).
- Cada registro pertenece a un `owner`; los querysets siempre filtran por el
  usuario autenticado.
- La ubicación de los contactos es siempre aproximada (país + ciudad
  precargada), nunca se usa el GPS del dispositivo ni se pretende conocer una
  dirección exacta — el mapa lo aclara explícitamente en su encabezado.
