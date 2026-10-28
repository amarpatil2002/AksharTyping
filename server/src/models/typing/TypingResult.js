import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const MAX_GRAPH_POINTS = 5000;
const MAX_REASONS = 100;

/* =====================================================
   SPEED GRAPH
===================================================== */

const speedGraphPointSchema = new Schema(
  {
    elapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
      max: 7200,
    },

    wpm: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
  },
  {
    _id: false,
    id: false,
    strict: "throw",
  },
);

/* =====================================================
   RESULT SUMMARY
===================================================== */

const summarySchema = new Schema(
  {
    durationSeconds: {
      type: Number,
      required: true,
      min: 0,
      max: 7200,
    },

    grossWpm: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },

    netWpm: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },

    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    totalTypedCharacters: {
      type: Number,
      required: true,
      min: 0,
    },

    correctCharacters: {
      type: Number,
      required: true,
      min: 0,
    },

    incorrectCharacters: {
      type: Number,
      required: true,
      min: 0,
    },

    missedCharacters: {
      type: Number,
      required: true,
      min: 0,
    },

    extraCharacters: {
      type: Number,
      required: true,
      min: 0,
    },

    totalErrors: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
    id: false,
    strict: "throw",
  },
);

/* =====================================================
   QUALIFICATION
===================================================== */

const qualificationSchema = new Schema(
  {
    passed: {
      type: Boolean,
      required: true,
    },

    minimumWpm: {
      type: Number,
      default: 0,
      min: 0,
    },

    minimumAccuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    minimumCorrectCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    minimumCorrectWords: {
      type: Number,
      default: 0,
      min: 0,
    },

    reasons: {
      type: [String],
      default: [],
      validate: {
        validator: (items) =>
          items.length <= MAX_REASONS &&
          items.every((item) => item.length <= 500),
        message: "Invalid qualification reasons.",
      },
    },
  },
  {
    _id: false,
    id: false,
    strict: "throw",
  },
);

/* =====================================================
   EXAM DETAILS
===================================================== */

const examDetailsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    language: {
      type: String,
      enum: ["en", "hi", "mr"],
      required: true,
    },

    configVersion: {
      type: Number,
      required: true,
      min: 1,
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
  },
  {
    _id: false,
    id: false,
    strict: "throw",
  },
);

/* =====================================================
   RESULT REPORT
===================================================== */

const reportSchema = new Schema(
  {
    summary: {
      type: summarySchema,
      required: true,
    },

    outcome: {
      passed: {
        type: Boolean,
        required: true,
      },

      reasons: {
        type: [String],
        default: [],
      },
    },

    evaluationStrategy: {
      type: String,
      enum: [
        "gross_net_wpm",
        "correct_words",
        "error_penalty",
        "qualification_only",
        "custom",
      ],
      required: true,
    },

    qualification: {
      type: qualificationSchema,
      required: true,
    },

    graph: {
      speedTimeline: {
        type: [speedGraphPointSchema],
        default: [],
        validate: {
          validator: (items) => items.length <= MAX_GRAPH_POINTS,
          message: "Too many speed graph points.",
        },
      },
    },

    examDetails: {
      type: examDetailsSchema,
      required: true,
    },

    reportVersion: {
      type: Number,
      required: true,
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

/* =====================================================
   TYPING RESULT
===================================================== */

const typingResultSchema = new Schema(
  {
    // One final result per typing attempt.
    attempt: {
      type: Schema.Types.ObjectId,
      ref: "TypingAttempt",
      required: true,
      immutable: true,
    },

    candidate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    exam: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      required: true,
      immutable: true,
      index: true,
    },

    report: {
      type: reportSchema,
      required: true,
    },

    status: {
      type: String,
      enum: ["finalized", "voided"],
      default: "finalized",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
    strict: "throw",
    minimize: false,
  },
);

/* =====================================================
   INDEXES
===================================================== */

// Prevent duplicate results for the same attempt.
typingResultSchema.index({ attempt: 1 }, { unique: true });

// Candidate result history.
typingResultSchema.index({
  candidate: 1,
  createdAt: -1,
});

// Results for a particular exam.
typingResultSchema.index({
  exam: 1,
  createdAt: -1,
});

const TypingResult =
  models.TypingResult || model("TypingResult", typingResultSchema);

export default TypingResult;
