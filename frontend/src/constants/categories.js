import {
  Briefcase,
  ClipboardList,
  Handshake,
  Landmark,
  PersonStanding,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

// Mirrors apps.contacts.models.Person.Category on the backend, plus "club"
// which is a separate model there. Kept in one place so badges, the add-
// contact chooser, the map legend and the Home category grid never drift
// out of sync.
export const PERSON_CATEGORIES = [
  { value: "player", label: "Jugador", short: "Jugador", color: "#d4af37", icon: PersonStanding },
  { value: "agent", label: "Representante", short: "Representante", color: "#6f9bb8", icon: Handshake },
  { value: "director", label: "Dirigente", short: "Dirigente", color: "#9a87c2", icon: ShieldCheck },
  { value: "sporting_director", label: "Director deportivo", short: "Dir. deportivo", color: "#4c9a8c", icon: Briefcase },
  { value: "coaching_staff", label: "Cuerpo técnico", short: "Cuerpo técnico", color: "#c08a4e", icon: ClipboardList },
  { value: "ex_player", label: "Ex jugador", short: "Ex jugador", color: "#8a9a78", icon: Star },
  { value: "environment", label: "Ambiente del fútbol", short: "Ambiente", color: "#b57d8f", icon: Users },
];

export const CLUB_CATEGORY = { value: "club", label: "Club", short: "Club", color: "#e8e6df", icon: Landmark };

export const ALL_CATEGORIES = [...PERSON_CATEGORIES, CLUB_CATEGORY];

// Display order for the Home category grid (clubs surfaced earlier than in
// the generic ALL_CATEGORIES list, matching the visual reference).
export const HOME_CATEGORY_ORDER = [
  "player", "agent", "director", "sporting_director", "coaching_staff", "club", "ex_player", "environment",
];

export function categoryMeta(value) {
  return ALL_CATEGORIES.find((c) => c.value === value) || {
    value, label: value, short: value, color: "#8a938a", icon: Users,
  };
}

export const RELATIONSHIP_LEVELS = [
  { value: "close", label: "Cercana" },
  { value: "medium", label: "Media" },
  { value: "distant", label: "Distante" },
];

export const PREFERRED_FOOT_OPTIONS = [
  { value: "right", label: "Derecha" },
  { value: "left", label: "Izquierda" },
  { value: "both", label: "Ambidiestro" },
];

export const INTERACTION_TYPES = [
  { value: "call", label: "Llamada" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "meeting", label: "Reunión" },
  { value: "email", label: "Email" },
  { value: "note", label: "Nota" },
  { value: "other", label: "Otro" },
];

export const RESOURCE_TYPES = [
  { value: "wyscout", label: "Wyscout" },
  { value: "transfermarkt", label: "Transfermarkt" },
  { value: "youtube", label: "Video de YouTube" },
  { value: "document", label: "Documento" },
  { value: "contract", label: "Contrato" },
  { value: "folder", label: "Carpeta externa" },
  { value: "other", label: "Otro" },
];

export const CONTRACT_SITUATION_OPTIONS = [
  { value: "", label: "Cualquiera" },
  { value: "free", label: "Sin contrato" },
  { value: "expiring_soon", label: "Vence en 6 meses" },
  { value: "active", label: "Contrato vigente" },
  { value: "expired", label: "Contrato vencido" },
];
