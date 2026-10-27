import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

/**
 * A frozen copy of the reusable TypingExamConfig.
 *
 * Mixed is intentional here: configuration options can evolve as new
 * court and government typing examinations are added. The snapshot
 * preserves the exact settings used when the exam was published.
 */
const configSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    language: {
      type: String,
      enum: ["en", "hi", "mr"],
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: 1,
    },
    targetWpm: {
      type: Number,
      default: 0,
      min: 0,
    },
    instructions: {
      type: [String],
      default: [],
    },
    examMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    passageSettings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    evaluationRules: {
      type: Schema.Types.Mixed,
      default: {},
    },
    examInterface: {
      type: Schema.Types.Mixed,
      default: {},
    },
    analyticsSettings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
    strict: true,
  },
);

const typingExamSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
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
      index: true,
    },

    // Version of the reusable config used for this exam.
    configVersion: {
      type: Number,
      required: true,
      min: 1,
    },

    // Frozen configuration used by this exam.
    configSnapshot: {
      type: configSnapshotSchema,
      default: undefined,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
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
    versionKey: "__v",
    strict: true,
  },
);

/**
 * Validate the exam before saving.
 */
typingExamSchema.pre("validate", function () {
  if (this.status === "published") {
    if (!this.publishedAt) {
      this.publishedAt = new Date();
    }

    if (!this.configSnapshot) {
      this.invalidate(
        "configSnapshot",
        "A published exam must have a frozen configuration snapshot.",
      );
    }
  }

  if (this.status === "draft") {
    this.publishedAt = null;
  }

  if (this.status === "archived" && !this.archivedAt) {
    this.archivedAt = new Date();
  }

  if (this.status !== "archived") {
    this.archivedAt = null;
  }

  if (
    this.configSnapshot &&
    this.configVersion !== this.configSnapshot.version
  ) {
    this.invalidate(
      "configVersion",
      "configVersion must match configSnapshot.version.",
    );
  }
});

/**
 * Useful indexes for administration and candidate exam listings.
 */
typingExamSchema.index({
  status: 1,
  publishedAt: -1,
});

typingExamSchema.index({
  config: 1,
  status: 1,
  createdAt: -1,
});

typingExamSchema.index({
  createdBy: 1,
  createdAt: -1,
});

typingExamSchema.index({
  "configSnapshot.examMetadata.state": 1,
  "configSnapshot.examMetadata.courtName": 1,
  status: 1,
});

typingExamSchema.index({
  "configSnapshot.language": 1,
  status: 1,
});

const TypingExam = models.TypingExam || model("TypingExam", typingExamSchema);

export default TypingExam;
