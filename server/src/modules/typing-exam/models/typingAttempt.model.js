import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
const schema = new Schema(
  {
    attemptId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    candidateId: { type: Schema.Types.ObjectId, required: true, index: true },
    examId: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      required: true,
      index: true,
    },
    examVersionId: {
      type: Schema.Types.ObjectId,
      ref: "TypingExamVersion",
      required: true,
      index: true,
    },
    passageId: {
      type: Schema.Types.ObjectId,
      ref: "TypingPassage",
      required: true,
    },
    language: { type: String, required: true },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    durationSeconds: { type: Number, min: 0 },
    typedText: { type: String, required: true, maxlength: 100000 },
    status: {
      type: String,
      enum: ["STARTED", "SUBMITTED", "EVALUATED", "INVALID", "EXPIRED"],
      default: "STARTED",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);
schema.index({ candidateId: 1, createdAt: -1 });
schema.index({ examVersionId: 1, status: 1 });
export default models.TypingAttempt || model("TypingAttempt", schema);
