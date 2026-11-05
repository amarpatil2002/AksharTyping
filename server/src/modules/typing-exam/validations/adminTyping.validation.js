import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId.');

export const createExamSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(2000).optional(),
  authority: z.string().trim().min(1).max(200),
  examCode: z.string().trim().min(1).max(100),
  postName: z.string().trim().min(1).max(200),
  recruitmentCycle: z.string().trim().max(100).optional(),
  examType: z.enum(['WORD', 'CHARACTER', 'HYBRID']),
  language: z.string().trim().min(2).max(30),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).default('DRAFT')
}).strict();

export const updateExamSchema = createExamSchema.partial().strict();

export const examParamsSchema = z.object({
  examId: objectId
}).strict();

export const createVersionSchema = z.object({
  examId: objectId,
  version: z.string().trim().min(1).max(50),
  recruitmentCycle: z.string().trim().max(100).optional(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'RETIRED']).default('DRAFT')
}).strict();

export const createPassageSchema = z.object({
  examId: objectId,
  examVersionId: objectId,
  title: z.string().trim().min(1).max(200),
  language: z.string().trim().min(2).max(30),
  content: z.string().min(1).max(50000),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT')
}).strict();

export const passageParamsSchema = z.object({
  passageId: objectId
}).strict();

export const createPolicySchema = z.object({
  examVersionId: objectId,
  name: z.string().trim().min(1).max(200),
  version: z.number().int().min(1).default(1),
  evaluator: z.string().trim().min(1).max(100),
  measurement: z.object({
    unit: z.enum(['WPM','CPM','KDPH','WORDS','CHARACTERS','KEY_DEPRESSIONS'])
  }).strict(),
  duration: z.object({
    seconds: z.number().int().min(1).max(3600)
  }).strict(),
  normalization: z.enum(['NFC','NFD','NFKC','NFKD','NONE']).default('NFC'),
  speed: z.object({
    grossMethod: z.string().trim().min(1).max(100),
    netMethod: z.string().trim().min(1).max(100)
  }).strict(),
  errors: z.object({
    method: z.string().trim().min(1).max(100),
    allowedPercentage: z.number().min(0).max(100).default(0)
  }).strict(),
  penalty: z.object({
    method: z.string().trim().min(1).max(100),
    value: z.number().min(0).optional()
  }).strict(),
  qualification: z.object({
    minimumSpeed: z.number().min(0).optional(),
    maximumErrors: z.number().int().min(0).optional()
  }).strict().optional(),
  rounding: z.object({
    method: z.enum(['ROUND','FLOOR','CEIL','TRUNCATE']).default('ROUND'),
    decimalPlaces: z.number().int().min(0).max(6).default(2)
  }).strict().default({ method: 'ROUND', decimalPlaces: 2 })
}).strict();
