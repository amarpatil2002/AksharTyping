import type { PaginationMeta } from "../../exam/types/typingExam.types";

// Supported languages
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

export type TypingPassageLanguage = (typeof LANGUAGES)[number];

// Passage status
export type TypingPassageStatus = "draft" | "published" | "archived";

// Passage difficulty
export type TypingPassageDifficulty = "easy" | "medium" | "hard";

// Passage
export interface TypingPassage {
  _id: string;
  examId: string;
  title: string;
  language: TypingPassageLanguage;
  content: string;
  wordCount: number;
  difficulty: TypingPassageDifficulty;
  status: TypingPassageStatus;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Create passage payload
export interface CreateTypingPassagePayload {
  title: string;
  language: TypingPassageLanguage;
  content: string;
  difficulty: TypingPassageDifficulty;
  status?: TypingPassageStatus;
}

// Update passage payload
export type UpdateTypingPassagePayload = Partial<CreateTypingPassagePayload>;

// Passage filters
export interface TypingPassageFilters {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: TypingPassageDifficulty;
  status?: TypingPassageStatus;
  language?: TypingPassageLanguage;
}

// Passage list response
export interface TypingPassageListResponse {
  passages: TypingPassage[];
  pagination: PaginationMeta;
}

// Single passage response
export interface TypingPassageResponse {
  passage: TypingPassage;
}

// Create passage response
export interface CreateTypingPassageResponse {
  passage: TypingPassage;
}

// Update passage response
export interface UpdateTypingPassageResponse {
  passage: TypingPassage;
}

// Delete passage response
export interface DeleteTypingPassageResponse {
  passageId: string;
  examId: string;
}

// Update passage status payload
export interface UpdateTypingPassageStatusPayload {
  status: TypingPassageStatus;
}

// Passage route parameters
export interface TypingPassageParams {
  examId: string;
  passageId: string;
}

// Exam route parameters
export interface TypingExamParams {
  examId: string;
}
