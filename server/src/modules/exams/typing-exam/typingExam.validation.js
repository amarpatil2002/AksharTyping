import { z } from "zod";

// ============================================================
// CONSTANTS
// ============================================================

const LANGUAGES = [
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
];

const DIFFICULTIES = ["easy", "medium", "hard"];

const ATTEMPT_STATUSES = ["in_progress", "evaluated", "expired", "abandoned"];

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// ============================================================
// REUSABLE VALIDATION
// ============================================================

const objectIdSchema = z
  .string()
  .trim()
  .regex(OBJECT_ID_REGEX, "Invalid ID format.");

const pageSchema = z.coerce.number().int().min(1).default(1);

const limitSchema = z.coerce.number().int().min(1).max(100).default(10);

// ============================================================
// EXAM PARAMS
// ============================================================

// GET /api/v1/typing/:examId

export const examParamsSchema = z
  .object({
    examId: objectIdSchema,
  })
  .strict();

// ============================================================
// START ATTEMPT PARAMS
// ============================================================

// POST /api/v1/typing/:examId/passages/:passageId/start

export const startAttemptParamsSchema = z
  .object({
    examId: objectIdSchema,
    passageId: objectIdSchema,
  })
  .strict();

// ============================================================
// EXAM QUERY
// ============================================================

// GET /api/v1/typing

export const examQuerySchema = z
  .object({
    page: pageSchema,
    limit: limitSchema,

    search: z
      .string()
      .trim()
      .max(200, "Search cannot exceed 200 characters.")
      .optional(),

    language: z.enum(LANGUAGES).optional(),

    sort: z
      .enum(["newest", "oldest", "title_asc", "title_desc"])
      .default("newest"),
  })
  .strict();

// ============================================================
// PASSAGE QUERY
// ============================================================

// GET /api/v1/typing/:examId/passages

export const passageQuerySchema = z
  .object({
    page: pageSchema,
    limit: limitSchema,

    difficulty: z.enum(DIFFICULTIES).optional(),

    search: z
      .string()
      .trim()
      .max(200, "Search cannot exceed 200 characters.")
      .optional(),
  })
  .strict();

// ============================================================
// ATTEMPT PARAMS
// ============================================================

// PATCH /api/v1/typing/attempts/:attemptId/progress
// POST  /api/v1/typing/attempts/:attemptId/submit
// GET   /api/v1/typing/attempts/:attemptId/result

export const attemptParamsSchema = z
  .object({
    attemptId: objectIdSchema,
  })
  .strict();

// ============================================================
// ATTEMPT HISTORY QUERY
// ============================================================

// GET /api/v1/typing/attempts/history

export const attemptQuerySchema = z
  .object({
    page: pageSchema,
    limit: limitSchema,

    status: z.enum(ATTEMPT_STATUSES).optional(),

    search: z
      .string()
      .trim()
      .max(200, "Search cannot exceed 200 characters.")
      .optional(),

    sort: z.enum(["newest", "oldest"]).default("newest"),
  })
  .strict();

// ============================================================
// UPDATE ATTEMPT PROGRESS
// ============================================================

// PATCH /api/v1/typing/attempts/:attemptId/progress

export const updateAttemptProgressSchema = z
  .object({
    typedText: z.string().max(100000, "Typed text is too long."),

    progressVersion: z.number().int().min(0).optional(),
  })
  .strict();

// ============================================================
// SUBMIT ATTEMPT
// ============================================================

// POST /api/v1/typing/attempts/:attemptId/submit

export const submitAttemptSchema = z
  .object({
    typedText: z.string().max(100000, "Typed text is too long."),

    progressVersion: z.number().int().min(0).optional(),
  })
  .strict();

// ============================================================
// EXAM + PASSAGE PARAMS
// ============================================================

export const examPassageParamsSchema = z
  .object({
    examId: objectIdSchema,
    passageId: objectIdSchema,
  })
  .strict();
