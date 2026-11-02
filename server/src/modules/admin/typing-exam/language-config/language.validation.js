import { z } from "zod";

// ============================================================
// COMMON HELPERS
// ============================================================

const requiredString = (max = 255) => z.string().trim().min(1).max(max);

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

const booleanQuerySchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================
// ENUMS
// ============================================================

const languageDirectionSchema = z.enum(["LTR", "RTL"]);

const languageNormalizationSchema = z.enum(["NFC", "NFD", "NFKC", "NFKD"]);

const languageInputMethodSchema = z.enum([
  "INSCRIPT",
  "REMIINGTON",
  "PHONETIC",
  "TRANSLITERATION",
  "TYPEWRITER",
  "CUSTOM",
]);

const languageCountingUnitSchema = z.enum([
  "WORD",
  "GRAPHEME",
  "CODE_POINT",
  "KEYSTROKE",
]);

// ============================================================
// NESTED SCHEMAS
// ============================================================

const languageUnicodeSchema = z
  .object({
    enabled: z.boolean().optional(),
    normalization: languageNormalizationSchema.optional(),
  })
  .strict();

const languageCountingSchema = z
  .object({
    unit: languageCountingUnitSchema.optional(),
    useGraphemeSegmentation: z.boolean().optional(),
  })
  .strict();

// ============================================================
// CREATE
// ============================================================

export const createLanguageSchema = z
  .object({
    languageCode: requiredString(20).transform((value) => value.toUpperCase()),

    languageName: requiredString(100),
    nativeName: requiredString(100),
    script: requiredString(100),

    direction: languageDirectionSchema.optional(),

    unicode: languageUnicodeSchema.optional(),

    supportedInputMethods: z
      .array(languageInputMethodSchema)
      .optional()
      .default([])
      .refine(
        (items) => new Set(items).size === items.length,
        "Duplicate input methods are not allowed",
      ),

    supportedLayouts: z
      .array(requiredString(100))
      .optional()
      .default([])
      .refine(
        (items) => new Set(items).size === items.length,
        "Duplicate layouts are not allowed",
      ),

    counting: languageCountingSchema.optional(),

    isActive: z.boolean().optional(),
  })
  .strict();

// ============================================================
// UPDATE
// ============================================================

export const updateLanguageSchema = z
  .object({
    languageCode: requiredString(20)
      .transform((value) => value.toUpperCase())
      .optional(),

    languageName: requiredString(100).optional(),
    nativeName: requiredString(100).optional(),
    script: requiredString(100).optional(),

    direction: languageDirectionSchema.optional(),

    unicode: languageUnicodeSchema.partial().optional(),

    supportedInputMethods: z
      .array(languageInputMethodSchema)
      .refine(
        (items) => new Set(items).size === items.length,
        "Duplicate input methods are not allowed",
      )
      .optional(),

    supportedLayouts: z
      .array(requiredString(100))
      .refine(
        (items) => new Set(items).size === items.length,
        "Duplicate layouts are not allowed",
      )
      .optional(),

    counting: languageCountingSchema.partial().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required",
  );

// ============================================================
// STATUS
// ============================================================

export const updateLanguageStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

// ============================================================
// PARAMS
// ============================================================

export const languageIdParamsSchema = z
  .object({
    languageId: objectIdSchema,
  })
  .strict();

// ============================================================
// QUERY
// ============================================================

export const languageQuerySchema = paginationSchema
  .extend({
    search: z.string().trim().optional(),

    languageCode: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .optional(),

    isActive: booleanQuerySchema.optional(),

    direction: languageDirectionSchema.optional(),
  })
  .strict();

// ============================================================
// VALIDATION MIDDLEWARE
// ============================================================

export const validateLanguageRequest =
  ({ body, query, params } = {}) =>
  (req, res, next) => {
    const errors = [];

    if (body) {
      const result = body.safeParse(req.body ?? {});

      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            field: `body.${issue.path.join(".") || "request"}`,
            message: issue.message,
          })),
        );
      } else {
        req.validatedBody = result.data;
      }
    }

    if (query) {
      const result = query.safeParse(req.query ?? {});

      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            field: `query.${issue.path.join(".") || "request"}`,
            message: issue.message,
          })),
        );
      } else {
        req.validatedQuery = result.data;
      }
    }

    if (params) {
      const result = params.safeParse(req.params ?? {});

      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            field: `params.${issue.path.join(".") || "request"}`,
            message: issue.message,
          })),
        );
      } else {
        req.validatedParams = result.data;
      }
    }

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Request validation failed.",
        errors,
      });
    }

    next();
  };
