import mongoose from "mongoose";

import {
  MEASUREMENT_UNITS,
  SPEED_METHODS,
  ERROR_METHODS,
  PENALTY_METHODS,
  ROUNDING_METHODS,
} from "../constants/typing.constants.js";

import { EVALUATOR_TYPES } from "../exam-utilities/types.js";

const { Schema, model, models } = mongoose;

const schema = new Schema(
  {
    examVersionId: {
      type: Schema.Types.ObjectId,
      ref: "TypingExamVersion",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    version: {
      type: Number,
      min: 1,
      default: 1,
    },

    /*
     * This determines which exam-specific evaluator
     * will calculate the final result.
     *
     * Example:
     * HIGH_COURT_GENERIC_WPM
     * RRB_NTPC_CBTST
     */
    evaluator: {
      type: String,
      enum: Object.values(EVALUATOR_TYPES),
      required: true,
      index: true,
    },

    measurement: {
      unit: {
        type: String,
        enum: MEASUREMENT_UNITS,
        required: true,
      },
    },

    duration: {
      seconds: {
        type: Number,
        min: 1,
        required: true,
      },
    },

    normalization: {
      type: String,
      enum: ["NFC", "NFD", "NFKC", "NFKD", "NONE"],
      default: "NFC",
    },

    speed: {
      grossMethod: {
        type: String,
        enum: SPEED_METHODS,
        required: true,
      },

      netMethod: {
        type: String,
        enum: SPEED_METHODS,
      },
    },

    errorRules: {
      method: {
        type: String,
        enum: ERROR_METHODS,
        required: true,
      },

      allowedPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
    },

    penalty: {
      method: {
        type: String,
        enum: PENALTY_METHODS,
        default: "NONE",
      },

      value: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    scoring: {
      maximumMarks: {
        type: Number,
        min: 0,
      },

      marksPerMistake: {
        type: Number,
        min: 0,
      },
    },

    evaluatorConfig: {
      type: Schema.Types.Mixed,
      default: undefined,
    },

    qualification: {
      minimumSpeed: {
        type: Number,
        min: 0,
      },

      maximumErrors: {
        type: Number,
        min: 0,
      },
    },

    rounding: {
      method: {
        type: String,
        enum: ROUNDING_METHODS,
        default: "ROUND",
      },

      decimalPlaces: {
        type: Number,
        min: 0,
        max: 6,
        default: 2,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  },
);

schema.index({ examVersionId: 1, version: 1 }, { unique: true });
schema.index({ examVersionId: 1, isActive: 1, version: -1 });

export default models.EvaluationPolicy || model("EvaluationPolicy", schema);
