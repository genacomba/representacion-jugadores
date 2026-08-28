import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, SlidersHorizontal, Globe2, ChevronRight } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { dashboardApi } from "../api/search";
import { contactsApi } from "../api/contacts";
import { clubsApi } from "../api/clubs";
import PersonCard from "../components/contacts/PersonCard";
import ClubCard from "../components/clubs/ClubCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { PERSON_CATEGORIES } from "../constants/categories";

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
      <div className="pt-2">
        <p className="font-serif text-2xl font-semibold text-gold-400">Mercado de Pases</p>
        <p className="mt-0.5 text-sm text-ink-400">Tu memoria profesional del mercado de pases.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="flex items-center gap-3 rounded-2xl border border-gold-500/30 bg-pitch-850 px-4 py-4 shadow-inner">
          <SearchIcon size={22} className="shrink-0 text-gold-400" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador, club, representante, país, posición..."
            className="w-full bg-transparent text-[16px] text-ink-100 placeholder:text-ink-500 outline-none"
          />
        </div>
      </form>

      <button
        onClick={() => navigate("/jugadores")}
        className="mt-3 flex w-full items-center justify-between rounded-2xl border border-pitch-600/70 bg-pitch-850 px-4 py-3 text-left transition-colors hover:border-gold-500/40"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-ink-200">
          <SlidersHorizontal size={18} className="text-gold-400" />
          Necesito un jugador — búsqueda avanzada
        </span>
        <ChevronRight size={18} className="text-ink-500" />
      </button>

      <button
        onClick={() => navigate("/mapa")}
        className="mt-3 flex w-full items-center justify-between rounded-2xl border border-pitch-600/70 bg-pitch-850 px-4 py-3 text-left transition-colors hover:border-gold-500/40"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-ink-200">
          <Globe2 size={18} className="text-gold-400" />
          Ver mapa mundial de contactos
        </span>
        <ChevronRight size={18} className="text-ink-500" />
      </button>

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

          <Section title="Categorías">
            <div className="grid grid-cols-2 gap-2.5">
              {PERSON_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => navigate(`/categoria/${cat.value}`)}
                  className="flex items-center justify-between rounded-xl border border-pitch-600/70 bg-pitch-850 px-3.5 py-3 text-left transition-colors hover:border-gold-500/40"
                >
                  <span className="text-sm text-ink-200">{cat.short}</span>
                  <span className="text-xs font-semibold text-ink-500">
                    {data.category_counts[cat.value] ?? 0}
                  </span>
                </button>
              ))}
              <button
                onClick={() => navigate("/categoria/club")}
                className="flex items-center justify-between rounded-xl border border-pitch-600/70 bg-pitch-850 px-3.5 py-3 text-left transition-colors hover:border-gold-500/40"
              >
                <span className="text-sm text-ink-200">Clubes</span>
                <span className="text-xs font-semibold text-ink-500">{data.category_counts.club ?? 0}</span>
              </button>
            </div>
          </Section>

          {!data.favorite_people.length &&
            !data.favorite_clubs.length &&
            !data.in_negotiation.length &&
            !data.recent.length && (
              <EmptyState
                title="Todavía no tenés actividad"
                description="Agregá tu primer contacto o explorá las categorías para empezar a construir tu agenda."
              />
            )}
        </>
      )}
    </div>
  );
}
