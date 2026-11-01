import { number, z } from "zod";

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
];

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId.");

const nonEmptyString = z.string().trim().min(1);

const paginationSchema = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
};

// ==========================================
// EXAM VALIDATION
// ==========================================

const scoringSchema = z
  .object({
    method: z
      .enum(["standard", "net_wpm", "accuracy", "weighted", "custom"])
      .default("standard"),

    wordLength: z.coerce.number().int().min(1).max(20).default(5),

    minimumWpm: z.coerce.number().min(0).max(500).default(0),

    minimumAccuracy: z.coerce.number().min(0).max(100).default(0),

    errorPenalty: z.coerce.number().min(0).max(100).default(0),

    speedWeight: z.coerce.number().min(0).max(100).default(50),

    accuracyWeight: z.coerce.number().min(0).max(100).default(50),
  })
  .strict()
  .superRefine((scoring, ctx) => {
    if (
      scoring.method === "weighted" &&
      Math.abs(scoring.speedWeight + scoring.accuracyWeight - 100) > 0.001
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Speed weight and accuracy weight must total 100 for weighted scoring.",
        path: ["accuracyWeight"],
      });
    }
  });

export const createExamSchema = z
  .object({
    title: nonEmptyString.max(200),

    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers and hyphens.",
      ),

    description: z.string().trim().max(5000).default(""),

    language: z
      .enum(LANGUAGES, {
        message: "Please select a valid language.",
      })
      .default("english"),

    durationSeconds: z.coerce.number().int().min(1).max(86400).default(600),

    targetWpm: z.coerce.number().min(0).max(500).default(30),

    maximumMarks: z.coerce.number().min(1).max(100000).default(100),

    passingPercentage: z.coerce.number().min(0).max(100).default(40),

    scoring: scoringSchema.default({
      method: "standard",
      wordLength: 5,
      minimumWpm: 0,
      minimumAccuracy: 0,
      errorPenalty: 0,
      speedWeight: 50,
      accuracyWeight: 50,
    }),

    instructions: z.array(nonEmptyString.max(1000)).max(50).default([]),

    status: z.enum(["draft", "published", "archived"]).default("draft"),
  })
  .strict();

export const updateScoringSchema = z
  .object({
    method: z
      .enum(["standard", "net_wpm", "accuracy", "weighted", "custom"])
      .optional(),

    wordLength: z.coerce.number().int().min(1).max(20).optional(),

    minimumWpm: z.coerce.number().min(0).max(500).optional(),

    minimumAccuracy: z.coerce.number().min(0).max(100).optional(),

    errorPenalty: z.coerce.number().min(0).max(100).optional(),

    speedWeight: z.coerce.number().min(0).max(100).optional(),

    accuracyWeight: z.coerce.number().min(0).max(100).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one scoring field is required.",
  });

export const updateExamSchema = createExamSchema
  .omit({ scoring: true })
  .partial()
  .extend({
    scoring: updateScoringSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export const updateExamStatusSchema = z
  .object({
    status: z.enum(["draft", "published", "archived"]),
  })
  .strict();

// ==========================================
// PASSAGE VALIDATION
// ==========================================

export const createPassageSchema = z
  .object({
    title: z.string().trim().max(200).default(""),

    language: z
      .enum(LANGUAGES, {
        message: "Please select a valid language.",
      })
      .default("english"),

    content: z.string().trim().min(1).max(100000),

    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),

    status: z.enum(["draft", "published", "archived"]).default("draft"),
  })
  .strict();

export const updatePassageSchema = createPassageSchema
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export const updatePassageStatusSchema = z
  .object({
    status: z.enum(["draft", "published", "archived"]),
  })
  .strict();

// ==========================================
// PARAMETER VALIDATION
// ==========================================

export const objectIdSchema = z
  .object({
    examId: objectId,
  })
  .passthrough();

export const passageParamsSchema = z
  .object({
    examId: z.string().regex(/^[0-9a-fA-F]{24}$/),

    passageId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  })
  .strict();

export const attemptParamsSchema = z
  .object({
    attemptId: objectId,
  })
  .strict();

// ==========================================
// EXAM LIST FILTERS
// ==========================================

export const examQuerySchema = z
  .object({
    ...paginationSchema,

    search: z.string().trim().max(200).optional(),

    status: z.enum(["draft", "published", "archived"]).optional(),

    language: z.string().trim().max(20).optional(),
  })
  .strict();

// ==========================================
// PASSAGE LIST FILTERS
// ==========================================

export const passageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z.string().trim().max(100).optional(),

    language: z.string().trim().min(2).max(20).optional(),

    difficulty: z.enum(["easy", "medium", "hard"]).optional(),

    status: z.enum(["draft", "published", "archived"]).optional(),

    sort: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

// ==========================================
// ATTEMPT LIST FILTERS
// ==========================================

export const attemptQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    examId: objectId.optional(),

    status: z
      .enum(["in_progress", "submitted", "evaluated", "expired"])
      .optional(),

    sort: z.enum(["newest", "oldest"]).default("newest"),
  })
  .strict();

// ==========================================
// MANUAL EVALUATION
// ==========================================

export const evaluateAttemptSchema = z
  .object({
    marks: z.coerce.number().min(0).max(100000),

    maximumMarks: z.coerce.number().positive().max(100000),

    passed: z.boolean(),
  })
  .strict()
  .refine((data) => data.marks <= data.maximumMarks, {
    message: "Marks cannot exceed maximum marks.",
    path: ["marks"],
  });

export const examParamsSchema = z
  .object({
    examId: objectId,
  })
  .strict();

export const examPassageParamsSchema = z
  .object({
    examId: objectId,
    passageId: objectId,
  })
  .strict();

export const userExamQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z.string().trim().max(200).optional(),

    language: z.string().trim().min(2).max(20).optional(),

    sort: z
      .enum(["newest", "oldest", "title_asc", "title_desc"])
      .default("newest"),
  })
  .strict();

export const userPassageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z.string().trim().max(100).optional(),

    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  })
  .strict();

export const userAttemptQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    examId: objectId.optional(),

    status: z
      .enum(["in_progress", "submitted", "evaluated", "expired"])
      .optional(),

    sort: z.enum(["newest", "oldest"]).default("newest"),
  })
  .strict();

export const updateAttemptProgressSchema = z
  .object({
    typedText: z.string().max(100000),
    progressVersion: z.number().int().min(0),
  })
  .strict();

export const submitAttemptSchema = z
  .object({
    typedText: z.string().max(100000),
    progressVersion: z.number().int().min(0),
  })
  .strict();

export const startAttemptParamsSchema = z
  .object({
    examId: objectId,
    passageId: objectId,
  })
  .strict();
