import { classifyIntent, type IntentClassification } from "@/services/nlp";
import {
  searchKnowledge,
  searchKnowledgeSync,
  type SearchOptions,
} from "@/services/searchKnowledge";
import type { IntentId } from "@/types/intents";
import type { KnowledgeItem, KnowledgeSourceLink } from "@/types/knowledge";

const OFFICIAL_PORTAL = "https://admissions.ui.edu.ng/";

export const FALLBACK_MESSAGE =
  "I'm sorry, I couldn't find a verified answer to that question in my admission information. Please check the official University of Ibadan admission information or contact the Admission Unit for confirmation.";

/** User-facing metadata only — no NLP/model internals. */
export interface AnswerMeta {
  source: string;
  category: string;
  lastUpdated: string;
}

export interface ChatbotReply {
  text: string;
  intent: IntentId;
  intentConfidence: number;
  matches: KnowledgeItem[];
  sources: KnowledgeSourceLink[];
  /** Display metadata for the primary answer (hidden on fallback). */
  meta?: AnswerMeta;
  confidence: number;
  isFallback: boolean;
}

export interface ChatbotOptions extends SearchOptions {
  /** Minimum combined confidence before returning a knowledge answer. */
  confidenceThreshold?: number;
}

function collectSources(matches: KnowledgeItem[]): KnowledgeSourceLink[] {
  const links: KnowledgeSourceLink[] = [];
  const seen = new Set<string>();

  for (const item of matches) {
    if (item.sources?.length) {
      for (const source of item.sources) {
        if (!seen.has(source.url)) {
          seen.add(source.url);
          links.push(source);
        }
      }
    } else if (item.sourceUrl && !seen.has(item.sourceUrl)) {
      seen.add(item.sourceUrl);
      links.push({ title: item.source, url: item.sourceUrl });
    }
  }

  return links;
}

/**
 * Prefer a single focused answer. Extra matches are only kept when they are
 * nearly as strong as the top hit and share the same intent/programme —
 * this stops unrelated fee text attaching to a Computer Science question.
 */
function selectFocusedMatches(
  matches: KnowledgeItem[],
  scores?: Array<{ item: KnowledgeItem; score: number }>,
): KnowledgeItem[] {
  if (matches.length <= 1) return matches;

  const top = matches[0];
  if (!top) return matches;

  const topScore = scores?.find((entry) => entry.item.id === top.id)?.score;
  if (topScore == null) return [top];

  return matches.filter((item) => {
    if (item.id === top.id) return true;
    const score = scores?.find((entry) => entry.item.id === item.id)?.score ?? 0;
    const sameFocus =
      item.intent === top.intent &&
      (item.programme ?? "") === (top.programme ?? "");
    return sameFocus && score >= topScore * 0.85;
  }).slice(0, 2);
}

function formatAnswer(matches: KnowledgeItem[]): string {
  return matches
    .map((item) => {
      const placeholderNote = item.isPlaceholder
        ? "\n\n_Note: Programme-specific subject combinations must still be confirmed on the official UI admissions portal / prospectus._"
        : "";
      return `${item.answer}${placeholderNote}`;
    })
    .join("\n\n");
}

function buildAnswerMeta(matches: KnowledgeItem[]): AnswerMeta | undefined {
  const primary = matches[0];
  if (!primary) return undefined;
  return {
    source: primary.source,
    category: primary.category,
    lastUpdated: primary.lastUpdated,
  };
}

function shouldFallback(
  matches: KnowledgeItem[],
  searchConfidence: number,
  intentResult: IntentClassification,
  threshold: number,
): boolean {
  if (matches.length === 0) return true;
  if (searchConfidence < threshold && intentResult.intent === "unknown") return true;
  if (searchConfidence < threshold * 0.6) return true;
  return false;
}

/**
 * Main chatbot pipeline:
 * Student question → NLP / intent → knowledge retrieval → response
 */
export async function answerQuestion(
  question: string,
  options: ChatbotOptions = {},
): Promise<ChatbotReply> {
  const trimmed = question.trim();
  const confidenceThreshold = options.confidenceThreshold ?? 0.28;

  if (!trimmed) {
    return {
      text: "Please type an admission-related question, for example about requirements, applications, screening, fees or programmes.",
      intent: "unknown",
      intentConfidence: 0,
      matches: [],
      sources: [],
      confidence: 0,
      isFallback: true,
    };
  }

  const intentResult = classifyIntent(trimmed);

  const searchResult = await searchKnowledge(trimmed, {
    ...options,
    intent: options.intent ?? intentResult.intent,
    limit: options.limit ?? 3,
  });

  if (
    shouldFallback(
      searchResult.matches,
      searchResult.confidence,
      intentResult,
      confidenceThreshold,
    )
  ) {
    // Retry without intent bias in case classification missed a good entry.
    const { intent: _ignoredIntent, ...broadOptions } = options;
    const broadSearch = await searchKnowledge(trimmed, {
      ...broadOptions,
      limit: options.limit ?? 3,
    });

    if (
      broadSearch.matches.length > 0 &&
      broadSearch.confidence >= confidenceThreshold
    ) {
      const focused = selectFocusedMatches(broadSearch.matches, broadSearch.scores);
      return {
        text: formatAnswer(focused),
        intent: intentResult.intent,
        intentConfidence: intentResult.confidence,
        matches: focused,
        sources: collectSources(focused),
        meta: buildAnswerMeta(focused),
        confidence: broadSearch.confidence,
        isFallback: false,
      };
    }

    return {
      text: FALLBACK_MESSAGE,
      intent: intentResult.intent,
      intentConfidence: intentResult.confidence,
      matches: [],
      sources: [
        {
          title: "University of Ibadan admissions portal",
          url: OFFICIAL_PORTAL,
        },
      ],
      confidence: 0,
      isFallback: true,
    };
  }

  const focused = selectFocusedMatches(searchResult.matches, searchResult.scores);
  return {
    text: formatAnswer(focused),
    intent: intentResult.intent,
    intentConfidence: intentResult.confidence,
    matches: focused,
    sources: collectSources(focused),
    meta: buildAnswerMeta(focused),
    confidence: searchResult.confidence,
    isFallback: false,
  };
}

/** Synchronous path for tests and environments without async encoders. */
export function answerQuestionSync(
  question: string,
  options: Omit<ChatbotOptions, "encoder"> = {},
): ChatbotReply {
  const trimmed = question.trim();
  const confidenceThreshold = options.confidenceThreshold ?? 0.28;

  if (!trimmed) {
    return {
      text: "Please type an admission-related question, for example about requirements, applications, screening, fees or programmes.",
      intent: "unknown",
      intentConfidence: 0,
      matches: [],
      sources: [],
      confidence: 0,
      isFallback: true,
    };
  }

  const intentResult = classifyIntent(trimmed);
  const searchResult = searchKnowledgeSync(trimmed, {
    ...options,
    intent: options.intent ?? intentResult.intent,
    limit: options.limit ?? 3,
  });

  if (
    shouldFallback(
      searchResult.matches,
      searchResult.confidence,
      intentResult,
      confidenceThreshold,
    )
  ) {
    const { intent: _ignoredIntent, ...broadOptions } = options;
    const broadSearch = searchKnowledgeSync(trimmed, {
      ...broadOptions,
      limit: options.limit ?? 3,
    });

    if (
      broadSearch.matches.length > 0 &&
      broadSearch.confidence >= confidenceThreshold
    ) {
      const focused = selectFocusedMatches(broadSearch.matches, broadSearch.scores);
      return {
        text: formatAnswer(focused),
        intent: intentResult.intent,
        intentConfidence: intentResult.confidence,
        matches: focused,
        sources: collectSources(focused),
        meta: buildAnswerMeta(focused),
        confidence: broadSearch.confidence,
        isFallback: false,
      };
    }

    return {
      text: FALLBACK_MESSAGE,
      intent: intentResult.intent,
      intentConfidence: intentResult.confidence,
      matches: [],
      sources: [
        {
          title: "University of Ibadan admissions portal",
          url: OFFICIAL_PORTAL,
        },
      ],
      confidence: 0,
      isFallback: true,
    };
  }

  const focused = selectFocusedMatches(searchResult.matches, searchResult.scores);
  return {
    text: formatAnswer(focused),
    intent: intentResult.intent,
    intentConfidence: intentResult.confidence,
    matches: focused,
    sources: collectSources(focused),
    meta: buildAnswerMeta(focused),
    confidence: searchResult.confidence,
    isFallback: false,
  };
}

/** @deprecated Prefer answerQuestion / answerQuestionSync */
export function buildAdmissionReply(records: KnowledgeItem[]): string {
  if (records.length === 0) return FALLBACK_MESSAGE;
  return formatAnswer(records);
}
