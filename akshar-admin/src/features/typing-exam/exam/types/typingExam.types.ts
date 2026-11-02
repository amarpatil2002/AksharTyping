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
  | "custom"
  | "fixed_error_penalty"
  | "grouped_error_penalty"
  | "correct_words_ratio"
  | "qualifying_only"
  | "speed_based";

export type TypingSpeedCalculation =
  | "gross_words_per_minute"
  | "correct_words_per_minute"
  | "gross_minus_error_penalty";

export type TypingAccuracyCalculation =
  | "correct_words_divided_by_words_typed"
  | "correct_words_divided_by_reference_words";

export type TypingNotReachedPolicy =
  | "no_separate_penalty"
  | "count_as_error"
  | "apply_configured_penalty";

export type TypingScoringRounding = "none" | "integer" | "two_decimals";

export interface TypingExamErrorPenalties {
  spelling?: number;
  wrongWord?: number;
  omission?: number;
  extraWord?: number;
  capitalization?: number;
  notReached?: number;
}

export interface TypingExamQualification {
  minimumMarks?: number;
  minimumWpm?: number;
  minimumAccuracy?: number;
  maximumErrors?: number | null;
  maximumErrorPercentage?: number | null;
  requireAll?: boolean;
}

export interface TypingExamScoring {
  method: TypingExamScoringMethod;
  wordLength: number;
  minimumWpm: number;
  minimumAccuracy: number;
  errorPenalty: number;
  speedWeight: number;
  accuracyWeight: number;

  // Additional scoring fields
  policyVersion?: number;

  errorPenalties?: TypingExamErrorPenalties;

  errorsPerGroup?: number;
  groupPenalty?: number;

  speedCalculation?: TypingSpeedCalculation;
  accuracyCalculation?: TypingAccuracyCalculation;

  notReachedPolicy?: TypingNotReachedPolicy;

  rounding?: TypingScoringRounding;

  qualification?: TypingExamQualification;
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
