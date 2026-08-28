import { describe, expect, it } from "vitest";
import { emailLink, formatRelativeDate, instagramLink, phoneLink, whatsappLink } from "./format";

function daysAgo(n) {
  // Built from local date parts (not toISOString, which would convert to
  // UTC and can shift the calendar day depending on the machine's
  // timezone) to match formatRelativeDate's own local-midnight parsing.
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

describe("quick-action link builders", () => {
  it("builds a wa.me link stripping non-digit characters", () => {
    expect(whatsappLink("+54 9 11 5555-1234")).toBe("https://wa.me/5491155551234");
  });

  it("returns null for an empty whatsapp number instead of a broken link", () => {
    expect(whatsappLink("")).toBeNull();
    expect(whatsappLink(undefined)).toBeNull();
  });

  it("builds a tel: link stripping spaces but keeping dashes (both are valid in tel: URIs)", () => {
    expect(phoneLink("+54 9 11 5555-1234")).toBe("tel:+549115555-1234");
  });

  it("returns null for an empty phone", () => {
    expect(phoneLink("")).toBeNull();
  });

  it("builds a mailto: link", () => {
    expect(emailLink("agente@example.com")).toBe("mailto:agente@example.com");
  });

  it("builds an instagram link, stripping a leading @", () => {
    expect(instagramLink("@jugador10")).toBe("https://instagram.com/jugador10");
    expect(instagramLink("jugador10")).toBe("https://instagram.com/jugador10");
  });

  it("returns null for a blank instagram handle rather than a dead link", () => {
    expect(instagramLink("")).toBeNull();
    expect(instagramLink("   ")).toBeNull();
  });
});

describe("formatRelativeDate (last-contact display)", () => {
  it("prompts to register an interaction when there is none", () => {
    expect(formatRelativeDate(null)).toBe("Sin contacto registrado");
  });

  it("labels today's date as 'Hoy'", () => {
    expect(formatRelativeDate(daysAgo(0))).toBe("Hoy");
  });

  it("labels yesterday as 'Ayer'", () => {
    expect(formatRelativeDate(daysAgo(1))).toBe("Ayer");
  });

  it("shows days for anything under a month", () => {
    expect(formatRelativeDate(daysAgo(5))).toBe("Hace 5 días");
  });

  it("shows months for anything under a year", () => {
    expect(formatRelativeDate(daysAgo(60))).toBe("Hace 2 meses");
  });
});
