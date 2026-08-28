import { useState } from "react";
import { Field, Input, Select, Textarea } from "../common/Field";
import Button from "../common/Button";
import CityPicker from "../common/CityPicker";
import Avatar from "../common/Avatar";
import { useCountries } from "../../hooks/useCountries";
import { extractErrorMessage } from "../../api/client";

export default function ClubForm({ initial, onSubmit, submitLabel = "Guardar club" }) {
  const countries = useCountries();
  const [values, setValues] = useState({
    name: initial?.name || "",
    country: initial?.country || "",
    website: initial?.website || "",
    notes: initial?.notes || "",
    is_favorite: initial?.is_favorite || false,
  });
  const [city, setCity] = useState(
    initial?.city_detail ? { id: initial.city, name: initial.city_detail.name } : null
  );
  const [crestFile, setCrestFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = "El nombre es obligatorio.";
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
      formData.append("name", values.name.trim());
      if (values.country) formData.append("country", values.country);
      if (city?.id) formData.append("city", city.id);
      formData.append("website", values.website);
      formData.append("notes", values.notes);
      formData.append("is_favorite", values.is_favorite);
      if (crestFile) formData.append("crest", crestFile);
      await onSubmit(formData);
    } catch (err) {
      setSubmitError(extractErrorMessage(err, "No se pudo guardar el club."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-10">
      <div className="flex items-center gap-4">
        <Avatar src={crestFile ? URL.createObjectURL(crestFile) : initial?.crest} name={values.name} size={64} />
        <label className="text-sm font-medium text-gold-400">
          {crestFile || initial?.crest ? "Cambiar escudo" : "Subir escudo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setCrestFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <Field label="Nombre del club" required error={errors.name}>
        <Input value={values.name} onChange={set("name")} placeholder="Ej: Club Atlético Provincial" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="País">
          <Select
            value={values.country}
            onChange={(e) => {
              set("country")(e);
              setCity(null);
            }}
          >
            <option value="">Seleccionar...</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Ciudad">
          <CityPicker
            country={values.country}
            disabled={!values.country}
            value={city?.id}
            valueLabel={city?.name}
            onChange={setCity}
          />
        </Field>
      </div>

      <Field label="Sitio web">
        <Input type="url" value={values.website} onChange={set("website")} placeholder="https://..." />
      </Field>

      <Field label="Observaciones">
        <Textarea value={values.notes} onChange={set("notes")} rows={4} />
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

      {submitError && <p className="text-sm text-danger">{submitError}</p>}

      <Button type="submit" className="w-full" loading={saving}>{submitLabel}</Button>
    </form>
  );
}
