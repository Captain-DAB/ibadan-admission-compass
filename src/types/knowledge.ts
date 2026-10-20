import type { IntentId } from "@/types/intents";

/** Optional clickable source link shown in the chat UI. */
export interface KnowledgeSourceLink {
  title: string;
  url: string;
}

/**
 * One editable knowledge-base entry.
 * Keep answers factual; mark unverified content with isPlaceholder: true.
 */
export interface KnowledgeItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  /** Primary intent this entry best answers. */
  intent: IntentId;
  programme?: string;
  session?: string;
  /** Human-readable source label (required). */
  source: string;
  /** Optional primary URL for the source label. */
  sourceUrl?: string;
  /** Extra official links shown under the reply. */
  sources?: KnowledgeSourceLink[];
  lastUpdated: string;
  /**
   * true = sample / unverified placeholder content.
   * The chatbot should not present these as confirmed official facts.
   */
  isPlaceholder?: boolean;
}

export interface ScoredKnowledgeItem {
  item: KnowledgeItem;
  score: number;
}

export interface KnowledgeSearchResult {
  matches: KnowledgeItem[];
  scores: ScoredKnowledgeItem[];
  confidence: number;
}
