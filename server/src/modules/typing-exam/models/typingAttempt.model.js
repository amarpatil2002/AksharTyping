import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const passageSnapshotSchema = new Schema(
  {
    contentHash: {
      type: String,
      required: true,
      trim: true,
    },

    version: {
      type: Number,
      required: true,
      min: 0,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
  },
  { _id: false },
);

const timingSchema = new Schema(
  {
    startedAt: {
      type: Date,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
    },

    elapsedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

const evaluationSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    errorMessage: {
      type: String,
      default: null,
      maxlength: 2000,
    },
  },
  { _id: false },
);

const submissionSchema = new Schema(
  {
    idempotencyKey: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },

    submittedTextHash: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false },
);

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
      required: true,
      index: true,
    },

    passageId: {
      type: Schema.Types.ObjectId,
      ref: "TypingPassage",
      required: true,
      index: true,
    },

    attemptType: {
      type: String,
      enum: ["OFFICIAL", "PRACTICE"],
      default: "OFFICIAL",
      required: true,
      index: true,
    },

    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    examType: {
      type: String,
      enum: ["WORD", "CHARACTER", "HYBRID"],
      required: true,
      index: true,
    },

    /*
     * Snapshot of the policy used for this attempt.
     *
     * These values must NOT be reconstructed from
     * the current exam configuration during evaluation.
     */
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

    /*
     * Immutable passage content used for evaluation.
     *
     * The engine evaluates against this snapshot,
     * not against a passage that may have changed later.
     */
    originalText: {
      type: String,
      required: true,
      maxlength: 50000,
    },

    passageSnapshot: {
      type: passageSnapshotSchema,
      required: true,
    },

    /*
     * Latest submitted/progress text.
     */
    typedText: {
      type: String,
      default: "",
      maxlength: 100000,
    },

    timing: {
      type: timingSchema,
      required: true,
    },

    /*
     * Optimistic concurrency version for progress saves.
     */
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
        "EXPIRED",
      ],
      default: "IN_PROGRESS",
      required: true,
      index: true,
    },

    evaluation: {
      type: evaluationSchema,
      default: () => ({
        status: "PENDING",
        attempts: 0,
      }),
    },

    submission: {
      type: submissionSchema,
      default: () => ({}),
    },

    /*
     * Filled only after TypingResult is successfully
     * created.
     */
    resultId: {
      type: Schema.Types.ObjectId,
      ref: "TypingResult",
      default: null,
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,

    /*
     * Do not expose/use Mongoose __v as the application
     * progress version. progressVersion is explicit.
     */
    versionKey: false,
  },
);

/*
 * Fast lookup for a user's attempts.
 */
typingAttemptSchema.index({
  userId: 1,
  examId: 1,
  createdAt: -1,
});

typingAttemptSchema.index({
  userId: 1,
  status: 1,
  createdAt: -1,
});

typingAttemptSchema.index({
  examId: 1,
  status: 1,
  createdAt: -1,
});

/*
 * Prevent more than one active attempt for the same
 * user/exam combination.
 *
 * Completed/failed/cancelled/expired attempts are
 * allowed to remain as historical records.
 */
typingAttemptSchema.index(
  {
    userId: 1,
    examId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: ["IN_PROGRESS", "SUBMITTED", "EVALUATING"],
      },
    },
  },
);

const TypingAttempt =
  models.TypingAttempt || model("TypingAttempt", typingAttemptSchema);

export default TypingAttempt;
