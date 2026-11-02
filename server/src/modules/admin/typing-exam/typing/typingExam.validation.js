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

const uniqueStringArray = (maxLength = 100) =>
  z
    .array(requiredString(maxLength))
    .refine(
      (items) => new Set(items).size === items.length,
      "Duplicate values are not allowed",
    );

// ============================================================
// SHARED ENUMS
// ============================================================

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

const languageSchema = z.enum(languages);

const examTypeSchema = z.enum(["WORD", "CHARACTER", "HYBRID"]);

const measurementUnitSchema = z.enum([
  "WPM",
  "CPM",
  "KDPH",
  "WORDS",
  "CHARACTERS",
  "KEY_DEPRESSIONS",
]);

const evaluatorSchema = z.enum([
  "STANDARD_WORD",
  "CPCT_NET_WPM",
  "RRB_WORD_PENALTY",
  "SSC_TYPING",
  "SSC_DEST",
  "AIIMS_STROKE_PENALTY",
  "CHARACTER_BASED",
  "KEYSTROKE_BASED",
  "HYBRID",
  "CUSTOM",
]);

// ============================================================
// SHARED MEASUREMENT TARGET
// ============================================================

const measurementTargetSchema = z
  .object({
    value: z.number().min(0),

    unit: measurementUnitSchema,

    comparison: z
      .enum(["MINIMUM", "MAXIMUM", "EXACT"])
      .optional()
      .default("MINIMUM"),
  })
  .strict();

const wordTargetSchema = z
  .object({
    value: z.number().min(0),
    unit: z.literal("WPM"),
    comparison: z
      .enum(["MINIMUM", "MAXIMUM", "EXACT"])
      .optional()
      .default("MINIMUM"),
  })
  .strict();

const characterTargetSchema = z
  .object({
    value: z.number().min(0),
    unit: z.enum(["CPM", "KDPH", "CHARACTERS", "KEY_DEPRESSIONS"]),
    comparison: z
      .enum(["MINIMUM", "MAXIMUM", "EXACT"])
      .optional()
      .default("MINIMUM"),
  })
  .strict();

// ============================================================
// SHARED QUALIFICATION RULES
// ============================================================

const qualificationRuleSchema = z
  .object({
    enabled: z.boolean().optional(),

    requireAll: z.boolean().optional(),

    qualifyingOnly: z.boolean().optional(),

    minimumSpeed: measurementTargetSchema.optional(),

    minimumAccuracy: z.number().min(0).max(100).nullable().optional(),

    minimumMarks: z.number().min(0).nullable().optional(),

    maximumErrors: z.number().min(0).nullable().optional(),

    maximumErrorPercentage: z.number().min(0).max(100).nullable().optional(),
  })
  .strict();

// ============================================================
// ROUNDING
// ============================================================

const roundingSchema = z
  .object({
    decimals: z.number().int().min(0).max(6).optional(),

    mode: z.enum(["ROUND", "FLOOR", "CEIL", "NONE"]).optional(),
  })
  .strict();

// ============================================================
// 1. WORD EXAM CONFIG
// ============================================================

const wordCountingSchema = z
  .object({
    wordMethod: z
      .enum([
        "SPACE_SEPARATED",
        "STANDARD_WORD",
        "TOKEN_BASED",
        "PASSAGE_ALIGNMENT",
      ])
      .optional(),

    caseSensitive: z.boolean().optional(),

    punctuationSensitive: z.boolean().optional(),

    whitespaceSensitive: z.boolean().optional(),

    normalization: z.enum(["NFC", "NFD", "NONE"]).optional(),

    notReachedPolicy: z
      .enum(["OMISSION", "NOT_REACHED", "NO_PENALTY"])
      .optional(),

    extraWordPolicy: z
      .enum(["COUNT_AS_ERROR", "IGNORE", "COUNT_AS_EXTRA_WORD"])
      .optional(),
  })
  .strict();

const wordAllowanceFields = {
  enabled: z.boolean().optional(),

  type: z
    .enum(["NONE", "PERCENTAGE_OF_TYPED_WORDS", "FIXED_ERRORS", "FIXED_WORDS"])
    .optional(),

  value: z.number().min(0).optional(),
};

const validateWordAllowance = (data, ctx) => {
  if (data.type === "NONE" && data.value !== undefined && data.value !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["value"],
      message: "Allowance value must be zero when type is NONE.",
    });
  }
};

const wordAllowanceBaseSchema = z.object(wordAllowanceFields).strict();

const wordAllowanceSchema = wordAllowanceBaseSchema.superRefine(
  validateWordAllowance,
);

const wordAllowanceUpdateSchema = wordAllowanceBaseSchema
  .partial()
  .superRefine(validateWordAllowance);

const wordGroupedPenaltySchema = z
  .object({
    enabled: z.boolean().optional(),

    errorsPerGroup: z.number().int().min(1).optional(),

    penaltyPerGroup: z.number().min(0).optional(),
  })
  .strict();

const wordMistakeRulesSchema = z
  .object({
    classification: z.enum(["WORD_BASED", "FULL_HALF", "CUSTOM"]).optional(),

    countFullMistakes: z.boolean().optional(),

    countHalfMistakes: z.boolean().optional(),

    fullMistakeWeight: z.number().min(0).optional(),

    halfMistakeWeight: z.number().min(0).max(1).optional(),

    spellingPenalty: z.number().min(0).optional(),

    wrongWordPenalty: z.number().min(0).optional(),

    omissionPenalty: z.number().min(0).optional(),

    extraWordPenalty: z.number().min(0).optional(),

    notReachedPenalty: z.number().min(0).optional(),

    allowance: wordAllowanceSchema.optional(),

    groupedPenalty: wordGroupedPenaltySchema.optional(),
  })
  .strict();

const wordSpeedCalculationSchema = z.enum([
  "GROSS_WORDS_PER_MINUTE",
  "CORRECT_WORDS_PER_MINUTE",
  "GROSS_MINUS_ERROR_PENALTY",
  "POLICY_DEFINED",
]);

export const createWordConfigSchema = z
  .object({
    name: requiredString(150),

    version: z.number().int().min(1).optional(),

    target: wordTargetSchema,

    wordLength: z.number().min(1).max(20).optional(),

    counting: wordCountingSchema.optional(),

    mistakeRules: wordMistakeRulesSchema.optional(),

    speedCalculation: wordSpeedCalculationSchema.optional(),

    qualification: qualificationRuleSchema.optional(),

    isActive: z.boolean().optional(),
  })
  .strict();

export const updateWordConfigSchema = z
  .object({
    name: requiredString(150).optional(),

    version: z.number().int().min(1).optional(),

    target: wordTargetSchema.partial().optional(),

    wordLength: z.number().min(1).max(20).optional(),

    counting: wordCountingSchema.partial().optional(),

    mistakeRules: z
      .object({
        classification: z
          .enum(["WORD_BASED", "FULL_HALF", "CUSTOM"])
          .optional(),

        countFullMistakes: z.boolean().optional(),
        countHalfMistakes: z.boolean().optional(),
        fullMistakeWeight: z.number().min(0).optional(),
        halfMistakeWeight: z.number().min(0).max(1).optional(),
        spellingPenalty: z.number().min(0).optional(),
        wrongWordPenalty: z.number().min(0).optional(),
        omissionPenalty: z.number().min(0).optional(),
        extraWordPenalty: z.number().min(0).optional(),
        notReachedPenalty: z.number().min(0).optional(),
        allowance: wordAllowanceUpdateSchema.optional(),
        groupedPenalty: wordGroupedPenaltySchema.partial().optional(),
      })
      .strict()
      .optional(),

    speedCalculation: wordSpeedCalculationSchema.optional(),

    qualification: qualificationRuleSchema.partial().optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required",
  );

// ============================================================
// 2. CHARACTER EXAM CONFIG
// ============================================================

const characterCountingSchema = z
  .object({
    characterUnit: z
      .enum([
        "GRAPHEME_CLUSTERS",
        "UNICODE_CODE_POINTS",
        "UTF16_CODE_UNITS",
        "KEY_EVENTS",
      ])
      .optional(),

    includeSpaces: z.boolean().optional(),

    includePunctuation: z.boolean().optional(),

    normalization: z.enum(["NFC", "NFD", "NONE"]).optional(),

    caseSensitive: z.boolean().optional(),

    whitespaceSensitive: z.boolean().optional(),

    notReachedPolicy: z
      .enum(["DELETION", "NOT_REACHED", "NO_PENALTY"])
      .optional(),
  })
  .strict();

const characterInputRulesSchema = z
  .object({
    captureKeyboardEvents: z.boolean().optional(),

    countBackspace: z.boolean().optional(),

    countDelete: z.boolean().optional(),

    countModifierKeys: z.boolean().optional(),

    allowPaste: z.boolean().optional(),

    allowBackspace: z.boolean().optional(),

    allowCursorMovement: z.boolean().optional(),

    keyboardLayout: z
      .enum([
        "QWERTY",
        "INSCRIPT",
        "REMINGTON",
        "KRUTI_DEV",
        "MANGAL",
        "CUSTOM",
        "NOT_APPLICABLE",
      ])
      .optional(),

    keyboardLayoutName: z.string().trim().max(100).nullable().optional(),

    inputMethod: z
      .enum(["UNICODE", "LEGACY_FONT", "IME", "PHYSICAL_KEYBOARD", "OTHER"])
      .optional(),

    fontName: z.string().trim().max(100).nullable().optional(),
  })
  .strict();

const fixedStrokePenaltySchema = z
  .object({
    enabled: z.boolean().optional(),

    unit: z.enum(["STROKE", "KEY_DEPRESSION", "CHARACTER"]).optional(),

    value: z.number().min(0).optional(),
  })
  .strict();

const characterMistakeRulesSchema = z
  .object({
    substitutionPenalty: z.number().min(0).optional(),

    insertionPenalty: z.number().min(0).optional(),

    deletionPenalty: z.number().min(0).optional(),

    notReachedPenalty: z.number().min(0).optional(),

    fixedStrokePenalty: fixedStrokePenaltySchema.optional(),
  })
  .strict();

const characterSpeedCalculationSchema = z.enum([
  "NET_CHARACTERS_PER_MINUTE",
  "GROSS_CHARACTERS_PER_MINUTE",
  "KEY_DEPRESSIONS_PER_HOUR",
  "POLICY_DEFINED",
]);

export const createCharacterConfigSchema = z
  .object({
    name: requiredString(150),

    version: z.number().int().min(1).optional(),

    target: characterTargetSchema,

    counting: characterCountingSchema.optional(),

    inputRules: characterInputRulesSchema.optional(),

    mistakeRules: characterMistakeRulesSchema.optional(),

    speedCalculation: characterSpeedCalculationSchema.optional(),

    qualification: qualificationRuleSchema.optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.target.unit === "KDPH" &&
      data.inputRules?.captureKeyboardEvents !== true
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inputRules", "captureKeyboardEvents"],
        message: "KDPH requires keyboard event capture.",
      });
    }
  });

export const updateCharacterConfigSchema = z
  .object({
    name: requiredString(150).optional(),

    version: z.number().int().min(1).optional(),

    target: characterTargetSchema.partial().optional(),

    counting: characterCountingSchema.partial().optional(),

    inputRules: characterInputRulesSchema.partial().optional(),

    mistakeRules: z
      .object({
        substitutionPenalty: z.number().min(0).optional(),
        insertionPenalty: z.number().min(0).optional(),
        deletionPenalty: z.number().min(0).optional(),
        notReachedPenalty: z.number().min(0).optional(),
        fixedStrokePenalty: fixedStrokePenaltySchema.partial().optional(),
      })
      .strict()
      .optional(),

    speedCalculation: characterSpeedCalculationSchema.optional(),

    qualification: qualificationRuleSchema.partial().optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required",
  );

// ============================================================
// 3. HYBRID EXAM CONFIG
// ============================================================

const resultCombinationSchema = z.enum([
  "BOTH_REQUIRED",
  "WORD_PRIMARY",
  "CHARACTER_PRIMARY",
  "WEIGHTED",
]);

export const createHybridConfigSchema = z
  .object({
    name: requiredString(150),

    version: z.number().int().min(1).optional(),

    wordConfigId: objectIdSchema,

    characterConfigId: objectIdSchema,

    resultCombination: resultCombinationSchema.optional(),

    wordWeight: z.number().min(0).max(100).optional(),

    characterWeight: z.number().min(0).max(100).optional(),

    qualification: qualificationRuleSchema.optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.resultCombination === "WEIGHTED" &&
      (data.wordWeight ?? 50) + (data.characterWeight ?? 50) !== 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wordWeight"],
        message: "Word and character weights must total 100.",
      });
    }
  });

export const updateHybridConfigSchema = z
  .object({
    name: requiredString(150).optional(),

    version: z.number().int().min(1).optional(),

    wordConfigId: objectIdSchema.optional(),

    characterConfigId: objectIdSchema.optional(),

    resultCombination: resultCombinationSchema.optional(),

    wordWeight: z.number().min(0).max(100).optional(),

    characterWeight: z.number().min(0).max(100).optional(),

    qualification: qualificationRuleSchema.partial().optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required",
  );

// ============================================================
// 4. EVALUATION POLICY
// ============================================================

const policySourceSchema = z
  .object({
    authority: z.string().trim().max(180).nullable().optional(),

    examCode: z.string().trim().max(80).nullable().optional(),

    recruitmentCycle: z.string().trim().max(100).nullable().optional(),

    notificationNumber: z.string().trim().max(150).nullable().optional(),

    sourceUrl: z.string().url().nullable().optional(),

    sourceTitle: z.string().trim().max(300).nullable().optional(),

    verifiedAt: z.coerce.date().nullable().optional(),

    verifiedBy: objectIdSchema.nullable().optional(),
  })
  .strict();

const policyScoringSchema = z
  .object({
    method: z.enum([
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
      "character_based",
      "keystroke_based",
      "hybrid",
    ]),

    speedCalculation: requiredString(100),

    accuracyCalculation: z.string().trim().max(100).nullable().optional(),

    speedWeight: z.number().min(0).max(100).optional(),

    accuracyWeight: z.number().min(0).max(100).optional(),

    rounding: roundingSchema.optional(),

    rules: z.record(z.unknown()).optional(),
  })
  .strict();

const policyStatusSchema = z.enum(["DRAFT", "VERIFIED", "RETIRED"]);

export const createEvaluationPolicySchema = z
  .object({
    name: requiredString(180),

    examCode: requiredString(80).transform((value) => value.toUpperCase()),

    examType: examTypeSchema,

    language: languageSchema,

    authority: requiredString(180),

    recruitmentCycle: requiredString(100),

    version: z.number().int().min(1).optional(),

    evaluator: evaluatorSchema,

    measurementUnit: measurementUnitSchema,

    scoring: policyScoringSchema,

    qualification: qualificationRuleSchema.optional(),

    source: policySourceSchema.optional(),

    status: z.literal("DRAFT").optional(),

    isOfficial: z.literal(false).optional(),

    notes: z.string().max(5000).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.scoring.method === "weighted" &&
      (data.scoring.speedWeight ?? 50) + (data.scoring.accuracyWeight ?? 50) !==
        100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scoring", "speedWeight"],
        message: "Speed and accuracy weights must total 100.",
      });
    }
  });

export const updateEvaluationPolicySchema = z
  .object({
    name: requiredString(180).optional(),

    examCode: requiredString(80)
      .transform((value) => value.toUpperCase())
      .optional(),

    examType: examTypeSchema.optional(),

    language: languageSchema.optional(),

    authority: requiredString(180).optional(),

    recruitmentCycle: requiredString(100).optional(),

    version: z.number().int().min(1).optional(),

    evaluator: evaluatorSchema.optional(),

    measurementUnit: measurementUnitSchema.optional(),

    scoring: policyScoringSchema.partial().optional(),

    qualification: qualificationRuleSchema.partial().optional(),

    source: policySourceSchema.partial().optional(),

    notes: z.string().max(5000).nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required",
  );

// Separate endpoint for policy verification.
// verifiedBy should be set from the authenticated admin.
export const verifyEvaluationPolicySchema = z
  .object({
    source: z
      .object({
        sourceUrl: z.string().url(),
        sourceTitle: requiredString(300),
        notificationNumber: requiredString(150).optional(),
      })
      .strict(),
  })
  .strict();

// ============================================================
// 5. TYPING EXAM
// ============================================================

const passageSettingsSchema = z
  .object({
    selectionMode: z
      .enum(["FIXED", "RANDOM", "CATEGORY_BASED", "ADMIN_ASSIGNED"])
      .optional(),

    passageCount: z.number().int().min(1).optional(),

    allowedCategories: uniqueStringArray(100).optional(),

    minimumWordCount: z.number().int().min(0).optional(),

    maximumWordCount: z.number().int().min(0).optional(),

    fixedPassageIds: z.array(objectIdSchema).optional(),
  })
  .strict();

const attemptSettingsSchema = z
  .object({
    maximumAttempts: z.number().int().min(1).optional(),

    allowRetake: z.boolean().optional(),

    allowPause: z.boolean().optional(),

    autoSubmit: z.boolean().optional(),

    showResultImmediately: z.boolean().optional(),

    showCorrectText: z.boolean().optional(),

    showDetailedErrors: z.boolean().optional(),
  })
  .strict();

const accessSchema = z
  .object({
    visibility: z
      .enum(["PUBLIC", "PRIVATE", "UNLISTED", "ASSIGNED"])
      .optional(),

    requiresLogin: z.boolean().optional(),

    allowedUserIds: z.array(objectIdSchema).optional(),

    allowedRoles: uniqueStringArray(80).optional(),
  })
  .strict();

const availabilitySchema = z
  .object({
    startsAt: z.coerce.date().nullable().optional(),

    endsAt: z.coerce.date().nullable().optional(),

    timezone: requiredString(100).optional(),
  })
  .strict();

const examStatusSchema = z.enum(["DRAFT", "PUBLISHED", "PAUSED", "ARCHIVED"]);

const examBaseFields = {
  title: requiredString(180),

  slug: requiredString(200),

  description: z.string().trim().max(5000).nullable().optional(),

  authority: requiredString(180),

  examCode: requiredString(80),

  postName: requiredString(180).optional(),

  recruitmentCycle: requiredString(100),

  examType: examTypeSchema,

  language: languageSchema,

  durationSeconds: z.number().int().min(1).max(7200),

  target: measurementTargetSchema,

  wordConfigId: objectIdSchema.nullable().optional(),

  characterConfigId: objectIdSchema.nullable().optional(),

  hybridConfigId: objectIdSchema.nullable().optional(),

  evaluationPolicyId: objectIdSchema,

  passageSettings: passageSettingsSchema.optional(),

  attemptSettings: attemptSettingsSchema.optional(),

  access: accessSchema.optional(),

  availability: availabilitySchema.optional(),

  status: examStatusSchema.optional(),

  isActive: z.boolean().optional(),
};

export const createTypingExamSchema = z
  .object(examBaseFields)
  .strict()
  .superRefine((data, ctx) => {
    const configFields = {
      WORD: ["wordConfigId"],
      CHARACTER: ["characterConfigId"],
      HYBRID: ["hybridConfigId"],
    };

    const requiredConfig = configFields[data.examType];

    for (const field of [
      "wordConfigId",
      "characterConfigId",
      "hybridConfigId",
    ]) {
      const shouldExist = requiredConfig.includes(field);
      const exists = data[field] != null;

      if (shouldExist !== exists) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: shouldExist
            ? `${field} is required for ${data.examType} exams.`
            : `${field} is not allowed for ${data.examType} exams.`,
        });
      }
    }

    const minWords = data.passageSettings?.minimumWordCount;
    const maxWords = data.passageSettings?.maximumWordCount;

    if (
      minWords !== undefined &&
      maxWords !== undefined &&
      minWords > maxWords
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passageSettings", "maximumWordCount"],
        message:
          "Maximum word count must be greater than or equal to minimum word count.",
      });
    }

    const startsAt = data.availability?.startsAt;
    const endsAt = data.availability?.endsAt;

    if (startsAt && endsAt && endsAt <= startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["availability", "endsAt"],
        message: "End date must be after start date.",
      });
    }

    if (
      data.passageSettings?.selectionMode === "FIXED" &&
      (!data.passageSettings.fixedPassageIds ||
        data.passageSettings.fixedPassageIds.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passageSettings", "fixedPassageIds"],
        message: "Fixed passage IDs are required for FIXED selection mode.",
      });
    }
  });

export const updateTypingExamSchema = z
  .object({
    title: examBaseFields.title.optional(),

    slug: examBaseFields.slug.optional(),

    description: examBaseFields.description,

    authority: examBaseFields.authority.optional(),

    examCode: examBaseFields.examCode.optional(),

    postName: examBaseFields.postName,

    recruitmentCycle: examBaseFields.recruitmentCycle.optional(),

    examType: examTypeSchema.optional(),

    language: languageSchema.optional(),

    durationSeconds: examBaseFields.durationSeconds.optional(),

    target: measurementTargetSchema.partial().optional(),

    wordConfigId: objectIdSchema.nullable().optional(),

    characterConfigId: objectIdSchema.nullable().optional(),

    hybridConfigId: objectIdSchema.nullable().optional(),

    evaluationPolicyId: objectIdSchema.optional(),

    passageSettings: passageSettingsSchema.partial().optional(),

    attemptSettings: attemptSettingsSchema.partial().optional(),

    access: accessSchema.partial().optional(),

    availability: availabilitySchema.partial().optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required",
  );

// Use a separate endpoint for status transitions.
export const updateExamStatusSchema = z
  .object({
    status: examStatusSchema,
  })
  .strict();

// ============================================================
// 6. TYPING PASSAGE
// ============================================================

export const createTypingPassageSchema = z
  .object({
    title: requiredString(180),

    language: languageSchema,

    content: requiredString(100000),

    difficulty: z.enum(["easy", "medium", "hard"]).optional(),

    category: z.string().trim().max(100).nullable().optional(),

    tags: uniqueStringArray(50).optional(),

    source: z.string().trim().max(500).nullable().optional(),

    isActive: z.boolean().optional(),
  })
  .strict();

export const updateTypingPassageSchema = z
  .object({
    title: requiredString(180).optional(),

    language: languageSchema.optional(),

    content: requiredString(100000).optional(),

    difficulty: z.enum(["easy", "medium", "hard"]).optional(),

    category: z.string().trim().max(100).nullable().optional(),

    tags: uniqueStringArray(50).optional(),

    source: z.string().trim().max(500).nullable().optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required",
  );

// ============================================================
// 7. PARAM VALIDATIONS
// ============================================================

export const examIdParamsSchema = z
  .object({
    examId: objectIdSchema,
  })
  .strict();

export const passageIdParamsSchema = z
  .object({
    passageId: objectIdSchema,
  })
  .strict();

export const wordConfigIdParamsSchema = z
  .object({
    configId: objectIdSchema,
  })
  .strict();

export const characterConfigIdParamsSchema = z
  .object({
    configId: objectIdSchema,
  })
  .strict();

export const hybridConfigIdParamsSchema = z
  .object({
    configId: objectIdSchema,
  })
  .strict();

export const evaluationPolicyIdParamsSchema = z
  .object({
    policyId: objectIdSchema,
  })
  .strict();

// ============================================================
// 8. ADMIN LISTING QUERIES
// ============================================================

export const examQuerySchema = paginationSchema
  .extend({
    search: z.string().trim().optional(),

    examType: examTypeSchema.optional(),

    language: languageSchema.optional(),

    authority: z.string().trim().optional(),

    recruitmentCycle: z.string().trim().optional(),

    status: examStatusSchema.optional(),

    isActive: booleanQuerySchema.optional(),
  })
  .strict();

export const passageQuerySchema = paginationSchema
  .extend({
    search: z.string().trim().optional(),

    language: languageSchema.optional(),

    difficulty: z.enum(["easy", "medium", "hard"]).optional(),

    category: z.string().trim().optional(),

    isActive: booleanQuerySchema.optional(),
  })
  .strict();

export const wordConfigQuerySchema = paginationSchema
  .extend({
    search: z.string().trim().optional(),
    isActive: booleanQuerySchema.optional(),
  })
  .strict();

export const characterConfigQuerySchema = paginationSchema
  .extend({
    search: z.string().trim().optional(),
    isActive: booleanQuerySchema.optional(),
  })
  .strict();

export const hybridConfigQuerySchema = paginationSchema
  .extend({
    search: z.string().trim().optional(),
    isActive: booleanQuerySchema.optional(),
  })
  .strict();

export const evaluationPolicyQuerySchema = paginationSchema
  .extend({
    search: z.string().trim().optional(),

    examCode: z.string().trim().optional(),

    examType: examTypeSchema.optional(),

    language: languageSchema.optional(),

    authority: z.string().trim().optional(),

    recruitmentCycle: z.string().trim().optional(),

    status: policyStatusSchema.optional(),

    isOfficial: booleanQuerySchema.optional(),
  })
  .strict();

// ============================================================
// PASSAGE ROUTE PARAMS
// ============================================================

export const passageRouteParamsSchema = examIdParamsSchema.extend({
  passageId: objectIdSchema,
});

// ============================================================
// UPDATE PASSAGE STATUS
// ============================================================

export const updatePassageStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();
