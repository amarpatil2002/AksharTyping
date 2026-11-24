const {
  EXAM_TYPES,
  POLICY_STATUS,
} = require("../config/typing.constants");

const POLICY_VERSION = "1.0.0";
const ENGINE_VERSION = "1.0.0";

const TYPING_RULES = Object.freeze({
  BHC_CLERK_ENGLISH: {
    id: "BHC_CLERK_ENGLISH",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,
    authority: "BOMBAY_HIGH_COURT",
    exam: "Bombay High Court Clerk",
    post: "Clerk",
    language: "english",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,
    passage: { requiredWords: 400 },
    target: { unit: "WPM", minimum: 40 },
    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: true,
      punctuationSensitive: true,
    },
    scoring: {
      type: "OFFICIAL_MARKS",
      maximumMarks: 20,
      minimumPassingMarks: 10,
      formulaAvailable: false,
      formula: null,
    },
    qualification: {
      type: "MINIMUM_MARKS",
      minimumMarks: 10,
    },
    testRules: {
      backspaceAllowed: false,
      deleteAllowed: false,
      spellCheckAllowed: false,
      wordSuggestionAllowed: false,
    },
    officialSource: {
      name: "Bombay High Court",
      url: "https://bombayhighcourt.gov.in/",
    },
  },

  MPSC_GROUP_C_CLERK_TYPIST_MARATHI: {
    id: "MPSC_GROUP_C_CLERK_TYPIST_MARATHI",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,
    authority: "MPSC",
    exam: "Maharashtra Group C Services",
    post: "Clerk-Typist",
    language: "marathi",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,
    passage: { requiredWords: 300 },
    target: {
      unit: "WPM",
      minimum: 30,
      keyDepressions: { minimum: 1500 },
    },
    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
      mistakes: ["OMISSION", "SUBSTITUTION", "ADDITION"],
    },
    scoring: {
      type: "QUALIFYING",
      formulaAvailable: true,
      formula: {
        speed: "CORRECT_WORDS / TIME_MINUTES",
        mistakePercentage:
          "TOTAL_ERRORS / MAX(EXPECTED_WORDS,TYPED_WORDS) * 100",
        minimumWpm: 30,
        maximumMistakePercentage: 7,
        qualifying: {
          default: { minimumCorrectWords: 279 },
          reserved: { minimumCorrectWords: 270 },
        },
      },
      maximumMarks: 0,
    },
    qualification: {
      type: "SPEED_AND_ERROR",
      default: {
        minimumWpm: 30,
        maximumMistakePercentage: 7,
        minimumCorrectWords: 279,
      },
      reserved: {
        minimumWpm: 30,
        maximumMistakePercentage: 7,
        minimumCorrectWords: 270,
      },
    },
    keyboard: { layout: "REMINGTON_MARATHI" },
    testRules: {
      backspaceAllowed: true,
      navigationKeysAllowed: false,
      arrowKeysAllowed: false,
    },
    officialSource: {
      name: "MPSC",
      url: "https://mpsc.gov.in/",
    },
  },

  MPSC_GROUP_C_CLERK_TYPIST_ENGLISH: {
    id: "MPSC_GROUP_C_CLERK_TYPIST_ENGLISH",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,
    authority: "MPSC",
    exam: "Maharashtra Group C Services",
    post: "Clerk-Typist",
    language: "english",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,
    passage: { requiredWords: 400 },
    target: {
      unit: "WPM",
      minimum: 40,
      keyDepressions: { minimum: 2000 },
    },
    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: true,
      punctuationSensitive: true,
      mistakes: ["OMISSION", "SUBSTITUTION", "ADDITION"],
    },
    scoring: {
      type: "QUALIFYING",
      formulaAvailable: true,
      formula: {
        speed: "CORRECT_WORDS / TIME_MINUTES",
        mistakePercentage:
          "TOTAL_ERRORS / MAX(EXPECTED_WORDS,TYPED_WORDS) * 100",
        minimumWpm: 40,
        maximumMistakePercentage: 7,
        qualifying: {
          default: { minimumCorrectWords: 372 },
          reserved: { minimumCorrectWords: 360 },
        },
      },
      maximumMarks: 0,
    },
    qualification: {
      type: "SPEED_AND_ERROR",
      default: {
        minimumWpm: 40,
        maximumMistakePercentage: 7,
        minimumCorrectWords: 372,
      },
      reserved: {
        minimumWpm: 40,
        maximumMistakePercentage: 7,
        minimumCorrectWords: 360,
      },
    },
    keyboard: { layout: "ENGLISH_US_QWERTY" },
    testRules: {
      backspaceAllowed: true,
      navigationKeysAllowed: false,
      arrowKeysAllowed: false,
    },
    officialSource: {
      name: "MPSC",
      url: "https://mpsc.gov.in/",
    },
  },
});

function getTypingRule(policyId) {
  if (!policyId) throw new Error("policyId is required");
  const rule = TYPING_RULES[policyId];
  if (!rule) throw new Error(`Typing policy '${policyId}' does not exist`);
  return rule;
}

function getAllTypingRules() {
  return Object.values(TYPING_RULES);
}

module.exports = {
  POLICY_VERSION,
  ENGINE_VERSION,
  TYPING_RULES,
  getTypingRule,
  getAllTypingRules,
};
