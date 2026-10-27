import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const intervalMetricSchema = new Schema(
  {
    elapsedSeconds: {
      type: Number,
      required: true,
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

    missedCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    extraCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    grossWpm: {
      type: Number,
      default: 0,
      min: 0,
    },

    netWpm: {
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

    errorsInInterval: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false, strict: "throw" },
);

const errorBreakdownSchema = new Schema(
  {
    incorrectCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    missedCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    extraCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctedMistakes: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalErrors: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false, strict: "throw" },
);

const resultSchema = new Schema(
  {
    grossWpm: {
      type: Number,
      default: 0,
      min: 0,
    },

    netWpm: {
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

    correctCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    typedCharacters: {
      type: Number,
      default: 0,
      min: 0,
    },

    errorBreakdown: {
      type: errorBreakdownSchema,
      default: () => ({}),
    },

    passed: {
      type: Boolean,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "passed", "failed"],
      default: "pending",
    },

    evaluatedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false, strict: "throw" },
);

const typingAttemptSchema = new Schema(
  {
    exam: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      required: true,
      immutable: true,
      index: true,
    },

    candidate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    // Snapshot preserves the exact configuration used for this attempt.
    examSnapshot: {
      title: {
        type: String,
        required: true,
      },

      language: {
        type: String,
        enum: ["en", "hi", "mr"],
        required: true,
      },

      passageText: {
        type: String,
        required: true,
      },

      durationSeconds: {
        type: Number,
        required: true,
        min: 60,
      },

      targetWpm: {
        type: Number,
        required: true,
        min: 1,
      },

      instructions: {
        type: [String],
        default: [],
      },

      evaluationRules: {
        type: Schema.Types.Mixed,
        required: true,
      },

      examInterface: {
        type: Schema.Types.Mixed,
        required: true,
      },

      configVersion: {
        type: Number,
        default: 1,
      },
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "auto_submitted", "abandoned"],
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
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    elapsedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    typedText: {
      type: String,
      default: "",
    },

    // Periodic metrics for speed and accuracy charts.
    timeline: {
      type: [intervalMetricSchema],
      default: [],
    },

    result: {
      type: resultSchema,
      default: () => ({}),
    },

    // Used to make submission retries safe.
    submissionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    optimisticConcurrency: true,
  },
);

// One attempt cannot have duplicate elapsed-time timeline points.
typingAttemptSchema.pre("validate", function () {
  if (!Array.isArray(this.timeline)) return;

  const elapsedTimes = this.timeline.map((point) => point.elapsedSeconds);

  if (new Set(elapsedTimes).size !== elapsedTimes.length) {
    this.invalidate(
      "timeline",
      "Timeline points must have unique elapsed times.",
    );
  }

  if (this.submittedAt && this.startedAt) {
    if (this.submittedAt < this.startedAt) {
      this.invalidate(
        "submittedAt",
        "Submission time cannot precede the start time.",
      );
    }
  }
});

typingAttemptSchema.index({
  candidate: 1,
  exam: 1,
  createdAt: -1,
});

typingAttemptSchema.index({
  exam: 1,
  status: 1,
});

const TypingAttempt =
  models.TypingAttempt || model("TypingAttempt", typingAttemptSchema);

export default TypingAttempt;
