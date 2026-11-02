import type { PaginationMeta } from "../../exam/types/typingExam.types";

// ============================================================
// SUPPORTED LANGUAGES
// ============================================================

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

// ============================================================
// PASSAGE STATUS
// ============================================================

export const PASSAGE_STATUSES = ["draft", "published", "archived"] as const;

export type TypingPassageStatus = (typeof PASSAGE_STATUSES)[number];

// ============================================================
// PASSAGE DIFFICULTY
// ============================================================

export const PASSAGE_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type TypingPassageDifficulty = (typeof PASSAGE_DIFFICULTIES)[number];

// ============================================================
// TYPING PASSAGE
// ============================================================

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

// ============================================================
// CREATE PASSAGE PAYLOAD
// ============================================================

export interface CreateTypingPassagePayload {
  title: string;

  language: TypingPassageLanguage;

  content: string;

  difficulty: TypingPassageDifficulty;

  status?: TypingPassageStatus;
}

// ============================================================
// UPDATE PASSAGE PAYLOAD
// ============================================================

export type UpdateTypingPassagePayload = Partial<CreateTypingPassagePayload>;

// ============================================================
// PASSAGE FILTERS
// ============================================================

export interface TypingPassageFilters {
  page?: number;

  limit?: number;

  search?: string;

  difficulty?: TypingPassageDifficulty;

  status?: TypingPassageStatus;

  language?: TypingPassageLanguage;
}

// ============================================================
// PASSAGE LIST RESPONSE
// ============================================================

export interface TypingPassageListResponse {
  passages: TypingPassage[];

  pagination: PaginationMeta;
}

// ============================================================
// SINGLE PASSAGE RESPONSE
// ============================================================

export interface TypingPassageResponse {
  passage: TypingPassage;
}

// ============================================================
// CREATE PASSAGE RESPONSE
// ============================================================

export interface CreateTypingPassageResponse {
  passage: TypingPassage;
}

// ============================================================
// UPDATE PASSAGE RESPONSE
// ============================================================

export interface UpdateTypingPassageResponse {
  passage: TypingPassage;
}

// ============================================================
// DELETE PASSAGE RESPONSE
// ============================================================

export interface DeleteTypingPassageResponse {
  passageId: string;

  examId: string;
}

// ============================================================
// UPDATE PASSAGE STATUS
// ============================================================

export interface UpdateTypingPassageStatusPayload {
  status: TypingPassageStatus;
}

// ============================================================
// ROUTE PARAMETERS
// ============================================================

export interface TypingPassageParams {
  examId: string;

  passageId: string;
}

export interface TypingExamParams {
  examId: string;
}
