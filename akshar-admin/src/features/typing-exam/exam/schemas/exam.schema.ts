import { z } from "zod";

// --------------------------------------------------
// Language validation
// --------------------------------------------------

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

const languageSchema = z.enum(LANGUAGES, {
  message: "Please select a valid Indian language.",
});

// --------------------------------------------------
// Scoring validation
// --------------------------------------------------

const scoringSchema = z
  .object({
    method: z.enum(["standard", "net_wpm", "accuracy", "weighted", "custom"]),

    wordLength: z
      .number()
      .int("Word length must be a whole number.")
      .min(1, "Word length must be at least 1.")
      .max(20, "Word length cannot exceed 20."),

    minimumWpm: z
      .number()
      .min(0, "Minimum WPM cannot be negative.")
      .max(500, "Minimum WPM cannot exceed 500."),

    minimumAccuracy: z
      .number()
      .min(0, "Minimum accuracy cannot be below 0%.")
      .max(100, "Minimum accuracy cannot exceed 100%."),

    errorPenalty: z
      .number()
      .min(0, "Error penalty cannot be negative.")
      .max(100, "Error penalty cannot exceed 100."),

    speedWeight: z
      .number()
      .min(0, "Speed weight cannot be negative.")
      .max(100, "Speed weight cannot exceed 100%."),

    accuracyWeight: z
      .number()
      .min(0, "Accuracy weight cannot be negative.")
      .max(100, "Accuracy weight cannot exceed 100%."),
  })
  .strict();

// --------------------------------------------------
// Create exam validation
// --------------------------------------------------

export const examSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Exam title is required.")
      .max(200, "Exam title cannot exceed 200 characters."),

    slug: z
      .string()
      .trim()
      .min(1, "Slug is required.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers and hyphens.",
      ),

    description: z.string().optional(),

    language: languageSchema,

    durationSeconds: z
      .number()
      .int("Duration must be a whole number.")
      .min(1, "Duration must be at least 1 second."),

    targetWpm: z.number().min(0, "Target WPM cannot be negative."),

    maximumMarks: z
      .number()
      .min(1, "Maximum marks must be at least 1.")
      .max(100000, "Maximum marks cannot exceed 100000."),

    passingPercentage: z
      .number()
      .min(0, "Passing percentage cannot be below 0%.")
      .max(100, "Passing percentage cannot exceed 100%."),

    status: z.enum(["draft", "published", "archived"]),

    scoring: scoringSchema,

    instructions: z.array(z.string()),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.scoring.method === "weighted" &&
      Math.abs(data.scoring.speedWeight + data.scoring.accuracyWeight - 100) >
        0.001
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scoring", "speedWeight"],
        message: "Speed weight and accuracy weight must add up to 100%.",
      });
    }
  });

// --------------------------------------------------
// Update exam validation
// --------------------------------------------------

const updateScoringSchema = scoringSchema.partial().strict();

export const updateExamSchema = z
  .object({
    title: examSchema.shape.title.optional(),

    slug: examSchema.shape.slug.optional(),

    description: examSchema.shape.description,

    language: languageSchema.optional(),

    durationSeconds: examSchema.shape.durationSeconds.optional(),

    targetWpm: examSchema.shape.targetWpm.optional(),

    maximumMarks: examSchema.shape.maximumMarks.optional(),

    passingPercentage: examSchema.shape.passingPercentage.optional(),

    status: examSchema.shape.status.optional(),

    scoring: updateScoringSchema.optional(),

    instructions: examSchema.shape.instructions.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
  })
  .superRefine((data, ctx) => {
    const scoring = data.scoring;

    // Validate the weight total when both weights are supplied.
    // If only one weight is supplied, the backend must merge it
    // with the existing exam configuration before validating.
    if (
      scoring?.method === "weighted" &&
      scoring.speedWeight !== undefined &&
      scoring.accuracyWeight !== undefined &&
      Math.abs(scoring.speedWeight + scoring.accuracyWeight - 100) > 0.001
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scoring", "speedWeight"],
        message: "Speed weight and accuracy weight must add up to 100%.",
      });
    }
  });

// --------------------------------------------------
// Types
// --------------------------------------------------

export type ExamFormData = z.infer<typeof examSchema>;

export type UpdateExamFormData = z.infer<typeof updateExamSchema>;

export type ExamFormErrors = Record<string, string>;
