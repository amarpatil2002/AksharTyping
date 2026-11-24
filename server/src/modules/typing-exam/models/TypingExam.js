const mongoose = require("mongoose");
const { EXAM_STATUS, EXAM_TYPES } = require("../config/typing.constants");

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
  code: {
    type: String, required: true, unique: true, uppercase: true, trim: true,
    minlength: 3, maxlength: 100, match: /^[A-Z0-9_]+$/,
  },
  policyId: { type: String, required: true, trim: true, index: true },
  policyVersion: { type: String, required: true },
  language: { type: String, required: true, enum: ["english", "marathi"] },
  examType: { type: String, required: true, enum: Object.values(EXAM_TYPES) },
  durationSeconds: { type: Number, required: true, min: 1, max: 3600 },
  status: { type: String, enum: Object.values(EXAM_STATUS), default: EXAM_STATUS.DRAFT, index: true },
  description: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true, versionKey: false });

schema.index({ status: 1, language: 1 });

module.exports = mongoose.model("TypingExam", schema);
