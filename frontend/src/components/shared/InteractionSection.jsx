import { useState } from "react";
import { Plus } from "lucide-react";
import { interactionsApi } from "../../api/contacts";
import { INTERACTION_TYPES } from "../../constants/categories";
import { formatDate } from "../../utils/format";
import { Select, Textarea } from "../common/Field";
import Button from "../common/Button";
import Card from "../common/Card";
import { extractErrorMessage } from "../../api/client";

export default function InteractionSection({ entityType, entityId, interactions, onCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("whatsapp");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError("");
    try {
      const created = await interactionsApi.create({
        entity_type: entityType,
        entity_id: entityId,
        interaction_type: type,
        date: new Date().toISOString().slice(0, 10),
        text: text.trim(),
      });
      onCreated(created);
      setText("");
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Actividad</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-gold-400"
        >
          <Plus size={14} /> Agregar
        </button>
      </div>

      {showForm && (
        <Card className="mb-3 space-y-3 p-3">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {INTERACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="¿Qué hablaron?"
            rows={2}
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button onClick={handleAdd} loading={saving} className="w-full">Guardar</Button>
        </Card>
      )}

      {interactions.length === 0 ? (
        <p className="text-sm text-ink-500">Todavía no hay interacciones registradas.</p>
      ) : (
        <ol className="space-y-3 border-l border-pitch-600 pl-4">
          {interactions.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-gold-400" />
              <p className="text-xs text-ink-500">{formatDate(item.date)}</p>
              <p className="text-sm text-ink-200">{item.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
