import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const typingPassageSchema = new Schema(
  {
    examId: {
      type: Schema.Types.ObjectId,
      ref: "TypingExam",
      required: true,
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
      validate: {
        validator(value) {
          return value.length > 0;
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
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Automatically calculate whitespace-separated word count.
typingPassageSchema.pre("validate", function () {
  this.wordCount = this.content
    ? this.content.trim().split(/\s+/u).filter(Boolean).length
    : 0;
});

// Efficient passage selection for an exam.
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
