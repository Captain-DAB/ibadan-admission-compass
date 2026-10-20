/**
 * Admission chatbot intents.
 * Add new intent IDs here, then register patterns in services/nlp.ts.
 */
export const INTENT_IDS = [
  "admission_requirements",
  "application_process",
  "screening",
  "cut_off_mark",
  "programme_information",
  "programme_requirements",
  "available_courses",
  "fees",
  "admission_status",
  "application_portal",
  "required_documents",
  "direct_entry",
  "UTME",
  "important_dates",
  "contact_information",
  "general_faq",
  "unknown",
] as const;

export type IntentId = (typeof INTENT_IDS)[number];

export interface IntentDefinition {
  id: IntentId;
  label: string;
  description: string;
  /** Example phrasings that should map to this intent (for documentation & NLP). */
  examples: string[];
  /** Lexical cues used by the current browser-side classifier. */
  patterns: string[];
}

export const INTENT_DEFINITIONS: IntentDefinition[] = [
  {
    id: "admission_requirements",
    label: "Admission requirements",
    description: "General eligibility, O'Level, age, and entry requirements.",
    examples: [
      "What are the admission requirements?",
      "What do I need to get admitted?",
      "What qualifications do I need?",
    ],
    patterns: [
      "requirement",
      "requirements",
      "qualify",
      "qualification",
      "eligibility",
      "need to get admitted",
      "what do i need",
      "o level",
      "olevel",
      "waec",
      "neco",
      "credits",
      "minimum age",
    ],
  },
  {
    id: "application_process",
    label: "Application process",
    description: "How to apply and application steps.",
    examples: [
      "How do I apply?",
      "I want to apply to UI.",
      "How can I submit my application?",
    ],
    patterns: [
      "how do i apply",
      "how to apply",
      "application process",
      "application steps",
      "submit application",
      "want to apply",
      "apply to ui",
      "register for admission",
    ],
  },
  {
    id: "screening",
    label: "Screening",
    description: "Post-UTME / screening registration and format.",
    examples: [
      "How does screening work?",
      "What is Post-UTME screening?",
    ],
    patterns: [
      "screening",
      "post utme",
      "post-utme",
      "postutme",
      "aptitude test",
    ],
  },
  {
    id: "cut_off_mark",
    label: "Cut-off mark",
    description: "Cut-off marks and minimum scores.",
    examples: [
      "What is the cut-off mark?",
      "What is the minimum UTME score?",
    ],
    patterns: [
      "cut off",
      "cutoff",
      "cut-off",
      "minimum score",
      "minimum utme",
      "jamb score",
    ],
  },
  {
    id: "programme_information",
    label: "Programme information",
    description: "General information about programmes and faculties.",
    examples: [
      "Tell me about Computer Science",
      "What programmes does UI offer?",
    ],
    patterns: [
      "programme information",
      "program information",
      "about the course",
      "about the programme",
      "faculty",
      "department",
    ],
  },
  {
    id: "programme_requirements",
    label: "Programme requirements",
    description: "Subject combinations and programme-specific requirements.",
    examples: [
      "What are the requirements for Computer Science?",
      "What subjects do I need for Medicine?",
    ],
    patterns: [
      "requirements for",
      "subject combination",
      "programme requirements",
      "program requirements",
      "course requirements",
      "jamb combination",
    ],
  },
  {
    id: "available_courses",
    label: "Available courses",
    description: "List of undergraduate programmes / courses.",
    examples: [
      "Which courses are available?",
      "What programmes can I study?",
    ],
    patterns: [
      "available courses",
      "available programmes",
      "list of courses",
      "which programmes",
      "which courses",
      "courses offered",
      "programmes offered",
    ],
  },
  {
    id: "fees",
    label: "Fees",
    description: "Tuition, acceptance fee, and charges.",
    examples: [
      "How much are the fees?",
      "What is the acceptance fee?",
    ],
    patterns: [
      "fee",
      "fees",
      "tuition",
      "acceptance fee",
      "school fees",
      "how much",
      "payment",
      "charges",
      "cost",
    ],
  },
  {
    id: "admission_status",
    label: "Admission status",
    description: "Checking offer / admission status.",
    examples: [
      "How do I check my admission status?",
      "Have I been offered admission?",
    ],
    patterns: [
      "admission status",
      "check status",
      "offer of admission",
      "have i been admitted",
      "admission list",
    ],
  },
  {
    id: "application_portal",
    label: "Application portal",
    description: "Where to apply online.",
    examples: [
      "Where can I apply?",
      "What is the admissions portal?",
    ],
    patterns: [
      "where can i apply",
      "where do i apply",
      "application portal",
      "admissions portal",
      "admissions.ui.edu.ng",
      "online portal",
    ],
  },
  {
    id: "required_documents",
    label: "Required documents",
    description: "Documents needed for application or screening.",
    examples: [
      "What documents do I need?",
      "Which credentials should I upload?",
    ],
    patterns: [
      "documents",
      "document",
      "credentials",
      "upload",
      "birth certificate",
      "passport photograph",
      "results slip",
    ],
  },
  {
    id: "direct_entry",
    label: "Direct Entry",
    description: "Direct Entry eligibility and process.",
    examples: [
      "Who can apply through Direct Entry?",
      "What is Direct Entry admission?",
    ],
    patterns: [
      "direct entry",
      "de applicant",
      "a level",
      "a-level",
      "nce certificate",
      "nd certificate",
      "hnd",
      "200 level",
    ],
  },
  {
    id: "UTME",
    label: "UTME",
    description: "UTME / JAMB-related admission questions.",
    examples: [
      "What is the UTME requirement?",
      "Do I need JAMB for UI?",
    ],
    patterns: ["utme", "jamb", "unified tertiary"],
  },
  {
    id: "important_dates",
    label: "Important dates",
    description: "Deadlines, registration windows, and key dates.",
    examples: [
      "When does registration close?",
      "What are the important admission dates?",
    ],
    patterns: [
      "deadline",
      "deadlines",
      "closing date",
      "important dates",
      "when does",
      "registration close",
      "registration open",
      "timeline",
    ],
  },
  {
    id: "contact_information",
    label: "Contact information",
    description: "Admission unit contacts and official channels.",
    examples: [
      "How can I contact the Admission Unit?",
      "What is the admissions office email?",
    ],
    patterns: [
      "contact",
      "email",
      "phone",
      "admission unit",
      "admissions office",
      "reach",
      "help desk",
    ],
  },
  {
    id: "general_faq",
    label: "General FAQ",
    description: "Other common admission questions.",
    examples: [
      "Where can I find official admission information?",
      "Is this information official?",
    ],
    patterns: [
      "official information",
      "faq",
      "frequently asked",
      "verify",
      "official source",
    ],
  },
  {
    id: "unknown",
    label: "Unknown",
    description: "Intent could not be determined confidently.",
    examples: [],
    patterns: [],
  },
];

export function getIntentDefinition(id: IntentId): IntentDefinition | undefined {
  return INTENT_DEFINITIONS.find((intent) => intent.id === id);
}
