import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

/* =====================================================
   CONFIGURATION SNAPSHOT
   Preserves the settings used by this exam.
===================================================== */

const configSnapshotSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    language: {
      type: String,
      enum: ["en", "hi", "mr"],
      required: true,
    },

    durationSeconds: {
      type: Number,
      required: true,
      min: 10,
      max: 7200,
    },

    targetWpm: {
      type: Number,
      default: 40,
      min: 0,
      max: 500,
    },

    instructions: {
      type: [String],
      default: [],
    },

    examMetadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    passageSettings: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    evaluationRules: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    examInterface: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    analyticsSettings: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },

    examWorkflow: {
      type: Schema.Types.Mixed,
      default: undefined,
    },

    version: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
    id: false,
    strict: true,
  },
);

/* =====================================================
   TYPING EXAM
===================================================== */

const typingExamSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    passageText: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },

    config: {
      type: Schema.Types.ObjectId,
      ref: "TypingExamConfig",
      required: true,
      immutable: true,
    },

    configVersion: {
      type: Number,
      required: true,
      min: 1,
    },

    configSnapshot: {
      type: configSnapshotSchema,
      default: undefined,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      required: true,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
    strict: true,
    minimize: false,
  },
);

/* =====================================================
   DOCUMENT VALIDATION
===================================================== */

typingExamSchema.pre("validate", function () {
  if (
    this.configSnapshot?.version != null &&
    this.configVersion !== this.configSnapshot.version
  ) {
    this.invalidate(
      "configVersion",
      "Configuration version must match the snapshot version.",
    );
  }

  if (this.status === "published") {
    if (!this.configSnapshot) {
      this.invalidate(
        "configSnapshot",
        "A configuration snapshot is required to publish an exam.",
      );
    }

    if (!this.publishedAt) {
      this.publishedAt = new Date();
    }

    if (!this.passageText?.trim()) {
      this.invalidate(
        "passageText",
        "A non-empty passage is required to publish an exam.",
      );
    }
  } else {
    this.publishedAt = null;
  }

  if (this.status === "archived") {
    if (!this.archivedAt) {
      this.archivedAt = new Date();
    }
  } else {
    this.archivedAt = null;
  }
});

/* =====================================================
   INDEXES
===================================================== */

// Admin exam listing.
typingExamSchema.index({
  status: 1,
  createdAt: -1,
});

// Exams associated with a configuration.
typingExamSchema.index({
  config: 1,
  status: 1,
});

// Candidate-facing published exam filtering.
typingExamSchema.index({
  status: 1,
  "configSnapshot.language": 1,
  createdAt: -1,
});

/* =====================================================
   MODEL EXPORT
===================================================== */

const TypingExam = models.TypingExam || model("TypingExam", typingExamSchema);

export default TypingExam;
