import {
  INTENT_DEFINITIONS,
  type IntentId,
} from "@/types/intents";

/**
 * Browser-side NLP helpers for the admission chatbot.
 *
 * Current implementation: tokenization + synonym expansion + intent scoring.
 * Designed so Transformers.js / embedding-based semantic search can plug in later
 * via the SemanticEncoder interface without changing the chatbot UI.
 */

export const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "does",
  "for",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "the",
  "to",
  "ui",
  "what",
  "when",
  "where",
  "which",
  "who",
  "you",
  "your",
  "please",
  "tell",
  "about",
]);

/** Maps related admission phrasings onto shared lexical tokens. */
export const topicSynonyms: Record<string, string[]> = {
  admission: ["admit", "admitted", "eligibility", "entry"],
  apply: ["application", "applications", "applying", "submit", "register", "registration"],
  course: ["programme", "programmes", "program", "programs", "department", "courses"],
  cutoff: ["cut", "score", "points", "marks", "minimum"],
  document: ["documents", "credentials", "papers", "upload"],
  fee: ["fees", "tuition", "payment", "cost", "charges", "levy"],
  jamb: ["utme"],
  olevel: ["olevel", "o-level", "waec", "neco", "credits", "subjects"],
  portal: ["website", "online", "site"],
  qualify: ["qualification", "qualifications", "requirement", "requirements", "need"],
  screen: ["screening", "postutme", "post-utme", "post utme"],
  deadline: ["closing", "close", "date", "dates", "when", "timeline"],
  contact: ["email", "phone", "reach", "office", "helpdesk"],
};

export interface ProcessedQuery {
  raw: string;
  normalized: string;
  tokens: string[];
  expandedTokens: string[];
}

export interface IntentClassification {
  intent: IntentId;
  confidence: number;
  /** Ranked alternatives for debugging / future multi-intent replies. */
  scores: Array<{ intent: IntentId; score: number }>;
}

/**
 * Future hook for browser embeddings (e.g. Transformers.js).
 * Implement encode() to return a Float32Array embedding vector.
 */
export interface SemanticEncoder {
  ready: boolean;
  encode(text: string): Promise<Float32Array | null>;
}

/** Placeholder encoder — swap with Transformers.js later. */
export const noopSemanticEncoder: SemanticEncoder = {
  ready: false,
  async encode() {
    return null;
  },
};

export function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

export function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens);

  for (const word of tokens) {
    for (const [topic, synonyms] of Object.entries(topicSynonyms)) {
      const flatSynonyms = synonyms.map((s) => s.replaceAll("-", "").replaceAll(" ", ""));
      const compactWord = word.replaceAll("-", "");

      if (
        compactWord === topic ||
        flatSynonyms.includes(compactWord) ||
        synonyms.includes(word)
      ) {
        expanded.add(topic);
        flatSynonyms.forEach((synonym) => expanded.add(synonym));
      }
    }
  }

  return [...expanded];
}

export function processQuery(query: string): ProcessedQuery {
  const normalized = normalizeText(query);
  const tokens = tokenize(query);
  const expandedTokens = expandTokens(tokens);

  return {
    raw: query,
    normalized,
    tokens,
    expandedTokens,
  };
}

/** True when `pattern` appears as a whole word/phrase in `text` (not a substring of a longer word). */
export function containsPhrase(text: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`);
  return regex.test(text);
}

/**
 * Intent classifier using phrase patterns + token overlap.
 * Same intent should match paraphrases such as:
 * - "What are the admission requirements?"
 * - "What do I need to get admitted?"
 * - "What qualifications do I need?"
 */
export function classifyIntent(query: string): IntentClassification {
  const processed = processQuery(query);
  const normalized = processed.normalized;
  const scores: Array<{ intent: IntentId; score: number }> = [];

  for (const definition of INTENT_DEFINITIONS) {
    if (definition.id === "unknown") continue;

    let score = 0;

    for (const pattern of definition.patterns) {
      const patternNorm = normalizeText(pattern);
      if (!patternNorm) continue;

      if (containsPhrase(normalized, patternNorm)) {
        // Longer / exact phrase matches are stronger signals.
        const words = patternNorm.split(" ").filter(Boolean).length;
        score += 3 + Math.min(4, words);
      } else {
        const patternTokens = tokenize(pattern);
        // Ignore ultra-short single-token patterns without a phrase hit
        // (avoids "nce" matching inside "france", "nd" inside random words, etc.).
        if (patternTokens.length === 1 && (patternTokens[0]?.length ?? 0) <= 3) {
          continue;
        }
        const overlap = patternTokens.filter((token) =>
          processed.expandedTokens.includes(token),
        ).length;
        if (patternTokens.length > 0 && overlap === patternTokens.length) {
          score += 2;
        } else if (overlap > 0) {
          score += overlap * 0.5;
        }
      }
    }

    // Light boost from documented example paraphrases (capped).
    let exampleBoost = 0;
    for (const example of definition.examples) {
      const exampleTokens = expandTokens(tokenize(example));
      const overlap = exampleTokens.filter((token) =>
        processed.expandedTokens.includes(token),
      ).length;
      if (exampleTokens.length > 0) {
        const ratio = overlap / exampleTokens.length;
        if (ratio >= 0.6) exampleBoost += ratio;
      }
    }
    score += Math.min(3, exampleBoost);

    // Disambiguate portal ("where … apply") vs process ("how … apply").
    if (definition.id === "application_portal" && /\bwhere\b/.test(normalized) && /\bapply\b/.test(normalized)) {
      score += 6;
    }
    if (definition.id === "application_process" && /\bhow\b/.test(normalized) && /\bapply\b/.test(normalized)) {
      score += 6;
    }

    if (score > 0) {
      scores.push({ intent: definition.id, score });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  const top = scores[0];
  if (!top || top.score < 2) {
    return { intent: "unknown", confidence: 0, scores };
  }

  const second = scores[1]?.score ?? 0;
  const confidence = Math.min(1, top.score / (top.score + second + 2));

  return {
    intent: top.intent,
    confidence,
    scores,
  };
}

/** Cosine similarity helper for future embedding-based retrieval. */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
