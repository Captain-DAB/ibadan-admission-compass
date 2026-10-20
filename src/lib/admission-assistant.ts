/**
 * Compatibility exports for the modular admission chatbot services.
 * Prefer importing from `@/services/chatbot` and `@/services/searchKnowledge`.
 */
export {
  answerQuestion,
  answerQuestionSync,
  buildAdmissionReply,
  type ChatbotReply,
} from "@/services/chatbot";
export {
  searchKnowledge,
  searchKnowledgeSync,
  getAllKnowledge,
} from "@/services/searchKnowledge";
export { classifyIntent, processQuery } from "@/services/nlp";
export { knowledgeBase as admissionRecords } from "@/data";
export type { KnowledgeItem as AdmissionRecord } from "@/types/knowledge";
export type { KnowledgeSourceLink as AdmissionSource } from "@/types/knowledge";

import { searchKnowledgeSync } from "@/services/searchKnowledge";
import type { KnowledgeItem } from "@/types/knowledge";

/** @deprecated Use searchKnowledgeSync / answerQuestionSync */
export function findAdmissionAnswers(
  query: string,
  category?: string,
): KnowledgeItem[] {
  const options = category ? { category } : {};
  return searchKnowledgeSync(query, options).matches;
}
