import mongoose from "mongoose";

import {
  LANGUAGES,
  EXAM_TYPES,
  EVALUATORS,
  measurementTargetSchema,
  qualificationRuleSchema,
} from "./Typing.js";

const { Schema } = mongoose;

const objectId = Schema.Types.ObjectId;

const evaluationPolicySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    authority: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    examCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 100,
    },

    postName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    recruitmentCycle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    language: {
      type: String,
      required: true,
      lowercase: true,
      enum: LANGUAGES,
    },

    examType: {
      type: String,
      required: true,
      enum: EXAM_TYPES,
    },

    version: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    evaluator: {
      type: String,
      required: true,
      enum: EVALUATORS,
    },

    measurement: {
      type: measurementTargetSchema,
      required: true,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
    },

    scoring: {
      grossSpeedMethod: {
        type: String,
        enum: [
          "TOTAL_WORDS",
          "TOTAL_CHARACTERS",
          "TOTAL_KEY_DEPRESSIONS",
          "POLICY_DEFINED",
        ],
        default: "POLICY_DEFINED",
      },

      netSpeedMethod: {
        type: String,
        enum: [
          "CORRECT_WORDS",
          "CORRECT_CHARACTERS",
          "GROSS_MINUS_PENALTY",
          "POLICY_DEFINED",
        ],
        default: "POLICY_DEFINED",
      },

      errorCalculation: {
        type: String,
        enum: [
          "WORD_BASED",
          "CHARACTER_BASED",
          "STROKE_BASED",
          "POLICY_DEFINED",
        ],
        default: "POLICY_DEFINED",
      },

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
        min: 0,
        default: 0,
      },

      errorAllowance: {
        enabled: {
          type: Boolean,
          default: false,
        },

        value: {
          type: Number,
          min: 0,
          default: 0,
        },

        unit: {
          type: String,
          enum: ["ERRORS", "WORDS", "CHARACTERS", "PERCENTAGE"],
          default: "ERRORS",
        },
      },
    },

    qualification: {
      type: qualificationRuleSchema,
      default: () => ({}),
    },

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

    officialSources: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: 250,
        },

        url: {
          type: String,
          required: true,
          trim: true,
          maxlength: 2000,
        },

        documentType: {
          type: String,
          enum: [
            "OFFICIAL_NOTIFICATION",
            "OFFICIAL_SYLLABUS",
            "EVALUATION_GUIDELINES",
            "CORRIGENDUM",
            "OTHER",
          ],
          default: "OFFICIAL_NOTIFICATION",
        },

        publishedAt: {
          type: Date,
          default: null,
        },
      },
    ],

    verification: {
      status: {
        type: String,
        enum: [
          "DRAFT",
          "PENDING_VERIFICATION",
          "VERIFIED",
          "REJECTED",
          "RETIRED",
        ],
        default: "DRAFT",
      },

      isOfficial: {
        type: Boolean,
        default: false,
      },

      verifiedAt: {
        type: Date,
        default: null,
      },

      verifiedBy: {
        type: objectId,
        ref: "User",
        default: null,
      },

      verificationNotes: {
        type: String,
        trim: true,
        maxlength: 3000,
        default: null,
      },
    },

    effectiveFrom: {
      type: Date,
      default: null,
    },

    effectiveUntil: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: objectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: objectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

/* VALIDATION */

evaluationPolicySchema.pre("validate", function () {
  if (
    this.verification?.isOfficial &&
    this.verification?.status !== "VERIFIED"
  ) {
    this.invalidate(
      "verification.isOfficial",
      "An official policy must have VERIFIED status.",
    );
  }

  if (this.verification?.status === "VERIFIED") {
    if (!this.verification.verifiedAt) {
      this.invalidate("verification.verifiedAt", "Verified date is required.");
    }

    if (!this.verification.verifiedBy) {
      this.invalidate("verification.verifiedBy", "Verified user is required.");
    }

    if (!this.officialSources?.length) {
      this.invalidate(
        "officialSources",
        "At least one official source is required for verification.",
      );
    }
  }

  if (
    this.effectiveFrom &&
    this.effectiveUntil &&
    this.effectiveUntil <= this.effectiveFrom
  ) {
    this.invalidate(
      "effectiveUntil",
      "Effective until must be later than effective from.",
    );
  }

  if (
    this.examType === "CHARACTER" &&
    this.measurement?.unit === "KDPH" &&
    !this.inputRequirements?.captureKeyboardEvents
  ) {
    this.invalidate(
      "inputRequirements.captureKeyboardEvents",
      "KDPH requires keyboard event capture.",
    );
  }
});

/* INDEXES */

evaluationPolicySchema.index(
  {
    authority: 1,
    examCode: 1,
    recruitmentCycle: 1,
    language: 1,
    version: 1,
  },
  {
    unique: true,
  },
);

evaluationPolicySchema.index({
  "verification.status": 1,
  isActive: 1,
});

evaluationPolicySchema.index({
  examType: 1,
  language: 1,
  authority: 1,
});

/* MODEL */

const EvaluationPolicy =
  mongoose.models.EvaluationPolicy ||
  mongoose.model("EvaluationPolicy", evaluationPolicySchema);

export default EvaluationPolicy;
