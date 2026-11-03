import { z } from "zod";
import { LANGUAGES } from "../../../../constants/typing.constants.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ID.");
const language = z.string().trim().toLowerCase().refine(
  (value) => LANGUAGES.includes(value),
  "Unsupported language."
);

const attemptTypes = ["PRACTICE", "MOCK"];
const attemptStatuses = [
  "IN_PROGRESS", "SUBMITTED", "EVALUATING", "COMPLETED",
  "EVALUATION_FAILED", "CANCELLED",
];

export const startTypingAttemptSchema = z.object({
  examId: objectId,
  passageId: objectId,
  attemptType: z.enum(attemptTypes).default("PRACTICE"),
}).strict();

export const saveTypingProgressSchema = z.object({
  typedText: z.string().max(100000, "Typed text is too long."),
  progressVersion: z.number().int().min(0),
}).strict();

export const submitTypingAttemptSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(128).optional(),
  typedText: z.string().max(100000).optional(),
  progressVersion: z.number().int().min(0).optional(),
}).strict();

export const attemptIdParamsSchema = z.object({
  attemptId: objectId,
}).strict();

export const resultIdParamsSchema = z.object({
  resultId: objectId,
}).strict();

export const examIdParamsSchema = z.object({
  examId: objectId,
}).strict();

export const passageIdParamsSchema = z.object({
  passageId: objectId,
}).strict();

export const userExamQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).optional(),
  language: language.optional(),
  examType: z.enum(["WORD", "CHARACTER", "HYBRID"]).optional(),
  examCategory: z.enum([
    "SSC", "RRB", "CPCT", "HIGH_COURT", "STATE", "AIIMS", "BANK", "OTHER",
  ]).optional(),
}).strict();

export const userPassageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  language: language.optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  category: z.string().trim().max(100).optional(),
}).strict();

export const userAttemptHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  examId: objectId.optional(),
  passageId: objectId.optional(),
  attemptType: z.enum(attemptTypes).optional(),
  status: z.enum(attemptStatuses).optional(),
}).strict();
