export const EXAM_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
});

export const PASSAGE_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

export const SUPPORTED_EXAM_TYPES = Object.freeze([
  "WORD",
  "CHARACTER",
  "HYBRID",
]);

export const SUPPORTED_LANGUAGES = Object.freeze([
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
]);

export const MAX_PASSAGE_CONTENT_LENGTH = 50000;
