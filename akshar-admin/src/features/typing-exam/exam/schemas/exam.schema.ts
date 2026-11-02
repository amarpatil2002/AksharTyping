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
// Scoring enums
// --------------------------------------------------

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

// --------------------------------------------------
// Error penalty validation
// --------------------------------------------------

const errorPenaltiesSchema = z
  .object({
    spelling: z.number().min(0, "Spelling penalty cannot be negative."),

    wrongWord: z.number().min(0, "Wrong word penalty cannot be negative."),

    omission: z.number().min(0, "Omission penalty cannot be negative."),

    extraWord: z.number().min(0, "Extra word penalty cannot be negative."),

    capitalization: z
      .number()
      .min(0, "Capitalization penalty cannot be negative."),

    notReached: z.number().min(0, "Not reached penalty cannot be negative."),
  })
  .strict();

// --------------------------------------------------
// Qualification validation
// --------------------------------------------------

const qualificationSchema = z
  .object({
    minimumMarks: z.number().min(0, "Minimum marks cannot be negative."),

    minimumWpm: z
      .number()
      .min(0, "Minimum WPM cannot be negative.")
      .max(500, "Minimum WPM cannot exceed 500."),

    minimumAccuracy: z
      .number()
      .min(0, "Minimum accuracy cannot be below 0%.")
      .max(100, "Minimum accuracy cannot exceed 100%."),

    maximumErrors: z
      .number()
      .int("Maximum errors must be a whole number.")
      .min(0, "Maximum errors cannot be negative.")
      .nullable(),

    maximumErrorPercentage: z
      .number()
      .min(0, "Maximum error percentage cannot be negative.")
      .max(100, "Maximum error percentage cannot exceed 100%.")
      .nullable(),

    requireAll: z.boolean(),
  })
  .strict();

// --------------------------------------------------
// Scoring validation
// --------------------------------------------------

const scoringSchema = z
  .object({
    method: scoringMethodSchema,

    policyVersion: z
      .number()
      .int("Policy version must be a whole number.")
      .min(1, "Policy version must be at least 1."),

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

    errorPenalties: errorPenaltiesSchema,

    speedWeight: z
      .number()
      .min(0, "Speed weight cannot be negative.")
      .max(100, "Speed weight cannot exceed 100%."),

    accuracyWeight: z
      .number()
      .min(0, "Accuracy weight cannot be negative.")
      .max(100, "Accuracy weight cannot exceed 100%."),

    errorsPerGroup: z
      .number()
      .int("Errors per group must be a whole number.")
      .min(1, "Errors per group must be at least 1."),

    groupPenalty: z.number().min(0, "Group penalty cannot be negative."),

    speedCalculation: speedCalculationSchema,

    accuracyCalculation: accuracyCalculationSchema,

    notReachedPolicy: notReachedPolicySchema,

    rounding: roundingSchema,

    qualification: qualificationSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.method === "weighted" &&
      Math.abs(data.speedWeight + data.accuracyWeight - 100) > 0.001
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["speedWeight"],
        message: "Speed weight and accuracy weight must add up to 100%.",
      });
    }
  });

// --------------------------------------------------
// Update scoring validation
// --------------------------------------------------

const updateScoringSchema = z
  .object({
    method: scoringMethodSchema.optional(),

    policyVersion: scoringSchema.shape.policyVersion.optional(),

    wordLength: scoringSchema.shape.wordLength.optional(),

    minimumWpm: scoringSchema.shape.minimumWpm.optional(),

    minimumAccuracy: scoringSchema.shape.minimumAccuracy.optional(),

    errorPenalty: scoringSchema.shape.errorPenalty.optional(),

    errorPenalties: errorPenaltiesSchema.partial().optional(),

    speedWeight: scoringSchema.shape.speedWeight.optional(),

    accuracyWeight: scoringSchema.shape.accuracyWeight.optional(),

    errorsPerGroup: scoringSchema.shape.errorsPerGroup.optional(),

    groupPenalty: scoringSchema.shape.groupPenalty.optional(),

    speedCalculation: speedCalculationSchema.optional(),

    accuracyCalculation: accuracyCalculationSchema.optional(),

    notReachedPolicy: notReachedPolicySchema.optional(),

    rounding: roundingSchema.optional(),

    qualification: qualificationSchema.partial().optional(),
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

    if (data.scoring.qualification.minimumMarks > data.maximumMarks) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scoring", "qualification", "minimumMarks"],
        message: "Minimum qualification marks cannot exceed maximum marks.",
      });
    }
  });

// --------------------------------------------------
// Update exam validation
// --------------------------------------------------

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
