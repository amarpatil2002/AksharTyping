import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const typingPassageSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    language: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      maxlength: 50000,
    },

    wordCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    characterCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "INACTIVE"],
      default: "DRAFT",
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

typingPassageSchema.index({
  examId: 1,
  language: 1,
  status: 1,
});

export const TypingPassage =
  models.TypingPassage ||
  model("TypingPassage", typingPassageSchema);
