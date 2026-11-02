import mongoose from "mongoose";

const { Schema, model, models } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const EXAM_TYPES = ["WORD", "CHARACTER", "HYBRID"];

const LANGUAGES = [
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

const MEASUREMENT_UNITS = [
  "WPM",
  "CPM",
  "KDPH",
  "WORDS",
  "CHARACTERS",
  "KEY_DEPRESSIONS",
];

const MAX_PASSAGE_LENGTH = 100_000;
const MAX_TYPED_TEXT_LENGTH = 200_000;
const MAX_ANALYSIS_ITEMS_PER_CHUNK = 1_000;
const MAX_TIMELINE_ITEMS_PER_CHUNK = 500;
const MAX_INPUT_EVENTS_PER_BATCH = 2_000;

const createModel = (name, schema) => models[name] || model(name, schema);

const nonNegativeNumber = {
  type: Number,
  min: 0,
  default: 0,
};

const percentNumber = {
  type: Number,
  min: 0,
  max: 100,
  default: 0,
};

/* =========================================================
   REUSABLE SNAPSHOT SCHEMAS
========================================================= */

const measurementSnapshotSchema = new Schema(
  {
    value: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: MEASUREMENT_UNITS },
    comparison: {
      type: String,
      enum: ["MINIMUM", "MAXIMUM", "EXACT"],
      default: "MINIMUM",
    },
  },
  { _id: false, strict: "throw" },
);

const examSnapshotSchema = new Schema(
  {
    examType: { type: String, required: true, enum: EXAM_TYPES },
    examTitle: { type: String, required: true, trim: true, maxlength: 200 },
    examCode: { type: String, trim: true, maxlength: 100, default: null },
    authority: { type: String, trim: true, maxlength: 150, default: null },
    recruitmentCycle: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },
    language: { type: String, required: true, enum: LANGUAGES },
    durationSeconds: { type: Number, required: true, min: 1, max: 86400 },
    target: { type: measurementSnapshotSchema, required: true },

    wordConfig: { type: Schema.Types.Mixed, default: undefined },
    characterConfig: { type: Schema.Types.Mixed, default: undefined },
    hybridConfig: { type: Schema.Types.Mixed, default: undefined },
    policySnapshot: { type: Schema.Types.Mixed, required: true },

    examVersion: { type: Number, min: 1, required: true },
    configVersion: { type: Number, min: 1, required: true },
    policyVersion: { type: Number, min: 1, required: true },
    evaluatorVersion: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
    },
  },
  { _id: false, strict: "throw" },
);

const passageSnapshotSchema = new Schema(
  {
    passageId: { type: ObjectId, ref: "TypingPassage", required: true },
    passageVersion: { type: Number, min: 1, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: MAX_PASSAGE_LENGTH },
    language: { type: String, required: true, enum: LANGUAGES },
    normalization: {
      type: String,
      enum: ["NFC", "NFD", "NONE"],
      default: "NFC",
    },
    wordCount: { type: Number, min: 0, required: true },
    characterCount: { type: Number, min: 0, required: true },
    graphemeCount: { type: Number, min: 0, required: true },
    contentHash: { type: String, required: true, trim: true, maxlength: 128 },
  },
  { _id: false, strict: "throw" },
);

/* =========================================================
   SUMMARY METRICS
========================================================= */

const wordMetricsSchema = new Schema(
  {
    totalWords: nonNegativeNumber,
    wordsTyped: nonNegativeNumber,
    correctWords: nonNegativeNumber,
    incorrectWords: nonNegativeNumber,
    misspellings: nonNegativeNumber,
    wrongWords: nonNegativeNumber,
    omissions: nonNegativeNumber,
    notReachedWords: nonNegativeNumber,
    extraWords: nonNegativeNumber,
    totalErrors: nonNegativeNumber,
    grossWpm: nonNegativeNumber,
    netWpm: nonNegativeNumber,
    accuracy: percentNumber,
    elapsedSeconds: nonNegativeNumber,
  },
  { _id: false, strict: "throw" },
);

const characterMetricsSchema = new Schema(
  {
    totalCharacters: nonNegativeNumber,
    charactersTyped: nonNegativeNumber,
    correctCharacters: nonNegativeNumber,
    incorrectCharacters: nonNegativeNumber,
    substitutions: nonNegativeNumber,
    insertions: nonNegativeNumber,
    deletions: nonNegativeNumber,
    notReachedCharacters: nonNegativeNumber,
    totalErrors: nonNegativeNumber,
    grossCpm: nonNegativeNumber,
    netCpm: nonNegativeNumber,
    accuracy: percentNumber,
    elapsedSeconds: nonNegativeNumber,
  },
  { _id: false, strict: "throw" },
);

const inputMetricsSchema = new Schema(
  {
    totalKeyEvents: nonNegativeNumber,
    characterKeyEvents: nonNegativeNumber,
    backspaceEvents: nonNegativeNumber,
    deleteEvents: nonNegativeNumber,
    modifierKeyEvents: nonNegativeNumber,
    navigationKeyEvents: nonNegativeNumber,
    pasteEvents: nonNegativeNumber,
    kdph: nonNegativeNumber,

    eventCaptureEnabled: {
      type: Boolean,
      default: false,
    },

    acceptedEventCount: nonNegativeNumber,
    rejectedEventCount: nonNegativeNumber,

    firstEventAt: { type: Date, default: null },
    lastEventAt: { type: Date, default: null },

    eventChainDigest: {
      type: String,
      default: null,
      maxlength: 128,
    },

    validationStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "PENDING", "VALID", "INVALID"],
      default: "NOT_REQUIRED",
    },
  },
  { _id: false, strict: "throw" },
);

const resultSchema = new Schema(
  {
    wordMetrics: {
      type: wordMetricsSchema,
      default: undefined,
    },

    characterMetrics: {
      type: characterMetricsSchema,
      default: undefined,
    },

    inputMetrics: {
      type: inputMetricsSchema,
      default: undefined,
    },

    grossSpeed: nonNegativeNumber,
    netSpeed: nonNegativeNumber,

    speedUnit: {
      type: String,
      enum: MEASUREMENT_UNITS,
      default: "WPM",
    },

    accuracy: percentNumber,
    totalErrors: nonNegativeNumber,

    totalMarks: {
      type: Number,
      default: null,
    },

    marksObtained: {
      type: Number,
      default: null,
    },

    marksLost: nonNegativeNumber,

    isQualified: {
      type: Boolean,
      default: null,
    },

    qualificationStatus: {
      type: String,
      enum: ["QUALIFIED", "NOT_QUALIFIED", "PENDING", "DISQUALIFIED"],
      default: "PENDING",
    },

    qualificationReasons: {
      type: [{ type: String, trim: true, maxlength: 500 }],
      default: [],
    },

    evaluatedAt: {
      type: Date,
      default: null,
    },

    evaluatorVersion: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    resultHash: {
      type: String,
      trim: true,
      maxlength: 128,
      default: null,
    },
  },
  { _id: false, strict: "throw" },
);

/* =========================================================
   MAIN TYPING ATTEMPT MODEL
========================================================= */

const typingAttemptSchema = new Schema(
  {
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    submissionId: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
      set: (value) =>
        typeof value === "string" && value.trim() ? value.trim() : null,
    },

    userId: {
      type: ObjectId,
      ref: "User",
      required: true,
    },

    examId: {
      type: ObjectId,
      ref: "TypingExam",
      required: true,
    },

    passageId: {
      type: ObjectId,
      ref: "TypingPassage",
      required: true,
    },

    // Frozen by the start-exam service.
    configSnapshot: {
      type: examSnapshotSchema,
      required: true,
      immutable: true,
    },

    passageSnapshot: {
      type: passageSnapshotSchema,
      required: true,
      immutable: true,
    },

    typedText: {
      type: String,
      default: "",
      maxlength: MAX_TYPED_TEXT_LENGTH,
    },

    typedCharacterCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    typedWordCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "CREATED",
        "IN_PROGRESS",
        "PAUSED",
        "SUBMITTED",
        "EVALUATING",
        "COMPLETED",
        "EXPIRED",
        "CANCELLED",
        "DISQUALIFIED",
        "EVALUATION_FAILED",
      ],
      default: "CREATED",
      index: true,
    },

    startedAt: { type: Date, default: null },
    deadlineAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    evaluatedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    resumedAt: { type: Date, default: null },

    elapsedSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },

    remainingSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Increment for every accepted progress write.
    progressVersion: {
      type: Number,
      min: 0,
      default: 0,
    },

    evaluationAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },

    lastSavedAt: {
      type: Date,
      default: null,
    },

    inputMetrics: {
      type: inputMetricsSchema,
      default: () => ({}),
    },

    analysisSummary: {
      wordAnalysisCount: { type: Number, min: 0, default: 0 },
      characterAnalysisCount: { type: Number, min: 0, default: 0 },
      timelinePointCount: { type: Number, min: 0, default: 0 },
      inputEventBatchCount: { type: Number, min: 0, default: 0 },
    },

    result: {
      type: resultSchema,
      default: undefined,
    },

    evaluationError: {
      code: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      message: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      occurredAt: {
        type: Date,
        default: null,
      },
    },

    clientInfo: {
      browser: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      operatingSystem: {
        type: String,
        trim: true,
        maxlength: 150,
        default: null,
      },

      deviceType: {
        type: String,
        enum: ["DESKTOP", "LAPTOP", "TABLET", "MOBILE", "OTHER"],
        default: "OTHER",
      },

      screenWidth: {
        type: Number,
        min: 0,
        default: null,
      },

      screenHeight: {
        type: Number,
        min: 0,
        default: null,
      },
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
    minimize: false,
  },
);

/* =========================================================
   ATTEMPT VALIDATION
========================================================= */

typingAttemptSchema.pre("validate", function () {
  const type = this.configSnapshot?.examType;

  const word = this.configSnapshot?.wordConfig;
  const character = this.configSnapshot?.characterConfig;
  const hybrid = this.configSnapshot?.hybridConfig;

  if (type === "WORD" && (!word || character || hybrid)) {
    this.invalidate("configSnapshot", "WORD attempts require only wordConfig.");
  }

  if (type === "CHARACTER" && (!character || word || hybrid)) {
    this.invalidate(
      "configSnapshot",
      "CHARACTER attempts require only characterConfig.",
    );
  }

  if (type === "HYBRID" && (!hybrid || word || character)) {
    this.invalidate(
      "configSnapshot",
      "HYBRID attempts require only hybridConfig.",
    );
  }

  if (
    this.passageSnapshot?.language &&
    this.configSnapshot?.language &&
    this.passageSnapshot.language !== this.configSnapshot.language
  ) {
    this.invalidate(
      "passageSnapshot.language",
      "Passage and exam languages must match.",
    );
  }

  if (
    this.status === "COMPLETED" &&
    (!this.result?.evaluatedAt || !this.result?.evaluatorVersion)
  ) {
    this.invalidate(
      "result",
      "A completed attempt requires a finalized evaluation.",
    );
  }

  if (
    this.result?.qualificationStatus === "QUALIFIED" &&
    this.result?.isQualified !== true
  ) {
    this.invalidate(
      "result.isQualified",
      "QUALIFIED status requires isQualified=true.",
    );
  }

  if (
    this.result?.qualificationStatus === "NOT_QUALIFIED" &&
    this.result?.isQualified !== false
  ) {
    this.invalidate(
      "result.isQualified",
      "NOT_QUALIFIED status requires isQualified=false.",
    );
  }

  if (
    this.inputMetrics?.validationStatus === "VALID" &&
    !this.inputMetrics?.eventCaptureEnabled
  ) {
    this.invalidate(
      "inputMetrics.validationStatus",
      "Validated input metrics require event capture.",
    );
  }
});

/* =========================================================
   INDEXES
========================================================= */

typingAttemptSchema.index(
  { userId: 1, examId: 1, attemptNumber: 1 },
  {
    unique: true,
    name: "uniq_user_exam_attempt_number",
  },
);

typingAttemptSchema.index(
  { submissionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      submissionId: { $type: "string" },
    },
    name: "uniq_submission_id",
  },
);

typingAttemptSchema.index(
  { userId: 1, createdAt: -1 },
  { name: "user_attempt_history" },
);

typingAttemptSchema.index(
  { examId: 1, status: 1, createdAt: -1 },
  { name: "exam_attempt_status" },
);

typingAttemptSchema.index(
  { status: 1, submittedAt: 1 },
  { name: "attempt_evaluation_queue" },
);

/* =========================================================
   LIFECYCLE TRANSITIONS
========================================================= */

typingAttemptSchema.statics.canTransition = function (from, to) {
  const transitions = {
    CREATED: ["IN_PROGRESS", "CANCELLED"],

    IN_PROGRESS: [
      "PAUSED",
      "SUBMITTED",
      "EXPIRED",
      "CANCELLED",
      "DISQUALIFIED",
    ],

    PAUSED: ["IN_PROGRESS", "CANCELLED", "EXPIRED"],

    SUBMITTED: ["EVALUATING", "EVALUATION_FAILED"],

    EVALUATING: ["COMPLETED", "EVALUATION_FAILED"],

    EVALUATION_FAILED: ["EVALUATING"],

    COMPLETED: [],
    EXPIRED: [],
    CANCELLED: [],
    DISQUALIFIED: [],
  };

  return Boolean(transitions[from]?.includes(to));
};

const TypingAttempt = createModel("TypingAttempt", typingAttemptSchema);

/* =========================================================
   WORD ANALYSIS COLLECTION
========================================================= */

const wordAnalysisItemSchema = new Schema(
  {
    index: {
      type: Number,
      required: true,
      min: 0,
    },

    expectedWord: {
      type: String,
      default: "",
      maxlength: 500,
    },

    typedWord: {
      type: String,
      default: "",
      maxlength: 500,
    },

    status: {
      type: String,
      required: true,
      enum: [
        "correct",
        "misspelling",
        "wrong",
        "omitted",
        "not_reached",
        "extra",
      ],
    },

    editDistance: {
      type: Number,
      min: 0,
      default: 0,
    },

    errorCategory: {
      type: String,
      enum: [
        "NONE",
        "SPELLING",
        "SUBSTITUTION",
        "INSERTION",
        "DELETION",
        "OMISSION",
        "EXTRA_WORD",
        "NOT_REACHED",
        "PUNCTUATION",
        "WHITESPACE",
        "CASE",
        "OTHER",
      ],
      default: "NONE",
    },

    marksLost: {
      type: Number,
      min: 0,
      default: 0,
    },

    isHalfMistake: {
      type: Boolean,
      default: false,
    },

    isFullMistake: {
      type: Boolean,
      default: false,
    },

    timeTakenMs: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
    strict: "throw",
  },
);

const typingWordAnalysisSchema = new Schema(
  {
    attemptId: {
      type: ObjectId,
      ref: "TypingAttempt",
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    items: {
      type: [wordAnalysisItemSchema],
      required: true,
      validate: {
        validator: (value) =>
          value.length > 0 && value.length <= MAX_ANALYSIS_ITEMS_PER_CHUNK,
        message: "Word analysis chunk must contain 1 to 1000 items.",
      },
    },

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    versionKey: false,
    strict: "throw",
  },
);

typingWordAnalysisSchema.index(
  { attemptId: 1, chunkIndex: 1 },
  {
    unique: true,
    name: "uniq_attempt_word_analysis_chunk",
  },
);

const TypingWordAnalysis = createModel(
  "TypingWordAnalysis",
  typingWordAnalysisSchema,
);

/* =========================================================
   CHARACTER ANALYSIS COLLECTION
========================================================= */

const characterAnalysisItemSchema = new Schema(
  {
    index: {
      type: Number,
      required: true,
      min: 0,
    },

    expectedCharacter: {
      type: String,
      default: "",
      maxlength: 32,
    },

    typedCharacter: {
      type: String,
      default: "",
      maxlength: 32,
    },

    status: {
      type: String,
      required: true,
      enum: ["correct", "substitution", "insertion", "deletion", "not_reached"],
    },

    errorCategory: {
      type: String,
      enum: [
        "NONE",
        "SUBSTITUTION",
        "INSERTION",
        "DELETION",
        "NOT_REACHED",
        "WHITESPACE",
        "PUNCTUATION",
        "CASE",
        "OTHER",
      ],
      default: "NONE",
    },

    marksLost: {
      type: Number,
      min: 0,
      default: 0,
    },

    timeTakenMs: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
    strict: "throw",
  },
);

const typingCharacterAnalysisSchema = new Schema(
  {
    attemptId: {
      type: ObjectId,
      ref: "TypingAttempt",
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    items: {
      type: [characterAnalysisItemSchema],
      required: true,
      validate: {
        validator: (value) =>
          value.length > 0 && value.length <= MAX_ANALYSIS_ITEMS_PER_CHUNK,
        message: "Character analysis chunk must contain 1 to 1000 items.",
      },
    },

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    versionKey: false,
    strict: "throw",
  },
);

typingCharacterAnalysisSchema.index(
  { attemptId: 1, chunkIndex: 1 },
  {
    unique: true,
    name: "uniq_attempt_character_analysis_chunk",
  },
);

const TypingCharacterAnalysis = createModel(
  "TypingCharacterAnalysis",
  typingCharacterAnalysisSchema,
);

/* =========================================================
   INPUT EVENT BATCH COLLECTION
========================================================= */

const typingInputEventBatchSchema = new Schema(
  {
    attemptId: {
      type: ObjectId,
      ref: "TypingAttempt",
      required: true,
    },

    batchNumber: {
      type: Number,
      required: true,
      min: 0,
    },

    firstSequence: {
      type: Number,
      required: true,
      min: 0,
    },

    lastSequence: {
      type: Number,
      required: true,
      min: 0,
    },

    eventCount: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_INPUT_EVENTS_PER_BATCH,
    },

    characterKeyEvents: nonNegativeNumber,
    backspaceEvents: nonNegativeNumber,
    deleteEvents: nonNegativeNumber,
    modifierKeyEvents: nonNegativeNumber,
    navigationKeyEvents: nonNegativeNumber,

    clientStartedAt: {
      type: Date,
      default: null,
    },

    clientEndedAt: {
      type: Date,
      default: null,
    },

    serverReceivedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    previousBatchDigest: {
      type: String,
      default: null,
      maxlength: 128,
    },

    batchDigest: {
      type: String,
      required: true,
      maxlength: 128,
    },

    validationStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },

    validationReason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  {
    versionKey: false,
    strict: "throw",
  },
);

typingInputEventBatchSchema.pre("validate", function () {
  if (this.lastSequence < this.firstSequence) {
    this.invalidate(
      "lastSequence",
      "lastSequence cannot be less than firstSequence.",
    );
  }

  const sequenceCount = this.lastSequence - this.firstSequence + 1;

  if (sequenceCount !== this.eventCount) {
    this.invalidate("eventCount", "eventCount must match the sequence range.");
  }
});

typingInputEventBatchSchema.index(
  { attemptId: 1, batchNumber: 1 },
  {
    unique: true,
    name: "uniq_attempt_input_batch",
  },
);

typingInputEventBatchSchema.index(
  { attemptId: 1, firstSequence: 1 },
  {
    unique: true,
    name: "uniq_attempt_input_sequence_start",
  },
);

const TypingInputEventBatch = createModel(
  "TypingInputEventBatch",
  typingInputEventBatchSchema,
);

/* =========================================================
   TIMELINE COLLECTION
========================================================= */

const timelinePointSchema = new Schema(
  {
    sequence: {
      type: Number,
      required: true,
      min: 0,
    },

    recordedAt: {
      type: Date,
      required: true,
    },

    elapsedMs: {
      type: Number,
      required: true,
      min: 0,
    },

    typedCharacters: nonNegativeNumber,
    typedWords: nonNegativeNumber,
    correctWords: nonNegativeNumber,
    errors: nonNegativeNumber,
    currentWpm: nonNegativeNumber,
    currentCpm: nonNegativeNumber,
  },
  {
    _id: false,
    strict: "throw",
  },
);

const typingAttemptTimelineSchema = new Schema(
  {
    attemptId: {
      type: ObjectId,
      ref: "TypingAttempt",
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    points: {
      type: [timelinePointSchema],
      required: true,
      validate: {
        validator: (value) =>
          value.length > 0 && value.length <= MAX_TIMELINE_ITEMS_PER_CHUNK,
        message: "Timeline chunk must contain 1 to 500 points.",
      },
    },

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    versionKey: false,
    strict: "throw",
  },
);

typingAttemptTimelineSchema.index(
  { attemptId: 1, chunkIndex: 1 },
  {
    unique: true,
    name: "uniq_attempt_timeline_chunk",
  },
);

const TypingAttemptTimeline = createModel(
  "TypingAttemptTimeline",
  typingAttemptTimelineSchema,
);

/* =========================================================
   EXPORTS
========================================================= */

export {
  TypingAttempt,
  TypingWordAnalysis,
  TypingCharacterAnalysis,
  TypingInputEventBatch,
  TypingAttemptTimeline,
};

export default TypingAttempt;
