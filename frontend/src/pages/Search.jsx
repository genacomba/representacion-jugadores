import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import { searchApi } from "../api/search";
import { contactsApi } from "../api/contacts";
import { clubsApi } from "../api/clubs";
import PersonCard from "../components/contacts/PersonCard";
import ClubCard from "../components/clubs/ClubCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import { extractErrorMessage } from "../api/client";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const debouncedQuery = useDebounce(query, 300);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setParams(debouncedQuery ? { q: debouncedQuery } : {}, { replace: true });
    if (!debouncedQuery.trim()) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchApi
      .global(debouncedQuery.trim())
      .then((data) => !cancelled && setResult(data))
      .catch((err) => !cancelled && setError(extractErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleTogglePersonFavorite = async (person) => {
    const res = await contactsApi.toggleFavorite(person.id);
    setResult((prev) => ({
      ...prev,
      people: prev.people.map((p) => (p.id === person.id ? { ...p, is_favorite: res.is_favorite } : p)),
    }));
  };

  const handleToggleClubFavorite = async (club) => {
    const res = await clubsApi.toggleFavorite(club.id);
    setResult((prev) => ({
      ...prev,
      clubs: prev.clubs.map((c) => (c.id === club.id ? { ...c, is_favorite: res.is_favorite } : c)),
    }));
  };

  const total = (result?.people?.length || 0) + (result?.clubs?.length || 0);

  return (
    <div>
      <PageHeader title="Buscar" />

      <div className="flex items-center gap-3 rounded-2xl border border-gold-500/30 bg-pitch-850 px-4 py-3.5">
        <SearchIcon size={20} className="shrink-0 text-gold-400" strokeWidth={1.75} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar jugador, club, representante, país, posición..."
          className="w-full bg-transparent text-[16px] text-ink-100 placeholder:text-ink-500 outline-none"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda">
            <X size={18} className="text-ink-500" />
          </button>
        )}
      </div>

      <div className="mt-5">
        {loading && (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        {!loading && !error && debouncedQuery.trim() && result && total === 0 && (
          <EmptyState
            icon={SearchIcon}
            title="Sin resultados"
            description={`No encontramos nada para "${debouncedQuery}". Probá con otro nombre, club, país o posición.`}
          />
        )}

        {!debouncedQuery.trim() && (
          <EmptyState
            icon={SearchIcon}
            title="Encontrá cualquier contacto en segundos"
            description='Probá con un nombre, un club, una nacionalidad o una posición, por ejemplo "delantero uruguay".'
          />
        )}

        {result?.people?.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
              Personas ({result.people.length})
            </h2>
            <div className="space-y-2">
              {result.people.map((p) => (
                <PersonCard key={p.id} person={p} onToggleFavorite={handleTogglePersonFavorite} />
              ))}
            </div>
          </div>
        )}

        {result?.clubs?.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
              Clubes ({result.clubs.length})
            </h2>
            <div className="space-y-2">
              {result.clubs.map((c) => (
                <ClubCard key={c.id} club={c} onToggleFavorite={handleToggleClubFavorite} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
