import { describe, expect, it } from "vitest";
import { ALL_CATEGORIES, categoryMeta, CLUB_CATEGORY, PERSON_CATEGORIES } from "./categories";

describe("categoryMeta", () => {
  it("resolves every known person category to a label and color", () => {
    for (const cat of PERSON_CATEGORIES) {
      const meta = categoryMeta(cat.value);
      expect(meta.label).toBe(cat.label);
      expect(meta.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("resolves the club category", () => {
    expect(categoryMeta("club")).toEqual(CLUB_CATEGORY);
  });

  it("falls back gracefully for an unknown category instead of throwing", () => {
    const meta = categoryMeta("something_unexpected");
    expect(meta.label).toBe("something_unexpected");
    expect(meta.color).toBeTruthy();
  });

  it("keeps exactly the 8 categories described in the brief (7 person + club)", () => {
    expect(ALL_CATEGORIES).toHaveLength(8);
  });
});
