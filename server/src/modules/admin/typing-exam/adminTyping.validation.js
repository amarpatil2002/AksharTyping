import { z } from "zod";
import { LANGUAGES } from "../../../../constants/typing.constants.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ID.");
const language = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => LANGUAGES.includes(value), "Unsupported language.");

const examCategories = [
  "SSC",
  "RRB",
  "CPCT",
  "HIGH_COURT",
  "STATE",
  "AIIMS",
  "BANK",
  "OTHER",
];
const examTypes = ["WORD", "CHARACTER", "HYBRID"];
const measurementUnits = [
  "WPM",
  "CPM",
  "KDPH",
  "WORDS",
  "CHARACTERS",
  "KEY_DEPRESSIONS",
];
const examStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"];
const documentTypes = ["NOTIFICATION", "RULEBOOK", "GUIDELINE", "OTHER"];

const optionalTrimmed = (max) => z.string().trim().max(max).optional();
const nonNegativeNumber = z.number().finite().min(0);

const officialSourceSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    url: z.string().trim().url().max(2048),
    documentType: z.enum(documentTypes).default("OTHER"),
  })
  .strict();

const measurementSchema = z
  .object({
    units: z.array(z.enum(measurementUnits)).min(1).max(6),
    minimumSpeed: nonNegativeNumber.optional(),
    minimumWords: nonNegativeNumber.optional(),
    minimumCharacters: nonNegativeNumber.optional(),
  })
  .strict();

const qualificationSchema = z
  .object({
    required: z.boolean().optional(),
    minimumSpeedRequired: z.boolean().optional(),
    minimumAccuracyRequired: z.boolean().optional(),
    minimumContentRequired: z.boolean().optional(),
  })
  .strict();

const examBaseSchema = z
  .object({
    title: z.string().trim().min(2).max(150),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(180)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers and hyphens.",
      ),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2)
      .max(40)
      .regex(/^[A-Z0-9_-]+$/, "Code contains unsupported characters."),
    description: z.string().max(2000).optional(),
    authority: optionalTrimmed(200),
    examCategory: z.enum(examCategories).optional(),
    postName: optionalTrimmed(150),
    recruitmentYear: z.string().trim().max(20).optional(),
    language,
    examType: z.enum(examTypes),
    durationSeconds: z.number().int().min(1).max(86400),
    measurement: measurementSchema,
    wordConfigId: objectId.nullable().optional(),
    characterConfigId: objectId.nullable().optional(),
    hybridConfigId: objectId.nullable().optional(),
    evaluationPolicyId: objectId,
    qualification: qualificationSchema.optional(),
    status: z.enum(examStatuses).optional(),
    officialSources: z.array(officialSourceSchema).max(20).optional(),
    policyVersion: z.string().trim().min(1).max(30).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const configFields = {
      WORD: ["wordConfigId"],
      CHARACTER: ["characterConfigId"],
      HYBRID: ["hybridConfigId"],
    }[data.examType];

    for (const field of [
      "wordConfigId",
      "characterConfigId",
      "hybridConfigId",
    ]) {
      if (configFields.includes(field) && !data[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${field} is required for ${data.examType} exams.`,
        });
      }
      if (!configFields.includes(field) && data[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${field} must not be supplied for ${data.examType} exams.`,
        });
      }
    }
  });

export const createTypingExamSchema = examBaseSchema;

export const updateTypingExamSchema = examBaseSchema
  .partial()
  .extend({ examId: objectId })
  .strict()
  .superRefine((data, ctx) => {
    // A partial update cannot reliably validate the combined exam/config state.
    // Controller/service must load the current exam and validate the merged state.
    if (data.examType && !data.evaluationPolicyId) {
      // evaluationPolicyId is already optional in a partial update; this is allowed
      // when unchanged. Keep this branch intentionally empty.
    }
  });

export const updateExamStatusSchema = z
  .object({
    examId: objectId,
    status: z.enum(examStatuses),
  })
  .strict();

const passageBaseSchema = z
  .object({
    title: z.string().trim().min(2).max(180),
    language,
    content: z.string().trim().min(1).max(50000),
    wordCount: z.number().int().min(0).max(20000),
    characterCount: z.number().int().min(0).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    category: z.string().trim().max(100).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    source: z.string().trim().max(500).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const createTypingPassageSchema = passageBaseSchema;
export const updateTypingPassageSchema = passageBaseSchema
  .partial()
  .extend({ passageId: objectId })
  .strict();

export const updatePassageStatusSchema = z
  .object({
    passageId: objectId,
    isActive: z.boolean(),
  })
  .strict();

export const examIdParamsSchema = z
  .object({
    examId: objectId,
  })
  .strict();

export const passageIdParamsSchema = z
  .object({
    passageId: objectId,
  })
  .strict();

export const examQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    language: language.optional(),
    examType: z.enum(examTypes).optional(),
    examCategory: z.enum(examCategories).optional(),
    status: z.enum(examStatuses).optional(),
  })
  .strict();

export const passageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    language: language.optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    category: z.string().trim().max(100).optional(),
    isActive: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
  })
  .strict();
