import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const typingTimelineSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attemptId: {
      type: Schema.Types.ObjectId,
      ref: "TypingAttempt",
      required: true,
    },

    examId: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      default: null,
    },

    language: {
      type: String,
      required: true,
      lowercase: true,
    },

    examType: {
      type: String,
      enum: ["WORD", "CHARACTER", "HYBRID"],
      required: true,
    },

    // Cumulative elapsed time from attempt start.
    elapsedSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    // Sampling interval used by the frontend/backend.
    intervalSeconds: {
      type: Number,
      default: 5,
      min: 1,
    },

    // Cumulative word statistics
    wordsTyped: { type: Number, default: 0 },
    correctWords: { type: Number, default: 0 },

    grossWpm: { type: Number, default: null },
    netWpm: { type: Number, default: null },

    // Cumulative character statistics
    charactersTyped: { type: Number, default: 0 },
    correctCharacters: { type: Number, default: 0 },

    grossCpm: { type: Number, default: null },
    netCpm: { type: Number, default: null },

    // Accuracy
    wordAccuracy: { type: Number, default: null },
    characterAccuracy: { type: Number, default: null },
    overallAccuracy: { type: Number, default: null },

    // Mistakes
    totalMistakes: { type: Number, default: 0 },
    fullMistakes: { type: Number, default: 0 },
    halfMistakes: { type: Number, default: 0 },

    // Activity
    activeSeconds: { type: Number, default: 0 },
    pauseSeconds: { type: Number, default: 0 },

    isPaused: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

// Prevent duplicate snapshots for the same elapsed second.
typingTimelineSchema.index(
  {
    attemptId: 1,
    elapsedSeconds: 1,
  },
  {
    unique: true,
  },
);

typingTimelineSchema.index({
  userId: 1,
  createdAt: -1,
});

export default models.TypingTimeline ||
  model("TypingTimeline", typingTimelineSchema);
