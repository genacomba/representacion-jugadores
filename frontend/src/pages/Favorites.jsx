import { useEffect, useState } from "react";
import { contactsApi } from "../api/contacts";
import { clubsApi } from "../api/clubs";
import { extractErrorMessage } from "../api/client";
import PersonCard from "../components/contacts/PersonCard";
import ClubCard from "../components/clubs/ClubCard";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { Star } from "lucide-react";

export default function Favorites() {
  const [people, setPeople] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      contactsApi.list({ is_favorite: true, page_size: 100 }),
      clubsApi.list({ is_favorite: true, page_size: 100 }),
    ])
      .then(([p, c]) => {
        setPeople(p.results);
        setClubs(c.results);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleTogglePerson = async (person) => {
    await contactsApi.toggleFavorite(person.id);
    setPeople((prev) => prev.filter((p) => p.id !== person.id));
  };

  const handleToggleClub = async (club) => {
    await clubsApi.toggleFavorite(club.id);
    setClubs((prev) => prev.filter((c) => c.id !== club.id));
  };

  return (
    <div>
      <PageHeader title="Favoritos" back />

      {loading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
      {error && <ErrorMessage message={error} onRetry={load} />}

      {!loading && !error && people.length === 0 && clubs.length === 0 && (
        <EmptyState icon={Star} title="Sin favoritos todavía" description="Marcá contactos o clubes como favoritos para verlos acá." />
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {people.map((p) => (
            <PersonCard key={p.id} person={p} onToggleFavorite={handleTogglePerson} />
          ))}
          {clubs.map((c) => (
            <ClubCard key={c.id} club={c} onToggleFavorite={handleToggleClub} />
          ))}
        </div>
      )}
    </div>
  );
}
