import { z } from "zod";

import {
  LANGUAGES,
  type TypingPassageStatus,
  type TypingPassageDifficulty,
} from "../types/passage.types";

// ============================================================
// ENUM SCHEMAS
// ============================================================

export const passageLanguageSchema = z.enum(LANGUAGES, {
  message: "Please select a valid Indian language.",
});

export const passageStatusSchema = z.enum(["draft", "published", "archived"]);

export const passageDifficultySchema = z.enum(["easy", "medium", "hard"]);

// ============================================================
// COMMON FIELD SCHEMAS
// ============================================================

const passageTitleSchema = z
  .string()
  .trim()
  .min(3, "Passage title must contain at least 3 characters.")
  .max(200, "Passage title cannot exceed 200 characters.");

const passageContentSchema = z
  .string()
  .trim()
  .min(1, "Passage content is required.")
  .max(50000, "Passage content cannot exceed 50,000 characters.");

// ============================================================
// CREATE PASSAGE SCHEMA
// ============================================================

export const createPassageSchema = z
  .object({
    title: passageTitleSchema,

    language: passageLanguageSchema,

    content: passageContentSchema,

    difficulty: passageDifficultySchema,

    status: passageStatusSchema.default("draft"),
  })
  .strict();

// ============================================================
// UPDATE PASSAGE SCHEMA
// ============================================================

export const updatePassageSchema = z
  .object({
    title: passageTitleSchema.optional(),

    language: passageLanguageSchema.optional(),

    content: passageContentSchema.optional(),

    difficulty: passageDifficultySchema.optional(),

    status: passageStatusSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for updating.",
  });

// ============================================================
// EXAM PARAMS
// ============================================================

export const examParamsSchema = z
  .object({
    examId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid examination ID."),
  })
  .strict();

// ============================================================
// PASSAGE PARAMS
// ============================================================

export const passageParamsSchema = z
  .object({
    examId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid examination ID."),

    passageId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid passage ID."),
  })
  .strict();

// ============================================================
// PASSAGE QUERY SCHEMA
// ============================================================

export const passageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, "Page must be at least 1.").default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1.")
      .max(100, "Limit cannot exceed 100.")
      .default(10),

    search: z
      .string()
      .trim()
      .max(200, "Search cannot exceed 200 characters.")
      .optional(),

    difficulty: passageDifficultySchema.optional(),

    status: passageStatusSchema.optional(),

    language: passageLanguageSchema.optional(),
  })
  .strict();

// ============================================================
// INFERRED TYPES
// ============================================================

export type CreatePassageFormValues = z.infer<typeof createPassageSchema>;

export type UpdatePassageFormValues = z.infer<typeof updatePassageSchema>;

export type PassageQueryValues = z.infer<typeof passageQuerySchema>;

// ============================================================
// ENUM TYPE EXPORTS
// ============================================================

export type { TypingPassageStatus, TypingPassageDifficulty };
