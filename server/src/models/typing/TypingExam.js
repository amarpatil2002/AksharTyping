import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const LANGUAGES = [
  "english",
  "assamese",
  "bengali",
  "bodo",
  "dogri",
  "gujarati",
  "hindi",
  "kannada",
  "kashmiri",
  "konkani",
  "maithili",
  "malayalam",
  "manipuri",
  "marathi",
  "nepali",
  "odia",
  "punjabi",
  "sanskrit",
  "santali",
  "sindhi",
  "tamil",
  "telugu",
  "urdu",
];

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
      enum: LANGUAGES,
      default: "english",
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

    // Maximum marks and passing criteria for this examination.
    maximumMarks: {
      type: Number,
      required: [true, "Maximum marks are required."],
      min: [1, "Maximum marks must be at least 1."],
      default: 100,
    },

    passingPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 40,
    },

    scoring: {
      method: {
        type: String,
        enum: ["standard", "net_wpm", "accuracy", "weighted", "custom"],
        default: "standard",
        required: true,
      },

      // Characters considered equivalent to one standard word.
      wordLength: {
        type: Number,
        min: 1,
        default: 5,
      },

      // Minimum qualifying net typing speed.
      minimumWpm: {
        type: Number,
        min: 0,
        default: 0,
      },

      // Minimum qualifying accuracy percentage.
      minimumAccuracy: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      // Marks deducted per configured error unit.
      errorPenalty: {
        type: Number,
        min: 0,
        default: 0,
      },

      // Used when method is weighted.
      speedWeight: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },

      accuracyWeight: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
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

// ============================================================
// SCORING VALIDATION
// ============================================================

typingExamSchema.pre("validate", function (next) {
  if (this.scoring?.method === "weighted") {
    const speedWeight = Number(this.scoring.speedWeight ?? 0);

    const accuracyWeight = Number(this.scoring.accuracyWeight ?? 0);

    if (speedWeight + accuracyWeight !== 100) {
      this.invalidate(
        "scoring.accuracyWeight",
        "Speed weight and accuracy weight must total 100 for weighted scoring.",
      );
    }
  }

  next();
});

// ============================================================
// INDEXES
// ============================================================

typingExamSchema.index({
  status: 1,
  createdAt: -1,
});

export const TypingExam =
  models.TypingExam || model("TypingExam", typingExamSchema);

export default TypingExam;
