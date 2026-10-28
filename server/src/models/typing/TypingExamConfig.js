import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

/* =====================================================
   EXAM METADATA
===================================================== */

const examMetadataSchema = new Schema(
  {
    country: {
      type: String,
      trim: true,
      default: "India",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    jurisdiction: {
      type: String,
      trim: true,
      default: "",
    },

    recruitmentAuthority: {
      type: String,
      trim: true,
      default: "",
    },

    courtName: {
      type: String,
      trim: true,
      default: "",
    },

    postName: {
      type: String,
      trim: true,
      default: "",
    },

    examCategory: {
      type: String,
      trim: true,
      default: "typing",
    },

    examStage: {
      type: String,
      trim: true,
      default: "typing_test",
    },

    notificationNumber: {
      type: String,
      trim: true,
      default: "",
    },

    notificationDate: {
      type: Date,
      default: null,
    },

    officialSourceUrl: {
      type: String,
      trim: true,
      default: "",
    },

    officialRulesVerified: {
      type: Boolean,
      default: false,
    },

    ruleVersion: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

/* =====================================================
   PASSAGE SETTINGS
===================================================== */

const passageSettingsSchema = new Schema(
  {
    sourceType: {
      type: String,
      enum: ["fixed", "random", "admin_selected"],
      default: "fixed",
    },

    expectedWordCount: {
      type: Number,
      min: 1,
      default: null,
    },

    expectedLineCount: {
      type: Number,
      min: 1,
      default: null,
    },

    minimumWordCount: {
      type: Number,
      min: 1,
      default: null,
    },

    maximumWordCount: {
      type: Number,
      min: 1,
      default: null,
    },

    preserveLineBreaks: {
      type: Boolean,
      default: true,
    },

    allowParagraphs: {
      type: Boolean,
      default: true,
    },

    allowNumbers: {
      type: Boolean,
      default: true,
    },

    allowPunctuation: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

/* =====================================================
   EVALUATION RULES
===================================================== */

const evaluationRulesSchema = new Schema(
  {
    strategy: {
      type: String,
      enum: [
        "gross_net_wpm",
        "correct_words",
        "error_penalty",
        "qualification_only",
        "custom",
      ],
      default: "gross_net_wpm",
    },

    wordLength: {
      type: Number,
      min: 1,
      max: 20,
      default: 5,
    },

    wpmMethod: {
      type: String,
      enum: ["gross", "net"],
      default: "net",
    },

    accuracyMethod: {
      type: String,
      enum: ["allCharacters", "typedCharacters"],
      default: "allCharacters",
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

    passingMode: {
      type: String,
      enum: ["all", "any"],
      default: "all",
    },

    countPunctuation: {
      type: Boolean,
      default: true,
    },

    ignoreRepeatedSpaces: {
      type: Boolean,
      default: false,
    },

    ignoreCase: {
      type: Boolean,
      default: false,
    },

    errorPenaltyPerError: {
      type: Number,
      min: 0,
      default: 0,
    },

    maximumMarks: {
      type: Number,
      min: 0,
      default: null,
    },

    passingMarks: {
      type: Number,
      min: 0,
      default: null,
    },

    qualificationOnly: {
      type: Boolean,
      default: false,
    },

    minimumCorrectWords: {
      type: Number,
      min: 0,
      default: null,
    },

    minimumCorrectCharacters: {
      type: Number,
      min: 0,
      default: null,
    },

    allowIncompletePassage: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

/* =====================================================
   EXAM INTERFACE
===================================================== */

const examInterfaceSchema = new Schema(
  {
    allowBackspace: {
      type: Boolean,
      default: true,
    },

    allowDelete: {
      type: Boolean,
      default: true,
    },

    allowArrowKeys: {
      type: Boolean,
      default: true,
    },

    allowNavigationKeys: {
      type: Boolean,
      default: true,
    },

    allowHomeEnd: {
      type: Boolean,
      default: true,
    },

    allowPaste: {
      type: Boolean,
      default: false,
    },

    allowCopy: {
      type: Boolean,
      default: false,
    },

    allowCut: {
      type: Boolean,
      default: false,
    },

    allowContextMenu: {
      type: Boolean,
      default: false,
    },

    allowUndo: {
      type: Boolean,
      default: true,
    },

    showReferencePassage: {
      type: Boolean,
      default: true,
    },

    autoSubmitOnTimeout: {
      type: Boolean,
      default: true,
    },

    showTimer: {
      type: Boolean,
      default: true,
    },

    showLiveWpm: {
      type: Boolean,
      default: true,
    },

    showLiveAccuracy: {
      type: Boolean,
      default: true,
    },

    showErrorCount: {
      type: Boolean,
      default: true,
    },

    enableSpellcheck: {
      type: Boolean,
      default: false,
    },

    requireFullscreen: {
      type: Boolean,
      default: false,
    },

    preventTextSelection: {
      type: Boolean,
      default: false,
    },

    inputMode: {
      type: String,
      enum: ["normal", "restricted", "exam"],
      default: "normal",
    },
  },
  { _id: false },
);

/* =====================================================
   EXAM WORKFLOW
===================================================== */

const examWorkflowStageSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    required: {
      type: Boolean,
      default: true,
    },

    settings: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    _id: false,
    strict: true,
  },
);

const examWorkflowSchema = new Schema(
  {
    stages: {
      type: [examWorkflowStageSchema],
      required: true,
      validate: {
        validator(stages) {
          return Array.isArray(stages) && stages.length > 0;
        },
        message: "Exam workflow must contain at least one stage.",
      },
    },
  },
  {
    _id: false,
    strict: true,
  },
);

/* =====================================================
   ANALYTICS SETTINGS
===================================================== */

const analyticsSettingsSchema = new Schema(
  {
    recordIntervalSeconds: {
      type: Number,
      min: 1,
      max: 60,
      default: 5,
    },

    showSpeedTimeline: {
      type: Boolean,
      default: true,
    },

    showAccuracyTimeline: {
      type: Boolean,
      default: true,
    },

    showErrorAnalysis: {
      type: Boolean,
      default: true,
    },

    showImprovementPlan: {
      type: Boolean,
      default: true,
    },

    storeKeystrokeTimeline: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

/* =====================================================
   TYPING EXAM CONFIGURATION
===================================================== */

const typingExamConfigSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    language: {
      type: String,
      enum: ["en", "hi", "mr"],
      required: true,
      default: "en",
      index: true,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 10,
      max: 7200,
    },

    targetWpm: {
      type: Number,
      min: 0,
      max: 500,
      default: 40,
    },

    examMetadata: {
      type: examMetadataSchema,
      default: () => ({}),
    },

    passageSettings: {
      type: passageSettingsSchema,
      default: () => ({}),
    },

    instructions: {
      type: [String],
      default: [],
    },

    evaluationRules: {
      type: evaluationRulesSchema,
      default: () => ({}),
    },

    examInterface: {
      type: examInterfaceSchema,
      default: () => ({}),
    },

    analyticsSettings: {
      type: analyticsSettingsSchema,
      default: () => ({}),
    },

    examWorkflow: {
      type: examWorkflowSchema,
      default: () => ({}),
    },
    version: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

/* =====================================================
   VALIDATION
===================================================== */

typingExamConfigSchema.pre("validate", function () {
  const rules = this.evaluationRules;

  if (
    rules?.maximumMarks != null &&
    rules?.passingMarks != null &&
    rules.passingMarks > rules.maximumMarks
  ) {
    this.invalidate(
      "evaluationRules.passingMarks",
      "Passing marks cannot exceed maximum marks.",
    );
  }

  const passage = this.passageSettings;

  if (
    passage?.minimumWordCount != null &&
    passage?.maximumWordCount != null &&
    passage.minimumWordCount > passage.maximumWordCount
  ) {
    this.invalidate(
      "passageSettings.minimumWordCount",
      "Minimum word count cannot exceed maximum word count.",
    );
  }
});

/* =====================================================
   INDEXES
===================================================== */

typingExamConfigSchema.index({
  "examMetadata.country": 1,
  "examMetadata.state": 1,
  "examMetadata.courtName": 1,
});

typingExamConfigSchema.index({
  language: 1,
  status: 1,
  createdAt: -1,
});

/* =====================================================
   EXPORT
===================================================== */

const TypingExamConfig =
  models.TypingExamConfig || model("TypingExamConfig", typingExamConfigSchema);

export default TypingExamConfig;
