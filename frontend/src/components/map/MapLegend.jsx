import { ALL_CATEGORIES } from "../../constants/categories";

export default function MapLegend({ active, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_CATEGORIES.map((cat) => {
        const isActive = active.includes(cat.value);
        return (
          <button
            key={cat.value}
            onClick={() => onToggle(cat.value)}
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-opacity"
            style={{
              borderColor: `${cat.color}55`,
              backgroundColor: isActive ? `${cat.color}22` : "transparent",
              color: isActive ? cat.color : "#616960",
              opacity: isActive ? 1 : 0.6,
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
            {cat.short}
          </button>
        );
      })}
    </div>
  );
}
