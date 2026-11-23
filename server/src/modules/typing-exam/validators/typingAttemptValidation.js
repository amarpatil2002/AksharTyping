import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId.");

export const startTypingAttemptSchema = z
  .object({
    examId: objectIdSchema,

    passageId: objectIdSchema,
  })
  .strict();

export const typingAttemptIdParamsSchema = z
  .object({
    attemptId: objectIdSchema,
  })
  .strict();

export const updateTypingAttemptProgressSchema = z
  .object({
    typedText: z
      .string({
        required_error: "typedText is required.",
      })
      .max(100000, "typedText cannot exceed 100000 characters."),

    progressVersion: z
      .number({
        required_error: "progressVersion is required.",
      })
      .int("progressVersion must be an integer.")
      .min(0, "progressVersion cannot be negative."),
  })
  .strict();

export const submitTypingAttemptSchema = z
  .object({
    typedText: z
      .string({
        required_error: "typedText is required.",
      })
      .max(100000, "typedText cannot exceed 100000 characters."),

    submissionId: z
      .string({
        required_error: "submissionId is required.",
      })
      .trim()
      .min(8, "submissionId must contain at least 8 characters.")
      .max(100, "submissionId cannot exceed 100 characters."),
  })
  .strict();
