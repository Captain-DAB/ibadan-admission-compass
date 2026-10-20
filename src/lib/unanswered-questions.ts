/**
 * Local record of questions the chatbot could not answer confidently.
 * Stored in LocalStorage for a future admin / knowledge-management workflow.
 */

export interface UnansweredQuestion {
  question: string;
  timestamp: string;
  status: "unanswered";
}

const STORAGE_KEY = "ui-admissions-unanswered-questions-v1";
const MAX_ITEMS = 100;

export function loadUnansweredQuestions(): UnansweredQuestion[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is UnansweredQuestion =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as UnansweredQuestion).question === "string" &&
        typeof (item as UnansweredQuestion).timestamp === "string" &&
        (item as UnansweredQuestion).status === "unanswered",
    );
  } catch {
    return [];
  }
}

export function recordUnansweredQuestion(question: string): UnansweredQuestion {
  const entry: UnansweredQuestion = {
    question: question.trim(),
    timestamp: new Date().toISOString(),
    status: "unanswered",
  };

  if (typeof window === "undefined" || !entry.question) return entry;

  try {
    const existing = loadUnansweredQuestions();
    const next = [entry, ...existing].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable; recording is best-effort.
  }

  return entry;
}

export function clearUnansweredQuestions(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
