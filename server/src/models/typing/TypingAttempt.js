import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

/* =========================================================
   LIMITS
========================================================= */

const MAX_PASSAGE_LENGTH = 100_000;
const MAX_WORDS_PER_ATTEMPT = 20_000;
const MAX_TIMELINE_POINTS = 5_000;
const MAX_WORD_ANALYSIS = 20_000;
const MAX_ERROR_CATEGORIES = 50;
const MAX_RECOMMENDATIONS = 30;

/* =========================================================
   SHARED FIELD DEFINITIONS
========================================================= */

const countField = {
  type: Number,
  required: true,
  min: 0,
  default: 0,
};

const wpmField = {
  type: Number,
  required: true,
  min: 0,
  max: 1000,
  default: 0,
};

const percentageField = {
  type: Number,
  required: true,
  min: 0,
  max: 100,
  default: 0,
};

const optionalString = {
  type: String,
  default: "",
  trim: false,
};

/* =========================================================
   EXAM CONFIGURATION SNAPSHOT

   Keeps the exam configuration unchanged even if an admin
   edits the original exam after an attempt has started.
========================================================= */

const configSnapshotSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    language: {
      type: String,
      required: true,
      trim: true,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
      max: 7200,
    },

    targetWpm: {
      type: Number,
      required: true,
      min: 0,
      max: 500,
      default: 40,
    },

    maximumMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    passingPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 40,
    },

    passingMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    scoring: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    _id: false,
    id: false,
    strict: true,
  },
);

const scoringBreakdownSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    policyVersion: {
      type: Number,
      default: 1,
    },
    speedMarks: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    rawMarks: {
      type: Number,
      default: 0,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false, strict: true },
);

/* =========================================================
   PASSAGE SNAPSHOT

   The original passage must never change after the attempt
   starts. This is essential for historical result accuracy.
========================================================= */

const passageSnapshotSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    language: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      maxlength: MAX_PASSAGE_LENGTH,
    },

    wordCount: {
      type: Number,
      required: true,
      min: 0,
      max: MAX_WORDS_PER_ATTEMPT,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  {
    _id: false,
    id: false,
    strict: true,
  },
);

/* =========================================================
   WORD COMPARISON

   Every aligned word is saved individually.

   correct       = exact word match
   misspelling   = similar word with spelling differences
   wrong         = a different substituted word
   omitted       = expected word was skipped
   not_reached   = candidate did not reach this passage word
   extra         = candidate typed an additional word
========================================================= */

const wordAnalysisSchema = new Schema(
  {
    position: {
      type: Number,
      required: true,
      min: 0,
    },

    referenceIndex: {
      type: Number,
      default: null,
      min: 0,
    },

    typedIndex: {
      type: Number,
      default: null,
      min: 0,
    },

    expectedWord: {
      ...optionalString,
      maxlength: 500,
    },

    typedWord: {
      ...optionalString,
      maxlength: 500,
    },

    type: {
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
        "none",
        "spelling",
        "wrong_word",
        "omission",
        "not_reached",
        "extra_word",
      ],
      default: "none",
    },

    marksLost: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
    id: false,
    strict: "throw",
  },
);

/* =========================================================
   WORD METRICS

   These metrics are calculated from the saved word alignment.
========================================================= */

const wordMetricsSchema = new Schema(
  {
    totalWords: countField,

    wordsTyped: countField,

    correctWords: countField,

    incorrectWords: countField,

    misspellings: countField,

    wrongWords: countField,

    omissions: countField,

    notReachedWords: countField,

    extraWords: countField,

    totalErrors: countField,

    grossWpm: wpmField,

    netWpm: wpmField,

    accuracy: percentageField,

    elapsedSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
    id: false,
    strict: true,
  },
);

/* =========================================================
   TIMELINE

   Stores word-level progress snapshots during the exam.
   These are used for speed and accuracy charts.
========================================================= */

const timelineSchema = new Schema(
  {
    elapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
      max: 7200,
    },

    totalWords: countField,

    wordsTyped: countField,

    correctWords: countField,

    incorrectWords: countField,

    misspellings: countField,

    wrongWords: countField,

    omissions: countField,

    notReachedWords: countField,

    extraWords: countField,

    totalErrors: countField,

    errorsInInterval: countField,

    grossWpm: wpmField,

    netWpm: wpmField,

    accuracy: percentageField,

    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
    id: false,
    strict: "throw",
  },
);

/* =========================================================
   ERROR DISTRIBUTION

   Used by the result page's error analysis charts.
========================================================= */

const errorCategorySchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    count: {
      type: Number,
      required: true,
      min: 0,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    marksLost: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
    id: false,
    strict: "throw",
  },
);

/* =========================================================
   MINUTE-WISE PERFORMANCE
========================================================= */

const minutePerformanceSchema = new Schema(
  {
    minute: {
      type: Number,
      required: true,
      min: 1,
    },

    startElapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    endElapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    wordsTyped: countField,

    correctWords: countField,

    incorrectWords: countField,

    totalErrors: countField,

    grossWpm: wpmField,

    netWpm: wpmField,

    accuracy: percentageField,
  },
  {
    _id: false,
    id: false,
    strict: "throw",
  },
);

/* =========================================================
   PERFORMANCE SEGMENTS
========================================================= */

const performanceSegmentSchema = new Schema(
  {
    segmentIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    label: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    startElapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    endElapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    wordsTyped: countField,

    correctWords: countField,

    totalErrors: countField,

    grossWpm: wpmField,

    netWpm: wpmField,

    accuracy: percentageField,
  },
  {
    _id: false,
    id: false,
    strict: "throw",
  },
);

/* =========================================================
   QUALIFICATION REQUIREMENTS
========================================================= */

const qualificationSchema = new Schema(
  {
    minimumWpm: {
      type: Number,
      min: 0,
      default: 0,
    },

    minimumAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    maximumErrors: {
      type: Number,
      min: 0,
      default: null,
    },

    minimumMarks: {
      type: Number,
      min: 0,
      default: 0,
    },

    achievedWpm: {
      type: Number,
      min: 0,
      default: 0,
    },

    achievedAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    achievedMarks: {
      type: Number,
      min: 0,
      default: 0,
    },

    wpmRequirementMet: {
      type: Boolean,
      default: false,
    },

    accuracyRequirementMet: {
      type: Boolean,
      default: false,
    },

    errorsRequirementMet: {
      type: Boolean,
      default: true,
    },

    marksRequirementMet: {
      type: Boolean,
      default: false,
    },

    passed: {
      type: Boolean,
      default: false,
    },
    maximumErrorPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    requireAll: {
      type: Boolean,
      default: true,
    },

    achievedErrors: {
      type: Number,
      min: 0,
      default: 0,
    },

    achievedErrorPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    _id: false,
    id: false,
    strict: true,
  },
);

/* =========================================================
   RESULT SCHEMA

   The final report contains:
   - word-level metrics
   - exact word comparison
   - marks and qualification
   - error distribution
   - chart data
========================================================= */

const resultSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["evaluated", "passed", "failed"],
      default: "evaluated",
    },

    wordMetrics: {
      type: wordMetricsSchema,
      required: true,
    },

    wordAnalysis: {
      type: [wordAnalysisSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_WORD_ANALYSIS,
        message: "Word analysis exceeds the allowed limit.",
      },
    },

    marks: {
      type: Number,
      required: true,
      min: 0,
    },

    maximumMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    passingPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    passingMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    meetsMinimumWpm: {
      type: Boolean,
      default: false,
    },

    meetsMinimumAccuracy: {
      type: Boolean,
      default: false,
    },

    meetsMaximumErrors: {
      type: Boolean,
      default: true,
    },

    meetsPassingMarks: {
      type: Boolean,
      default: false,
    },

    passed: {
      type: Boolean,
      required: true,
      default: false,
    },

    qualification: {
      type: qualificationSchema,
      default: () => ({}),
    },

    errorDistribution: {
      type: [errorCategorySchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_ERROR_CATEGORIES,
        message: "Too many error categories.",
      },
    },

    minutePerformance: {
      type: [minutePerformanceSchema],
      default: [],
    },

    performanceSegments: {
      type: [performanceSegmentSchema],
      default: [],
    },

    timeline: {
      type: [timelineSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_TIMELINE_POINTS,
        message: "Too many result timeline points.",
      },
    },

    summary: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    analytics: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    insights: {
      type: [String],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_RECOMMENDATIONS,
        message: "Too many performance insights.",
      },
    },

    scoringBreakdown: {
      type: scoringBreakdownSchema,
      default: undefined,
    },

    reportVersion: {
      type: Number,
      default: 1,
      min: 1,
    },

    evaluatedAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
    id: false,
    strict: "throw",
    minimize: false,
  },
);

/* =========================================================
   MAIN TYPING ATTEMPT MODEL
========================================================= */

const typingAttemptSchema = new Schema(
  {
    /* Candidate who started the examination */

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    /* Original exam reference */

    examId: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      required: true,
      immutable: true,
      index: true,
    },

    /* Original passage reference */

    passageId: {
      type: Schema.Types.ObjectId,
      ref: "TypingPassage",
      required: true,
      immutable: true,
      index: true,
    },

    /* Frozen exam configuration */

    configSnapshot: {
      type: configSnapshotSchema,
      required: true,
      immutable: true,
    },

    /* Frozen passage information */

    passageSnapshot: {
      type: passageSnapshotSchema,
      required: true,
      immutable: true,
    },

    /* Exact text entered by the candidate */

    typedText: {
      type: String,
      default: "",
      maxlength: MAX_PASSAGE_LENGTH,
    },

    /* Attempt lifecycle */

    status: {
      type: String,
      enum: ["in_progress", "evaluated", "expired", "abandoned"],
      default: "in_progress",
      required: true,
      index: true,
    },

    /* Exam timing */

    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },

    deadlineAt: {
      type: Date,
      required: true,
      immutable: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

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

    /* Optimistic concurrency for autosave */

    progressVersion: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* Word-based progress history */

    timeline: {
      type: [timelineSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_TIMELINE_POINTS,
        message: "Attempt timeline exceeds the allowed limit.",
      },
    },

    /* Final evaluated report */

    result: {
      type: resultSchema,
      default: undefined,
    },

    /* Prevent duplicate submissions */

    submissionId: {
      type: String,
      trim: true,
      maxlength: 128,
      default: null,
    },

    evaluatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
    strict: "throw",
    minimize: false,
  },
);

/* =========================================================
   DOCUMENT VALIDATION
========================================================= */

typingAttemptSchema.pre("validate", function () {
  /* Deadline must be after start time */

  if (this.startedAt && this.deadlineAt && this.deadlineAt <= this.startedAt) {
    this.invalidate(
      "deadlineAt",
      "Deadline must be later than the start time.",
    );
  }

  /* Elapsed time cannot exceed configured duration */

  const duration = Number(this.configSnapshot?.durationSeconds ?? 0);

  if (duration > 0 && this.elapsedSeconds > duration) {
    this.invalidate(
      "elapsedSeconds",
      "Elapsed time cannot exceed the examination duration.",
    );
  }

  /* Evaluated attempts must have a result */

  if (this.status === "evaluated" && !this.result) {
    this.invalidate("result", "An evaluated attempt must contain a result.");
  }

  /* Evaluated attempts must have timestamps */

  if (this.status === "evaluated" && !this.evaluatedAt) {
    this.invalidate(
      "evaluatedAt",
      "An evaluated attempt must have an evaluation timestamp.",
    );
  }

  if (this.status === "evaluated" && !this.submittedAt) {
    this.invalidate(
      "submittedAt",
      "An evaluated attempt must have a submission timestamp.",
    );
  }

  /* Validate final marks */

  if (this.result) {
    const result = this.result;

    if (
      result.marks != null &&
      result.maximumMarks != null &&
      result.marks > result.maximumMarks
    ) {
      this.invalidate("result.marks", "Marks cannot exceed maximum marks.");
    }

    if (
      result.passingMarks != null &&
      result.maximumMarks != null &&
      result.passingMarks > result.maximumMarks
    ) {
      this.invalidate(
        "result.passingMarks",
        "Passing marks cannot exceed maximum marks.",
      );
    }

    if (
      result.wordMetrics &&
      result.wordMetrics.correctWords > result.wordMetrics.wordsTyped
    ) {
      this.invalidate(
        "result.wordMetrics.correctWords",
        "Correct words cannot exceed words typed.",
      );
    }

    if (
      result.wordMetrics &&
      result.wordMetrics.totalErrors !==
        result.wordMetrics.incorrectWords +
          result.wordMetrics.omissions +
          result.wordMetrics.notReachedWords +
          result.wordMetrics.extraWords
    ) {
      this.invalidate(
        "result.wordMetrics.totalErrors",
        "Total errors must equal the sum of the word error categories.",
      );
    }

    /* Every alignment entry needs a valid classification */

    for (const [index, word] of (result.wordAnalysis || []).entries()) {
      if (word.type === "correct" && word.expectedWord !== word.typedWord) {
        this.invalidate(
          `result.wordAnalysis.${index}`,
          "A correct word must exactly match its expected word.",
        );
      }

      if (word.type === "omitted" || word.type === "not_reached") {
        if (word.typedWord) {
          this.invalidate(
            `result.wordAnalysis.${index}.typedWord`,
            "An omitted or not-reached word cannot have a typed word.",
          );
        }
      }

      if (word.type === "extra" && word.expectedWord) {
        this.invalidate(
          `result.wordAnalysis.${index}.expectedWord`,
          "An extra word cannot have an expected word.",
        );
      }
    }

    /* Validate result timeline duration */

    for (const [index, point] of (result.timeline || []).entries()) {
      if (duration > 0 && point.elapsedSeconds > duration) {
        this.invalidate(
          `result.timeline.${index}.elapsedSeconds`,
          "Result timeline exceeds the exam duration.",
        );
      }
    }
  }

  /* Validate autosave timeline */

  for (const [index, point] of (this.timeline || []).entries()) {
    if (duration > 0 && point.elapsedSeconds > duration) {
      this.invalidate(
        `timeline.${index}.elapsedSeconds`,
        "Timeline elapsed time cannot exceed exam duration.",
      );
    }

    if (point.correctWords > point.wordsTyped) {
      this.invalidate(
        `timeline.${index}.correctWords`,
        "Correct words cannot exceed words typed.",
      );
    }
  }
});

/* =========================================================
   INDEXES
========================================================= */

/* Candidate attempt history */

typingAttemptSchema.index({
  userId: 1,
  createdAt: -1,
});

/* Exam attempt history */

typingAttemptSchema.index({
  examId: 1,
  createdAt: -1,
});

/* Passage attempt history */

typingAttemptSchema.index({
  passageId: 1,
  createdAt: -1,
});

/* Candidate's attempts for an exam */

typingAttemptSchema.index({
  userId: 1,
  examId: 1,
  status: 1,
});

/* Expiry and cleanup queries */

typingAttemptSchema.index({
  status: 1,
  deadlineAt: 1,
});

/* =========================================================
   INDEXES
========================================================= */

// Candidate attempt history
typingAttemptSchema.index(
  { userId: 1, createdAt: -1 },
  { name: "candidate_attempt_history" },
);

// Exam attempt history
typingAttemptSchema.index(
  { examId: 1, createdAt: -1 },
  { name: "exam_attempt_history" },
);

// Passage attempt history
typingAttemptSchema.index(
  { passageId: 1, createdAt: -1 },
  { name: "passage_attempt_history" },
);

// Candidate's attempts for an exam
typingAttemptSchema.index(
  { userId: 1, examId: 1, status: 1 },
  { name: "candidate_exam_attempts" },
);

// Expiry queries
typingAttemptSchema.index(
  { status: 1, deadlineAt: 1 },
  { name: "attempt_expiry_lookup" },
);

// Only one active attempt per candidate per exam
typingAttemptSchema.index(
  { userId: 1, examId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "in_progress",
    },
    name: "unique_active_attempt_per_user_exam",
  },
);

// Prevent duplicate submission IDs for a candidate
typingAttemptSchema.index(
  { userId: 1, submissionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      submissionId: { $type: "string" },
    },
    name: "unique_candidate_submission_id",
  },
);

/* =========================================================
   MODEL EXPORT
========================================================= */

const TypingAttempt =
  models.TypingAttempt || model("TypingAttempt", typingAttemptSchema);

export default TypingAttempt;
