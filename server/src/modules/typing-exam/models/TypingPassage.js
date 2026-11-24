const mongoose = require("mongoose");
const { PASSAGE_STATUS } = require("../config/typing.constants");

const schema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "TypingExam", required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
  text: { type: String, required: true, trim: true, minlength: 1, maxlength: 50000 },
  language: { type: String, required: true, enum: ["english", "marathi"] },
  wordCount: { type: Number, required: true, min: 1 },
  status: { type: String, enum: Object.values(PASSAGE_STATUS), default: PASSAGE_STATUS.DRAFT, index: true },
}, { timestamps: true, versionKey: false });

schema.index({ examId: 1, status: 1 });

module.exports = mongoose.model("TypingPassage", schema);
