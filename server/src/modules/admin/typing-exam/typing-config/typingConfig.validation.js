import { z } from "zod";

// ============================================================
// COMMON HELPERS
// ============================================================

const requiredString = (max = 255) => z.string().trim().min(1).max(max);

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId.");

const nonNegativeNumber = z.number().finite().min(0);

const percentageSchema = z.number().finite().min(0).max(100);

const versionSchema = z.number().int().min(1);

const activeSchema = z.boolean();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(180).optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

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

const comparisonSchema = z.enum(["MINIMUM", "MAXIMUM", "EXACT"]);

// ============================================================
// MEASUREMENT TARGET
// ============================================================

const measurementTargetSchema = z
  .object({
    value: nonNegativeNumber,
    unit: measurementUnitSchema,
    comparison: comparisonSchema.optional(),
  })
  .strict();

const wordTargetSchema = z
  .object({
    value: nonNegativeNumber,
    unit: z.literal("WPM"),
    comparison: comparisonSchema.optional(),
  })
  .strict();

const characterTargetSchema = z
  .object({
    value: nonNegativeNumber,
    unit: z.enum(["CPM", "KDPH", "CHARACTERS", "KEY_DEPRESSIONS"]),
    comparison: comparisonSchema.optional(),
  })
  .strict();

// ============================================================
// QUALIFICATION
// ============================================================

const qualificationRuleSchema = z
  .object({
    enabled: z.boolean().optional(),
    requireAll: z.boolean().optional(),
    qualifyingOnly: z.boolean().optional(),

    minimumSpeed: measurementTargetSchema.optional(),

    minimumAccuracy: percentageSchema.nullable().optional(),
    minimumMarks: nonNegativeNumber.nullable().optional(),
    maximumErrors: nonNegativeNumber.nullable().optional(),
    maximumErrorPercentage: percentageSchema.nullable().optional(),
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

  value: nonNegativeNumber.optional(),
};

const validateWordAllowance = (data, ctx) => {
  if (data.type === "NONE" && data.value !== undefined && data.value !== 0) {
    ctx.addIssue({
      code: "custom",
      path: ["value"],
      message: "Allowance value must be zero when type is NONE.",
    });
  }
};

const wordAllowanceSchema = z
  .object(wordAllowanceFields)
  .strict()
  .superRefine(validateWordAllowance);

const wordAllowanceUpdateSchema = z
  .object(wordAllowanceFields)
  .partial()
  .strict()
  .superRefine(validateWordAllowance);

const wordGroupedPenaltySchema = z
  .object({
    enabled: z.boolean().optional(),
    errorsPerGroup: z.number().int().min(1).optional(),
    penaltyPerGroup: nonNegativeNumber.optional(),
  })
  .strict();

const wordMistakeRulesSchema = z
  .object({
    classification: z.enum(["WORD_BASED", "FULL_HALF", "CUSTOM"]).optional(),

    countFullMistakes: z.boolean().optional(),
    countHalfMistakes: z.boolean().optional(),

    fullMistakeWeight: nonNegativeNumber.optional(),
    halfMistakeWeight: z.number().min(0).max(1).optional(),

    spellingPenalty: nonNegativeNumber.optional(),
    wrongWordPenalty: nonNegativeNumber.optional(),
    omissionPenalty: nonNegativeNumber.optional(),
    extraWordPenalty: nonNegativeNumber.optional(),
    notReachedPenalty: nonNegativeNumber.optional(),

    allowance: wordAllowanceSchema.optional(),
    groupedPenalty: wordGroupedPenaltySchema.optional(),
  })
  .strict();

const wordMistakeRulesUpdateSchema = z
  .object({
    classification: z.enum(["WORD_BASED", "FULL_HALF", "CUSTOM"]).optional(),

    countFullMistakes: z.boolean().optional(),
    countHalfMistakes: z.boolean().optional(),

    fullMistakeWeight: nonNegativeNumber.optional(),
    halfMistakeWeight: z.number().min(0).max(1).optional(),

    spellingPenalty: nonNegativeNumber.optional(),
    wrongWordPenalty: nonNegativeNumber.optional(),
    omissionPenalty: nonNegativeNumber.optional(),
    extraWordPenalty: nonNegativeNumber.optional(),
    notReachedPenalty: nonNegativeNumber.optional(),

    allowance: wordAllowanceUpdateSchema.optional(),
    groupedPenalty: wordGroupedPenaltySchema.partial().optional(),
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
    version: versionSchema.optional(),

    target: wordTargetSchema,

    wordLength: z.number().min(1).max(20).optional(),

    counting: wordCountingSchema.optional(),
    mistakeRules: wordMistakeRulesSchema.optional(),

    speedCalculation: wordSpeedCalculationSchema.optional(),

    qualification: qualificationRuleSchema.optional(),
    isActive: activeSchema.optional(),
  })
  .strict();

export const updateWordConfigSchema = z
  .object({
    name: requiredString(150).optional(),

    target: wordTargetSchema.partial().optional(),

    wordLength: z.number().min(1).max(20).optional(),

    counting: wordCountingSchema.partial().optional(),

    mistakeRules: wordMistakeRulesUpdateSchema.optional(),

    speedCalculation: wordSpeedCalculationSchema.optional(),

    qualification: qualificationRuleSchema.partial().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required.",
  );

export const updateWordConfigStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

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

    value: nonNegativeNumber.optional(),
  })
  .strict();

const characterMistakeRulesSchema = z
  .object({
    substitutionPenalty: nonNegativeNumber.optional(),
    insertionPenalty: nonNegativeNumber.optional(),
    deletionPenalty: nonNegativeNumber.optional(),
    notReachedPenalty: nonNegativeNumber.optional(),

    fixedStrokePenalty: fixedStrokePenaltySchema.optional(),
  })
  .strict();

const characterSpeedCalculationSchema = z.enum([
  "NET_CHARACTERS_PER_MINUTE",
  "GROSS_CHARACTERS_PER_MINUTE",
  "KEY_DEPRESSIONS_PER_HOUR",
  "POLICY_DEFINED",
]);

const validateCharacterTarget = (data, ctx) => {
  if (
    data.target?.unit === "KDPH" &&
    data.inputRules?.captureKeyboardEvents !== true
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["inputRules", "captureKeyboardEvents"],
      message: "KDPH requires keyboard event capture.",
    });
  }
};

export const createCharacterConfigSchema = z
  .object({
    name: requiredString(150),
    version: versionSchema.optional(),

    target: characterTargetSchema,

    counting: characterCountingSchema.optional(),
    inputRules: characterInputRulesSchema.optional(),
    mistakeRules: characterMistakeRulesSchema.optional(),

    speedCalculation: characterSpeedCalculationSchema.optional(),

    qualification: qualificationRuleSchema.optional(),
    isActive: activeSchema.optional(),
  })
  .strict()
  .superRefine(validateCharacterTarget);

export const updateCharacterConfigSchema = z
  .object({
    name: requiredString(150).optional(),

    target: characterTargetSchema.partial().optional(),

    counting: characterCountingSchema.partial().optional(),

    inputRules: characterInputRulesSchema.partial().optional(),

    mistakeRules: characterMistakeRulesSchema.partial().optional(),

    speedCalculation: characterSpeedCalculationSchema.optional(),

    qualification: qualificationRuleSchema.partial().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required.",
  );

export const updateCharacterConfigStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

// ============================================================
// 3. EVALUATION POLICY
// ============================================================

const policyScoringSchema = z
  .object({
    grossSpeedMethod: z
      .enum([
        "TOTAL_WORDS",
        "TOTAL_CHARACTERS",
        "TOTAL_KEY_DEPRESSIONS",
        "POLICY_DEFINED",
      ])
      .optional(),

    netSpeedMethod: z
      .enum([
        "CORRECT_WORDS",
        "CORRECT_CHARACTERS",
        "GROSS_MINUS_PENALTY",
        "POLICY_DEFINED",
      ])
      .optional(),

    errorCalculation: z
      .enum(["WORD_BASED", "CHARACTER_BASED", "STROKE_BASED", "POLICY_DEFINED"])
      .optional(),

    penaltyMethod: z
      .enum([
        "NONE",
        "FIXED_PER_ERROR",
        "GROUPED_ERRORS",
        "PERCENTAGE",
        "POLICY_DEFINED",
      ])
      .optional(),

    penaltyValue: nonNegativeNumber.optional(),

    errorAllowance: z
      .object({
        enabled: z.boolean().optional(),
        value: nonNegativeNumber.optional(),
        unit: z
          .enum(["ERRORS", "WORDS", "CHARACTERS", "PERCENTAGE"])
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const policyInputRequirementsSchema = z
  .object({
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

    inputMethod: z
      .enum(["UNICODE", "LEGACY_FONT", "IME", "PHYSICAL_KEYBOARD", "OTHER"])
      .optional(),

    captureKeyboardEvents: z.boolean().optional(),
    allowPaste: z.boolean().optional(),
  })
  .strict();

const policyOfficialSourceSchema = z
  .object({
    title: requiredString(250),
    url: z.string().trim().min(1).max(2000),
    documentType: z
      .enum([
        "OFFICIAL_NOTIFICATION",
        "OFFICIAL_SYLLABUS",
        "EVALUATION_GUIDELINES",
        "CORRIGENDUM",
        "OTHER",
      ])
      .optional(),
    publishedAt: z.coerce.date().nullable().optional(),
  })
  .strict();

const policyVerificationCreateSchema = z
  .object({
    status: z.literal("DRAFT").optional(),
    isOfficial: z.literal(false).optional(),
    verificationNotes: z.string().trim().max(3000).nullable().optional(),
  })
  .strict();

const policyVerificationUpdateSchema = z
  .object({
    verificationNotes: z.string().trim().max(3000).nullable().optional(),
  })
  .strict();

export const createEvaluationPolicySchema = z
  .object({
    name: requiredString(200),
    authority: requiredString(150),
    examCode: requiredString(100).transform((value) => value.toUpperCase()),
    postName: requiredString(150),
    recruitmentCycle: requiredString(50),

    language: languageSchema,
    examType: examTypeSchema,
    evaluator: evaluatorSchema,

    measurement: measurementTargetSchema,
    durationSeconds: z.number().int().min(1),

    scoring: policyScoringSchema.optional(),

    qualification: qualificationRuleSchema.optional(),

    inputRequirements: policyInputRequirementsSchema.optional(),

    officialSources: z.array(policyOfficialSourceSchema).max(20).optional(),

    verification: policyVerificationCreateSchema.optional(),

    effectiveFrom: z.coerce.date().nullable().optional(),
    effectiveUntil: z.coerce.date().nullable().optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.effectiveFrom &&
      data.effectiveUntil &&
      data.effectiveUntil <= data.effectiveFrom
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["effectiveUntil"],
        message: "Effective until must be later than effective from.",
      });
    }

    if (
      data.examType === "CHARACTER" &&
      data.measurement.unit === "KDPH" &&
      data.inputRequirements?.captureKeyboardEvents !== true
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["inputRequirements", "captureKeyboardEvents"],
        message: "KDPH requires keyboard event capture.",
      });
    }
  });

export const updateEvaluationPolicySchema = z
  .object({
    name: requiredString(200).optional(),
    authority: requiredString(150).optional(),
    examCode: requiredString(100)
      .transform((value) => value.toUpperCase())
      .optional(),
    postName: requiredString(150).optional(),
    recruitmentCycle: requiredString(50).optional(),

    language: languageSchema.optional(),
    examType: examTypeSchema.optional(),
    evaluator: evaluatorSchema.optional(),

    measurement: measurementTargetSchema.partial().optional(),
    durationSeconds: z.number().int().min(1).optional(),

    scoring: policyScoringSchema.partial().optional(),
    qualification: qualificationRuleSchema.partial().optional(),
    inputRequirements: policyInputRequirementsSchema.partial().optional(),

    officialSources: z.array(policyOfficialSourceSchema).max(20).optional(),

    verification: policyVerificationUpdateSchema.optional(),

    effectiveFrom: z.coerce.date().nullable().optional(),
    effectiveUntil: z.coerce.date().nullable().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required.",
  );

export const updateEvaluationPolicyStatusSchema = z
  .object({
    status: z.enum([
      "DRAFT",
      "PENDING_VERIFICATION",
      "VERIFIED",
      "REJECTED",
      "RETIRED",
    ]),
  })
  .strict();

// ============================================================
// PARAM VALIDATION
// ============================================================

export const configIdParamsSchema = z
  .object({
    configId: objectIdSchema,
  })
  .strict();

export const policyIdParamsSchema = z
  .object({
    policyId: objectIdSchema,
  })
  .strict();
