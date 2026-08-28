import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import WorldMapPreview, { resolveOverlaps } from "./WorldMapPreview";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

const COUNTRIES = [
  { country: "AR", country_name: "Argentina", total: 24 },
  { country: "UY", country_name: "Uruguay", total: 20 },
  // "ZZ" has no known centroid: must be skipped rather than guessed at.
  { country: "ZZ", country_name: "Nowhere", total: 99 },
];

describe("WorldMapPreview", () => {
  it("only places markers for countries with a real, resolvable position", () => {
    render(
      <MemoryRouter>
        <WorldMapPreview countries={COUNTRIES} />
      </MemoryRouter>
    );
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.queryByText("99")).not.toBeInTheDocument();
  });

  it("shows a country's real total and a way to see its contacts when tapped", async () => {
    render(
      <MemoryRouter>
        <WorldMapPreview countries={COUNTRIES} />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByText("24"));
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("24 contacto(s)")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Ver contactos"));
    expect(navigateMock).toHaveBeenCalledWith("/buscar?q=Argentina");
  });

  it("nudges markers apart so neighboring countries never fully overlap and block each other's taps", () => {
    // Regression: Argentina and Uruguay's real centroids sit ~25px apart in
    // this projection -- closer than their combined marker radii -- which
    // used to leave Argentina's circle completely covered by Uruguay's, so
    // a real click (real hit-testing; jsdom/RTL clicks don't check this)
    // landed on the wrong country. Reproduced with Playwright, not this
    // unit test, hence asserting the geometry invariant directly here.
    const markers = [
      { country: "AR", position: [315.33, 354.99], radius: 24 },
      { country: "UY", position: [336.58, 348.83], radius: 21.7 },
    ];
    const resolved = resolveOverlaps(markers);
    const [a, b] = resolved;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    expect(dist).toBeGreaterThanOrEqual(a.radius + b.radius);
  });

  it("'Ver mapa completo' opens the existing 3D globe screen, not a duplicate map", async () => {
    render(
      <MemoryRouter>
        <WorldMapPreview countries={COUNTRIES} />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByText("Ver mapa completo"));
    expect(navigateMock).toHaveBeenCalledWith("/mapa");
  });
});
