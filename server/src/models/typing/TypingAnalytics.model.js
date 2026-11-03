import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const typingAnalyticsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    language: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    examType: {
      type: String,
      enum: ["WORD", "CHARACTER", "HYBRID", "ALL"],
      default: "ALL",
    },

    totalTests: { type: Number, default: 0 },
    completedTests: { type: Number, default: 0 },

    practiceTests: { type: Number, default: 0 },
    mockTests: { type: Number, default: 0 },
    officialTests: { type: Number, default: 0 },

    totalPracticeSeconds: { type: Number, default: 0 },
    totalActiveSeconds: { type: Number, default: 0 },

    // Word statistics
    totalWordsTyped: { type: Number, default: 0 },
    totalCorrectWords: { type: Number, default: 0 },

    averageGrossWpm: { type: Number, default: null },
    averageNetWpm: { type: Number, default: null },

    bestGrossWpm: { type: Number, default: null },
    bestNetWpm: { type: Number, default: null },

    // Character statistics
    totalCharactersTyped: { type: Number, default: 0 },
    totalCorrectCharacters: { type: Number, default: 0 },

    averageGrossCpm: { type: Number, default: null },
    averageNetCpm: { type: Number, default: null },

    bestGrossCpm: { type: Number, default: null },
    bestNetCpm: { type: Number, default: null },

    averageGrossKdph: { type: Number, default: null },
    averageNetKdph: { type: Number, default: null },

    bestGrossKdph: { type: Number, default: null },
    bestNetKdph: { type: Number, default: null },

    // Accuracy
    averageWordAccuracy: { type: Number, default: null },
    averageCharacterAccuracy: { type: Number, default: null },

    // Only calculate when a consistent exam-level
    // accuracy definition is available.
    averageAccuracy: { type: Number, default: null },
    bestAccuracy: { type: Number, default: null },

    // Mistakes
    totalMistakes: { type: Number, default: 0 },
    totalFullMistakes: { type: Number, default: 0 },
    totalHalfMistakes: { type: Number, default: 0 },

    totalSpellingErrors: { type: Number, default: 0 },
    totalSpacingErrors: { type: Number, default: 0 },
    totalPunctuationErrors: { type: Number, default: 0 },

    // Qualification
    passedTests: { type: Number, default: 0 },
    failedTests: { type: Number, default: 0 },

    bestSpeedAttemptId: {
      type: Schema.Types.ObjectId,
      ref: "TypingAttempt",
      default: null,
    },

    bestAccuracyAttemptId: {
      type: Schema.Types.ObjectId,
      ref: "TypingAttempt",
      default: null,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

// One document per candidate, language and exam type.
typingAnalyticsSchema.index(
  {
    userId: 1,
    language: 1,
    examType: 1,
  },
  {
    unique: true,
  },
);

typingAnalyticsSchema.index({
  userId: 1,
  lastAttemptAt: -1,
});

export default models.TypingAnalytics ||
  model("TypingAnalytics", typingAnalyticsSchema);
