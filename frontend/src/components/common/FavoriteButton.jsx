import { Star } from "lucide-react";

export default function FavoriteButton({ active, onToggle, size = 20, className = "" }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onToggle?.();
      }}
      aria-pressed={active}
      aria-label={active ? "Quitar de favoritos" : "Marcar como favorito"}
      className={`flex items-center justify-center rounded-full p-2 transition-colors active:scale-95 ${className}`}
    >
      <Star
        size={size}
        strokeWidth={1.75}
        className={active ? "fill-gold-400 text-gold-400" : "text-ink-400"}
      />
    </button>
  );
}
