import { Home, Search, Plus, Globe2, Menu, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Brand from "../common/Brand";

const ITEMS = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/agregar", label: "Agregar contacto", icon: Plus },
  { to: "/mapa", label: "Mapa mundial", icon: Globe2 },
  { to: "/mas", label: "Más", icon: Menu },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-pitch-600/70 bg-pitch-900 md:flex">
      <div className="px-6 py-6">
        <Brand size="sm" />
        <p className="mt-2 text-xs text-ink-400">CRM privado del representante</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-pitch-800 text-gold-400" : "text-ink-300 hover:bg-pitch-800/70"
              }`
            }
          >
            <Icon size={19} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-pitch-600/70 px-4 py-4">
        <p className="truncate text-sm text-ink-300">{user?.display_name || user?.username}</p>
        <button
          onClick={logout}
          className="mt-2 flex items-center gap-2 text-sm text-ink-400 hover:text-danger"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
