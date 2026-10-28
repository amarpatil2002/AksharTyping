import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const MAX_PASSAGE_LENGTH = 50_000;
const MAX_TIMELINE_POINTS = 5_000;

/* =====================================================
   FROZEN EXAM CONFIGURATION SNAPSHOT

   Built from TypingExamConfig when an attempt starts.
   Never update this snapshot when the config changes.
===================================================== */

const examSnapshotSchema = new Schema(
  {
    config: {
      type: Schema.Types.ObjectId,
      ref: "TypingExamConfig",
      required: true,
      immutable: true,
    },

    configVersion: {
      type: Number,
      required: true,
      min: 1,
      immutable: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    language: {
      type: String,
      enum: ["en", "hi", "mr"],
      required: true,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 10,
      max: 7200,
    },

    targetWpm: {
      type: Number,
      min: 0,
      max: 500,
      default: 40,
    },

    instructions: {
      type: [String],
      default: [],
      validate: {
        validator: (items) =>
          items.length <= 30 && items.every((item) => item.length <= 500),
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

    // Actual reference passage selected for this attempt.
    passageText: {
      type: String,
      required: true,
      maxlength: MAX_PASSAGE_LENGTH,
    },
  },
  {
    _id: false,
    id: false,
    strict: true,
    minimize: false,
  },
);

/* =====================================================
   TIMELINE METRICS
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
   TYPING ATTEMPT
===================================================== */

const typingAttemptSchema = new Schema(
  {
    candidate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    // The concrete exam instance being attempted.
    exam: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      required: true,
      immutable: true,
      index: true,
    },

    // Frozen configuration and passage used by this attempt.
    examSnapshot: {
      type: examSnapshotSchema,
      required: true,
      immutable: true,
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "expired", "evaluated", "cancelled"],
      required: true,
      default: "in_progress",
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

    // Collected according to the frozen analytics configuration.
    timeline: {
      type: [typingTimelineMetricSchema],
      default: [],
      validate: {
        validator: (items) => items.length <= MAX_TIMELINE_POINTS,
        message: "Too many attempt timeline points.",
      },
    },

    // Separate TypingResult document; no embedded report.
    result: {
      type: Schema.Types.ObjectId,
      ref: "TypingResult",
      default: null,
    },

    // Idempotency key supplied for a submission request.
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

  if (!this.examSnapshot) return;

  if (
    this.deadlineAt &&
    this.startedAt &&
    this.examSnapshot.durationSeconds > 0
  ) {
    const maximumDeadline =
      this.startedAt.getTime() + this.examSnapshot.durationSeconds * 1000;

    if (this.deadlineAt.getTime() !== maximumDeadline) {
      this.invalidate(
        "deadlineAt",
        "Deadline must match the configured exam duration.",
      );
    }
  }

  if (this.status === "submitted" && !this.submittedAt) {
    this.invalidate(
      "submittedAt",
      "A submitted attempt must have a submission timestamp.",
    );
  }

  if (this.status === "evaluated" && !this.result) {
    this.invalidate(
      "result",
      "An evaluated attempt must reference a result document.",
    );
  }

  if (this.status === "evaluated" && !this.evaluatedAt) {
    this.invalidate(
      "evaluatedAt",
      "An evaluated attempt must have an evaluation timestamp.",
    );
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
