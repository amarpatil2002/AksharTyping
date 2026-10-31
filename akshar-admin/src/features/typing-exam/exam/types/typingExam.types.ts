export type TypingExamStatus = "draft" | "published" | "archived";

export type TypingExamScoringMethod =
  | "standard"
  | "net_wpm"
  | "accuracy"
  | "custom";

export interface TypingExamScoring {
  method: TypingExamScoringMethod;
  wordLength: number;
  minimumWpm: number;
  minimumAccuracy: number;
  errorPenalty: number;
}

export interface TypingExam {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  durationSeconds: number;
  targetWpm: number;
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
  language: string;
  durationSeconds: number;
  targetWpm: number;
  scoring: TypingExamScoring;
  instructions: string[];
  status?: TypingExamStatus;
}

export type UpdateTypingExamPayload = Partial<CreateTypingExamPayload>;

export interface TypingExamFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: TypingExamStatus;
  language?: string;
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
