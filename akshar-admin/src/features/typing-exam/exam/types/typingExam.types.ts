export const LANGUAGES = [
  "english",
  "assamese",
  "bengali",
  "bodo",
  "dogri",
  "gujarati",
  "hindi",
  "kannada",
  "kashmiri",
  "konkani",
  "maithili",
  "malayalam",
  "manipuri",
  "marathi",
  "nepali",
  "odia",
  "punjabi",
  "sanskrit",
  "santali",
  "sindhi",
  "tamil",
  "telugu",
  "urdu",
] as const;

export type TypingExamLanguage = (typeof LANGUAGES)[number];

export type TypingExamStatus = "draft" | "published" | "archived";

export type TypingExamScoringMethod =
  | "standard"
  | "net_wpm"
  | "accuracy"
  | "weighted"
  | "custom";

export interface TypingExamScoring {
  method: TypingExamScoringMethod;
  wordLength: number;
  minimumWpm: number;
  minimumAccuracy: number;
  errorPenalty: number;
  speedWeight: number;
  accuracyWeight: number;
}

export interface TypingExam {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: TypingExamLanguage;

  durationSeconds: number;
  targetWpm: number;

  maximumMarks: number;
  passingPercentage: number;

  scoring: TypingExamScoring;
  instructions: string[];

  status: TypingExamStatus;

  createdBy: string;
  updatedBy?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateTypingExamPayload {
  title: string;
  slug: string;
  description?: string;
  language: TypingExamLanguage;

  durationSeconds: number;
  targetWpm: number;

  maximumMarks: number;
  passingPercentage: number;

  scoring: TypingExamScoring;
  instructions: string[];

  status?: TypingExamStatus;
}

export interface UpdateTypingExamPayload {
  title?: string;
  slug?: string;
  description?: string;
  language?: TypingExamLanguage;

  durationSeconds?: number;
  targetWpm?: number;

  maximumMarks?: number;
  passingPercentage?: number;

  scoring?: Partial<TypingExamScoring>;
  instructions?: string[];

  status?: TypingExamStatus;
}

export interface TypingExamFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: TypingExamStatus;
  language?: TypingExamLanguage;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TypingExamStatistics {
  passages: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };

  attempts: {
    total: number;
    inProgress: number;
    submitted: number;
    evaluated: number;
    expired: number;
  };
}

export interface GetTypingExamData {
  exam: TypingExam;
  statistics: TypingExamStatistics;
}
