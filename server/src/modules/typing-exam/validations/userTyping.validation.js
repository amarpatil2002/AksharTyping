import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Common                                                                     */
/* -------------------------------------------------------------------------- */

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId.");

const languages = [
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

/* -------------------------------------------------------------------------- */
/* Exam Params                                                                */
/* -------------------------------------------------------------------------- */

export const examIdParamsSchema = z
  .object({
    examId: objectIdSchema,
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Passage Params                                                             */
/* -------------------------------------------------------------------------- */

export const passageParamsSchema = z
  .object({
    passageId: objectIdSchema,
  })
  .strict();

export const examVersionParamsSchema = z
  .object({
    examVersionId: objectIdSchema,
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Start Attempt                                                              */
/* -------------------------------------------------------------------------- */

export const startAttemptSchema = z
  .object({
    examId: objectIdSchema,

    examVersionId: objectIdSchema,

    passageId: objectIdSchema,

    language: z.enum(languages),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Attempt Params                                                             */
/* -------------------------------------------------------------------------- */

export const attemptParamsSchema = z
  .object({
    attemptId: z
      .string()
      .trim()
      .min(8)
      .max(80)
      .regex(/^[A-Za-z0-9_-]+$/, "Invalid typing attempt ID."),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Submit Attempt                                                             */
/* -------------------------------------------------------------------------- */

export const submitAttemptSchema = z
  .object({
    typedText: z
      .string()
      .max(100000, "Typed text is too long.")
      .superRefine((text, context) => {
        const words = text.trim() ? text.trim().split(/\s+/u) : [];
        if (words.length > 1999 || words.some((word) => Array.from(word).length > 1999)) {
          context.addIssue({
            code: "custom",
            message: "Typed text exceeds the safe evaluation limits.",
          });
        }
      }),

    progressVersion: z.number().int().min(0).optional(),
  })
  .strict();
