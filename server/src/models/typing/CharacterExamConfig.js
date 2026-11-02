import mongoose from "mongoose";

import { measurementTargetSchema, qualificationRuleSchema } from "./Typing.js";

const { Schema } = mongoose;

const objectId = Schema.Types.ObjectId;

const characterExamConfigSchema = new Schema(
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
      validate: {
        validator: (value) =>
          ["CPM", "KDPH", "CHARACTERS", "KEY_DEPRESSIONS"].includes(
            value?.unit,
          ),
        message: "Invalid character exam target unit.",
      },
    },

    counting: {
      characterUnit: {
        type: String,
        enum: [
          "GRAPHEME_CLUSTERS",
          "UNICODE_CODE_POINTS",
          "UTF16_CODE_UNITS",
          "KEY_EVENTS",
        ],
        default: "GRAPHEME_CLUSTERS",
      },

      includeSpaces: {
        type: Boolean,
        default: true,
      },

      includePunctuation: {
        type: Boolean,
        default: true,
      },

      normalization: {
        type: String,
        enum: ["NFC", "NFD", "NONE"],
        default: "NFC",
      },

      caseSensitive: {
        type: Boolean,
        default: true,
      },

      whitespaceSensitive: {
        type: Boolean,
        default: true,
      },

      notReachedPolicy: {
        type: String,
        enum: ["DELETION", "NOT_REACHED", "NO_PENALTY"],
        default: "NOT_REACHED",
      },
    },

    inputRules: {
      captureKeyboardEvents: {
        type: Boolean,
        default: false,
      },

      countBackspace: {
        type: Boolean,
        default: true,
      },

      countDelete: {
        type: Boolean,
        default: true,
      },

      countModifierKeys: {
        type: Boolean,
        default: false,
      },

      allowPaste: {
        type: Boolean,
        default: false,
      },

      allowBackspace: {
        type: Boolean,
        default: true,
      },

      allowCursorMovement: {
        type: Boolean,
        default: true,
      },

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

      keyboardLayoutName: {
        type: String,
        trim: true,
        default: null,
      },

      inputMethod: {
        type: String,
        enum: ["UNICODE", "LEGACY_FONT", "IME", "PHYSICAL_KEYBOARD", "OTHER"],
        default: "UNICODE",
      },

      fontName: {
        type: String,
        trim: true,
        default: null,
      },
    },

    mistakeRules: {
      substitutionPenalty: {
        type: Number,
        min: 0,
        default: 1,
      },

      insertionPenalty: {
        type: Number,
        min: 0,
        default: 1,
      },

      deletionPenalty: {
        type: Number,
        min: 0,
        default: 1,
      },

      notReachedPenalty: {
        type: Number,
        min: 0,
        default: 1,
      },

      fixedStrokePenalty: {
        enabled: {
          type: Boolean,
          default: false,
        },

        unit: {
          type: String,
          enum: ["STROKE", "KEY_DEPRESSION", "CHARACTER"],
          default: "STROKE",
        },

        value: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
    },

    speedCalculation: {
      type: String,
      enum: [
        "NET_CHARACTERS_PER_MINUTE",
        "GROSS_CHARACTERS_PER_MINUTE",
        "KEY_DEPRESSIONS_PER_HOUR",
        "POLICY_DEFINED",
      ],
      default: "NET_CHARACTERS_PER_MINUTE",
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

characterExamConfigSchema.pre("validate", function () {
  if (this.target?.unit === "KDPH" && !this.inputRules?.captureKeyboardEvents) {
    this.invalidate(
      "inputRules.captureKeyboardEvents",
      "KDPH requires keyboard-event tracking.",
    );
  }
});

characterExamConfigSchema.index({ name: 1, version: 1 }, { unique: true });

const CharacterExamConfig =
  mongoose.models.CharacterExamConfig ||
  mongoose.model("CharacterExamConfig", characterExamConfigSchema);

export default CharacterExamConfig;
