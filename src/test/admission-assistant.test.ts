import { describe, expect, it } from "vitest";
import { buildAdmissionReply, findAdmissionAnswers } from "@/lib/admission-assistant";

describe("local admission information search", () => {
  it("finds the verified University of Ibadan UTME minimum score", () => {
    expect(findAdmissionAnswers("What's the minimum UTME score?")[0]?.id).toBe(
      "minimum-utme-score",
    );
  });

  it("finds official O’Level credit guidance", () => {
    expect(findAdmissionAnswers("How many WAEC credits do I need?")[0]?.id).toBe(
      "olevel-credits",
    );
  });

  it("returns a verification-first fallback for an unknown deadline", () => {
    const answers = findAdmissionAnswers("When does registration close?");

    expect(answers.some((answer) => answer.id === "screening-deadlines")).toBe(
      true,
    );
    expect(buildAdmissionReply(answers)).toContain(
      "A current screening deadline could not be verified.",
    );
  });

  it("filters local search results by the selected admission category", () => {
    expect(
      findAdmissionAnswers("fees and charges", "Fees").every(
        (answer) => answer.category === "Fees",
      ),
    ).toBe(true);
  });
});