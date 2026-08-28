import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { categoryMeta } from "../../constants/categories";

export default function CityPanel({ city, loading, entities, onClose }) {
  const navigate = useNavigate();
  if (!city) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 max-h-[60%] overflow-y-auto rounded-t-3xl border-t border-gold-500/25 bg-pitch-900/98 backdrop-blur safe-bottom">
      <div className="sticky top-0 flex items-center justify-between border-b border-pitch-700 bg-pitch-900/98 px-5 py-4">
        <div>
          <p className="font-medium text-ink-100">{city.name}</p>
          <p className="text-xs text-ink-400">
            {city.country_name} · {entities?.length ?? "…"} contacto(s) · ubicación aproximada
          </p>
        </div>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-pitch-800">
          <X size={18} />
        </button>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <div className="space-y-2">
            {entities.map((entity) => {
              const meta = categoryMeta(entity.category);
              return (
                <button
                  key={`${entity.type}-${entity.id}`}
                  onClick={() => navigate(entity.type === "club" ? `/clubes/${entity.id}` : `/contactos/${entity.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-pitch-600/70 bg-pitch-850 p-3 text-left hover:border-gold-500/40"
                >
                  <Avatar src={entity.photo} name={entity.name} size={44} ringColor={meta.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-100">{entity.name}</p>
                    {entity.subtitle && <p className="truncate text-xs text-ink-400">{entity.subtitle}</p>}
                  </div>
                  <Badge color={meta.color}>{meta.short}</Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
