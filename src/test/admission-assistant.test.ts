import { describe, expect, it } from "vitest";
import { answerQuestionSync, buildAdmissionReply } from "@/services/chatbot";
import { classifyIntent } from "@/services/nlp";
import { searchKnowledgeSync } from "@/services/searchKnowledge";
import {
  clearUnansweredQuestions,
  loadUnansweredQuestions,
  recordUnansweredQuestion,
} from "@/lib/unanswered-questions";

describe("intent classification", () => {
  it("maps requirement paraphrases to admission_requirements", () => {
    const phrases = [
      "What are the admission requirements?",
      "What do I need to get admitted?",
      "What are the requirements for admission?",
      "What qualifications do I need?",
    ];

    for (const phrase of phrases) {
      expect(classifyIntent(phrase).intent).toBe("admission_requirements");
    }
  });

  it("maps application paraphrases to application intents", () => {
    expect(classifyIntent("How do I apply?").intent).toBe("application_process");
    expect(classifyIntent("Where can I apply?").intent).toBe("application_portal");
    expect(classifyIntent("I want to apply to UI.").intent).toBe(
      "application_process",
    );
    expect(classifyIntent("How can I submit my application?").intent).toBe(
      "application_process",
    );
  });
});

describe("local admission knowledge retrieval", () => {
  it("finds the verified University of Ibadan UTME minimum score", () => {
    expect(searchKnowledgeSync("What's the minimum UTME score?").matches[0]?.id).toBe(
      "req-002",
    );
  });

  it("finds official O'Level credit guidance", () => {
    expect(searchKnowledgeSync("How many WAEC credits do I need?").matches[0]?.id).toBe(
      "req-001",
    );
  });

  it("returns the official 2026/2027 screening registration window", () => {
    const result = searchKnowledgeSync("When does screening registration close?");

    expect(result.matches.some((answer) => answer.id === "scr-002")).toBe(true);
    expect(buildAdmissionReply(result.matches)).toContain("19 July 2026");
  });

  it("filters local search results by category", () => {
    expect(
      searchKnowledgeSync("fees and charges", { category: "fees" }).matches.every(
        (answer) => answer.category === "fees",
      ),
    ).toBe(true);
  });

  it("falls back clearly when nothing relevant is found", () => {
    const reply = answerQuestionSync("What is the capital of France?");

    expect(reply.isFallback).toBe(true);
    expect(reply.text).toContain("couldn't find a verified answer");
  });

  it("answers Computer Science entry without dumping unrelated fees", () => {
    const reply = answerQuestionSync(
      "how do I enter UI as a computer science student",
    );

    expect(reply.matches[0]?.id).toBe("cs-001");
    expect(reply.meta?.category).toBeTruthy();
    expect(reply.meta?.source).toBeTruthy();
    expect(reply.meta?.lastUpdated).toBeTruthy();
    expect(reply.text.toLocaleLowerCase()).toContain("computer science");
    expect(reply.text.toLocaleLowerCase()).toContain("chemistry");
    expect(reply.text.toLocaleLowerCase()).toContain("physics");
    expect(reply.text.toLocaleLowerCase()).toContain("200");
    expect(reply.text.toLocaleLowerCase()).not.toContain("bundled fees");
    expect(reply.text).not.toContain("PLACEHOLDER");
  });
});


describe("unanswered question local storage", () => {
  it("records unanswered questions in the expected shape", () => {
    clearUnansweredQuestions();
    const entry = recordUnansweredQuestion("Will UI open a campus on Mars?");

    expect(entry.status).toBe("unanswered");
    expect(entry.question).toBe("Will UI open a campus on Mars?");
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(loadUnansweredQuestions()[0]?.question).toBe(entry.question);

    clearUnansweredQuestions();
    expect(loadUnansweredQuestions()).toHaveLength(0);
  });
});
