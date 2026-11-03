import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const typingResultSchema = new Schema(
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
      unique: true,
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

    attemptType: {
      type: String,
      enum: ["PRACTICE", "MOCK", "OFFICIAL"],
      default: "PRACTICE",
    },

    // WORD examination metrics.
    wordMetrics: {
      totalWords: { type: Number, default: null },
      wordsTyped: { type: Number, default: null },
      correctWords: { type: Number, default: null },
      incorrectWords: { type: Number, default: null },
      grossWpm: { type: Number, default: null },
      netWpm: { type: Number, default: null },
      accuracy: { type: Number, default: null },
    },

    // CHARACTER examination metrics.
    characterMetrics: {
      totalCharacters: { type: Number, default: null },
      charactersTyped: { type: Number, default: null },
      correctCharacters: { type: Number, default: null },
      incorrectCharacters: { type: Number, default: null },
      grossCpm: { type: Number, default: null },
      netCpm: { type: Number, default: null },
      grossKdph: { type: Number, default: null },
      netKdph: { type: Number, default: null },
      accuracy: { type: Number, default: null },
    },

    // Overall display metrics. For HYBRID, use MIXED
    // and retain the individual metrics above.
    performance: {
      grossSpeed: { type: Number, default: null },
      netSpeed: { type: Number, default: null },

      measurementUnit: {
        type: String,
        enum: ["WPM", "CPM", "KDPH", "MIXED", null],
        default: null,
      },

      accuracy: { type: Number, default: null },
      errorPercentage: { type: Number, default: null },
    },

    mistakes: {
      fullMistakes: { type: Number, default: 0 },
      halfMistakes: { type: Number, default: 0 },
      weightedMistakes: { type: Number, default: 0 },
      finalMistakes: { type: Number, default: 0 },

      substitutions: { type: Number, default: 0 },
      omissions: { type: Number, default: 0 },
      insertions: { type: Number, default: 0 },
      transpositions: { type: Number, default: 0 },

      spellingErrors: { type: Number, default: 0 },
      spacingErrors: { type: Number, default: 0 },
      punctuationErrors: { type: Number, default: 0 },
      caseErrors: { type: Number, default: 0 },
      otherErrors: { type: Number, default: 0 },
    },

    timing: {
      durationSeconds: { type: Number, default: 0 },
      elapsedSeconds: { type: Number, default: 0 },
      activeSeconds: { type: Number, default: null },
      pauseSeconds: { type: Number, default: null },
    },

    scoring: {
      method: {
        type: String,
        enum: [
          "NET_SPEED",
          "ACCURACY",
          "MARKS",
          "QUALIFYING",
          "SCALED_SCORE",
          "CUSTOM",
        ],
        default: "CUSTOM",
      },

      marksObtained: { type: Number, default: null },
      maximumMarks: { type: Number, default: null },
      marksDeducted: { type: Number, default: null },
      scaledScore: { type: Number, default: null },

      qualified: {
        type: Boolean,
        default: null,
      },

      status: {
        type: String,
        enum: ["PASS", "FAIL", "PENDING", "NOT_APPLICABLE"],
        default: "PENDING",
      },

      qualificationDetails: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },

    evaluation: {
      evaluator: {
        type: String,
        default: "",
      },

      policyVersion: {
        type: String,
        default: "1.0",
      },

      calculationVersion: {
        type: String,
        default: "1.0",
      },

      reportVersion: {
        type: Number,
        default: 1,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

typingResultSchema.index({
  userId: 1,
  createdAt: -1,
});

typingResultSchema.index({
  userId: 1,
  examId: 1,
  createdAt: -1,
});

typingResultSchema.index({
  userId: 1,
  language: 1,
  examType: 1,
  createdAt: -1,
});

export default models.TypingResult || model("TypingResult", typingResultSchema);
