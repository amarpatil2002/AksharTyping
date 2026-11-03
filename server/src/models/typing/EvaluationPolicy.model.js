import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const evaluationPolicySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      default: "",
    },

    examCategory: {
      type: String,
      enum: [
        "SSC",
        "RRB",
        "CPCT",
        "HIGH_COURT",
        "STATE",
        "AIIMS",
        "BANK",
        "OTHER",
      ],
      default: "OTHER",
    },

    language: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    examType: {
      type: String,
      enum: ["WORD", "CHARACTER", "HYBRID"],
      required: true,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
    },

    // Measurement configuration
    measurement: {
      grossSpeedMethod: {
        type: String,
        enum: [
          "TOTAL_WORDS",
          "TOTAL_CHARACTERS",
          "TOTAL_KEY_DEPRESSIONS",
          "POLICY_DEFINED",
        ],
        required: true,
      },

      netSpeedMethod: {
        type: String,
        enum: [
          "CORRECT_WORDS",
          "CORRECT_CHARACTERS",
          "CORRECT_KEY_DEPRESSIONS",
          "GROSS_MINUS_PENALTY",
          "POLICY_DEFINED",
        ],
        required: true,
      },

      errorCalculation: {
        type: String,
        enum: [
          "WORD_BASED",
          "CHARACTER_BASED",
          "STROKE_BASED",
          "POLICY_DEFINED",
        ],
        required: true,
      },
    },

    // Official scoring configuration
    scoring: {
      penaltyMethod: {
        type: String,
        enum: [
          "NONE",
          "FIXED_PER_ERROR",
          "GROUPED_ERRORS",
          "PERCENTAGE",
          "POLICY_DEFINED",
        ],
        default: "NONE",
      },

      penaltyValue: {
        type: Number,
        default: 0,
        min: 0,
      },

      groupSize: {
        type: Number,
        default: 1,
        min: 1,
      },

      fullMistakeWeight: {
        type: Number,
        default: 1,
        min: 0,
      },

      halfMistakeWeight: {
        type: Number,
        default: 0.5,
        min: 0,
      },

      maximumMarks: {
        type: Number,
        default: null,
        min: 0,
      },

      marksDeducted: {
        type: Boolean,
        default: false,
      },

      scoringMethod: {
        type: String,
        enum: [
          "NET_SPEED",
          "ACCURACY",
          "MARKS",
          "QUALIFYING",
          "SCALED_SCORE",
          "CUSTOM",
        ],
        default: "NET_SPEED",
      },
    },

    // Full and half mistake classification
    mistakeRules: {
      substitution: {
        type: String,
        enum: ["FULL", "HALF", "IGNORE"],
        default: "FULL",
      },

      omission: {
        type: String,
        enum: ["FULL", "HALF", "IGNORE"],
        default: "FULL",
      },

      insertion: {
        type: String,
        enum: ["FULL", "HALF", "IGNORE"],
        default: "FULL",
      },

      transposition: {
        type: String,
        enum: ["FULL", "HALF", "IGNORE"],
        default: "FULL",
      },

      spelling: {
        type: String,
        enum: ["FULL", "HALF", "IGNORE"],
        default: "FULL",
      },

      spacing: {
        type: String,
        enum: ["FULL", "HALF", "IGNORE"],
        default: "HALF",
      },

      punctuation: {
        type: String,
        enum: ["FULL", "HALF", "IGNORE"],
        default: "HALF",
      },

      case: {
        type: String,
        enum: ["FULL", "HALF", "IGNORE"],
        default: "IGNORE",
      },

      other: {
        type: String,
        enum: ["FULL", "HALF", "IGNORE"],
        default: "FULL",
      },
    },

    // Error allowance
    errorAllowance: {
      enabled: {
        type: Boolean,
        default: false,
      },

      maximumPercentage: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
    },

    // Qualification requirements
    qualificationRules: {
      required: {
        type: Boolean,
        default: true,
      },

      minimumSpeed: {
        type: Number,
        default: null,
        min: 0,
      },

      minimumAccuracy: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },

      maximumErrorPercentage: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },

      minimumMarks: {
        type: Number,
        default: null,
        min: 0,
      },
    },

    // Input configuration
    inputRequirements: {
      keyboardLayout: {
        type: String,
        enum: [
          "QWERTY",
          "INSCRIPT",
          "REMINGTON",
          "KRUTI_DEV",
          "MANGAL",
          "CUSTOM",
          "NOT_APPLICABLE",
        ],
        default: "QWERTY",
      },

      inputMethod: {
        type: String,
        enum: ["UNICODE", "LEGACY_FONT", "IME", "PHYSICAL_KEYBOARD", "OTHER"],
        default: "UNICODE",
      },

      captureKeyboardEvents: {
        type: Boolean,
        default: false,
      },

      allowPaste: {
        type: Boolean,
        default: false,
      },
    },

    // Official reference documents
    officialSources: [
      {
        title: {
          type: String,
          required: true,
        },

        url: {
          type: String,
          required: true,
        },

        documentType: {
          type: String,
          enum: ["NOTIFICATION", "RULEBOOK", "GUIDELINE", "OTHER"],
          default: "OTHER",
        },
      },
    ],

    version: {
      type: String,
      default: "1.0",
    },

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "INACTIVE"],
      default: "DRAFT",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

evaluationPolicySchema.index({
  examCategory: 1,
  language: 1,
  examType: 1,
  status: 1,
});

export default models.EvaluationPolicy ||
  model("EvaluationPolicy", evaluationPolicySchema);
