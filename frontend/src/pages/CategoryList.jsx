import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { contactsApi } from "../api/contacts";
import { clubsApi } from "../api/clubs";
import { extractErrorMessage } from "../api/client";
import PersonCard from "../components/contacts/PersonCard";
import ClubCard from "../components/clubs/ClubCard";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import Button from "../components/common/Button";
import { categoryMeta } from "../constants/categories";

export default function CategoryList() {
  const { category } = useParams();
  const isClub = category === "club";
  const meta = categoryMeta(category);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const fetchList = () => {
    setLoading(true);
    setError(null);
    const params = { page_size: 20, ...(favoritesOnly ? { is_favorite: true } : {}) };
    const request = isClub ? clubsApi.list(params) : contactsApi.list({ ...params, category });
    request
      .then(setResult)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(fetchList, [category, favoritesOnly]);

  const loadMore = () => {
    if (!result?.next) return;
    const url = new URL(result.next);
    const request = isClub
      ? clubsApi.list(Object.fromEntries(url.searchParams))
      : contactsApi.list(Object.fromEntries(url.searchParams));
    request.then((next) => setResult((prev) => ({ ...next, results: [...prev.results, ...next.results] })));
  };

  const handleTogglePersonFavorite = async (person) => {
    const res = await contactsApi.toggleFavorite(person.id);
    setResult((prev) => ({
      ...prev,
      results: prev.results.map((p) => (p.id === person.id ? { ...p, is_favorite: res.is_favorite } : p)),
    }));
  };

  const handleToggleClubFavorite = async (club) => {
    const res = await clubsApi.toggleFavorite(club.id);
    setResult((prev) => ({
      ...prev,
      results: prev.results.map((c) => (c.id === club.id ? { ...c, is_favorite: res.is_favorite } : c)),
    }));
  };

  return (
    <div>
      <PageHeader
        title={isClub ? "Clubes" : meta.label}
        subtitle={result ? `${result.count} en tu agenda` : undefined}
        back
      />

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFavoritesOnly((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            favoritesOnly ? "border-gold-400 text-gold-400" : "border-pitch-600 text-ink-400"
          }`}
        >
          ★ Solo favoritos
        </button>
      </div>

      {loading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
      {error && <ErrorMessage message={error} onRetry={fetchList} />}

      {!loading && !error && result && (
        result.results.length === 0 ? (
          <EmptyState title="No hay resultados" description="Todavía no agregaste contactos en esta categoría." />
        ) : (
          <>
            <div className="space-y-2">
              {result.results.map((item) =>
                isClub ? (
                  <ClubCard key={item.id} club={item} onToggleFavorite={handleToggleClubFavorite} />
                ) : (
                  <PersonCard key={item.id} person={item} onToggleFavorite={handleTogglePersonFavorite} />
                )
              )}
            </div>
            {result.next && (
              <div className="mt-4 flex justify-center">
                <Button variant="secondary" onClick={loadMore}>Cargar más</Button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
