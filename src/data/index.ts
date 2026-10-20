import admission from "@/data/admission.json";
import contacts from "@/data/contacts.json";
import faq from "@/data/faq.json";
import fees from "@/data/fees.json";
import programmes from "@/data/programmes.json";
import requirements from "@/data/requirements.json";
import screening from "@/data/screening.json";
import type { KnowledgeItem } from "@/types/knowledge";

/**
 * Modular local knowledge base.
 * Edit or extend individual JSON files — this index merges them for retrieval.
 */
export const knowledgeBase: KnowledgeItem[] = [
  ...(admission as KnowledgeItem[]),
  ...(programmes as KnowledgeItem[]),
  ...(requirements as KnowledgeItem[]),
  ...(screening as KnowledgeItem[]),
  ...(fees as KnowledgeItem[]),
  ...(contacts as KnowledgeItem[]),
  ...(faq as KnowledgeItem[]),
];

export function getKnowledgeById(id: string): KnowledgeItem | undefined {
  return knowledgeBase.find((item) => item.id === id);
}

export function getKnowledgeByIntent(
  intent: KnowledgeItem["intent"],
): KnowledgeItem[] {
  return knowledgeBase.filter((item) => item.intent === intent);
}

export function getKnowledgeByCategory(category: string): KnowledgeItem[] {
  return knowledgeBase.filter(
    (item) => item.category.toLocaleLowerCase() === category.toLocaleLowerCase(),
  );
}
