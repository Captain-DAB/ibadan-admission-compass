import { knowledgeBase } from "@/data";
import {
  cosineSimilarity,
  expandTokens,
  normalizeText,
  processQuery,
  tokenize,
  type SemanticEncoder,
  noopSemanticEncoder,
} from "@/services/nlp";
import type { IntentId } from "@/types/intents";
import type {
  KnowledgeItem,
  KnowledgeSearchResult,
  ScoredKnowledgeItem,
} from "@/types/knowledge";

export interface SearchOptions {
  /** Prefer items tagged with this intent. */
  intent?: IntentId;
  /** Legacy / UI category filter (case-insensitive). */
  category?: string;
  limit?: number;
  /** Minimum lexical score to keep a match. */
  minScore?: number;
  /**
   * Optional browser-side encoder (Transformers.js later).
   * When ready, semantic similarity boosts lexical ranking.
   */
  encoder?: SemanticEncoder;
}

const DEFAULT_LIMIT = 3;
const DEFAULT_MIN_SCORE = 1.25;

function itemSearchText(item: KnowledgeItem): string {
  return [
    item.category,
    item.question,
    item.answer,
    item.programme ?? "",
    item.intent,
    ...item.keywords,
  ]
    .join(" ")
    .replaceAll("-", " ");
}

function lexicalScore(query: string, item: KnowledgeItem): number {
  const processed = processQuery(query);
  if (processed.expandedTokens.length === 0) return 0;

  const recordTokens = new Set(expandTokens(tokenize(itemSearchText(item))));
  let score = processed.expandedTokens.reduce(
    (total, term) => total + Number(recordTokens.has(term)),
    0,
  );

  const q = normalizeText(query);
  const questionNorm = normalizeText(item.question);

  if (questionNorm.includes(q) || (q.length > 12 && q.includes(questionNorm))) {
    score += 4;
  }

  // Keyword phrase hits (word-boundary aware for short keywords)
  for (const keyword of item.keywords) {
    const keyNorm = normalizeText(keyword);
    if (keyNorm.length <= 2) continue;
    if (keyNorm.length <= 3) {
      const escaped = keyNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(q)) {
        score += 2.5;
      }
    } else if (q.includes(keyNorm)) {
      score += 2.5;
    }
  }

  // Programme name mention
  if (item.programme) {
    const programmeNorm = normalizeText(item.programme);
    if (programmeNorm && q.includes(programmeNorm)) {
      score += 3;
    }
  }

  return score;
}

/**
 * Retrieve relevant knowledge-base entries for a student question.
 * Lexical + synonym scoring today; semantic encoder boost when available.
 */
export async function searchKnowledge(
  query: string,
  options: SearchOptions = {},
): Promise<KnowledgeSearchResult> {
  const {
    intent,
    category,
    limit = DEFAULT_LIMIT,
    minScore = DEFAULT_MIN_SCORE,
    encoder = noopSemanticEncoder,
  } = options;

  const corpus = knowledgeBase.filter((item) => {
    if (category && item.category.toLocaleLowerCase() !== category.toLocaleLowerCase()) {
      return false;
    }
    return true;
  });

  const queryEmbedding =
    encoder.ready ? await encoder.encode(query) : null;

  const scored: ScoredKnowledgeItem[] = [];

  for (const item of corpus) {
    const lexical = lexicalScore(query, item);
    // Intent may boost ranking, but never create a match from intent alone.
    if (lexical < minScore * 0.75) {
      continue;
    }

    let score = lexical;

    if (intent && intent !== "unknown" && item.intent === intent) {
      score += 2.5;
    }

    if (queryEmbedding && encoder.ready) {
      const itemEmbedding = await encoder.encode(itemSearchText(item));
      if (itemEmbedding) {
        const semantic = cosineSimilarity(queryEmbedding, itemEmbedding);
        // Weight reserved for future Transformers.js embeddings.
        score += semantic * 5;
      }
    }

    if (score >= minScore) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  // If intent-filtered results exist with decent scores, prefer them.
  let ranked = scored;
  if (intent && intent !== "unknown") {
    const intentMatches = scored.filter((entry) => entry.item.intent === intent);
    if (intentMatches.length > 0 && (intentMatches[0]?.score ?? 0) >= minScore) {
      ranked = [
        ...intentMatches,
        ...scored.filter((entry) => entry.item.intent !== intent),
      ];
    }
  }

  const top = ranked.slice(0, limit);
  const best = top[0]?.score ?? 0;
  const confidence = best <= 0 ? 0 : Math.min(1, best / (best + 4));

  return {
    matches: top.map(({ item }) => item),
    scores: top,
    confidence,
  };
}

/** Synchronous lexical search for tests and simple UI paths. */
export function searchKnowledgeSync(
  query: string,
  options: Omit<SearchOptions, "encoder"> = {},
): KnowledgeSearchResult {
  const {
    intent,
    category,
    limit = DEFAULT_LIMIT,
    minScore = DEFAULT_MIN_SCORE,
  } = options;

  const scored = knowledgeBase
    .filter((item) => {
      if (category && item.category.toLocaleLowerCase() !== category.toLocaleLowerCase()) {
        return false;
      }
      return true;
    })
    .map((item) => {
      const lexical = lexicalScore(query, item);
      if (lexical < minScore * 0.75) {
        return { item, score: 0 };
      }
      let score = lexical;
      if (intent && intent !== "unknown" && item.intent === intent) {
        score += 2.5;
      }
      return { item, score };
    })
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score);

  let ranked = scored;
  if (intent && intent !== "unknown") {
    const intentMatches = scored.filter((entry) => entry.item.intent === intent);
    if (intentMatches.length > 0) {
      ranked = [
        ...intentMatches,
        ...scored.filter((entry) => entry.item.intent !== intent),
      ];
    }
  }

  const top = ranked.slice(0, limit);
  const best = top[0]?.score ?? 0;

  return {
    matches: top.map(({ item }) => item),
    scores: top,
    confidence: best <= 0 ? 0 : Math.min(1, best / (best + 4)),
  };
}

export function getAllKnowledge(): KnowledgeItem[] {
  return knowledgeBase;
}
