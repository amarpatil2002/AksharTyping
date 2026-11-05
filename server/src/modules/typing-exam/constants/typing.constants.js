export const EXAM_TYPES = Object.freeze(["WORD", "CHARACTER", "HYBRID"]);
export const LANGUAGES = Object.freeze([
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
export const MEASUREMENT_UNITS = Object.freeze([
  "WPM",
  "CPM",
  "KDPH",
  "WORDS",
  "CHARACTERS",
  "KEY_DEPRESSIONS",
]);
export const COUNTING_METHODS = Object.freeze([
  "SPACE_SEPARATED",
  "STANDARD_WORD",
  "TOKEN_BASED",
  "PASSAGE_ALIGNMENT",
]);
export const CHARACTER_UNITS = Object.freeze([
  "GRAPHEME_CLUSTERS",
  "UNICODE_CODE_POINTS",
  "UTF16_CODE_UNITS",
  "KEY_EVENTS",
]);
export const NORMALIZATIONS = Object.freeze([
  "NFC",
  "NFD",
  "NFKC",
  "NFKD",
  "NONE",
]);
export const PENALTY_METHODS = Object.freeze([
  "NONE",
  "FIXED_PER_ERROR",
  "GROUPED_ERRORS",
  "PERCENTAGE",
  "POLICY_DEFINED",
]);
export const SPEED_METHODS = Object.freeze([
  "TOTAL_WORDS",
  "TOTAL_CHARACTERS",
  "TOTAL_KEY_DEPRESSIONS",
  "CORRECT_WORDS",
  "CORRECT_CHARACTERS",
  "GROSS_MINUS_PENALTY",
  "POLICY_DEFINED",
]);
export const ERROR_METHODS = Object.freeze([
  "WORD_BASED",
  "CHARACTER_BASED",
  "STROKE_BASED",
  "FULL_HALF",
  "POLICY_DEFINED",
]);
export const ROUNDING_METHODS = Object.freeze([
  "ROUND",
  "FLOOR",
  "CEIL",
  "TRUNCATE",
]);
export const RESULT_STATUSES = Object.freeze([
  "PASS",
  "FAIL",
  "QUALIFIED",
  "NOT_QUALIFIED",
  "INCOMPLETE",
]);
