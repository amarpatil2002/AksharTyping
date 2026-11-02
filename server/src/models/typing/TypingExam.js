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

/* ============================================================
   SCORING CONFIGURATION
============================================================ */

const errorPenaltiesSchema = new Schema(
  {
    spelling: {
      type: Number,
      min: 0,
      default: 0,
    },

    wrongWord: {
      type: Number,
      min: 0,
      default: 0,
    },

    omission: {
      type: Number,
      min: 0,
      default: 0,
    },

    extraWord: {
      type: Number,
      min: 0,
      default: 0,
    },

    capitalization: {
      type: Number,
      min: 0,
      default: 0,
    },

    notReached: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    _id: false,
    strict: true,
  },
);

const qualificationSchema = new Schema(
  {
    minimumMarks: {
      type: Number,
      min: 0,
      default: 0,
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

    maximumErrors: {
      type: Number,
      min: 0,
      default: null,
    },

    maximumErrorPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    requireAll: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
    strict: true,
  },
);

const scoringSchema = new Schema(
  {
    method: {
      type: String,
      enum: [
        "standard",
        "net_wpm",
        "accuracy",
        "weighted",
        "custom",
        "fixed_error_penalty",
        "grouped_error_penalty",
        "correct_words_ratio",
        "qualifying_only",
        "speed_based",
      ],
      default: "standard",
      required: true,
    },

    policyVersion: {
      type: Number,
      min: 1,
      default: 1,
    },

    // Retained for backward compatibility.
    wordLength: {
      type: Number,
      min: 1,
      default: 5,
    },

    // Typing speed requirement.
    minimumWpm: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Accuracy requirement.
    minimumAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Default penalty used by custom and legacy scoring.
    errorPenalty: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Individual error penalties.
    errorPenalties: {
      type: errorPenaltiesSchema,
      default: () => ({}),
    },

    // Used by weighted scoring.
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

    // Used by grouped error penalty scoring.
    errorsPerGroup: {
      type: Number,
      min: 1,
      default: 1,
    },

    groupPenalty: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Speed calculation convention.
    speedCalculation: {
      type: String,
      enum: [
        "gross_words_per_minute",
        "correct_words_per_minute",
        "gross_minus_error_penalty",
      ],
      default: "correct_words_per_minute",
    },

    // Accuracy calculation convention.
    accuracyCalculation: {
      type: String,
      enum: [
        "correct_words_divided_by_words_typed",
        "correct_words_divided_by_reference_words",
      ],
      default: "correct_words_divided_by_words_typed",
    },

    // How words remaining at the end are handled.
    notReachedPolicy: {
      type: String,
      enum: [
        "no_separate_penalty",
        "count_as_error",
        "apply_configured_penalty",
      ],
      default: "no_separate_penalty",
    },

    // Final result rounding.
    rounding: {
      type: String,
      enum: ["none", "integer", "two_decimals"],
      default: "two_decimals",
    },

    // Qualification conditions.
    qualification: {
      type: qualificationSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
    strict: true,
  },
);

/* ============================================================
   MAIN EXAM MODEL
============================================================ */

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
      type: scoringSchema,
      default: () => ({}),
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
    strict: true,
  },
);

/* ============================================================
   VALIDATION
============================================================ */

typingExamSchema.pre("validate", function (next) {
  const scoring = this.scoring;

  if (!scoring) {
    return next();
  }

  // Weighted scoring must total exactly 100.
  if (scoring.method === "weighted") {
    const speedWeight = Number(scoring.speedWeight ?? 0);
    const accuracyWeight = Number(scoring.accuracyWeight ?? 0);

    if (Math.abs(speedWeight + accuracyWeight - 100) > 0.000001) {
      this.invalidate(
        "scoring.accuracyWeight",
        "Speed weight and accuracy weight must total 100.",
      );
    }
  }

  // Grouped penalty configuration.
  if (
    scoring.method === "grouped_error_penalty" &&
    (!Number.isInteger(scoring.errorsPerGroup) || scoring.errorsPerGroup < 1)
  ) {
    this.invalidate(
      "scoring.errorsPerGroup",
      "Errors per group must be a positive integer.",
    );
  }

  // Qualification marks cannot exceed maximum marks.
  const minimumMarks = Number(scoring.qualification?.minimumMarks ?? 0);

  if (minimumMarks > this.maximumMarks) {
    this.invalidate(
      "scoring.qualification.minimumMarks",
      "Minimum qualification marks cannot exceed maximum marks.",
    );
  }

  // The passing percentage and passing marks should agree
  // when minimum qualification marks are not separately configured.
  if (scoring.qualification?.minimumMarks == null && this.maximumMarks > 0) {
    const passingMarks = (this.maximumMarks * this.passingPercentage) / 100;

    if (!Number.isFinite(passingMarks)) {
      this.invalidate("passingPercentage", "Invalid passing percentage.");
    }
  }

  next();
});

/* ============================================================
   INDEXES
============================================================ */

typingExamSchema.index({
  status: 1,
  createdAt: -1,
});

typingExamSchema.index({
  language: 1,
  status: 1,
});

/* ============================================================
   EXPORT
============================================================ */

export const TypingExam =
  models.TypingExam || model("TypingExam", typingExamSchema);

export default TypingExam;
