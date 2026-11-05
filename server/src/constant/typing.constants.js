export const GROUP_CODES = [
  "SSC",
  "RAILWAY",
  "CENTRAL_GOVT",
  "STATE_GOVT",
  "HIGH_COURT",
];

export const EXAM_TYPES = ["WORD", "CHARACTER", "HYBRID"];
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

export const POLICY_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];
export const VERIFICATION_STATUSES = ["NOT_VERIFIED", "VERIFIED", "REJECTED"];
export const ATTEMPT_STATUSES = [
  "IN_PROGRESS",
  "SUBMITTED",
  "EVALUATING",
  "COMPLETED",
  "EVALUATION_FAILED",
];

export const DEFAULT_GROUP_POLICY = {
  policyCode: "GROUP_DEFAULT",
  version: 1,
  status: "DRAFT",
  verificationStatus: "NOT_VERIFIED",
  examType: "WORD",
  measurement: {
    durationSeconds: 600,
    wordMethod: "SPACE_SEPARATED",
    wordLength: 5,
    characterUnit: "GRAPHEME_CLUSTERS",
    includeSpaces: true,
    includePunctuation: true,
    normalization: "NFC",
  },
  scoring: {
    grossSpeedSource: "TYPED_UNITS",
    netSpeedSource: "CORRECT_UNITS",
    penaltyMethod: "NONE",
    penaltyValue: 0,
    accuracyMethod: "CORRECT_OVER_TYPED",
  },
  qualification: {
    minimumSpeed: null,
    maximumErrorPercentage: null,
    requireAllConditions: true,
  },
  resultFields: [
    "grossSpeed",
    "netSpeed",
    "accuracy",
    "errorCount",
    "qualificationStatus",
  ],
};
