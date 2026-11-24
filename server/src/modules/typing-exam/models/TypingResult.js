const mongoose = require("mongoose");
const { EXAM_TYPES } = require("../config/typing.constants");

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "TypingAttempt", required: true, unique: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "TypingExam", required: true, index: true },
  passageId: { type: mongoose.Schema.Types.ObjectId, ref: "TypingPassage", required: true },
  policyId: { type: String, required: true, index: true },
  policyVersion: { type: String, required: true },
  engineVersion: { type: String, required: true },
  examType: { type: String, enum: Object.values(EXAM_TYPES), required: true },
  language: { type: String, required: true },
  elapsedSeconds: { type: Number, required: true, min: 0 },

  coreResult: {
    words: {
      expected: { type: Number, required: true, min: 0 },
      typed: { type: Number, required: true, min: 0 },
      correct: { type: Number, required: true, min: 0 },
      incorrect: { type: Number, required: true, min: 0 },
      missing: { type: Number, required: true, min: 0 },
      extra: { type: Number, required: true, min: 0 },
      errors: { type: Number, required: true, min: 0 },
    },
    metrics: {
      grossWpm: { type: Number, required: true, min: 0 },
      netWpm: { type: Number, required: true, min: 0 },
      accuracyPercentage: { type: Number, required: true, min: 0, max: 100 },
      errorPercentage: { type: Number, required: true, min: 0, max: 100 },
      elapsedSeconds: { type: Number, required: true, min: 0 },
      elapsedMinutes: { type: Number, required: true, min: 0 },
    },
  },

  officialResult: {
    available: { type: Boolean, required: true },
    status: { type: String, required: true },
    marks: { type: Number, min: 0, default: null },
    maximumMarks: { type: Number, min: 0, default: null },
    qualified: { type: Boolean, default: null },
    reason: { type: String },
    criteria: { type: mongoose.Schema.Types.Mixed, default: null },
    formulaVersion: { type: String, required: true },
  },

  officialCalculationAvailable: { type: Boolean, required: true },
  finalScore: { type: Number, min: 0, default: null },
  qualified: { type: Boolean, default: null },
}, { timestamps: true, versionKey: false });

schema.index({ userId: 1, createdAt: -1 });
schema.index({ examId: 1, createdAt: -1 });

module.exports = mongoose.model("TypingResult", schema);
