import programmesCatalog from "@/data/programmes-catalog.json";
import { searchKnowledge } from "@/services/searchKnowledge";
import type { ProgrammeRecord } from "@/types/programmes";
import type { KnowledgeItem } from "@/types/knowledge";

export interface GlobalSearchHit {
  kind: "knowledge" | "programme";
  id: string;
  title: string;
  snippet: string;
  score: number;
  knowledge?: KnowledgeItem;
  programme?: ProgrammeRecord;
}

export interface GlobalSearchResult {
  query: string;
  hits: GlobalSearchHit[];
  /** Reserved for future Transformers.js semantic ranking. */
  mode: "lexical" | "semantic-ready";
}

function programmeScore(query: string, programme: ProgrammeRecord): number {
  const q = query.toLocaleLowerCase();
  const bag = [
    programme.name,
    programme.faculty,
    programme.category,
    programme.summary,
    programme.requirements,
    ...programme.keywords,
  ]
    .join(" ")
    .toLocaleLowerCase();

  let score = 0;
  for (const token of q.split(/[^a-z0-9]+/).filter((part) => part.length > 2)) {
    if (bag.includes(token)) score += 1.5;
  }
  if (programme.name.toLocaleLowerCase().includes(q)) score += 4;
  if (q.includes("requirement") && programme.requirements) score += 1.5;
  return score;
}

/**
 * Global admission search across knowledge base + programme catalog.
 * Lexical today; searchKnowledge accepts a SemanticEncoder for later upgrades.
 */
export async function globalAdmissionSearch(
  query: string,
  limit = 8,
): Promise<GlobalSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: trimmed, hits: [], mode: "lexical" };
  }

  const knowledge = await searchKnowledge(trimmed, { limit: limit + 2 });
  const programmes = (programmesCatalog as ProgrammeRecord[])
    .map((programme) => ({
      programme,
      score: programmeScore(trimmed, programme),
    }))
    .filter((entry) => entry.score >= 1.5)
    .sort((a, b) => b.score - a.score);

  const hits: GlobalSearchHit[] = [
    ...knowledge.scores.map(({ item, score }) => ({
      kind: "knowledge" as const,
      id: item.id,
      title: item.question,
      snippet: item.answer.slice(0, 180),
      score,
      knowledge: item,
    })),
    ...programmes.map(({ programme, score }) => ({
      kind: "programme" as const,
      id: programme.id,
      title: programme.name,
      snippet: programme.requirements.slice(0, 180),
      score,
      programme,
    })),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    query: trimmed,
    hits,
    mode: "lexical",
  };
}
