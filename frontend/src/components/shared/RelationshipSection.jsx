import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";
import { relationshipsApi } from "../../api/contacts";
import { clubsApi } from "../../api/clubs";
import { categoryMeta } from "../../constants/categories";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import Card from "../common/Card";
import { Field, Select } from "../common/Field";
import PersonPicker from "../common/PersonPicker";
import { extractErrorMessage } from "../../api/client";

function entityHref(entity) {
  return entity.type === "club" ? `/clubes/${entity.id}` : `/contactos/${entity.id}`;
}

function entityLabel(entity) {
  return entity.type === "club" ? entity.name : entity.full_name;
}

export default function RelationshipSection({ selfType, selfId, relationships, onCreated, relationshipTypes }) {
  const [showForm, setShowForm] = useState(false);
  const [direction, setDirection] = useState("to"); // "to": self -> target, "from": target -> self
  const [typeId, setTypeId] = useState(relationshipTypes[0]?.id || "");
  const [targetKind, setTargetKind] = useState("person");
  const [targetPerson, setTargetPerson] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [targetClubId, setTargetClubId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (targetKind === "club" && clubs.length === 0) {
      clubsApi.list({ page_size: 200 }).then((data) => setClubs(data.results));
    }
  }, [targetKind, clubs.length]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const targetId = targetKind === "person" ? targetPerson?.id : targetClubId;
    if (!targetId || !typeId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        relationship_type: typeId,
        from_type: direction === "to" ? selfType : targetKind,
        from_id: direction === "to" ? selfId : targetId,
        to_type: direction === "to" ? targetKind : selfType,
        to_id: direction === "to" ? targetId : selfId,
      };
      const created = await relationshipsApi.create(payload);
      onCreated(created);
      setShowForm(false);
      setTargetPerson(null);
      setTargetClubId("");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Relaciones</h2>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-gold-400">
          <Plus size={14} /> Vincular
        </button>
      </div>

      {showForm && (
        <Card className="mb-3 space-y-3 p-3">
          <Field label="Tipo de vínculo">
            <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {relationshipTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sentido">
              <Select value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="to">Este contacto → otro</option>
                <option value="from">Otro → este contacto</option>
              </Select>
            </Field>
            <Field label="Vincular con">
              <Select value={targetKind} onChange={(e) => setTargetKind(e.target.value)}>
                <option value="person">Persona</option>
                <option value="club">Club</option>
              </Select>
            </Field>
          </div>
          {targetKind === "person" ? (
            <PersonPicker
              value={targetPerson?.id}
              valueLabel={targetPerson?.full_name}
              onChange={setTargetPerson}
              excludeId={selfType === "person" ? selfId : undefined}
            />
          ) : (
            <Select value={targetClubId} onChange={(e) => setTargetClubId(e.target.value)}>
              <option value="">Seleccionar club...</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button onClick={handleAdd} loading={saving} className="w-full">Guardar vínculo</Button>
        </Card>
      )}

      {relationships.length === 0 ? (
        <p className="text-sm text-ink-500">Sin relaciones registradas todavía.</p>
      ) : (
        <div className="space-y-2">
          {relationships.map((rel) => {
            const isFromSelf = rel.from_entity_detail?.type === selfType && String(rel.from_entity_detail?.id) === String(selfId);
            const other = isFromSelf ? rel.to_entity_detail : rel.from_entity_detail;
            const label = isFromSelf ? rel.relationship_type_detail.label : (rel.relationship_type_detail.inverse_label || rel.relationship_type_detail.label);
            if (!other) return null;
            const meta = categoryMeta(other.category);
            return (
              <Link
                key={rel.id}
                to={entityHref(other)}
                className="flex items-center gap-3 rounded-xl border border-pitch-600/70 bg-pitch-850 px-3.5 py-3 hover:border-gold-500/40"
              >
                <Avatar src={other.photo || other.crest} name={entityLabel(other)} size={36} ringColor={meta.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-400">{label}</p>
                  <p className="truncate text-sm font-medium text-ink-100">{entityLabel(other)}</p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-ink-500" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
