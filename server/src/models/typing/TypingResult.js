import mongoose from "mongoose";

const { Schema, model } = mongoose;

const typingResultSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "TypingSession",
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    examDefinitionId: {
      type: Schema.Types.ObjectId,
      ref: "ExamDefinition",
      required: true,
      index: true,
    },

    metrics: {
      elapsedSeconds: { type: Number, min: 0, required: true },
      typedCharacters: { type: Number, min: 0, required: true },
      referenceCharacters: { type: Number, min: 0, required: true },
      correctCharacters: { type: Number, min: 0, required: true },
      errors: { type: Number, min: 0, required: true },
      omissions: { type: Number, min: 0, default: 0 },
      insertions: { type: Number, min: 0, default: 0 },
      substitutions: { type: Number, min: 0, default: 0 },
      grossWpm: { type: Number, min: 0, required: true },
      netWpm: { type: Number, min: 0, default: null },
      accuracyPercent: { type: Number, min: 0, max: 100, required: true },
      completionPercent: { type: Number, min: 0, max: 100, required: true },
    },

    scoring: {
      status: {
        type: String,
        enum: ["provisional", "official_rules_verified"],
        default: "provisional",
      },

      ruleVersion: { type: Number, min: 1, default: null },
      totalMarks: { type: Number, min: 0, default: null },
      marksAwarded: { type: Number, min: 0, default: null },

      qualificationStatus: {
        type: String,
        enum: ["pass", "fail", "not_determined"],
        default: "not_determined",
      },

      breakdown: {
        type: [Schema.Types.Mixed],
        default: [],
      },

      explanation: {
        type: String,
        default: "Official scoring rules have not been verified.",
      },
    },

    telemetrySummary: {
      averageIntervalWpm: { type: Number, min: 0, default: null },
      peakIntervalWpm: { type: Number, min: 0, default: null },
      lowestIntervalWpm: { type: Number, min: 0, default: null },
      speedDropCount: { type: Number, min: 0, default: 0 },
      activeTypingSeconds: { type: Number, min: 0, default: null },
      pauseSeconds: { type: Number, min: 0, default: null },
    },
  },
  { timestamps: true },
);

typingResultSchema.index({ userId: 1, createdAt: -1 });
typingResultSchema.index({ userId: 1, examDefinitionId: 1, createdAt: -1 });

const TypingResult = model("TypingResult", typingResultSchema);

export default TypingResult;
