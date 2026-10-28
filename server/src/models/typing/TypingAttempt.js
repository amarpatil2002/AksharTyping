import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const MAX_PASSAGE_LENGTH = 50_000;
const MAX_TIMELINE_POINTS = 5_000;
const MAX_CHARACTER_ANALYSIS = 20_000;
const MAX_ERROR_CATEGORIES = 50;
const MAX_RECOMMENDATIONS = 30;
const MAX_QUALIFICATION_REASONS = 50;
const MAX_SEGMENTS = 500;

/* =====================================================
   SHARED SCHEMA HELPERS
===================================================== */

const boundedCount = {
  type: Number,
  required: true,
  min: 0,
  max: 100_000_000,
  default: 0,
};

const boundedWpm = {
  type: Number,
  required: true,
  min: 0,
  max: 1000,
  default: 0,
};

const percentage = {
  type: Number,
  required: true,
  min: 0,
  max: 100,
  default: 0,
};

/* =====================================================
   EXAM SNAPSHOT
===================================================== */

const examSnapshotSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    language: {
      type: String,
      enum: ["en", "hi", "mr"],
      required: true,
    },

    passageText: {
      type: String,
      required: true,
      maxlength: MAX_PASSAGE_LENGTH,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 10,
      max: 7200,
    },

    targetWpm: {
      type: Number,
      default: 40,
      min: 0,
      max: 500,
    },

    instructions: {
      type: [String],
      default: [],
      validate: {
        validator: (items) =>
          items.length <= 100 && items.every((item) => item.length <= 2000),
        message: "Invalid exam instructions.",
      },
    },

    examMetadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    passageSettings: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    evaluationRules: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    examInterface: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    analyticsSettings: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    examWorkflow: {
      type: Schema.Types.Mixed,
      default: undefined,
    },

    configVersion: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
    id: false,
    strict: true,
  },
);

/* =====================================================
   ATTEMPT TIMELINE METRICS
===================================================== */

const typingTimelineMetricSchema = new Schema(
  {
    elapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
      max: 7200,
    },

    typedCharacters: boundedCount,
    correctCharacters: boundedCount,
    incorrectCharacters: boundedCount,
    missedCharacters: boundedCount,
    extraCharacters: boundedCount,
    grossWpm: boundedWpm,
    netWpm: boundedWpm,
    accuracy: percentage,
    errorsInInterval: boundedCount,
  },
  {
    _id: false,
    id: false,
    strict: "throw",
  },
);

/* =====================================================
   RESULT CHARACTER ANALYSIS
===================================================== */

const characterAnalysisSchema = new Schema(
  {
    referenceIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    referenceCharacter: {
      type: String,
      required: true,
      maxlength: 16,
    },

    typedCharacter: {
      type: String,
      default: null,
      maxlength: 16,
    },

    type: {
      type: String,
      required: true,
      enum: ["correct", "incorrect", "missing", "extra"],
    },

    category: {
      type: String,
      enum: [
        "letter",
        "number",
        "punctuation",
        "whitespace",
        "symbol",
        "other",
      ],
      default: "other",
    },
  },
  { _id: false, strict: "throw" },
);

/* =====================================================
   RESULT TIMELINE
===================================================== */

const resultTimelineSchema = new Schema(
  {
    elapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
      max: 7200,
    },

    typedCharacters: boundedCount,
    correctCharacters: boundedCount,
    incorrectCharacters: boundedCount,
    missedCharacters: boundedCount,
    extraCharacters: boundedCount,
    grossWpm: boundedWpm,
    netWpm: boundedWpm,
    accuracy: percentage,
    errorsInInterval: boundedCount,
  },
  { _id: false, strict: "throw" },
);

/* =====================================================
   ERROR DISTRIBUTION
===================================================== */

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
      max: 100_000_000,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false, strict: "throw" },
);

/* =====================================================
   PERFORMANCE SEGMENTS
===================================================== */

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
      maxlength: 200,
      default: "",
    },

    startElapsedSeconds: {
      type: Number,
      min: 0,
      max: 7200,
      default: null,
    },

    endElapsedSeconds: {
      type: Number,
      min: 0,
      max: 7200,
      default: null,
    },

    typedCharacters: boundedCount,
    correctCharacters: boundedCount,
    incorrectCharacters: boundedCount,
    grossWpm: boundedWpm,
    netWpm: boundedWpm,
    accuracy: percentage,
    errors: boundedCount,
  },
  { _id: false, strict: "throw" },
);

/* =====================================================
   SKILL PROFILE
===================================================== */

const skillScoreSchema = new Schema(
  {
    skill: {
      type: String,
      required: true,
      enum: [
        "speed",
        "accuracy",
        "consistency",
        "punctuation",
        "spacing",
        "capitalization",
        "number_entry",
        "endurance",
        "correction",
        "overall",
      ],
    },

    score: percentage,

    benchmarkScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  { _id: false, strict: "throw" },
);

/* =====================================================
   IMPROVEMENT PLAN
===================================================== */

const improvementRecommendationSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      enum: [
        "speed",
        "accuracy",
        "consistency",
        "punctuation",
        "spacing",
        "capitalization",
        "number_entry",
        "endurance",
        "general",
      ],
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    suggestedMinutes: {
      type: Number,
      min: 0,
      max: 1440,
      default: 10,
    },

    targetValue: {
      type: Number,
      default: null,
    },

    currentValue: {
      type: Number,
      default: null,
    },
  },
  { _id: false, strict: "throw" },
);

/* =====================================================
   TYPING RESULT
===================================================== */

const typingResultSchema = new Schema(
  {
    outcome: {
      type: String,
      required: true,
      enum: ["pass", "fail", "incomplete"],
    },

    timedOut: {
      type: Boolean,
      required: true,
      default: false,
    },

    evaluationStrategy: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Overall performance
    grossWpm: boundedWpm,
    netWpm: boundedWpm,
    accuracy: percentage,

    // Character and word statistics
    totalCharacters: boundedCount,
    typedCharacters: boundedCount,
    correctCharacters: boundedCount,
    incorrectCharacters: boundedCount,
    missedCharacters: boundedCount,
    extraCharacters: boundedCount,
    totalErrors: boundedCount,
    correctWords: boundedCount,
    totalReferenceCharacters: boundedCount,

    // Duration and pace
    durationSeconds: {
      type: Number,
      required: true,
      min: 0,
      max: 7200,
    },

    averageWpm: {
      type: Number,
      min: 0,
      max: 1000,
      default: null,
    },

    peakWpm: {
      type: Number,
      min: 0,
      max: 1000,
      default: null,
    },

    lowestWpm: {
      type: Number,
      min: 0,
      max: 1000,
      default: null,
    },

    averageAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // Consistency and fatigue analysis
    consistencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    speedVariation: {
      type: Number,
      min: 0,
      default: null,
    },

    fatigueIndicator: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // Qualification
    targetWpm: {
      type: Number,
      min: 0,
      max: 1000,
      default: null,
    },

    minimumWpm: {
      type: Number,
      min: 0,
      max: 1000,
      default: null,
    },

    minimumAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    marksObtained: {
      type: Number,
      min: 0,
      default: null,
    },

    maximumMarks: {
      type: Number,
      min: 0,
      default: null,
    },

    passingMarks: {
      type: Number,
      min: 0,
      default: null,
    },

    passed: {
      type: Boolean,
      required: true,
    },

    qualificationOnly: {
      type: Boolean,
      default: false,
    },

    qualificationReasons: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 500,
        },
      ],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_QUALIFICATION_REASONS,
        message: "Too many qualification reasons.",
      },
    },

    // Graph datasets
    timeline: {
      type: [resultTimelineSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_TIMELINE_POINTS,
        message: "Too many result timeline points.",
      },
    },

    errorDistribution: {
      type: [errorCategorySchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_ERROR_CATEGORIES,
        message: "Too many error categories.",
      },
    },

    performanceSegments: {
      type: [performanceSegmentSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_SEGMENTS,
        message: "Too many performance segments.",
      },
    },

    skillProfile: {
      type: [skillScoreSchema],
      default: [],
      validate: {
        validator: (items) =>
          items.length <= 20 &&
          new Set(items.map((item) => item.skill)).size === items.length,
        message: "Skill profile contains duplicate or excessive skills.",
      },
    },

    characterAnalysis: {
      type: [characterAnalysisSchema],
      default: undefined,
      validate: {
        validator: (items) => items.length <= MAX_CHARACTER_ANALYSIS,
        message: "Character analysis exceeds the allowed limit.",
      },
    },

    improvementPlan: {
      type: [improvementRecommendationSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_RECOMMENDATIONS,
        message: "Too many improvement recommendations.",
      },
    },

    reportVersion: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
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

/* =====================================================
   TYPING ATTEMPT
===================================================== */

const typingAttemptSchema = new Schema(
  {
    candidate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    exam: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      required: true,
      immutable: true,
    },

    examSnapshot: {
      type: examSnapshotSchema,
      required: true,
      immutable: true,
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "expired", "evaluated", "cancelled"],
      default: "in_progress",
      required: true,
      index: true,
    },

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

    typedText: {
      type: String,
      default: "",
      maxlength: MAX_PASSAGE_LENGTH,
    },

    timeline: {
      type: [typingTimelineMetricSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_TIMELINE_POINTS,
        message: "Too many attempt timeline points.",
      },
    },

    // Embedded result report.
    result: {
      type: typingResultSchema,
      default: undefined,
    },

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
    strict: true,
    minimize: false,
  },
);

/* =====================================================
   DOCUMENT VALIDATION
===================================================== */

typingAttemptSchema.pre("validate", function () {
  if (this.startedAt && this.deadlineAt && this.deadlineAt <= this.startedAt) {
    this.invalidate(
      "deadlineAt",
      "Deadline must be later than the start time.",
    );
  }

  if (this.status === "evaluated" && !this.result) {
    this.invalidate("result", "An evaluated attempt must contain a result.");
  }

  if (this.status === "evaluated" && !this.evaluatedAt) {
    this.invalidate(
      "evaluatedAt",
      "An evaluated attempt must have an evaluation timestamp.",
    );
  }

  if (this.status === "submitted" && !this.submittedAt) {
    this.invalidate(
      "submittedAt",
      "A submitted attempt must have a submission timestamp.",
    );
  }

  if (this.result) {
    if (this.result.correctCharacters > this.result.totalCharacters) {
      this.invalidate(
        "result.correctCharacters",
        "Correct characters cannot exceed total characters.",
      );
    }

    if (this.result.incorrectCharacters > this.result.totalCharacters) {
      this.invalidate(
        "result.incorrectCharacters",
        "Incorrect characters cannot exceed total characters.",
      );
    }

    if (
      this.result.correctCharacters + this.result.incorrectCharacters >
      this.result.totalCharacters
    ) {
      this.invalidate(
        "result.totalCharacters",
        "Correct and incorrect characters cannot exceed total characters combined.",
      );
    }

    if (
      this.result.maximumMarks != null &&
      this.result.marksObtained != null &&
      this.result.marksObtained > this.result.maximumMarks
    ) {
      this.invalidate(
        "result.marksObtained",
        "Marks obtained cannot exceed maximum marks.",
      );
    }

    if (
      this.result.maximumMarks != null &&
      this.result.passingMarks != null &&
      this.result.passingMarks > this.result.maximumMarks
    ) {
      this.invalidate(
        "result.passingMarks",
        "Passing marks cannot exceed maximum marks.",
      );
    }

    for (const [index, point] of (this.result.timeline || []).entries()) {
      if (point.elapsedSeconds > this.result.durationSeconds) {
        this.invalidate(
          `result.timeline.${index}.elapsedSeconds`,
          "Result timeline exceeds the attempt duration.",
        );
      }
    }

    for (const [index, segment] of (
      this.result.performanceSegments || []
    ).entries()) {
      if (
        segment.startElapsedSeconds != null &&
        segment.endElapsedSeconds != null &&
        segment.endElapsedSeconds < segment.startElapsedSeconds
      ) {
        this.invalidate(
          `result.performanceSegments.${index}.endElapsedSeconds`,
          "Segment end must not precede its start.",
        );
      }
    }
  }

  for (const [index, metric] of (this.timeline || []).entries()) {
    if (metric.elapsedSeconds > this.examSnapshot.durationSeconds) {
      this.invalidate(
        `timeline.${index}.elapsedSeconds`,
        "Timeline elapsed time cannot exceed exam duration.",
      );
    }

    if (metric.correctCharacters > metric.typedCharacters) {
      this.invalidate(
        `timeline.${index}.correctCharacters`,
        "Correct characters cannot exceed typed characters.",
      );
    }
  }
});

/* =====================================================
   INDEXES
===================================================== */

typingAttemptSchema.index({
  candidate: 1,
  createdAt: -1,
});

typingAttemptSchema.index({
  exam: 1,
  createdAt: -1,
});

typingAttemptSchema.index({
  candidate: 1,
  exam: 1,
  status: 1,
});

typingAttemptSchema.index({
  status: 1,
  deadlineAt: 1,
});

/* =====================================================
   MODEL EXPORT
===================================================== */

const TypingAttempt =
  models.TypingAttempt || model("TypingAttempt", typingAttemptSchema);

export default TypingAttempt;
