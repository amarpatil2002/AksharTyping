import { z } from "zod";
import { EVALUATOR_TYPES } from "../exam-utilities/types.js";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const examTypes = ["WORD", "CHARACTER", "HYBRID"];
const languages = [
  "multilingual",
  "english",
  "hindi",
  "assamese",
  "bengali",
  "bodo",
  "dogri",
  "gujarati",
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

const examStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"];

const versionStatuses = ["DRAFT", "ACTIVE", "RETIRED"];

const passageDifficulties = ["EASY", "MEDIUM", "HARD"];

const passageStatuses = ["DRAFT", "ACTIVE", "INACTIVE"];

const measurementUnits = [
  "WPM",
  "CPM",
  "KDPH",
  "WORDS",
  "CHARACTERS",
  "KEY_DEPRESSIONS",
];

const normalizationMethods = ["NFC", "NFD", "NFKC", "NFKD", "NONE"];

const speedMethods = [
  "TOTAL_WORDS",
  "TOTAL_CHARACTERS",
  "TOTAL_KEY_DEPRESSIONS",
  "CORRECT_WORDS",
  "CORRECT_CHARACTERS",
  "GROSS_MINUS_PENALTY",
  "POLICY_DEFINED",
];

const errorMethods = [
  "WORD_BASED",
  "CHARACTER_BASED",
  "STROKE_BASED",
  "FULL_HALF",
  "POLICY_DEFINED",
];

const penaltyMethods = [
  "NONE",
  "FIXED_PER_ERROR",
  "GROUPED_ERRORS",
  "PERCENTAGE",
  "POLICY_DEFINED",
];

const roundingMethods = ["ROUND", "FLOOR", "CEIL", "TRUNCATE"];

/* -------------------------------------------------------------------------- */
/* Common                                                                     */
/* -------------------------------------------------------------------------- */

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId.");

const dateSchema = z.coerce.date();

/* -------------------------------------------------------------------------- */
/* Exam                                                                       */
/* -------------------------------------------------------------------------- */

export const createExamSchema = z
  .object({
    title: z.string().trim().min(1).max(200),

    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers and hyphens only.",
      ),

    description: z.string().trim().max(2000).optional(),

    authority: z.string().trim().min(1).max(200),

    examCode: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .transform((value) => value.toUpperCase()),

    postName: z.string().trim().min(1).max(200),

    recruitmentCycle: z.string().trim().min(1).max(100),

    examType: z.enum(examTypes),

    language: z.enum(languages),

    status: z.enum(examStatuses).default("DRAFT"),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Update Exam                                                                */
/* -------------------------------------------------------------------------- */

export const updateExamSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),

    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers and hyphens only.",
      )
      .optional(),

    description: z.string().trim().max(2000).optional(),

    authority: z.string().trim().min(1).max(200).optional(),

    examCode: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .transform((value) => value.toUpperCase())
      .optional(),

    postName: z.string().trim().min(1).max(200).optional(),

    recruitmentCycle: z.string().trim().min(1).max(100).optional(),

    examType: z.enum(examTypes).optional(),

    language: z.enum(languages).optional(),

    status: z.enum(examStatuses).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one exam field must be provided.",
  });

export const getExamsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(examStatuses).optional(),
    examType: z.enum(examTypes).optional(),
    language: z.enum(languages).optional(),
    search: z.string().trim().max(100).optional(),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Exam Params                                                                */
/* -------------------------------------------------------------------------- */

export const examParamsSchema = z
  .object({
    examId: objectIdSchema,
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Exam Version                                                               */
/* -------------------------------------------------------------------------- */

export const createVersionSchema = z
  .object({
    examId: objectIdSchema,

    version: z.string().trim().min(1).max(50),

    recruitmentCycle: z.string().trim().min(1).max(100),

    effectiveFrom: dateSchema,

    effectiveTo: dateSchema.optional(),

    status: z.enum(versionStatuses).default("DRAFT"),
  })
  .strict()
  .refine(
    (data) => {
      if (!data.effectiveTo) return true;
      return data.effectiveTo >= data.effectiveFrom;
    },
    {
      message: "effectiveTo must be greater than or equal to effectiveFrom.",
      path: ["effectiveTo"],
    },
  );

/* -------------------------------------------------------------------------- */
/* Passage Params                                                             */
/* -------------------------------------------------------------------------- */

export const passageParamsSchema = z
  .object({
    passageId: objectIdSchema,
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Create Passage                                                             */
/* -------------------------------------------------------------------------- */

export const createPassageSchema = z
  .object({
    examId: objectIdSchema,

    examVersionId: objectIdSchema,

    title: z.string().trim().min(1).max(200),

    language: z.enum(languages),

    content: z
      .string()
      .trim()
      .min(1)
      .max(50000)
      .superRefine((text, context) => {
        const words = text.split(/\s+/u);
        if (words.length > 1999 || words.some((word) => Array.from(word).length > 1999)) {
          context.addIssue({
            code: "custom",
            message: "Passage exceeds the safe evaluation limits.",
          });
        }
      }),

    difficulty: z.enum(passageDifficulties).default("MEDIUM"),

    status: z.enum(passageStatuses).default("DRAFT"),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Evaluation Policy                                                          */
/* -------------------------------------------------------------------------- */

export const createPolicySchema = z
  .object({
    examVersionId: objectIdSchema,

    name: z.string().trim().min(1).max(200),

    version: z.number().int().min(1),

    evaluator: z.enum(
      Object.values(EVALUATOR_TYPES).filter(
        (evaluator) => evaluator !== EVALUATOR_TYPES.HIGH_COURT_MULTI_LANGUAGE,
      ),
    ),

    measurement: z
      .object({
        unit: z.enum(measurementUnits),
      })
      .strict(),

    duration: z
      .object({
        seconds: z.number().int().positive().max(86400),
      })
      .strict(),

    normalization: z.enum(normalizationMethods).default("NFC"),

    speed: z
      .object({
        grossMethod: z.enum(speedMethods),
        netMethod: z.enum(speedMethods),
      })
      .strict(),

    errors: z
      .object({
        method: z.enum(errorMethods),
        allowedPercentage: z.number().min(0).max(100).optional(),
      })
      .strict(),

    penalty: z
      .object({
        method: z.enum(penaltyMethods),
        value: z.number().min(0).default(0),
      })
      .strict(),

    scoring: z
      .object({
        maximumMarks: z.number().min(0),
        marksPerMistake: z.number().min(0).optional(),
      })
      .strict()
      .optional(),

    evaluatorConfig: z
      .object({
        minimumWpm: z.number().min(0).optional(),
        minimumMarks: z.number().min(0).max(1000).optional(),
        maximumMarks: z.number().positive().max(1000).optional(),
        correctWordMark: z.number().positive().max(100).optional(),
        useIgnorableMistakes: z.boolean().optional(),
        ignorableMistakePercentage: z.number().min(0).max(100).optional(),
        deductionWordsPerMistake: z.number().min(0).optional(),
      })
      .strict()
      .optional(),

    qualification: z
      .object({
        minimumSpeed: z.number().min(0).optional(),

        maximumErrors: z.number().int().min(0).optional(),
      })
      .strict(),

    rounding: z
      .object({
        method: z.enum(roundingMethods).default("ROUND"),

        decimalPlaces: z.number().int().min(0).max(6).default(2),
      })
      .strict(),
  })
  .strict()
  .superRefine((policy, context) => {
    if (policy.evaluator === "RSSB_LDC_JA_2026" && policy.duration.seconds !== 600) {
      context.addIssue({
        code: "custom",
        path: ["duration", "seconds"],
        message: "RSSB LDC speed sections are 10 minutes (600 seconds).",
      });
    }
    if (policy.evaluator === "RSSB_LDC_JA_2026") {
      if (policy.scoring !== undefined || policy.penalty.method !== "NONE") {
        context.addIssue({
          code: "custom",
          path: ["evaluator"],
          message: "RSSB marks are calculated from correctly typed words; use evaluatorConfig for marks settings.",
        });
      }
      if ((policy.evaluatorConfig?.maximumMarks ?? 25) < (policy.evaluatorConfig?.minimumMarks ?? 9)) {
        context.addIssue({
          code: "custom",
          path: ["evaluatorConfig"],
          message: "minimumMarks cannot exceed maximumMarks.",
        });
      }
    }
    if (policy.evaluator === "MPSC_GROUP_C_CLERK_TYPIST_2026" && policy.scoring !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["evaluator"],
        message: "MPSC Clerk-Typist policy is certificate-practice qualification and does not award exam marks.",
      });
    }
    if (["FULL_HALF", "POLICY_DEFINED"].includes(policy.errors.method)) {
      context.addIssue({
        code: "custom",
        path: ["errors", "method"],
        message: "This error method requires a dedicated exam evaluator.",
      });
    }
    if (["GROUPED_ERRORS", "POLICY_DEFINED"].includes(policy.penalty.method)) {
      context.addIssue({
        code: "custom",
        path: ["penalty", "method"],
        message: "This penalty method requires a dedicated exam evaluator.",
      });
    }
    if (
      policy.speed.grossMethod === "POLICY_DEFINED" ||
      policy.speed.netMethod === "POLICY_DEFINED"
    ) {
      context.addIssue({
        code: "custom",
        path: ["speed"],
        message: "Policy-defined speed requires a dedicated exam evaluator.",
      });
    }
    if (
      policy.evaluator.startsWith("RRB_") &&
      (policy.errors.method !== "WORD_BASED" ||
        policy.penalty.method !== "NONE" ||
        policy.errors.allowedPercentage !== undefined ||
        policy.scoring !== undefined)
    ) {
      context.addIssue({
        code: "custom",
        path: ["evaluator"],
        message:
          "RRB evaluators use word mistakes and their registered deduction formula; separate marks and penalties are unsupported.",
      });
    }
  });
