import mongoose from "mongoose";

import { qualificationRuleSchema } from "./Typing.js";

const { Schema } = mongoose;

const objectId = Schema.Types.ObjectId;

const hybridExamConfigSchema = new Schema(
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

    wordConfigId: {
      type: objectId,
      ref: "WordExamConfig",
      required: true,
    },

    characterConfigId: {
      type: objectId,
      ref: "CharacterExamConfig",
      required: true,
    },

    resultCombination: {
      type: String,
      enum: ["BOTH_REQUIRED", "WORD_PRIMARY", "CHARACTER_PRIMARY", "WEIGHTED"],
      default: "BOTH_REQUIRED",
    },

    wordWeight: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },

    characterWeight: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
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

/* VALIDATION */

hybridExamConfigSchema.pre("validate", function () {
  if (
    this.resultCombination === "WEIGHTED" &&
    this.wordWeight + this.characterWeight !== 100
  ) {
    this.invalidate("wordWeight", "Hybrid weights must total 100.");
  }
});

/* INDEXES */

hybridExamConfigSchema.index({ name: 1, version: 1 }, { unique: true });

/* MODEL */

const HybridExamConfig =
  mongoose.models.HybridExamConfig ||
  mongoose.model("HybridExamConfig", hybridExamConfigSchema);

export default HybridExamConfig;
