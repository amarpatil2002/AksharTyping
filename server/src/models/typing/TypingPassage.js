import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const typingPassageSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      required: true,
      immutable: true,
    },

    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50000,
      validate: {
        validator(value) {
          return typeof value === "string" && value.trim().length > 0;
        },
        message: "Passage content cannot be empty.",
      },
    },

    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

// ============================================================
// AUTOMATIC WORD COUNT
// ============================================================

typingPassageSchema.pre("validate", function () {
  const content = this.content?.trim() ?? "";

  this.wordCount = content ? content.split(/\s+/u).filter(Boolean).length : 0;
});

// ============================================================
// INDEXES
// ============================================================

// Efficient candidate passage selection.
typingPassageSchema.index({
  examId: 1,
  language: 1,
  status: 1,
  difficulty: 1,
});

// Efficient admin passage listing.
typingPassageSchema.index({
  examId: 1,
  createdAt: -1,
});

export const TypingPassage =
  models.TypingPassage || model("TypingPassage", typingPassageSchema);

export default TypingPassage;
