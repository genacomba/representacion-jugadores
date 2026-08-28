import { useNavigate } from "react-router-dom";
import { Star, Globe2, SlidersHorizontal, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/common/PageHeader";
import { PERSON_CATEGORIES, CLUB_CATEGORY } from "../constants/categories";

function Row({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-pitch-600/70 bg-pitch-850 px-4 py-3.5 text-left text-sm font-medium text-ink-200 transition-colors hover:border-gold-500/40"
    >
      <Icon size={18} className="text-gold-400" strokeWidth={1.75} />
      {label}
    </button>
  );
}

export default function More() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div>
      <PageHeader title="Más" />

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-pitch-600/70 bg-pitch-850 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pitch-700 text-gold-400">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-100">{user?.display_name || user?.username}</p>
          <p className="text-xs text-ink-400">{user?.email || "Cuenta privada"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Row icon={Star} label="Favoritos" onClick={() => navigate("/favoritos")} />
        <Row icon={SlidersHorizontal} label="Necesito un jugador" onClick={() => navigate("/jugadores")} />
        <Row icon={Globe2} label="Mapa mundial" onClick={() => navigate("/mapa")} />
      </div>

      <p className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-400">Categorías</p>
      <div className="space-y-2">
        {[...PERSON_CATEGORIES, CLUB_CATEGORY].map((cat) => (
          <Row
            key={cat.value}
            icon={ShieldCheck}
            label={cat.label}
            onClick={() => navigate(`/categoria/${cat.value}`)}
          />
        ))}
      </div>

      <button
        onClick={logout}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 py-3.5 text-sm font-medium text-danger"
      >
        <LogOut size={17} /> Cerrar sesión
      </button>
    </div>
  );
}
