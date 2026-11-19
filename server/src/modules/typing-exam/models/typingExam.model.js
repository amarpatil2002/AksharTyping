import mongoose from "mongoose";
import { EXAM_TYPES, LANGUAGES } from "../constants/typing.constants.js";
const { Schema, model, models } = mongoose;
const schema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, trim: true, lowercase: true, maxlength: 200 },
    examCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 100,
    },
    authority: { type: String, required: true, trim: true, maxlength: 200 },
    postName: { type: String, required: true, trim: true, maxlength: 200 },
    recruitmentCycle: { type: String, trim: true, maxlength: 100 },
    examType: { type: String, enum: EXAM_TYPES, required: true },
    language: { type: String, enum: LANGUAGES, required: true },
    description: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);
schema.index({ slug: 1 }, { unique: true, sparse: true });
schema.index({ authority: 1, status: 1 });
export default models.TypingExam || model('TypingExam',schema);
