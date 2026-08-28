export function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatRelativeDate(value) {
  if (!value) return "Sin contacto registrado";
  const date = new Date(`${value}T00:00:00`);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
  return `Hace ${Math.floor(days / 365)} años`;
}

/** For full timestamps (e.g. the activity feed), unlike formatRelativeDate
 * which only handles date-only strings ("YYYY-MM-DD"). Mirrors the
 * reference's "Hoy, 09:21" / "Ayer, 19:30" style for recent events. */
const pad2 = (n) => String(n).padStart(2, "0");

export function formatActivityTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  // Formatted by hand (24h, zero-padded) rather than via toLocaleTimeString:
  // Intl's "es-AR" output for hour/month differs across Node/ICU builds and
  // real browsers (12h with am/pm here, unpadded month there), which isn't
  // worth chasing for a fixed "HH:MM" / "DD/MM" shape.
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

  if (days <= 0) return `Hoy, ${time}`;
  if (days === 1) return `Ayer, ${time}`;
  if (days < 7) return `Hace ${days} días`;
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
}

function digitsOnly(value = "") {
  return value.replace(/[^\d]/g, "");
}

export function whatsappLink(number) {
  const digits = digitsOnly(number);
  return digits ? `https://wa.me/${digits}` : null;
}

export function phoneLink(number) {
  return number ? `tel:${number.replace(/\s+/g, "")}` : null;
}

export function emailLink(email) {
  return email ? `mailto:${email}` : null;
}

export function instagramLink(handle) {
  if (!handle) return null;
  const clean = handle.replace(/^@/, "").trim();
  return clean ? `https://instagram.com/${clean}` : null;
}
