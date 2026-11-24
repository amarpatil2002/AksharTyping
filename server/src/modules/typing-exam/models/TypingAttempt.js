const mongoose = require("mongoose");
const { ATTEMPT_STATUS, EVALUATION_STATUS } = require("../config/typing.constants");

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "TypingExam", required: true, index: true },
  passageId: { type: mongoose.Schema.Types.ObjectId, ref: "TypingPassage", required: true },
  policyId: { type: String, required: true, index: true },
  policyVersion: { type: String, required: true },
  originalText: { type: String, required: true },
  typedText: { type: String, default: "" },
  startedAt: { type: Date, required: true },
  submittedAt: { type: Date },
  status: { type: String, enum: Object.values(ATTEMPT_STATUS), default: ATTEMPT_STATUS.STARTED, index: true },
  submission: {
    idempotencyKey: { type: String },
    submittedTextHash: { type: String },
  },
  evaluation: {
    status: { type: String, enum: Object.values(EVALUATION_STATUS), default: EVALUATION_STATUS.NOT_STARTED },
    startedAt: Date,
    completedAt: Date,
    error: String,
  },
}, { timestamps: true, versionKey: false });

schema.index({ userId: 1, examId: 1, status: 1 });
schema.index({ userId: 1, "submission.idempotencyKey": 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("TypingAttempt", schema);
