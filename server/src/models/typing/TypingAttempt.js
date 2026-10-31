import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const timelineSchema = new Schema(
  {
    elapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    typedCharacters: {
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
  { _id: false },
);

const resultSchema = new Schema(
  {
    totalCharacters: {
      type: Number,
      default: 0,
    },

    correctCharacters: {
      type: Number,
      default: 0,
    },

    incorrectCharacters: {
      type: Number,
      default: 0,
    },

    missedCharacters: {
      type: Number,
      default: 0,
    },

    extraCharacters: {
      type: Number,
      default: 0,
    },

    totalErrors: {
      type: Number,
      default: 0,
    },

    grossWpm: {
      type: Number,
      default: 0,
    },

    netWpm: {
      type: Number,
      default: 0,
    },

    accuracy: {
      type: Number,
      default: 0,
    },

    marks: {
      type: Number,
      default: 0,
    },

    maximumMarks: {
      type: Number,
      default: 0,
    },

    passed: {
      type: Boolean,
      default: false,
    },

    evaluatedAt: {
      type: Date,
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
    },

    // Preserve the exam configuration used for this attempt.
    configSnapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },

    // Preserve the exact reference passage.
    passageSnapshot: {
      type: String,
      required: true,
    },

    typedText: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "evaluated", "expired"],
      default: "in_progress",
      index: true,
    },

    startedAt: {
      type: Date,
      required: true,
    },

    deadlineAt: {
      type: Date,
      required: true,
    },

    submittedAt: {
      type: Date,
    },

    submissionId: {
      type: String,
    },

    timeline: {
      type: [timelineSchema],
      default: [],
    },

    result: {
      type: resultSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

typingAttemptSchema.index({
  userId: 1,
  examId: 1,
  createdAt: -1,
});

typingAttemptSchema.index({
  status: 1,
  deadlineAt: 1,
});

typingAttemptSchema.index(
  { submissionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      submissionId: { $type: "string" },
    },
  },
);

export const TypingAttempt =
  models.TypingAttempt || model("TypingAttempt", typingAttemptSchema);

export default TypingAttempt;
