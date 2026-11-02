import { z } from "zod";

import { LANGUAGES } from "../../../../models/typing/TypingExam.js";

// ============================================================
// COMMON SCHEMAS
// ============================================================

const objectIdValueSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const nonEmptyString = (max) => {
  let schema = z.string().trim().min(1);

  if (max !== undefined) {
    schema = schema.max(max);
  }

  return schema;
};

const languageSchema = z.enum(LANGUAGES);

const examStatusSchema = z.enum(["draft", "published", "archived"]);

const passageStatusSchema = z.enum(["draft", "published", "archived"]);

const difficultySchema = z.enum(["easy", "medium", "hard"]);

const positiveNumberSchema = z.number().min(0);

const positiveIntegerSchema = z.number().int().min(1);

// ============================================================
// PARAMS SCHEMAS
// ============================================================

// Used by routes containing only :examId.
export const objectIdSchema = z
  .object({
    examId: objectIdValueSchema,
  })
  .strict();

// Used by routes containing :examId and :passageId.
export const passageParamsSchema = z
  .object({
    examId: objectIdValueSchema,
    passageId: objectIdValueSchema,
  })
  .strict();

// ============================================================
// SCORING SCHEMAS
// ============================================================

const errorPenaltiesSchema = z
  .object({
    spelling: positiveNumberSchema.optional(),
    wrongWord: positiveNumberSchema.optional(),
    omission: positiveNumberSchema.optional(),
    extraWord: positiveNumberSchema.optional(),
    capitalization: positiveNumberSchema.optional(),
    notReached: positiveNumberSchema.optional(),
  })
  .strict();

const qualificationSchema = z
  .object({
    minimumMarks: positiveNumberSchema.optional(),
    minimumWpm: positiveNumberSchema.optional(),
    minimumAccuracy: z.number().min(0).max(100).optional(),
    maximumErrors: positiveNumberSchema.nullable().optional(),
    maximumErrorPercentage: z.number().min(0).max(100).nullable().optional(),
    requireAll: z.boolean().optional(),
  })
  .strict();

const scoringMethodSchema = z.enum([
  "standard",
  "net_wpm",
  "accuracy",
  "weighted",
  "custom",
  "fixed_error_penalty",
  "grouped_error_penalty",
  "correct_words_ratio",
  "qualifying_only",
  "speed_based",
]);

const speedCalculationSchema = z.enum([
  "gross_words_per_minute",
  "correct_words_per_minute",
  "gross_minus_error_penalty",
]);

const accuracyCalculationSchema = z.enum([
  "correct_words_divided_by_words_typed",
  "correct_words_divided_by_reference_words",
]);

const notReachedPolicySchema = z.enum([
  "no_separate_penalty",
  "count_as_error",
  "apply_configured_penalty",
]);

const roundingSchema = z.enum(["none", "integer", "two_decimals"]);

const scoringSchema = z
  .object({
    method: scoringMethodSchema.optional(),

    policyVersion: z.number().min(1).optional(),

    wordLength: z.number().min(1).optional(),

    minimumWpm: positiveNumberSchema.optional(),

    minimumAccuracy: z.number().min(0).max(100).optional(),

    errorPenalty: positiveNumberSchema.optional(),

    errorPenalties: errorPenaltiesSchema.optional(),

    speedWeight: z.number().min(0).max(100).optional(),

    accuracyWeight: z.number().min(0).max(100).optional(),

    errorsPerGroup: positiveIntegerSchema.optional(),

    groupPenalty: positiveNumberSchema.optional(),

    speedCalculation: speedCalculationSchema.optional(),

    accuracyCalculation: accuracyCalculationSchema.optional(),

    notReachedPolicy: notReachedPolicySchema.optional(),

    rounding: roundingSchema.optional(),

    qualification: qualificationSchema.optional(),
  })
  .strict()
  .superRefine((scoring, ctx) => {
    // Validate weighted scoring when both weights are supplied.
    if (
      scoring.method === "weighted" &&
      scoring.speedWeight !== undefined &&
      scoring.accuracyWeight !== undefined &&
      Math.abs(scoring.speedWeight + scoring.accuracyWeight - 100) > 0.000001
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accuracyWeight"],
        message: "Speed weight and accuracy weight must total 100.",
      });
    }

    // Grouped penalty requires a positive integer.
    if (
      scoring.method === "grouped_error_penalty" &&
      scoring.errorsPerGroup !== undefined &&
      (!Number.isInteger(scoring.errorsPerGroup) || scoring.errorsPerGroup < 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["errorsPerGroup"],
        message: "Errors per group must be a positive integer.",
      });
    }
  });

// ============================================================
// EXAM SCHEMAS
// ============================================================

export const createExamSchema = z
  .object({
    title: nonEmptyString(200),

    slug: nonEmptyString(),

    description: z.string().trim().optional(),

    language: languageSchema,

    durationSeconds: z.number().min(1),

    targetWpm: positiveNumberSchema.optional(),

    maximumMarks: z.number().min(1),

    passingPercentage: z.number().min(0).max(100),

    scoring: scoringSchema.optional(),

    instructions: z.array(z.string()).optional(),
    status: examStatusSchema.optional(),
  })
  .strict()
  .superRefine((exam, ctx) => {
    const minimumMarks = exam.scoring?.qualification?.minimumMarks;

    if (minimumMarks !== undefined && minimumMarks > exam.maximumMarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scoring", "qualification", "minimumMarks"],
        message: "Minimum qualification marks cannot exceed maximum marks.",
      });
    }
  });

export const updateExamSchema = z
  .object({
    title: nonEmptyString(200).optional(),

    slug: nonEmptyString().optional(),

    description: z.string().trim().optional(),

    language: languageSchema.optional(),

    durationSeconds: z.number().min(1).optional(),

    targetWpm: positiveNumberSchema.optional(),

    maximumMarks: z.number().min(1).optional(),

    passingPercentage: z.number().min(0).max(100).optional(),

    scoring: scoringSchema.optional(),

    instructions: z.array(z.string()).optional(),
    status: examStatusSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one exam field is required.",
  });

// Status is updated through its dedicated endpoint.
export const updateExamStatusSchema = z
  .object({
    status: examStatusSchema,
  })
  .strict();

// ============================================================
// PASSAGE SCHEMAS
// ============================================================

export const createPassageSchema = z
  .object({
    title: z.string().trim().max(200).optional(),

    language: languageSchema,

    content: nonEmptyString(),

    difficulty: difficultySchema.optional(),
    status: passageStatusSchema.optional(),
  })
  .strict();

export const updatePassageSchema = z
  .object({
    title: z.string().trim().max(200).optional(),

    language: languageSchema.optional(),

    content: nonEmptyString().optional(),

    difficulty: difficultySchema.optional(),
    status: passageStatusSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one passage field is required.",
  });

export const updatePassageStatusSchema = z
  .object({
    status: passageStatusSchema,
  })
  .strict();

// ============================================================
// EXAM QUERY SCHEMA
// ============================================================

export const examQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    status: examStatusSchema.optional(),

    language: languageSchema.optional(),

    search: z.string().trim().optional(),
  })
  .strict();

// ============================================================
// PASSAGE QUERY SCHEMA
// ============================================================

export const passageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    status: passageStatusSchema.optional(),

    language: languageSchema.optional(),

    difficulty: difficultySchema.optional(),

    search: z.string().trim().optional(),
  })
  .strict();
