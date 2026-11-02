import mongoose from "mongoose";

import { measurementTargetSchema, qualificationRuleSchema } from "./Typing.js";

const { Schema } = mongoose;

const objectId = Schema.Types.ObjectId;

const wordExamConfigSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    version: {
      type: Number,
      min: 1,
      default: 1,
    },

    target: {
      type: measurementTargetSchema,
      required: true,
    },

    wordLength: {
      type: Number,
      min: 1,
      max: 20,
      default: 5,
    },

    counting: {
      wordMethod: {
        type: String,
        enum: [
          "SPACE_SEPARATED",
          "STANDARD_WORD",
          "TOKEN_BASED",
          "PASSAGE_ALIGNMENT",
        ],
        default: "PASSAGE_ALIGNMENT",
      },

      caseSensitive: {
        type: Boolean,
        default: false,
      },

      punctuationSensitive: {
        type: Boolean,
        default: true,
      },

      whitespaceSensitive: {
        type: Boolean,
        default: true,
      },

      normalization: {
        type: String,
        enum: ["NFC", "NFD", "NONE"],
        default: "NFC",
      },

      notReachedPolicy: {
        type: String,
        enum: ["OMISSION", "NOT_REACHED", "NO_PENALTY"],
        default: "NOT_REACHED",
      },

      extraWordPolicy: {
        type: String,
        enum: ["COUNT_AS_ERROR", "IGNORE", "COUNT_AS_EXTRA_WORD"],
        default: "COUNT_AS_ERROR",
      },
    },

    mistakeRules: {
      classification: {
        type: String,
        enum: ["WORD_BASED", "FULL_HALF", "CUSTOM"],
        default: "WORD_BASED",
      },

      countFullMistakes: {
        type: Boolean,
        default: true,
      },

      countHalfMistakes: {
        type: Boolean,
        default: false,
      },

      fullMistakeWeight: {
        type: Number,
        min: 0,
        default: 1,
      },

      halfMistakeWeight: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5,
      },

      spellingPenalty: {
        type: Number,
        min: 0,
        default: 1,
      },

      wrongWordPenalty: {
        type: Number,
        min: 0,
        default: 1,
      },

      omissionPenalty: {
        type: Number,
        min: 0,
        default: 1,
      },

      extraWordPenalty: {
        type: Number,
        min: 0,
        default: 1,
      },

      notReachedPenalty: {
        type: Number,
        min: 0,
        default: 1,
      },

      allowance: {
        enabled: {
          type: Boolean,
          default: false,
        },

        type: {
          type: String,
          enum: [
            "NONE",
            "PERCENTAGE_OF_TYPED_WORDS",
            "FIXED_ERRORS",
            "FIXED_WORDS",
          ],
          default: "NONE",
        },

        value: {
          type: Number,
          min: 0,
          default: 0,
        },
      },

      groupedPenalty: {
        enabled: {
          type: Boolean,
          default: false,
        },

        errorsPerGroup: {
          type: Number,
          min: 1,
          default: 10,
        },

        penaltyPerGroup: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
    },

    speedCalculation: {
      type: String,
      enum: [
        "GROSS_WORDS_PER_MINUTE",
        "CORRECT_WORDS_PER_MINUTE",
        "GROSS_MINUS_ERROR_PENALTY",
        "POLICY_DEFINED",
      ],
      default: "GROSS_WORDS_PER_MINUTE",
    },

    qualification: {
      type: qualificationRuleSchema,
      default: () => ({}),
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

wordExamConfigSchema.index({ name: 1, version: 1 }, { unique: true });

const WordExamConfig =
  mongoose.models.WordExamConfig ||
  mongoose.model("WordExamConfig", wordExamConfigSchema);

export default WordExamConfig;
