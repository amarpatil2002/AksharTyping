import type { PaginationMeta } from "../../exam/types/typingExam.types";

export type TypingPassageStatus = "draft" | "published" | "archived";

export type TypingPassageDifficulty = "easy" | "medium" | "hard";

export interface TypingPassage {
  _id: string;
  examId: string;
  title: string;
  language: string;
  content: string;
  wordCount: number;
  difficulty: TypingPassageDifficulty;
  status: TypingPassageStatus;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTypingPassagePayload {
  title: string;
  language: string;
  content: string;
  difficulty: TypingPassageDifficulty;
  status?: TypingPassageStatus;
}

export type UpdateTypingPassagePayload = Partial<CreateTypingPassagePayload>;

export interface TypingPassageFilters {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: TypingPassageDifficulty;
  status?: TypingPassageStatus;
  language?: string;
}

export interface TypingPassageListResponse {
  passages: TypingPassage[];
  pagination: PaginationMeta;
}
