import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ActivityFeed from "./ActivityFeed";

const ACTIVITY = [
  {
    kind: "person_created",
    timestamp: new Date().toISOString(),
    title: "Juan Pérez",
    subtitle: "Contacto agregado",
    target: { type: "person", id: "abc-1" },
  },
  {
    kind: "interaction",
    timestamp: new Date().toISOString(),
    title: "Club Demo",
    subtitle: "Interacción registrada: Hablamos por WhatsApp.",
    target: { type: "club", id: "club-1" },
  },
];

describe("ActivityFeed", () => {
  it("renders nothing when there is no real activity (never fabricates events)", () => {
    const { container } = render(
      <MemoryRouter>
        <ActivityFeed activity={[]} />
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each real event with its title and subtitle", () => {
    render(
      <MemoryRouter>
        <ActivityFeed activity={ACTIVITY} />
      </MemoryRouter>
    );
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("Contacto agregado")).toBeInTheDocument();
    expect(screen.getByText("Club Demo")).toBeInTheDocument();
  });

  it("links a person event to the contact's detail page and a club event to the club's", () => {
    render(
      <MemoryRouter>
        <ActivityFeed activity={ACTIVITY} />
      </MemoryRouter>
    );
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/contactos/abc-1");
    expect(links[1]).toHaveAttribute("href", "/clubes/club-1");
  });
});
