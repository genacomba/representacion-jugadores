import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryCard from "./CategoryCard";
import { categoryMeta } from "../../constants/categories";

describe("CategoryCard", () => {
  it("shows the category label and the real count passed in (never hardcoded)", () => {
    render(<CategoryCard category={categoryMeta("player")} count={127} onClick={() => {}} />);
    expect(screen.getByText("Jugador")).toBeInTheDocument();
    expect(screen.getByText("127")).toBeInTheDocument();
  });

  it("shows zero plainly when the user has no contacts in that category yet", () => {
    render(<CategoryCard category={categoryMeta("club")} count={0} onClick={() => {}} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("navigates to that category's listing on tap", async () => {
    const onClick = vi.fn();
    render(<CategoryCard category={categoryMeta("agent")} count={5} onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
