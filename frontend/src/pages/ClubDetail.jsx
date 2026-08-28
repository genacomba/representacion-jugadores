import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2, Globe, Users } from "lucide-react";
import { clubsApi } from "../api/clubs";
import { contactsApi, interactionsApi, relationshipsApi, resourcesApi } from "../api/contacts";
import { extractErrorMessage } from "../api/client";
import Avatar from "../components/common/Avatar";
import FavoriteButton from "../components/common/FavoriteButton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import PersonCard from "../components/contacts/PersonCard";
import InteractionSection from "../components/shared/InteractionSection";
import ResourceSection from "../components/shared/ResourceSection";
import RelationshipSection from "../components/shared/RelationshipSection";
import { CLUB_CATEGORY } from "../constants/categories";
import { useCountryName } from "../hooks/useCountries";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="text-right text-ink-200">{value}</span>
    </div>
  );
}

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [people, setPeople] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [resources, setResources] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const countryName = useCountryName();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      clubsApi.retrieve(id),
      clubsApi.people(id),
      interactionsApi.listForEntity("club", id),
      resourcesApi.listForEntity("club", id),
      clubsApi.relationships(id),
      relationshipsApi.types(),
    ])
      .then(([c, ppl, i, r, rel, types]) => {
        if (cancelled) return;
        setClub(c);
        setPeople(ppl);
        setInteractions(i.results || i);
        setResources(r.results || r);
        setRelationships(rel);
        setRelationshipTypes(types);
      })
      .catch((err) => !cancelled && setError(extractErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleToggleFavorite = async () => {
    const res = await clubsApi.toggleFavorite(id);
    setClub((prev) => ({ ...prev, is_favorite: res.is_favorite }));
  };

  const handleTogglePersonFavorite = async (person) => {
    const res = await contactsApi.toggleFavorite(person.id);
    setPeople((prev) => prev.map((p) => (p.id === person.id ? { ...p, is_favorite: res.is_favorite } : p)));
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar ${club.name}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await clubsApi.remove(id);
      navigate(-1);
    } catch (err) {
      setError(extractErrorMessage(err));
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (error) return <ErrorMessage message={error} />;
  if (!club) return null;

  return (
    <div>
      <PageHeader
        title=""
        back
        actions={
          <>
            <button onClick={() => navigate(`/clubes/${id}/editar`)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-300 hover:bg-pitch-800">
              <Pencil size={17} />
            </button>
            <button onClick={handleDelete} disabled={deleting} className="flex h-9 w-9 items-center justify-center rounded-full text-danger hover:bg-danger/10">
              <Trash2 size={17} />
            </button>
          </>
        }
      />

      <div className="flex items-start gap-4">
        <Avatar src={club.crest} name={club.name} size={76} ringColor={CLUB_CATEGORY.color} />
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="truncate text-xl font-semibold text-ink-100">{club.name}</h1>
            <FavoriteButton active={club.is_favorite} onToggle={handleToggleFavorite} />
          </div>
          {club.website && (
            <a href={club.website} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 text-sm text-gold-400">
              <Globe size={14} /> Sitio web
            </a>
          )}
        </div>
      </div>

      <div className="mt-7 space-y-7">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Información general</h2>
          <div className="divide-y divide-pitch-700 rounded-2xl border border-pitch-600/70 bg-pitch-850 px-4">
            <InfoRow label="País" value={club.country && countryName(club.country)} />
            <InfoRow label="Ciudad" value={club.city_detail?.name} />
          </div>
        </section>

        {club.notes && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Observaciones</h2>
            <p className="rounded-2xl border border-pitch-600/70 bg-pitch-850 p-4 text-sm text-ink-200">{club.notes}</p>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
            Personas relacionadas ({people.length})
          </h2>
          {people.length === 0 ? (
            <EmptyState icon={Users} title="Sin contactos vinculados" description="Todavía no registraste personas de tu agenda en este club." />
          ) : (
            <div className="space-y-2">
              {people.map((p) => (
                <PersonCard key={p.id} person={p} onToggleFavorite={handleTogglePersonFavorite} />
              ))}
            </div>
          )}
        </section>

        <RelationshipSection
          selfType="club"
          selfId={club.id}
          relationships={relationships}
          relationshipTypes={relationshipTypes}
          onCreated={(rel) => setRelationships((prev) => [...prev, rel])}
        />

        <InteractionSection
          entityType="club"
          entityId={club.id}
          interactions={interactions}
          onCreated={(item) => setInteractions((prev) => [item, ...prev])}
        />

        <ResourceSection
          entityType="club"
          entityId={club.id}
          resources={resources}
          onCreated={(item) => setResources((prev) => [item, ...prev])}
        />
      </div>
    </div>
  );
}
