import mongoose from "mongoose";

import { measurementTargetSchema, LANGUAGES, EXAM_TYPES } from "./Typing.js";

const { Schema } = mongoose;

const objectId = Schema.Types.ObjectId;

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
      trim: true,
      lowercase: true,
      maxlength: 220,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
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
      trim: true,
      maxlength: 50,
      default: null,
    },

    examType: {
      type: String,
      required: true,
      enum: EXAM_TYPES,
    },

    language: {
      type: String,
      required: true,
      lowercase: true,
      enum: LANGUAGES,
    },

    languageConfigId: {
      type: objectId,
      ref: "LanguageConfig",
      required: true,
    },

    inputMethod: {
      type: String,
      required: true,
      enum: [
        "INSCRIPT",
        "REMIINGTON",
        "PHONETIC",
        "TRANSLITERATION",
        "TYPEWRITER",
        "CUSTOM",
        "STANDARD_QWERTY",
      ],
    },

    keyboardLayout: {
      type: String,
      trim: true,
      default: null,
    },

    textDirection: {
      type: String,
      enum: ["LTR", "RTL"],
      default: "LTR",
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
      max: 86400,
    },

    target: {
      type: measurementTargetSchema,
      required: true,
    },

    wordConfigId: {
      type: objectId,
      ref: "WordExamConfig",
      default: null,
    },

    characterConfigId: {
      type: objectId,
      ref: "CharacterExamConfig",
      default: null,
    },

    hybridConfigId: {
      type: objectId,
      ref: "HybridExamConfig",
      default: null,
    },

    evaluationPolicyId: {
      type: objectId,
      ref: "EvaluationPolicy",
      required: true,
    },

    passageSettings: {
      selectionMode: {
        type: String,
        enum: ["FIXED", "RANDOM", "CATEGORY_BASED", "ADMIN_ASSIGNED"],
        default: "RANDOM",
      },

      passageCount: {
        type: Number,
        min: 1,
        default: 1,
      },

      allowedCategories: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],

      minimumWordCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      maximumWordCount: {
        type: Number,
        min: 0,
        default: null,
      },

      fixedPassageIds: [
        {
          type: objectId,
          ref: "TypingPassage",
        },
      ],
    },

    attemptSettings: {
      maximumAttempts: {
        type: Number,
        min: 1,
        default: 1,
      },

      allowRetake: {
        type: Boolean,
        default: false,
      },

      allowPause: {
        type: Boolean,
        default: false,
      },

      autoSubmit: {
        type: Boolean,
        default: true,
      },

      showResultImmediately: {
        type: Boolean,
        default: true,
      },

      showCorrectText: {
        type: Boolean,
        default: true,
      },

      showDetailedErrors: {
        type: Boolean,
        default: true,
      },
    },

    access: {
      visibility: {
        type: String,
        enum: ["PUBLIC", "PRIVATE", "UNLISTED", "ASSIGNED"],
        default: "PUBLIC",
      },

      requiresLogin: {
        type: Boolean,
        default: true,
      },

      allowedUserIds: [
        {
          type: objectId,
          ref: "User",
        },
      ],

      allowedRoles: [
        {
          type: String,
          trim: true,
        },
      ],
    },

    availability: {
      startsAt: {
        type: Date,
        default: null,
      },

      endsAt: {
        type: Date,
        default: null,
      },

      timezone: {
        type: String,
        default: "Asia/Kolkata",
        trim: true,
      },
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "PAUSED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
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

    publishedAt: {
      type: Date,
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

typingExamSchema.pre("validate", function () {
  const configFields = {
    WORD: ["wordConfigId"],
    CHARACTER: ["characterConfigId"],
    HYBRID: ["hybridConfigId"],
  };

  const requiredConfig = configFields[this.examType] || [];

  const allConfigFields = [
    "wordConfigId",
    "characterConfigId",
    "hybridConfigId",
  ];

  for (const field of allConfigFields) {
    const shouldExist = requiredConfig.includes(field);
    const exists = Boolean(this[field]);

    if (shouldExist !== exists) {
      this.invalidate(
        field,
        shouldExist
          ? `${field} is required for ${this.examType} exams.`
          : `${field} is not allowed for ${this.examType} exams.`,
      );
    }
  }

  if (
    this.passageSettings?.maximumWordCount !== null &&
    this.passageSettings?.maximumWordCount !== undefined &&
    this.passageSettings.maximumWordCount <
      this.passageSettings.minimumWordCount
  ) {
    this.invalidate(
      "passageSettings.maximumWordCount",
      "Maximum word count cannot be smaller than minimum word count.",
    );
  }

  if (
    this.availability?.startsAt &&
    this.availability?.endsAt &&
    this.availability.endsAt <= this.availability.startsAt
  ) {
    this.invalidate(
      "availability.endsAt",
      "Exam end date must be after start date.",
    );
  }

  if (this.status === "PUBLISHED" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

/* INDEXES */

typingExamSchema.index({ slug: 1 }, { unique: true });

typingExamSchema.index({
  authority: 1,
  examCode: 1,
  recruitmentCycle: 1,
});

typingExamSchema.index({
  status: 1,
  isActive: 1,
  language: 1,
  examType: 1,
});

typingExamSchema.index({
  "availability.startsAt": 1,
  "availability.endsAt": 1,
});

/* MODEL */

const TypingExam =
  mongoose.models.TypingExam || mongoose.model("TypingExam", typingExamSchema);

export default TypingExam;
