const typingPassageSchema = new Schema(
  {
    /* =====================================================
       BASIC INFORMATION
    ===================================================== */

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
      maxlength: 1000,
      default: null,
    },

    /* =====================================================
       PASSAGE CONTENT
    ===================================================== */

    content: {
      type: String,
      required: true,
      maxlength: MAX_PASSAGE_LENGTH,
      validate: {
        validator: (value) =>
          typeof value === "string" && value.trim().length > 0,

        message: "Passage content cannot be empty.",
      },
    },

    language: {
      type: String,
      required: true,
      lowercase: true,
      enum: LANGUAGES,
      index: true,
    },

    script: {
      type: String,
      enum: [
        "LATIN",
        "DEVANAGARI",
        "BENGALI",
        "GUJARATI",
        "GURMUKHI",
        "KANNADA",
        "MALAYALAM",
        "ODIA",
        "TAMIL",
        "TELUGU",
        "URDU",
        "OTHER",
      ],
      default: "LATIN",
    },

    normalization: {
      type: String,
      enum: ["NFC", "NFD", "NONE"],
      default: "NFC",
    },

    /* =====================================================
       PASSAGE STATISTICS
    ===================================================== */

    statistics: {
      wordCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      characterCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      graphemeCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      codePointCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      utf16Length: {
        type: Number,
        min: 0,
        default: 0,
      },

      lineCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      paragraphCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      estimatedTypingSeconds: {
        type: Number,
        min: 0,
        default: null,
      },
    },

    /* =====================================================
       CLASSIFICATION
    ===================================================== */

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    difficulty: {
      type: String,
      enum: ["BEGINNER", "EASY", "MEDIUM", "HARD", "EXPERT"],
      default: "MEDIUM",
      index: true,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 50,
      },
    ],

    /* =====================================================
       EXAM COMPATIBILITY
    ===================================================== */

    examTypes: [
      {
        type: String,
        enum: EXAM_TYPES,
      },
    ],

    supportedKeyboardLayouts: [
      {
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
      },
    ],

    supportedInputMethods: [
      {
        type: String,
        enum: ["UNICODE", "LEGACY_FONT", "IME", "PHYSICAL_KEYBOARD", "OTHER"],
      },
    ],

    /* =====================================================
       SOURCE INFORMATION
    ===================================================== */

    source: {
      type: String,
      enum: [
        "ORIGINAL",
        "OFFICIAL",
        "PUBLIC_DOMAIN",
        "ADMIN_CREATED",
        "IMPORTED",
        "OTHER",
      ],
      default: "ADMIN_CREATED",
    },

    sourceTitle: {
      type: String,
      trim: true,
      maxlength: 250,
      default: null,
    },

    sourceUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    /* =====================================================
       STATUS
    ===================================================== */

    status: {
      type: String,
      enum: ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
       USAGE STATISTICS
    ===================================================== */

    usage: {
      totalAttempts: {
        type: Number,
        min: 0,
        default: 0,
      },

      completedAttempts: {
        type: Number,
        min: 0,
        default: 0,
      },

      averageAccuracy: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      averageSpeed: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    /* =====================================================
       AUDIT
    ===================================================== */

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

/* =========================================================
   VALIDATION
========================================================= */

typingPassageSchema.pre("validate", function () {
  if (this.content) {
    const normalizedContent =
      this.normalization === "NONE"
        ? this.content
        : this.content.normalize(this.normalization);

    if (normalizedContent.length > MAX_PASSAGE_LENGTH) {
      this.invalidate("content", "Passage exceeds maximum allowed length.");
    }
  }

  if (this.usage?.completedAttempts > this.usage?.totalAttempts) {
    this.invalidate(
      "usage.completedAttempts",
      "Completed attempts cannot exceed total attempts.",
    );
  }

  if (this.status === "PUBLISHED" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

/* =========================================================
   INDEXES
========================================================= */

typingPassageSchema.index({ slug: 1 }, { unique: true });

typingPassageSchema.index({
  language: 1,
  category: 1,
  difficulty: 1,
  status: 1,
  isActive: 1,
});

typingPassageSchema.index({
  language: 1,
  examTypes: 1,
  status: 1,
});

typingPassageSchema.index({
  tags: 1,
  language: 1,
});

/* =========================================================
   MODEL
========================================================= */

const TypingPassage =
  models.TypingPassage || model("TypingPassage", typingPassageSchema);

export default TypingPassage;
