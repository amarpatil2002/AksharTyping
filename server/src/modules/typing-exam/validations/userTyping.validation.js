import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId.');

export const examIdParamsSchema = z.object({
  examId: objectId
}).strict();

export const passageParamsSchema = z.object({
  passageId: objectId
}).strict();

export const startAttemptSchema = z.object({
  examId: objectId,
  examVersionId: objectId,
  passageId: objectId,
  language: z.string().trim().min(2).max(30)
}).strict();

export const attemptParamsSchema = z.object({
  attemptId: z.string().trim().min(1).max(100)
}).strict();

export const submitAttemptSchema = z.object({
  typedText: z.string().max(100000, 'Typed text is too long.'),
  progressVersion: z.number().int().min(0).optional()
}).strict();
