import { useEffect, useState } from "react";
import { Field, Input, Select, Textarea } from "../common/Field";
import Button from "../common/Button";
import CityPicker from "../common/CityPicker";
import PersonPicker from "../common/PersonPicker";
import Avatar from "../common/Avatar";
import { useCountries } from "../../hooks/useCountries";
import { clubsApi } from "../../api/clubs";
import { playersApi } from "../../api/players";
import { categoryMeta, PREFERRED_FOOT_OPTIONS, RELATIONSHIP_LEVELS } from "../../constants/categories";
import { extractErrorMessage } from "../../api/client";

const VISIBILITY = {
  player: { birthDate: true, club: true, roleTitle: false, playerSection: true, roleLabel: "" },
  agent: { birthDate: false, club: false, roleTitle: true, playerSection: false, roleLabel: "Cargo / función" },
  director: { birthDate: false, club: true, roleTitle: true, playerSection: false, roleLabel: "Cargo" },
  sporting_director: { birthDate: false, club: true, roleTitle: true, playerSection: false, roleLabel: "Cargo" },
  coaching_staff: { birthDate: false, club: true, roleTitle: true, playerSection: false, roleLabel: "Función" },
  ex_player: { birthDate: true, club: false, roleTitle: true, playerSection: false, roleLabel: "Actividad actual" },
  environment: { birthDate: false, club: false, roleTitle: true, playerSection: false, roleLabel: "Actividad" },
};

function emptyValues(initial) {
  return {
    first_name: initial?.first_name || "",
    last_name: initial?.last_name || "",
    nickname: initial?.nickname || "",
    birth_date: initial?.birth_date || "",
    nationality: initial?.nationality || "",
    current_country: initial?.current_country || "",
    phone: initial?.phone || "",
    whatsapp: initial?.whatsapp || "",
    email: initial?.email || "",
    instagram: initial?.instagram || "",
    role_title: initial?.role_title || "",
    is_favorite: initial?.is_favorite || false,
    notes: initial?.notes || "",
    how_met: initial?.how_met || "",
    relationship_level: initial?.relationship_level || "",
  };
}

export default function PersonForm({ category, initial, onSubmit, submitLabel = "Guardar contacto" }) {
  const rules = VISIBILITY[category] || VISIBILITY.environment;
  const countries = useCountries();
  const [values, setValues] = useState(emptyValues(initial));
  const [city, setCity] = useState(
    initial?.current_city_detail ? { id: initial.current_city, name: initial.current_city_detail.name } : null
  );
  const [club, setClub] = useState(
    initial?.current_club_detail ? { id: initial.current_club_detail.id, name: initial.current_club_detail.name } : null
  );
  const [referredBy, setReferredBy] = useState(
    initial?.referred_by_detail ? { id: initial.referred_by_detail.id, full_name: initial.referred_by_detail.full_name } : null
  );
  const [photoFile, setPhotoFile] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [positions, setPositions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [representative, setRepresentative] = useState(
    initial?.player_profile?.represented_by_detail
      ? { id: initial.player_profile.represented_by_detail.id, full_name: initial.player_profile.represented_by_detail.full_name }
      : null
  );
  const [playerValues, setPlayerValues] = useState({
    primary_position: initial?.player_profile?.primary_position || "",
    secondary_position: initial?.player_profile?.secondary_position || "",
    preferred_foot: initial?.player_profile?.preferred_foot || "",
    has_eu_passport: initial?.player_profile?.has_eu_passport || false,
    contract_until: initial?.player_profile?.contract_until || "",
    status: initial?.player_profile?.status || "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rules.club) clubsApi.list({ page_size: 200 }).then((data) => setClubs(data.results));
    if (rules.playerSection) {
      playersApi.positions().then(setPositions);
      playersApi.statuses().then(setStatuses);
    }
  }, [rules.club, rules.playerSection]);

  const set = (key) => (e) => setValues((prev) => ({ ...prev, [key]: e.target.value }));
  const setPlayer = (key) => (e) =>
    setPlayerValues((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const nextErrors = {};
    if (!values.first_name.trim()) nextErrors.first_name = "El nombre es obligatorio.";
    if (rules.playerSection) {
      if (!playerValues.primary_position) nextErrors.primary_position = "Elegí la posición principal.";
      if (!playerValues.status) nextErrors.status = "Elegí un estado.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSubmitError("");
    try {
      const formData = new FormData();
      formData.append("category", category);
      Object.entries(values).forEach(([key, value]) => formData.append(key, value ?? ""));
      formData.append("current_city", city?.id || "");
      formData.append("current_club", club?.id || "");
      formData.append("referred_by", referredBy?.id || "");
      if (photoFile) formData.append("photo", photoFile);

      if (rules.playerSection) {
        // Sent as a single JSON-encoded field (not flattened dotted keys):
        // multipart/form-data can't carry a nested object natively, and the
        // backend decodes this one field back into player_profile before
        // validation (see PersonWriteSerializer.to_internal_value).
        formData.append("player_profile", JSON.stringify({
          primary_position: playerValues.primary_position || null,
          secondary_position: playerValues.secondary_position || null,
          preferred_foot: playerValues.preferred_foot || "",
          has_eu_passport: !!playerValues.has_eu_passport,
          contract_until: playerValues.contract_until || null,
          status: playerValues.status || null,
          represented_by: representative?.id || null,
        }));
      }

      await onSubmit(formData);
    } catch (err) {
      setSubmitError(extractErrorMessage(err, "No se pudo guardar el contacto."));
    } finally {
      setSaving(false);
    }
  };

  const meta = categoryMeta(category);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Avatar
          src={photoFile ? URL.createObjectURL(photoFile) : initial?.photo}
          name={`${values.first_name} ${values.last_name}`}
          size={64}
          ringColor={meta.color}
        />
        <label className="text-sm font-medium text-gold-400">
          {photoFile || initial?.photo ? "Cambiar foto" : "Subir foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Datos generales</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" required error={errors.first_name}>
            <Input value={values.first_name} onChange={set("first_name")} />
          </Field>
          <Field label="Apellido">
            <Input value={values.last_name} onChange={set("last_name")} />
          </Field>
        </div>
        <Field label="Apodo">
          <Input value={values.nickname} onChange={set("nickname")} />
        </Field>
        {rules.birthDate && (
          <Field label="Fecha de nacimiento">
            <Input type="date" value={values.birth_date} onChange={set("birth_date")} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nacionalidad">
            <Select value={values.nationality} onChange={set("nationality")}>
              <option value="">Seleccionar...</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="País actual">
            <Select
              value={values.current_country}
              onChange={(e) => {
                set("current_country")(e);
                setCity(null);
              }}
            >
              <option value="">Seleccionar...</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Ciudad actual">
          <CityPicker
            country={values.current_country}
            disabled={!values.current_country}
            value={city?.id}
            valueLabel={city?.name}
            onChange={setCity}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Contacto</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono">
            <Input value={values.phone} onChange={set("phone")} placeholder="+54 9 11 ..." />
          </Field>
          <Field label="WhatsApp">
            <Input value={values.whatsapp} onChange={set("whatsapp")} placeholder="+54 9 11 ..." />
          </Field>
        </div>
        <Field label="Email">
          <Input type="email" value={values.email} onChange={set("email")} />
        </Field>
        <Field label="Instagram">
          <Input value={values.instagram} onChange={set("instagram")} placeholder="@usuario" />
        </Field>
      </section>

      {(rules.club || rules.roleTitle) && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Información profesional</h2>
          {rules.club && (
            <Field label="Club actual">
              <Select
                value={club?.id || ""}
                onChange={(e) => {
                  const selected = clubs.find((c) => c.id === e.target.value);
                  setClub(selected || null);
                }}
              >
                <option value="">Sin club</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          )}
          {rules.roleTitle && (
            <Field label={rules.roleLabel}>
              <Input value={values.role_title} onChange={set("role_title")} />
            </Field>
          )}
        </section>
      )}

      {rules.playerSection && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Ficha de jugador</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Posición principal" required error={errors.primary_position}>
              <Select value={playerValues.primary_position} onChange={setPlayer("primary_position")}>
                <option value="">Seleccionar...</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Posición secundaria">
              <Select value={playerValues.secondary_position} onChange={setPlayer("secondary_position")}>
                <option value="">Ninguna</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Pierna hábil">
              <Select value={playerValues.preferred_foot} onChange={setPlayer("preferred_foot")}>
                <option value="">Seleccionar...</option>
                {PREFERRED_FOOT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Estado" required error={errors.status}>
              <Select value={playerValues.status} onChange={setPlayer("status")}>
                <option value="">Seleccionar...</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Contrato hasta">
              <Input type="date" value={playerValues.contract_until} onChange={setPlayer("contract_until")} />
            </Field>
          </div>
          <Field label="Representante">
            <PersonPicker
              category="agent"
              value={representative?.id}
              valueLabel={representative?.full_name}
              onChange={setRepresentative}
              placeholder="Buscar representante..."
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-ink-300">
            <input
              type="checkbox"
              checked={playerValues.has_eu_passport}
              onChange={(e) => setPlayerValues((prev) => ({ ...prev, has_eu_passport: e.target.checked }))}
              className="h-4 w-4 rounded border-pitch-600 bg-pitch-800 accent-gold-400"
            />
            Pasaporte comunitario
          </label>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Vínculo y notas</h2>
        <Field label="Cómo lo conocí">
          <Textarea value={values.how_met} onChange={set("how_met")} rows={2} />
        </Field>
        <Field label="Quién me pasó el contacto">
          <PersonPicker
            value={referredBy?.id}
            valueLabel={referredBy?.full_name}
            onChange={setReferredBy}
            excludeId={initial?.id}
            placeholder="Buscar contacto..."
          />
        </Field>
        <Field label="Tipo de relación">
          <Select value={values.relationship_level} onChange={set("relationship_level")}>
            <option value="">Sin especificar</option>
            {RELATIONSHIP_LEVELS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Observaciones generales">
          <Textarea value={values.notes} onChange={set("notes")} rows={3} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            checked={values.is_favorite}
            onChange={(e) => setValues((prev) => ({ ...prev, is_favorite: e.target.checked }))}
            className="h-4 w-4 rounded border-pitch-600 bg-pitch-800 accent-gold-400"
          />
          Marcar como favorito
        </label>
      </section>

      {submitError && <p className="text-sm text-danger">{submitError}</p>}

      <Button type="submit" className="w-full" loading={saving}>{submitLabel}</Button>
    </form>
  );
}
