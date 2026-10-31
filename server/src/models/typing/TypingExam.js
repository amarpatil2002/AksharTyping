import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const typingExamSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "en",
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
      default: 600,
    },

    targetWpm: {
      type: Number,
      min: 0,
      default: 30,
    },

    scoring: {
      method: {
        type: String,
        enum: ["standard", "net_wpm", "accuracy", "custom"],
        default: "standard",
      },

      wordLength: {
        type: Number,
        min: 1,
        default: 5,
      },

      minimumWpm: {
        type: Number,
        min: 0,
        default: 0,
      },

      minimumAccuracy: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      errorPenalty: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    instructions: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
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

typingExamSchema.index({
  status: 1,
  createdAt: -1,
});

export const TypingExam =
  models.TypingExam || model("TypingExam", typingExamSchema);

export default TypingExam;
