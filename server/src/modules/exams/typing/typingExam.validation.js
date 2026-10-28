import { z } from "zod";

/* =====================================================
   COMMON VALIDATION
===================================================== */

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const configIdParamSchema = z.object({
  configId: objectIdSchema,
});

export const attemptIdParamSchema = z.object({
  attemptId: objectIdSchema,
});

const nonEmptyString = (max = 200) => z.string().trim().min(1).max(max);

const positiveInteger = z.coerce.number().int().positive();

const languageSchema = z.enum(["en", "hi", "mr"]);

const configStatusSchema = z.enum(["active", "archived"]);

const examStatusSchema = z.enum(["draft", "published", "archived"]);

/* =====================================================
   EXAM IDENTITY / RECRUITMENT METADATA
===================================================== */

export const examMetadataSchema = z
  .object({
    country: z.string().trim().min(1).max(100).default("India"),

    state: z.string().trim().max(100).default(""),

    jurisdiction: z.string().trim().max(150).default(""),

    recruitmentAuthority: z.string().trim().max(200).default(""),

    courtName: z.string().trim().max(200).default(""),

    postName: z.string().trim().max(200).default(""),

    examCategory: z.string().trim().max(100).default("typing"),

    examStage: z.string().trim().max(100).default("typing_test"),

    notificationNumber: z.string().trim().max(150).default(""),

    notificationDate: z.coerce.date().optional(),

    officialSourceUrl: z.string().url().or(z.literal("")).default(""),

    officialRulesVerified: z.boolean().default(false),

    ruleVersion: z.string().trim().max(100).default(""),

    notes: z.string().trim().max(3000).default(""),
  })
  .strict();

/* =====================================================
   PASSAGE SETTINGS
===================================================== */

export const passageSettingsSchema = z
  .object({
    sourceType: z.enum(["fixed", "random", "admin_selected"]).default("fixed"),

    expectedWordCount: z.number().int().positive().optional(),

    expectedLineCount: z.number().int().positive().optional(),

    minimumWordCount: z.number().int().positive().optional(),

    maximumWordCount: z.number().int().positive().optional(),

    preserveLineBreaks: z.boolean().default(true),

    allowParagraphs: z.boolean().default(true),

    allowNumbers: z.boolean().default(true),

    allowPunctuation: z.boolean().default(true),
  })
  .strict()
  .refine(
    (data) =>
      data.minimumWordCount === undefined ||
      data.maximumWordCount === undefined ||
      data.minimumWordCount <= data.maximumWordCount,
    {
      message: "Minimum word count cannot exceed maximum word count",
      path: ["minimumWordCount"],
    },
  );

/* =====================================================
   SCORING / QUALIFICATION RULES
===================================================== */

export const evaluationRulesSchema = z
  .object({
    strategy: z
      .enum([
        "gross_net_wpm",
        "correct_words",
        "error_penalty",
        "qualification_only",
        "custom",
      ])
      .default("gross_net_wpm"),

    wordLength: z.number().int().min(1).max(20).default(5),

    wpmMethod: z.enum(["gross", "net"]).default("net"),

    accuracyMethod: z
      .enum(["allCharacters", "typedCharacters"])
      .default("allCharacters"),

    minimumWpm: z.number().min(0).max(500).default(0),

    minimumAccuracy: z.number().min(0).max(100).default(0),

    maximumErrors: z.number().int().min(0).optional(),

    maximumErrorPercentage: z.number().min(0).max(100).optional(),

    passingMode: z.enum(["all", "any"]).default("all"),

    countPunctuation: z.boolean().default(true),

    ignoreRepeatedSpaces: z.boolean().default(false),

    ignoreCase: z.boolean().default(false),

    errorPenaltyPerError: z.number().min(0).max(100).default(0),

    maximumMarks: z.number().positive().optional(),

    passingMarks: z.number().min(0).optional(),

    qualificationOnly: z.boolean().default(false),

    // Optional, explicitly configured result conditions.
    minimumCorrectWords: z.number().int().min(0).optional(),

    minimumCorrectCharacters: z.number().int().min(0).optional(),

    allowIncompletePassage: z.boolean().default(true),
  })
  .strict()
  .refine(
    (rules) =>
      rules.maximumMarks === undefined ||
      rules.passingMarks === undefined ||
      rules.passingMarks <= rules.maximumMarks,
    {
      message: "Passing marks cannot exceed maximum marks",
      path: ["passingMarks"],
    },
  );

/* =====================================================
   KEYBOARD / TYPING INTERFACE
===================================================== */

export const examInterfaceSchema = z
  .object({
    allowBackspace: z.boolean().default(true),

    allowDelete: z.boolean().default(true),

    allowArrowKeys: z.boolean().default(true),

    allowNavigationKeys: z.boolean().default(true),

    allowHomeEnd: z.boolean().default(true),

    allowPaste: z.boolean().default(false),

    allowCopy: z.boolean().default(false),

    allowCut: z.boolean().default(false),

    allowContextMenu: z.boolean().default(false),

    allowUndo: z.boolean().default(true),

    showReferencePassage: z.boolean().default(true),

    autoSubmitOnTimeout: z.boolean().default(true),

    showTimer: z.boolean().default(true),

    showLiveWpm: z.boolean().default(true),

    showLiveAccuracy: z.boolean().default(true),

    showErrorCount: z.boolean().default(true),

    enableSpellcheck: z.boolean().default(false),

    requireFullscreen: z.boolean().default(false),

    preventTextSelection: z.boolean().default(false),

    inputMode: z.enum(["normal", "restricted", "exam"]).default("normal"),
  })
  .strict();

/* =====================================================
   ANALYTICS SETTINGS
===================================================== */

export const analyticsSettingsSchema = z
  .object({
    recordIntervalSeconds: z.number().int().min(1).max(60).default(5),

    showSpeedTimeline: z.boolean().default(true),

    showAccuracyTimeline: z.boolean().default(true),

    showErrorAnalysis: z.boolean().default(true),

    showImprovementPlan: z.boolean().default(true),

    storeKeystrokeTimeline: z.boolean().default(true),
  })
  .strict();

/* =====================================================
   EXAM WORKFLOW / STAGES
===================================================== */

export const examWorkflowStageSchema = z
  .object({
    key: z.string().trim().min(1).max(100),

    type: z.string().trim().min(1).max(100),

    enabled: z.boolean().default(true),

    required: z.boolean().default(true),

    durationSeconds: z.number().int().positive().optional(),
  })
  .strict();

export const examWorkflowSchema = z
  .object({
    stages: z.array(examWorkflowStageSchema).min(1).max(30),
  })
  .strict()
  .refine(
    (workflow) => {
      const enabledStages = workflow.stages.filter((stage) => stage.enabled);

      return (
        enabledStages.length > 0 &&
        enabledStages[0].type === "instructions" &&
        enabledStages[enabledStages.length - 1].type === "result"
      );
    },
    {
      message: "Workflow must start with instructions and end with result",
      path: ["stages"],
    },
  );

/* =====================================================
   EXAM CONFIGURATION VALIDATION
===================================================== */

export const createTypingExamConfigSchema = z
  .object({
    name: nonEmptyString(150),

    description: z.string().trim().max(2000).default(""),

    language: languageSchema.default("en"),

    durationSeconds: z.number().int().min(10).max(7200),

    targetWpm: z.number().min(0).max(500).default(40),

    examMetadata: examMetadataSchema.default({}),

    passageSettings: passageSettingsSchema.default({}),

    instructions: z
      .array(z.string().trim().min(1).max(500))
      .max(30)
      .default([]),

    evaluationRules: evaluationRulesSchema.default({}),

    examInterface: examInterfaceSchema.default({}),

    analyticsSettings: analyticsSettingsSchema.default({}),

    examWorkflow: examWorkflowSchema,
  })
  .strict();

export const updateTypingExamConfigSchema = z
  .object({
    name: nonEmptyString(150).optional(),

    description: z.string().trim().max(2000).optional(),

    language: languageSchema.optional(),

    durationSeconds: z.number().int().min(10).max(7200).optional(),

    targetWpm: z.number().min(0).max(500).optional(),

    examMetadata: examMetadataSchema.optional(),

    passageSettings: passageSettingsSchema.optional(),

    instructions: z.array(z.string().trim().min(1).max(500)).max(30).optional(),

    evaluationRules: evaluationRulesSchema.optional(),

    examInterface: examInterfaceSchema.optional(),

    analyticsSettings: analyticsSettingsSchema.optional(),

    examWorkflow: examWorkflowSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one configuration field is required",
  });

/* =====================================================
   EXAM VALIDATION
===================================================== */

export const createTypingExamSchema = z
  .object({
    title: nonEmptyString(200),

    passageText: z.string().trim().min(1).max(50000),

    configId: objectIdSchema,
  })
  .strict();

export const updateTypingExamSchema = z
  .object({
    title: nonEmptyString(200).optional(),

    passageText: z.string().trim().min(1).max(50000).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one exam field is required",
  });

export const listTypingExamsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    status: examStatusSchema.optional(),

    language: languageSchema.optional(),

    configId: objectIdSchema.optional(),

    search: z.string().trim().max(200).optional(),
  })
  .strict();

/* =====================================================
   TYPING ATTEMPT VALIDATION
===================================================== */

export const startTypingAttemptSchema = z
  .object({
    examId: objectIdSchema,
  })
  .strict();

const speedGraphPointSchema = z
  .object({
    elapsedSeconds: z.number().int().min(0).max(7200),
    wpm: z.number().min(0).max(1000),
  })
  .strict();

export const submitTypingAttemptSchema = z
  .object({
    submissionId: z.string().trim().min(1).max(128),
    typedText: z.string().max(50_000),
    speedGraph: z.array(speedGraphPointSchema).max(5000).default([]),
  })
  .strict();

export const typingTimelineMetricSchema = z
  .object({
    elapsedSeconds: z.number().int().min(0),

    typedCharacters: z.number().int().min(0),

    correctCharacters: z.number().int().min(0),

    incorrectCharacters: z.number().int().min(0),

    missedCharacters: z.number().int().min(0),

    extraCharacters: z.number().int().min(0),

    grossWpm: z.number().min(0).max(1000),

    netWpm: z.number().min(0).max(1000),

    accuracy: z.number().min(0).max(100),

    errorsInInterval: z.number().int().min(0),
  })
  .strict();

export const saveTypingAttemptTimelineSchema = z
  .object({
    typedText: z.string().max(50_000).optional(),

    metrics: z.array(typingTimelineMetricSchema).min(1).max(1200),
  })
  .strict();

/* =====================================================
   ANALYTICS VALIDATION
===================================================== */

export const typingExamAnalyticsQuerySchema = z
  .object({
    from: z.coerce.date().optional(),

    to: z.coerce.date().optional(),

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "'from' must be earlier than or equal to 'to'",
    path: ["from"],
  });

/* =====================================================
   VALIDATION MIDDLEWARE
===================================================== */

export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req[source] = result.data;

    next();
  };
};
