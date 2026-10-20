export interface ProgrammeRecord {
  id: string;
  name: string;
  faculty: string;
  category: string;
  summary: string;
  admissionInfo: string;
  requirements: string;
  relatedFaqs: string[];
  keywords: string[];
  isPlaceholder?: boolean;
  source: string;
  lastUpdated: string;
}
