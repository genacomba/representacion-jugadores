import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import PersonForm from "../components/contacts/PersonForm";
import ClubForm from "../components/clubs/ClubForm";
import { contactsApi } from "../api/contacts";
import { clubsApi } from "../api/clubs";
import { categoryMeta } from "../constants/categories";
import { extractErrorMessage } from "../api/client";

export default function ContactForm({ mode = "create", category: forcedCategory }) {
  const params = useParams();
  const navigate = useNavigate();
  const category = forcedCategory || params.category;
  const isClub = category === "club";
  const isEdit = mode === "edit";

  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    const fetcher = isClub ? clubsApi.retrieve(params.id) : contactsApi.retrieve(params.id);
    fetcher
      .then(setInitial)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [isEdit, isClub, params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }
  if (error) return <ErrorMessage message={error} />;

  const effectiveCategory = isEdit ? (isClub ? "club" : initial?.category) : category;
  const meta = categoryMeta(effectiveCategory);
  const title = isEdit ? `Editar ${meta.label.toLowerCase()}` : `Agregar ${meta.label.toLowerCase()}`;

  const handleSubmit = async (payload) => {
    if (isClub) {
      const saved = isEdit
        ? await clubsApi.update(params.id, payload)
        : await clubsApi.create(payload);
      navigate(`/clubes/${saved.id}`, { replace: true });
    } else {
      const saved = isEdit
        ? await contactsApi.update(params.id, payload)
        : await contactsApi.create(payload);
      navigate(`/contactos/${saved.id}`, { replace: true });
    }
  };

  return (
    <div>
      <PageHeader title={title} back />
      {isClub ? (
        <ClubForm initial={initial} onSubmit={handleSubmit} submitLabel={isEdit ? "Guardar cambios" : "Crear club"} />
      ) : (
        <PersonForm
          category={effectiveCategory}
          initial={initial}
          onSubmit={handleSubmit}
          submitLabel={isEdit ? "Guardar cambios" : "Crear contacto"}
        />
      )}
    </div>
  );
}
