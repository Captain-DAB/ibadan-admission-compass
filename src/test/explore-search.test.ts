import { describe, expect, it } from "vitest";
import { EXPLORE_CATEGORIES, getItemsForCategory } from "@/lib/explore-categories";
import { globalAdmissionSearch } from "@/services/globalSearch";

describe("admission information explorer", () => {
  it("defines the expected browse categories", () => {
    const titles = EXPLORE_CATEGORIES.map((category) => category.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        "Admission Requirements",
        "Programmes",
        "Application Process",
        "Screening",
        "UTME",
        "Direct Entry",
        "Fees",
        "Important Dates",
        "Required Documents",
        "FAQs",
        "Contact Information",
      ]),
    );
  });

  it("returns knowledge items for the requirements category", () => {
    expect(getItemsForCategory("admission-requirements").length).toBeGreaterThan(0);
  });
});

describe("global admission search", () => {
  it("finds Computer Science requirements from the local knowledge base", async () => {
    const result = await globalAdmissionSearch("Computer Science requirements");

    expect(result.mode).toBe("lexical");
    expect(result.hits.length).toBeGreaterThan(0);
    expect(
      result.hits.some(
        (hit) =>
          hit.title.toLocaleLowerCase().includes("computer science") ||
          hit.id.includes("cs") ||
          hit.programme?.name === "Computer Science",
      ),
    ).toBe(true);
  });
});
