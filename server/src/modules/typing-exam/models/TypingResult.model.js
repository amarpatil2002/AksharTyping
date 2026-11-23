import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

/**
 * Comparison items are intentionally Mixed.
 *
 * The comparison engine can return structured objects
 * containing token/index/position information.
 */
const comparisonListSchema = new Schema(
  {
    correct: {
      type: [Schema.Types.Mixed],
      default: [],
    },

    incorrect: {
      type: [Schema.Types.Mixed],
      default: [],
    },

    missing: {
      type: [Schema.Types.Mixed],
      default: [],
    },

    extra: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  { _id: false },
);

/**
 * WORD core-result metrics.
 */
const wordMetricsSchema = new Schema(
  {
    expectedWords: {
      type: Number,
      default: 0,
      min: 0,
    },

    typedWords: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctWords: {
      type: Number,
      default: 0,
      min: 0,
    },

    incorrectWords: {
      type: Number,
      default: 0,
      min: 0,
    },

    missingWords: {
      type: Number,
      default: 0,
      min: 0,
    },

    extraWords: {
      type: Number,
      default: 0,
      min: 0,
    },

    errorCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    grossWpm: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctWpm: {
      type: Number,
      default: 0,
      min: 0,
    },

    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    errorPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false },
);

/**
 * CHARACTER core-result metrics.
 */
const characterMetricsSchema = new Schema(
  {
    expectedCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    typedCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    incorrectCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    missingCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    extraCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    errorCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    grossCpm: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctCpm: {
      type: Number,
      default: 0,
      min: 0,
    },

    grossKDPH: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctKDPH: {
      type: Number,
      default: 0,
      min: 0,
    },

    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    errorPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false },
);

const wordCoreResultSchema = new Schema(
  {
    metrics: {
      type: wordMetricsSchema,
      default: null,
    },

    comparison: {
      type: comparisonListSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

const characterCoreResultSchema = new Schema(
  {
    metrics: {
      type: characterMetricsSchema,
      default: null,
    },

    comparison: {
      type: comparisonListSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

const hybridCoreResultSchema = new Schema(
  {
    available: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

/**
 * Core result is policy-independent.
 */
const coreResultSchema = new Schema(
  {
    word: {
      type: wordCoreResultSchema,
      default: null,
    },

    character: {
      type: characterCoreResultSchema,
      default: null,
    },

    hybrid: {
      type: hybridCoreResultSchema,
      default: null,
    },
  },
  { _id: false },
);

/**
 * Official result is policy-specific.
 *
 * Different evaluators can expose different
 * metric fields, therefore metrics/qualification
 * remain flexible.
 */
const officialResultSchema = new Schema(
  {
    evaluator: {
      type: String,
      required: true,
      trim: true,
    },

    metrics: {
      type: Schema.Types.Mixed,
      default: {},
    },

    marks: {
      type: Schema.Types.Mixed,
      default: {},
    },

    qualification: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

const calculationSchema = new Schema(
  {
    calculatedAt: {
      type: Date,
      required: true,
    },

    engineVersion: {
      type: String,
      required: true,
      trim: true,
    },

    policyVersion: {
      type: String,
      required: true,
      trim: true,
    },

    formulaVersion: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false },
);

const typingResultSchema = new Schema(
  {
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: "TypingAttempt",
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    examId: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      required: true,
      index: true,
    },

    passageId: {
      type: Schema.Types.ObjectId,
      ref: "TypingPassage",
      required: true,
      index: true,
    },

    policyId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    policyVersion: {
      type: String,
      required: true,
      trim: true,
    },

    formulaVersion: {
      type: String,
      default: null,
      trim: true,
    },

    engineVersion: {
      type: String,
      required: true,
      trim: true,
    },

    examType: {
      type: String,
      enum: ["WORD", "CHARACTER", "HYBRID"],
      required: true,
    },

    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    elapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    /**
     * Neutral/policy-independent calculation.
     */
    coreResult: {
      type: coreResultSchema,
      required: true,
    },

    /**
     * Exam-specific calculation.
     *
     * Null is valid when:
     * - policy is PARTIALLY_VERIFIED
     * - policy is UNVERIFIED
     * - official formula is disabled
     */
    officialResult: {
      type: officialResultSchema,
      default: null,
    },

    officialCalculationAvailable: {
      type: Boolean,
      required: true,
      default: false,
    },

    officialCalculationReason: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    finalScore: {
      type: Number,
      default: null,
    },

    marksObtained: {
      type: Number,
      default: null,
    },

    maxMarks: {
      type: Number,
      default: null,
    },

    qualified: {
      type: Boolean,
      default: null,
    },

    qualificationReason: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    /**
     * Exact formula configuration used
     * when this result was calculated.
     */
    formulaSnapshot: {
      type: Schema.Types.Mixed,
      default: {},
    },

    calculation: {
      type: calculationSchema,
      required: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

typingResultSchema.index({
  userId: 1,
  examId: 1,
  createdAt: -1,
});

typingResultSchema.index({
  examId: 1,
  policyId: 1,
  createdAt: -1,
});

typingResultSchema.index({
  userId: 1,
  qualified: 1,
  createdAt: -1,
});

const TypingResult =
  models.TypingResult || model("TypingResult", typingResultSchema);

export default TypingResult;
