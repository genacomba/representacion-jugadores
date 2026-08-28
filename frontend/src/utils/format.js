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
