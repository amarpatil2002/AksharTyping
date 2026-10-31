import { z } from "zod";

export const examSchema = z.object({
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

  language: z.string().trim().min(1, "Language is required."),

  durationSeconds: z
    .number()
    .int("Duration must be a whole number.")
    .min(1, "Duration must be at least 1 second."),

  targetWpm: z.number().min(0, "Target WPM cannot be negative."),

  status: z.enum(["draft", "published", "archived"]),

  scoring: z.object({
    method: z.enum(["standard", "net_wpm", "accuracy", "custom"]),

    wordLength: z
      .number()
      .int("Word length must be a whole number.")
      .min(1, "Word length must be at least 1."),

    minimumWpm: z.number().min(0, "Minimum WPM cannot be negative."),

    minimumAccuracy: z
      .number()
      .min(0, "Minimum accuracy cannot be below 0%.")
      .max(100, "Minimum accuracy cannot exceed 100%."),

    errorPenalty: z.number().min(0, "Error penalty cannot be negative."),
  }),

  instructions: z.array(z.string()),
});

export type ExamFormErrors = Record<string, string>;
