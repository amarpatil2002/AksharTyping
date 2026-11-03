import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const typingExamSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
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
      maxlength: 2000,
    },

    authority: {
      type: String,
      default: "",
      trim: true,
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

    postName: {
      type: String,
      default: "",
      trim: true,
    },

    recruitmentYear: {
      type: String,
      default: "",
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

    measurement: {
      units: {
        type: [
          {
            type: String,
            enum: [
              "WPM",
              "CPM",
              "KDPH",
              "WORDS",
              "CHARACTERS",
              "KEY_DEPRESSIONS",
            ],
          },
        ],
        required: true,
      },

      minimumSpeed: {
        type: Number,
        default: 0,
        min: 0,
      },

      minimumWords: {
        type: Number,
        default: 0,
        min: 0,
      },

      minimumCharacters: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    evaluationPolicyId: {
      type: Schema.Types.ObjectId,
      ref: "EvaluationPolicy",
      required: true,
    },

    wordConfigId: {
      type: Schema.Types.ObjectId,
      ref: "WordExamConfig",
      default: null,
    },

    characterConfigId: {
      type: Schema.Types.ObjectId,
      ref: "CharacterExamConfig",
      default: null,
    },

    hybridConfigId: {
      type: Schema.Types.ObjectId,
      ref: "HybridExamConfig",
      default: null,
    },

    evaluationPolicyId: {
      type: Schema.Types.ObjectId,
      ref: "EvaluationPolicy",
      required: true,
    },

    qualification: {
      required: {
        type: Boolean,
        default: true,
      },

      minimumSpeedRequired: {
        type: Boolean,
        default: true,
      },

      minimumAccuracyRequired: {
        type: Boolean,
        default: false,
      },

      minimumContentRequired: {
        type: Boolean,
        default: false,
      },
    },

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "DRAFT",
    },

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

    policyVersion: {
      type: String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

// Ensure the correct configuration exists for the exam type.
typingExamSchema.pre("validate", function (next) {
  if (this.examType === "WORD" && !this.wordConfigId) {
    return next(new Error("WORD exam requires wordConfigId"));
  }

  if (this.examType === "CHARACTER" && !this.characterConfigId) {
    return next(new Error("CHARACTER exam requires characterConfigId"));
  }

  if (this.examType === "HYBRID" && !this.hybridConfigId) {
    return next(new Error("HYBRID exam requires hybridConfigId"));
  }

  next();
});

typingExamSchema.index({
  examCategory: 1,
  language: 1,
  status: 1,
});

typingExamSchema.index({
  examType: 1,
  status: 1,
});

export default models.TypingExam || model("TypingExam", typingExamSchema);
