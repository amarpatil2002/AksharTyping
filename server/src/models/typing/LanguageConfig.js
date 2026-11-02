import mongoose from "mongoose";

const { Schema } = mongoose;

const languageConfigSchema = new Schema(
  {
    languageCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    languageName: {
      type: String,
      required: true,
      trim: true,
    },

    nativeName: {
      type: String,
      required: true,
      trim: true,
    },

    script: {
      type: String,
      required: true,
      trim: true,
    },

    direction: {
      type: String,
      enum: ["LTR", "RTL"],
      default: "LTR",
    },

    unicode: {
      enabled: {
        type: Boolean,
        default: true,
      },

      normalization: {
        type: String,
        enum: ["NFC", "NFD", "NFKC", "NFKD"],
        default: "NFC",
      },
    },

    supportedInputMethods: [
      {
        type: String,
        enum: [
          "INSCRIPT",
          "REMIINGTON",
          "PHONETIC",
          "TRANSLITERATION",
          "TYPEWRITER",
          "CUSTOM",
        ],
      },
    ],

    supportedLayouts: [
      {
        type: String,
        trim: true,
      },
    ],

    counting: {
      unit: {
        type: String,
        enum: ["WORD", "GRAPHEME", "CODE_POINT", "KEYSTROKE"],
        default: "GRAPHEME",
      },

      useGraphemeSegmentation: {
        type: Boolean,
        default: true,
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
    strict: "throw",
  },
);

const LanguageConfig =
  mongoose.models.LanguageConfig ||
  mongoose.model("LanguageConfig", languageConfigSchema);

export default LanguageConfig;
