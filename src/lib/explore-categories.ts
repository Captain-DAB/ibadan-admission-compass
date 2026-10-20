import { knowledgeBase } from "@/data";
import type { IntentId } from "@/types/intents";
import type { KnowledgeItem } from "@/types/knowledge";

export interface ExploreCategory {
  id: string;
  title: string;
  description: string;
  intents: IntentId[];
  /** Extra keyword boosts when matching items into this category. */
  keywords: string[];
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    id: "admission-requirements",
    title: "Admission Requirements",
    description: "General eligibility, O'Level and entry rules.",
    intents: ["admission_requirements", "cut_off_mark"],
    keywords: ["requirement", "olevel", "eligibility"],
  },
  {
    id: "programmes",
    title: "Programmes",
    description: "Browse courses and programme guidance.",
    intents: ["programme_information", "programme_requirements", "available_courses"],
    keywords: ["programme", "course", "faculty"],
  },
  {
    id: "application-process",
    title: "Application Process",
    description: "How and where to apply for admission.",
    intents: ["application_process", "application_portal"],
    keywords: ["apply", "application", "portal"],
  },
  {
    id: "screening",
    title: "Screening",
    description: "Post-UTME / screening registration and format.",
    intents: ["screening"],
    keywords: ["screening", "post-utme"],
  },
  {
    id: "utme",
    title: "UTME",
    description: "UTME / JAMB route into 100 level.",
    intents: ["UTME", "cut_off_mark"],
    keywords: ["utme", "jamb"],
  },
  {
    id: "direct-entry",
    title: "Direct Entry",
    description: "Direct Entry routes and qualifications.",
    intents: ["direct_entry"],
    keywords: ["direct entry", "nce", "nd", "hnd"],
  },
  {
    id: "fees",
    title: "Fees",
    description: "Tuition, acceptance and related charges.",
    intents: ["fees"],
    keywords: ["fee", "tuition", "payment"],
  },
  {
    id: "important-dates",
    title: "Important Dates",
    description: "Deadlines and registration windows.",
    intents: ["important_dates"],
    keywords: ["deadline", "date", "closing"],
  },
  {
    id: "required-documents",
    title: "Required Documents",
    description: "Credentials needed for application or screening.",
    intents: ["required_documents"],
    keywords: ["document", "credentials"],
  },
  {
    id: "faqs",
    title: "FAQs",
    description: "Common admission questions.",
    intents: ["general_faq", "admission_status"],
    keywords: ["faq", "official", "status"],
  },
  {
    id: "contact-information",
    title: "Contact Information",
    description: "Admission Unit and official channels.",
    intents: ["contact_information"],
    keywords: ["contact", "email", "office"],
  },
];

export function getItemsForCategory(categoryId: string): KnowledgeItem[] {
  const category = EXPLORE_CATEGORIES.find((entry) => entry.id === categoryId);
  if (!category) return [];

  return knowledgeBase.filter((item) => {
    if (category.intents.includes(item.intent)) return true;
    const haystack = [item.category, item.question, ...item.keywords]
      .join(" ")
      .toLocaleLowerCase();
    return category.keywords.some((keyword) => haystack.includes(keyword));
  });
}

export function getCategoryCounts(): Record<string, number> {
  return Object.fromEntries(
    EXPLORE_CATEGORIES.map((category) => [
      category.id,
      getItemsForCategory(category.id).length,
    ]),
  );
}
