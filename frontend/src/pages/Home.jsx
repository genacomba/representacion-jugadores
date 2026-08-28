import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { dashboardApi } from "../api/search";
import { mapApi } from "../api/map";
import { contactsApi } from "../api/contacts";
import { clubsApi } from "../api/clubs";
import PersonCard from "../components/contacts/PersonCard";
import ClubCard from "../components/clubs/ClubCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import HomeHeader from "../components/home/HomeHeader";
import CategoryCard from "../components/home/CategoryCard";
import ActivityFeed from "../components/home/ActivityFeed";
import { categoryMeta, HOME_CATEGORY_ORDER } from "../constants/categories";

// The pre-baked world map path data (~170KB) only needs to load once the
// rest of Home is already interactive, so it's split into its own chunk
// rather than weighing down the first screen a user sees after login.
const WorldMapPreview = lazy(() => import("../components/home/WorldMapPreview"));

function Section({ title, action, children }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data, loading, error, refetch, setData } = useApi(() => dashboardApi.get(), []);
  const [countries, setCountries] = useState(null);

  useEffect(() => {
    mapApi.countries().then((res) => setCountries(res.countries));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
  };

  const handleTogglePersonFavorite = async (person) => {
    const result = await contactsApi.toggleFavorite(person.id);
    setData((prev) => ({
      ...prev,
      favorite_people: result.is_favorite
        ? prev.favorite_people
        : prev.favorite_people.filter((p) => p.id !== person.id),
      in_negotiation: prev.in_negotiation.map((p) =>
        p.id === person.id ? { ...p, is_favorite: result.is_favorite } : p
      ),
    }));
  };

  const handleToggleClubFavorite = async (club) => {
    const result = await clubsApi.toggleFavorite(club.id);
    setData((prev) => ({
      ...prev,
      favorite_clubs: result.is_favorite
        ? prev.favorite_clubs
        : prev.favorite_clubs.filter((c) => c.id !== club.id),
    }));
  };

  return (
    <div>
      <HomeHeader />
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold text-ink-100">Inicio</h1>
        <p className="mt-0.5 text-sm text-ink-400">Tu memoria profesional del mercado de pases.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="flex items-center gap-2 rounded-2xl border border-gold-500/30 bg-pitch-850 px-4 py-4 shadow-inner">
          <SearchIcon size={22} className="shrink-0 text-gold-400" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador, club, representante..."
            className="w-full bg-transparent text-[16px] text-ink-100 placeholder:text-ink-500 outline-none"
          />
          <button
            type="button"
            onClick={() => navigate("/jugadores")}
            aria-label="Búsqueda avanzada de jugadores"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-gold-400"
          >
            <SlidersHorizontal size={16} strokeWidth={1.75} />
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-14 flex justify-center">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {data && (
        <>
          {(data.favorite_people.length > 0 || data.favorite_clubs.length > 0) && (
            <Section title="Favoritos" action={
              <button onClick={() => navigate("/favoritos")} className="text-xs font-medium text-gold-400">
                Ver todos
              </button>
            }>
              <div className="space-y-2">
                {data.favorite_people.slice(0, 4).map((p) => (
                  <PersonCard key={p.id} person={p} onToggleFavorite={handleTogglePersonFavorite} />
                ))}
                {data.favorite_clubs.slice(0, 4).map((c) => (
                  <ClubCard key={c.id} club={c} onToggleFavorite={handleToggleClubFavorite} />
                ))}
              </div>
            </Section>
          )}

          {data.in_negotiation.length > 0 && (
            <Section title="Jugadores en negociación">
              <div className="space-y-2">
                {data.in_negotiation.map((p) => (
                  <PersonCard key={p.id} person={p} onToggleFavorite={handleTogglePersonFavorite} />
                ))}
              </div>
            </Section>
          )}

          {data.recent.length > 0 && (
            <Section title="Consultados recientemente">
              <div className="space-y-2">
                {data.recent.map((item) =>
                  item.type === "person" ? (
                    <PersonCard key={`p-${item.id}`} person={item} onToggleFavorite={handleTogglePersonFavorite} />
                  ) : (
                    <ClubCard key={`c-${item.id}`} club={item} onToggleFavorite={handleToggleClubFavorite} />
                  )
                )}
              </div>
            </Section>
          )}

          {!data.favorite_people.length &&
            !data.favorite_clubs.length &&
            !data.in_negotiation.length &&
            !data.recent.length && (
              <EmptyState
                className="mt-8"
                title="Todavía no tenés actividad"
                description="Agregá tu primer contacto o explorá las categorías para empezar a construir tu agenda."
              />
            )}

          <Section title="Categorías">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {HOME_CATEGORY_ORDER.map((value) => {
                const category = categoryMeta(value);
                return (
                  <CategoryCard
                    key={value}
                    category={category}
                    count={data.category_counts[value] ?? 0}
                    onClick={() => navigate(`/categoria/${value}`)}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="Mapa global">
            {countries === null ? (
              <div className="flex justify-center rounded-2xl border border-pitch-600/70 bg-pitch-850 py-10">
                <LoadingSpinner />
              </div>
            ) : (
              <Suspense fallback={
                <div className="flex justify-center rounded-2xl border border-pitch-600/70 bg-pitch-850 py-10">
                  <LoadingSpinner />
                </div>
              }>
                <WorldMapPreview countries={countries} />
              </Suspense>
            )}
          </Section>

          {data.activity?.length > 0 && (
            <Section title="Últimos movimientos">
              <ActivityFeed activity={data.activity} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}
