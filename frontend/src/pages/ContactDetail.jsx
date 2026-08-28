import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { contactsApi, interactionsApi, relationshipsApi, resourcesApi } from "../api/contacts";
import { extractErrorMessage } from "../api/client";
import Avatar from "../components/common/Avatar";
import Badge from "../components/common/Badge";
import FavoriteButton from "../components/common/FavoriteButton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import PageHeader from "../components/common/PageHeader";
import QuickActions from "../components/contacts/QuickActions";
import InteractionSection from "../components/shared/InteractionSection";
import ResourceSection from "../components/shared/ResourceSection";
import RelationshipSection from "../components/shared/RelationshipSection";
import { categoryMeta } from "../constants/categories";
import { formatDate, formatRelativeDate } from "../utils/format";
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

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
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
      contactsApi.retrieve(id),
      interactionsApi.listForEntity("person", id),
      resourcesApi.listForEntity("person", id),
      contactsApi.relationships(id),
      relationshipsApi.types(),
    ])
      .then(([p, i, r, rel, types]) => {
        if (cancelled) return;
        setPerson(p);
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
    const res = await contactsApi.toggleFavorite(id);
    setPerson((prev) => ({ ...prev, is_favorite: res.is_favorite }));
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar a ${person.full_name} de tu agenda? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await contactsApi.remove(id);
      navigate(-1);
    } catch (err) {
      setError(extractErrorMessage(err));
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (error) return <ErrorMessage message={error} />;
  if (!person) return null;

  const meta = categoryMeta(person.category);
  const profile = person.player_profile;

  return (
    <div>
      <PageHeader
        title=""
        back
        actions={
          <>
            <button onClick={() => navigate(`/contactos/${id}/editar`)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-300 hover:bg-pitch-800">
              <Pencil size={17} />
            </button>
            <button onClick={handleDelete} disabled={deleting} className="flex h-9 w-9 items-center justify-center rounded-full text-danger hover:bg-danger/10">
              <Trash2 size={17} />
            </button>
          </>
        }
      />

      <div className="flex items-start gap-4">
        <Avatar src={person.photo} name={person.full_name} size={76} ringColor={meta.color} />
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="truncate text-xl font-semibold text-ink-100">{person.full_name}</h1>
            <FavoriteButton active={person.is_favorite} onToggle={handleToggleFavorite} />
          </div>
          {person.nickname && <p className="text-sm text-ink-400">"{person.nickname}"</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge color={meta.color}>{meta.label}</Badge>
            {profile?.status_detail && <Badge color="#8a938a">{profile.status_detail.name}</Badge>}
          </div>
          <p className="mt-1.5 text-xs text-ink-500">
            Último contacto: {formatRelativeDate(person.last_contact_date)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <QuickActions phone={person.phone} whatsapp={person.whatsapp} email={person.email} instagram={person.instagram} />
      </div>

      <div className="mt-7 space-y-7">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Información general</h2>
          <div className="divide-y divide-pitch-700 rounded-2xl border border-pitch-600/70 bg-pitch-850 px-4">
            <InfoRow label="Nacionalidad" value={person.nationality && countryName(person.nationality)} />
            <InfoRow label="País actual" value={person.current_country && countryName(person.current_country)} />
            <InfoRow label="Ciudad actual" value={person.current_city_detail?.name} />
            <InfoRow label="Fecha de nacimiento" value={person.birth_date && `${formatDate(person.birth_date)} (${person.age} años)`} />
            <InfoRow label="Club actual" value={person.current_club_detail && (
              <Link to={`/clubes/${person.current_club_detail.id}`} className="text-gold-400">{person.current_club_detail.name}</Link>
            )} />
            <InfoRow label="Cargo / función" value={person.role_title} />
          </div>
        </section>

        {profile && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Información profesional</h2>
            <div className="divide-y divide-pitch-700 rounded-2xl border border-pitch-600/70 bg-pitch-850 px-4">
              <InfoRow label="Posición principal" value={profile.primary_position_detail?.name} />
              <InfoRow label="Posición secundaria" value={profile.secondary_position_detail?.name} />
              <InfoRow label="Pierna hábil" value={profile.preferred_foot === "right" ? "Derecha" : profile.preferred_foot === "left" ? "Izquierda" : profile.preferred_foot === "both" ? "Ambidiestro" : ""} />
              <InfoRow label="Pasaporte comunitario" value={profile.has_eu_passport ? "Sí" : "No"} />
              <InfoRow label="Contrato hasta" value={profile.contract_until && formatDate(profile.contract_until)} />
              <InfoRow label="Representante" value={profile.represented_by_detail && (
                <Link to={`/contactos/${profile.represented_by_detail.id}`} className="text-gold-400">{profile.represented_by_detail.full_name}</Link>
              )} />
              <InfoRow label="Estado" value={profile.status_detail?.name} />
            </div>
          </section>
        )}

        {(person.how_met || person.referred_by_detail || person.relationship_level) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Vínculo</h2>
            <div className="divide-y divide-pitch-700 rounded-2xl border border-pitch-600/70 bg-pitch-850 px-4">
              <InfoRow label="Cómo lo conocí" value={person.how_met} />
              <InfoRow label="Quién me lo pasó" value={person.referred_by_detail && (
                <Link to={`/contactos/${person.referred_by_detail.id}`} className="text-gold-400">{person.referred_by_detail.full_name}</Link>
              )} />
              <InfoRow label="Tipo de relación" value={
                { close: "Cercana", medium: "Media", distant: "Distante" }[person.relationship_level]
              } />
            </div>
          </section>
        )}

        {person.notes && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-400">Observaciones</h2>
            <p className="rounded-2xl border border-pitch-600/70 bg-pitch-850 p-4 text-sm text-ink-200">{person.notes}</p>
          </section>
        )}

        <RelationshipSection
          selfType="person"
          selfId={person.id}
          relationships={relationships}
          relationshipTypes={relationshipTypes}
          onCreated={(rel) => setRelationships((prev) => [...prev, rel])}
        />

        <InteractionSection
          entityType="person"
          entityId={person.id}
          interactions={interactions}
          onCreated={(item) => setInteractions((prev) => [item, ...prev])}
        />

        <ResourceSection
          entityType="person"
          entityId={person.id}
          resources={resources}
          onCreated={(item) => setResources((prev) => [item, ...prev])}
        />
      </div>
    </div>
  );
}
