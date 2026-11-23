import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const typingExamSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 220,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    authority: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    examCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 80,
      default: "",
    },

    postName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    recruitmentCycle: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    examType: {
      type: String,
      required: true,
      enum: ["WORD", "CHARACTER", "HYBRID"],
    },

    language: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    policyId: {
      type: String,
      required: true,
      trim: true,
    },

    policyVersion: {
      type: String,
      trim: true,
      default: null,
    },

    formulaVersion: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },

    isOfficial: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

typingExamSchema.index({
  authority: 1,
  examType: 1,
  language: 1,
  status: 1,
});

export const TypingExam =
  models.TypingExam || model("TypingExam", typingExamSchema);
