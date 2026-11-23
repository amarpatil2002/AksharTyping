import { z } from "zod";
import {
  EXAM_STATUS,
  PASSAGE_STATUS,
  SUPPORTED_EXAM_TYPES,
  SUPPORTED_LANGUAGES,
  MAX_PASSAGE_CONTENT_LENGTH,
} from "../config/typingExamAdmin.config.js";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID.");
const objectId = objectIdSchema;
const optionalMetadata = z.record(z.string(), z.unknown()).optional();
const status = z.enum(Object.values(EXAM_STATUS));
const passageStatus = z.enum(Object.values(PASSAGE_STATUS));

const examFields = {
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(1).max(220),
  description: z.string().trim().max(2000).optional(),
  authority: z.string().trim().min(1).max(120),
  examCode: z.string().trim().max(80).optional(),
  postName: z.string().trim().min(1).max(160),
  recruitmentCycle: z.string().trim().max(100).optional(),
  examType: z.enum(SUPPORTED_EXAM_TYPES),
  language: z.enum(SUPPORTED_LANGUAGES),
  policyId: z.string().trim().min(1),
  status: status.optional(),
  metadata: optionalMetadata,
};

const passageFields = {
  examId: objectId,
  title: z.string().trim().min(2).max(200),
  language: z.enum(SUPPORTED_LANGUAGES),
  content: z.string().min(1).max(MAX_PASSAGE_CONTENT_LENGTH),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  status: passageStatus.optional(),
  metadata: optionalMetadata,
};

export const createTypingExamSchema = z.object(examFields);
export const updateTypingExamSchema = z.object(examFields).partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required.",
);
export const updateExamStatusSchema = z.object({ status });
export const examIdParamsSchema = z.object({ examId: objectId });
export const examQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: status.optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  authority: z.string().trim().optional(),
  examType: z.enum(SUPPORTED_EXAM_TYPES).optional(),
  search: z.string().trim().optional(),
});

export const createTypingPassageSchema = z.object(passageFields);
export const updateTypingPassageSchema = z.object(passageFields).omit({
  examId: true,
}).partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required.",
);
export const updatePassageStatusSchema = z.object({ status: passageStatus });
export const passageRouteParamsSchema = z.object({ passageId: objectId });
export const passageQuerySchema = z.object({
  examId: objectId.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: passageStatus.optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});
