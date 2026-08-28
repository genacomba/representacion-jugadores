import { Home, Search, Plus, Globe2, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";

const ITEMS = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/agregar", label: "Agregar", icon: Plus, isCentral: true },
  { to: "/mapa", label: "Mapa", icon: Globe2 },
  { to: "/mas", label: "Más", icon: Menu },
];

export default function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-pitch-600/70 bg-pitch-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {ITEMS.map(({ to, label, icon: Icon, end, isCentral }) =>
          isCentral ? (
            <NavLink key={to} to={to} className="relative flex flex-1 flex-col items-center justify-center py-2">
              <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 text-pitch-950 shadow-lg shadow-gold-900/30">
                <Icon size={26} strokeWidth={2} />
              </span>
              <span className="mt-1 text-[11px] font-medium text-ink-300">{label}</span>
            </NavLink>
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                  isActive ? "text-gold-400" : "text-ink-400"
                }`
              }
            >
              <Icon size={22} strokeWidth={1.75} />
              {label}
            </NavLink>
          )
        )}
      </div>
    </nav>
  );
}
