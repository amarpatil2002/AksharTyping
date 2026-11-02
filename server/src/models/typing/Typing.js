import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const LANGUAGES = [
  "english",
  "hindi",
  "assamese",
  "bengali",
  "bodo",
  "dogri",
  "gujarati",
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

export const EXAM_TYPES = ["WORD", "CHARACTER", "HYBRID"];

const MEASUREMENT_UNITS = [
  "WPM",
  "CPM",
  "KDPH",
  "WORDS",
  "CHARACTERS",
  "KEY_DEPRESSIONS",
];

export const EVALUATORS = [
  "STANDARD_WORD",
  "CPCT_NET_WPM",
  "RRB_WORD_PENALTY",
  "SSC_TYPING",
  "SSC_DEST",
  "AIIMS_STROKE_PENALTY",
  "CHARACTER_BASED",
  "KEYSTROKE_BASED",
  "HYBRID",
  "CUSTOM",
];

const MAX_PASSAGE_LENGTH = 100000;
const MAX_WORDS_PER_PASSAGE = 20000;
const MAX_ANALYSIS_ITEMS = 20000;
const MAX_TIMELINE_POINTS = 5000;

const countField = {
  type: Number,
  min: 0,
  default: 0,
};

const percentField = {
  type: Number,
  min: 0,
  max: 100,
  default: 0,
};

const objectId = Schema.Types.ObjectId;

const createModel = (name, schema) => models[name] || model(name, schema);

const validateArrayLimit = (max, label) => ({
  validator: (items) => Array.isArray(items) && items.length <= max,
  message: `${label} exceeds the allowed limit.`,
});

/* =========================================================
   SHARED SCHEMAS
========================================================= */

export const measurementTargetSchema = new Schema(
  {
    value: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      enum: MEASUREMENT_UNITS,
      required: true,
    },

    comparison: {
      type: String,
      enum: ["MINIMUM", "MAXIMUM", "EXACT"],
      default: "MINIMUM",
    },
  },
  {
    _id: false,
    strict: "throw",
  },
);

export const qualificationRuleSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },

    requireAll: {
      type: Boolean,
      default: true,
    },

    qualifyingOnly: {
      type: Boolean,
      default: true,
    },

    minimumSpeed: {
      type: measurementTargetSchema,
      default: undefined,
    },

    minimumAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    minimumMarks: {
      type: Number,
      min: 0,
      default: null,
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
  },
  {
    _id: false,
    strict: "throw",
  },
);
