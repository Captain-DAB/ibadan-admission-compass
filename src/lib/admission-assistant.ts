import admissionInfo from "@/data/admission-info.json";

export interface AdmissionSource {
  title: string;
  url: string;
}

export interface AdmissionRecord {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  sources: AdmissionSource[];
  updatedAt: string;
  verified: boolean;
}

export const admissionRecords = admissionInfo as AdmissionRecord[];

const stopWords = new Set([
  "a", "an", "and", "are", "can", "do", "does", "for", "how", "i",
  "in", "is", "it", "me", "my", "of", "on", "or", "the", "to", "ui",
  "what", "when", "where", "which", "who", "you", "your",
]);

const topicSynonyms: Record<string, string[]> = {
  admission: ["apply", "application", "eligibility"],
  course: ["programme", "programmes", "program", "programs", "department"],
  cut: ["score", "cutoff", "cut-off", "points", "marks"],
  jamb: ["utme"],
  olevel: ["o-level", "waec", "neco", "credits"],
  pay: ["fee", "fees", "tuition", "payment", "cost", "charges"],
  screen: ["screening", "post-utme", "postutme"],
  deadline: ["closing", "close", "date", "when"],
};

function normalize(value: string): string[] {
  const words = value
    .toLocaleLowerCase()
    .replace(/[’']/g, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));

  const expanded = new Set(words);

  for (const word of words) {
    for (const [topic, synonyms] of Object.entries(topicSynonyms)) {
      if (word === topic || synonyms.includes(word)) {
        expanded.add(topic);
        synonyms.forEach((synonym) => expanded.add(synonym.replaceAll("-", "")));
      }
    }
  }

  return [...expanded];
}

export function findAdmissionAnswers(
  query: string,
  category?: string,
): AdmissionRecord[] {
  const terms = normalize(query);

  if (terms.length === 0) return [];

  return admissionRecords
    .filter((record) => !category || record.category === category)
    .map((record) => {
      const recordTerms = new Set(
        normalize(
          [record.category, record.question, record.answer, ...record.keywords]
            .join(" ")
            .replaceAll("-", " "),
        ),
      );
      let score = terms.reduce(
        (total, term) => total + Number(recordTerms.has(term)),
        0,
      );

      if (record.question.toLocaleLowerCase().includes(query.toLocaleLowerCase())) {
        score += 3;
      }
      if (category === record.category) score += 1;

      return { record, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ record }) => record);
}

export function buildAdmissionReply(records: AdmissionRecord[]): string {
  if (records.length === 0) {
    return "I couldn't find a verified answer to that in the information available to me. Try one of the admission topics, or check the latest details directly on the [official UI admissions portal](https://admissions.ui.edu.ng/).";
  }

  return records.map((record) => record.answer).join("\n\n");
}
