import { useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import { ALL_CATEGORIES } from "../constants/categories";

export default function AddContact() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Agregar" subtitle="¿Qué querés registrar?" />
      <div className="grid grid-cols-2 gap-3">
        {ALL_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => navigate(`/agregar/${cat.value}`)}
              className="flex flex-col items-start gap-3 rounded-2xl border border-pitch-600/70 bg-pitch-850 p-4 text-left transition-colors hover:border-gold-500/50 active:bg-pitch-800"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
              >
                <Icon size={19} strokeWidth={1.75} />
              </span>
              <span className="text-sm font-medium text-ink-100">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
