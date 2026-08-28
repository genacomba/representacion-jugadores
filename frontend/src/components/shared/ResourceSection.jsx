import { useState } from "react";
import { Plus, ExternalLink, FileText } from "lucide-react";
import { resourcesApi } from "../../api/contacts";
import { RESOURCE_TYPES } from "../../constants/categories";
import { Field, Input, Select } from "../common/Field";
import Button from "../common/Button";
import Card from "../common/Card";
import { extractErrorMessage } from "../../api/client";

export default function ResourceSection({ entityType, entityId, resources, onCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("transfermarkt");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (resources.length === 0 && !showForm) {
    return (
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Documentos y enlaces</h2>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs font-medium text-gold-400">
            <Plus size={14} /> Agregar
          </button>
        </div>
      </section>
    );
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    setError("");
    try {
      const created = await resourcesApi.create({
        entity_type: entityType, entity_id: entityId,
        resource_type: type, title: title.trim(), url: url.trim(),
      });
      onCreated(created);
      setTitle("");
      setUrl("");
      setShowForm(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Documentos y enlaces</h2>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-gold-400">
          <Plus size={14} /> Agregar
        </button>
      </div>

      {showForm && (
        <Card className="mb-3 space-y-3 p-3">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <Field label="Título">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Perfil de Transfermarkt" />
          </Field>
          <Field label="URL">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </Field>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button onClick={handleAdd} loading={saving} className="w-full">Guardar</Button>
        </Card>
      )}

      <div className="space-y-2">
        {resources.map((r) => (
          <a
            key={r.id}
            href={r.url || r.file}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl border border-pitch-600/70 bg-pitch-850 px-3.5 py-3 text-sm text-ink-200 hover:border-gold-500/40"
          >
            <span className="flex items-center gap-2 truncate">
              <FileText size={16} className="shrink-0 text-gold-400" />
              <span className="truncate">{r.title}</span>
            </span>
            <ExternalLink size={15} className="shrink-0 text-ink-500" />
          </a>
        ))}
      </div>
    </section>
  );
}
