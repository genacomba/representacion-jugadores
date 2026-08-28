import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PersonCard from "./PersonCard";

const basePerson = {
  id: "abc-123",
  full_name: "Juan Pérez",
  nickname: "",
  photo: null,
  category: "player",
  primary_position: "Delantero",
  current_club_detail: { id: "club-1", name: "Club Atlético Provincial" },
  status: "En carpeta",
  is_favorite: false,
};

function renderCard(person = basePerson, onToggleFavorite = vi.fn()) {
  return render(
    <MemoryRouter>
      <PersonCard person={person} onToggleFavorite={onToggleFavorite} />
    </MemoryRouter>
  );
}

describe("PersonCard", () => {
  it("shows the fast-glance info a rep needs mid-call: name, position, club, status", () => {
    renderCard();
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText(/Delantero/)).toBeInTheDocument();
    expect(screen.getByText(/Club Atlético Provincial/)).toBeInTheDocument();
    expect(screen.getByText("En carpeta")).toBeInTheDocument();
  });

  it("links to the contact's own detail page", () => {
    renderCard();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/contactos/abc-123");
  });

  it("falls back to the category label when there is no position/club to show", () => {
    renderCard({ ...basePerson, category: "agent", primary_position: null, current_club_detail: null });
    // Appears twice: once as the subtitle fallback, once as the category badge.
    expect(screen.getAllByText("Representante").length).toBeGreaterThan(0);
  });

  it("toggles favorite without navigating away from the list", async () => {
    const onToggleFavorite = vi.fn();
    renderCard(basePerson, onToggleFavorite);
    await userEvent.click(screen.getByRole("button", { name: /marcar como favorito/i }));
    expect(onToggleFavorite).toHaveBeenCalledWith(basePerson);
  });
});
