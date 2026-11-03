import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const typingAttemptSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    examId: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      default: null,
    },

    passageId: {
      type: Schema.Types.ObjectId,
      ref: "TypingPassage",
      default: null,
    },

    attemptType: {
      type: String,
      enum: ["PRACTICE", "MOCK", "OFFICIAL"],
      default: "PRACTICE",
    },

    language: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    examType: {
      type: String,
      enum: ["WORD", "CHARACTER", "HYBRID"],
      required: true,
    },

    // Original passage saved at attempt creation.
    originalText: {
      type: String,
      required: true,
    },

    passageSnapshot: {
      contentHash: String,
      version: Number,
      title: String,
    },

    // Exact exam/configuration/policy data used for this attempt.
    configSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },

    typedText: {
      type: String,
      default: "",
      maxlength: 100000,
    },

    timing: {
      startedAt: {
        type: Date,
        required: true,
      },

      submittedAt: {
        type: Date,
        default: null,
      },

      // Allowed examination duration.
      durationSeconds: {
        type: Number,
        required: true,
        min: 1,
      },

      // Actual server-measured elapsed duration.
      elapsedSeconds: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    progressVersion: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "IN_PROGRESS",
        "SUBMITTED",
        "EVALUATING",
        "COMPLETED",
        "EVALUATION_FAILED",
        "CANCELLED",
      ],
      default: "IN_PROGRESS",
    },

    evaluation: {
      status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
        default: "PENDING",
      },

      attempts: {
        type: Number,
        default: 0,
      },

      startedAt: Date,
      completedAt: Date,

      errorMessage: {
        type: String,
        default: "",
      },
    },

    submission: {
      idempotencyKey: {
        type: String,
        default: null,
      },

      submittedTextHash: {
        type: String,
        default: null,
      },
    },

    resultId: {
      type: Schema.Types.ObjectId,
      ref: "TypingResult",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

typingAttemptSchema.index({
  userId: 1,
  createdAt: -1,
});

typingAttemptSchema.index({
  userId: 1,
  examId: 1,
  createdAt: -1,
});

typingAttemptSchema.index({
  status: 1,
  updatedAt: 1,
});

export default models.TypingAttempt ||
  model("TypingAttempt", typingAttemptSchema);
