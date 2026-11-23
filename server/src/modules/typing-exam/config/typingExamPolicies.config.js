/**
 * Akshar AI - Typing Exam Policies
 *
 * Only policies with a known calculation rule should be marked VERIFIED.
 * Add new exams here instead of hard-coding formulas in controllers.
 */

export const POLICY_STATUS = Object.freeze({
  VERIFIED: "VERIFIED",
  PARTIALLY_VERIFIED: "PARTIALLY_VERIFIED",
  UNVERIFIED: "UNVERIFIED",
});

export const EXAM_TYPES = Object.freeze({
  WORD: "WORD",
  CHARACTER: "CHARACTER",
  HYBRID: "HYBRID",
});

export const POLICY_VERSION = "2.0.0";

export const TYPING_EXAM_POLICIES = Object.freeze({
  /*
   * =========================================================
   * BOMBAY HIGH COURT - CLERK
   * =========================================================
   */

  // src/config/typingExamPolicies.config.js

  BOMBAY_HIGH_COURT_CLERK_ENGLISH: {
    id: "BOMBAY_HIGH_COURT_CLERK_ENGLISH",

    status: POLICY_STATUS.VERIFIED,

    authority: "BOMBAY_HIGH_COURT",

    exam: "Bombay High Court Clerk",
    post: "Clerk",

    language: "english",
    examType: EXAM_TYPES.WORD,

    evaluator: "STANDARD_WORD",

    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 40,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "GROSS_WPM",

      penaltyMethod: "NOT_OFFICIALLY_VERIFIED",

      passageRequirement: {
        targetWords: 400,
        tolerance: null,
      },
    },

    qualification: {
      type: "MINIMUM_SPEED_AND_PASSING_MARKS",

      minimumWpm: 40,

      typingTestMarks: 20,
      minimumPassingMarks: 10,
    },

    inputRequirements: {
      keyboardLayout: "QWERTY",
      inputMethod: "PHYSICAL_KEYBOARD",

      captureKeyboardEvents: true,

      allowPaste: false,

      restrictions: {
        backspace: false,
        delete: false,
        spellCheck: false,
        wordAutoCompletion: false,
        wordSuggestion: false,
      },

      mode: "SCREEN_TO_SCREEN",
    },

    formula: {
      version: "1.0.0",
      type: "WORD_STANDARD",
      officialEnabled: true,

      grossWpm: "typedWords / timeMinutes",
      netWpm: "grossWpm",

      accuracy: "(correctWords / typedWords) * 100",

      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / expectedWords) * 100",

      marks: {
        type: "QUALIFYING_ONLY",
        maxMarks: 20,
        minimumPassingMarks: 10,
      },

      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title: "Bombay High Court Clerk Recruitment / Typing Test Notice",
      url: "https://bombayhighcourt.gov.in/",
    },

    verificationNote:
      "The official Clerk material establishes an English typing test of 400 words for 10 minutes, carrying 20 marks with 10 minimum passing marks. The complete official error/penalty calculation formula has not been established, so this policy remains PARTIALLY_VERIFIED.",
  },

  BOMBAY_HIGH_COURT_CLERK_MARATHI: {
    id: "BOMBAY_HIGH_COURT_CLERK_MARATHI",

    status: POLICY_STATUS.VERIFIED,

    authority: "BOMBAY_HIGH_COURT",

    exam: "Bombay High Court Clerk",
    post: "Clerk",

    language: "marathi",
    examType: EXAM_TYPES.WORD,

    evaluator: "STANDARD_WORD",

    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 30,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "GROSS_WPM",

      penaltyMethod: "NOT_OFFICIALLY_VERIFIED",

      passageRequirement: {
        targetWords: 300,
        tolerance: null,
      },
    },

    qualification: {
      type: "MINIMUM_SPEED_AND_PASSING_MARKS",

      minimumWpm: 30,

      typingTestMarks: 20,
      minimumPassingMarks: 10,
    },

    inputRequirements: {
      keyboardLayout: "KRUTI_DEV",
      inputMethod: "LEGACY_FONT",

      captureKeyboardEvents: true,

      allowPaste: false,

      restrictions: {
        backspace: false,
        delete: false,
        spellCheck: false,
        wordAutoCompletion: false,
        wordSuggestion: false,
      },

      mode: "SCREEN_TO_SCREEN",

      font: {
        family: "KRUTI_DEV-55",
        required: true,
      },
    },

    formula: {
      version: "1.0.0",
      type: "WORD_STANDARD",
      officialEnabled: true,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "grossWpm",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "NOT_OFFICIALLY_VERIFIED",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title: "Bombay High Court Marathi Typing Test Notice",
      url: "https://bombayhighcourt.gov.in/",
    },

    verificationNote:
      "Marathi typing has been officially used in Bombay High Court recruitment and an official notice for Junior Clerk specifies Kruti Dev-55. The exact current Clerk Marathi typing speed, passage length, marks and error/penalty formula must be verified against the specific recruitment notification before this policy can be marked VERIFIED.",
  },

  /*
   * =========================================================
   * MPSC GROUP C - CLERK-TYPIST
   * =========================================================
   */

  MPSC_GROUP_C_CLERK_TYPIST_ENGLISH: {
    id: "MPSC_GROUP_C_CLERK_TYPIST_ENGLISH",

    status: POLICY_STATUS.PARTIALLY_VERIFIED,

    authority: "MPSC",

    exam: "MPSC Group C",
    post: "Clerk-Typist",

    language: "english",
    examType: EXAM_TYPES.WORD,

    evaluator: "STANDARD_WORD",

    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 40,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "GROSS_WPM",

      penaltyMethod: "NOT_OFFICIALLY_VERIFIED",

      passageRequirement: {
        targetWords: null,
        tolerance: null,
      },
    },

    qualification: {
      type: "MINIMUM_SPEED",

      minimumWpm: 40,

      typingTestMarks: null,
      minimumPassingMarks: null,
    },

    inputRequirements: {
      keyboardLayout: "QWERTY",
      inputMethod: "PHYSICAL_KEYBOARD",

      captureKeyboardEvents: true,

      allowPaste: false,

      restrictions: {
        backspace: false,
        delete: false,
        spellCheck: false,
        wordAutoCompletion: false,
        wordSuggestion: false,
      },

      mode: "SCREEN_TO_SCREEN",
    },

    formula: {
      version: "1.0.0",
      type: "WORD_STANDARD",
      officialEnabled: false,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "grossWpm",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "NOT_OFFICIALLY_VERIFIED",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title: "MPSC Group C / Clerk-Typist Recruitment",
      url: "https://mpsc.gov.in/",
    },

    verificationNote:
      "The English typing requirement is reported as 40 WPM. The exact current recruitment-cycle passage length, test methodology, error calculation and penalty rules must be verified against the applicable official MPSC notification before this policy can be marked VERIFIED.",
  },

  MPSC_GROUP_C_CLERK_TYPIST_MARATHI: {
    id: "MPSC_GROUP_C_CLERK_TYPIST_MARATHI",

    status: POLICY_STATUS.PARTIALLY_VERIFIED,

    authority: "MPSC",

    exam: "MPSC Group C",
    post: "Clerk-Typist",

    language: "marathi",
    examType: EXAM_TYPES.WORD,

    evaluator: "STANDARD_WORD",

    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 30,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "GROSS_WPM",

      penaltyMethod: "NOT_OFFICIALLY_VERIFIED",

      passageRequirement: {
        targetWords: null,
        tolerance: null,
      },
    },

    qualification: {
      type: "MINIMUM_SPEED",

      minimumWpm: 30,

      typingTestMarks: null,
      minimumPassingMarks: null,
    },

    inputRequirements: {
      keyboardLayout: "REMINGTON",
      inputMethod: "UNICODE",

      captureKeyboardEvents: true,

      allowPaste: false,

      restrictions: {
        backspace: false,
        delete: false,
        spellCheck: false,
        wordAutoCompletion: false,
        wordSuggestion: false,
      },

      mode: "SCREEN_TO_SCREEN",
    },

    formula: {
      version: "1.0.0",
      type: "WORD_STANDARD",
      officialEnabled: false,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "grossWpm",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "NOT_OFFICIALLY_VERIFIED",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title: "MPSC Group C / Clerk-Typist Recruitment",
      url: "https://mpsc.gov.in/",
    },

    verificationNote:
      "The Marathi typing requirement is reported as 30 WPM. Marathi typing is associated with the Remington layout, but the exact current recruitment-cycle input method, passage length, test methodology, error calculation and penalty rules must be verified against the applicable official MPSC notification before this policy can be marked VERIFIED.",
  },

  /*
   * =========================================================
   * MPSC GROUP C - TAX ASSISTANT
   * =========================================================
   *
   * Tax Assistant is different from Clerk-Typist.
   * Keep it as a separate policy rather than reusing Clerk-Typist.
   */

  MPSC_GROUP_C_TAX_ASSISTANT_ENGLISH: {
    id: "MPSC_GROUP_C_TAX_ASSISTANT_ENGLISH",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,

    authority: "MPSC",
    exam: "MPSC Group C",
    post: "Tax Assistant",

    language: "english",
    examType: EXAM_TYPES.WORD,

    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 40,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "GROSS_WPM",
      penaltyMethod: "NOT_OFFICIALLY_VERIFIED",
    },

    qualification: {
      type: "MINIMUM_SPEED",
      minimumWpm: 40,
    },

    formula: {
      version: "1.0.0",
      type: "WORD_STANDARD",
      officialEnabled: false,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "grossWpm",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "NOT_OFFICIALLY_VERIFIED",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title: "MPSC Group C Tax Assistant Recruitment",
      url: "https://mpsc.gov.in/",
    },

    verificationNote:
      "English typing requirement is reported at 40 WPM. Complete current-cycle scoring rules require verification.",
  },

  MPSC_GROUP_C_TAX_ASSISTANT_MARATHI: {
    id: "MPSC_GROUP_C_TAX_ASSISTANT_MARATHI",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,

    authority: "MPSC",
    exam: "MPSC Group C",
    post: "Tax Assistant",

    language: "marathi",
    examType: EXAM_TYPES.WORD,

    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 30,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    inputRequirements: {
      keyboardLayout: "REMINGTON",
      inputMethod: "UNICODE",
      captureKeyboardEvents: false,
      allowPaste: false,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "GROSS_WPM",
      penaltyMethod: "NOT_OFFICIALLY_VERIFIED",
    },

    qualification: {
      type: "MINIMUM_SPEED",
      minimumWpm: 30,
    },

    formula: {
      version: "1.0.0",
      type: "WORD_STANDARD",
      officialEnabled: false,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "grossWpm",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "NOT_OFFICIALLY_VERIFIED",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title: "MPSC Group C Tax Assistant Recruitment",
      url: "https://mpsc.gov.in/",
    },

    verificationNote:
      "Marathi typing requirement is reported at 30 WPM. Complete current-cycle scoring rules require verification.",
  },

  /*
   * =========================================================
   * RAJASTHAN RSSB - LDC / JUNIOR ASSISTANT
   * =========================================================
   *
   * RSSB/RSMSSB official material confirms a Hindi + English
   * typing speed and efficiency test.
   *
   * Do NOT invent the exact WPM/error formula until the
   * applicable recruitment notification is fully verified.
   */

  RSSB_LDC_JUNIOR_ASSISTANT_HINDI: {
    id: "RSSB_LDC_JUNIOR_ASSISTANT_HINDI",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,

    authority: "RSSB",
    exam: "RSSB LDC / Junior Assistant",
    post: "Clerk Grade-II / Junior Assistant",

    language: "hindi",
    examType: EXAM_TYPES.WORD,

    durationSeconds: 600,

    target: {
      unit: "WPM",
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "POLICY_DEFINED",
      penaltyMethod: "POLICY_DEFINED",
    },

    qualification: {
      type: "TYPING_SPEED_AND_EFFICIENCY_TEST",
    },

    formula: {
      version: "1.0.0",
      type: "WORD_STANDARD",
      officialEnabled: false,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "correctWords / timeMinutes",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "NOT_OFFICIALLY_VERIFIED",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title:
        "RSSB Clerk Grade-II / Junior Assistant Typing Speed and Efficiency Test",
      url: "https://rsmssb.rajasthan.gov.in/",
    },

    verificationNote:
      "Official RSSB material confirms Hindi typing speed and efficiency testing. Exact current-cycle minimum speed and scoring formula must be established from the applicable recruitment notification before official calculation.",
  },

  RSSB_LDC_JUNIOR_ASSISTANT_ENGLISH: {
    id: "RSSB_LDC_JUNIOR_ASSISTANT_ENGLISH",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,

    authority: "RSSB",
    exam: "RSSB LDC / Junior Assistant",
    post: "Clerk Grade-II / Junior Assistant",

    language: "english",
    examType: EXAM_TYPES.WORD,

    durationSeconds: 600,

    target: {
      unit: "WPM",
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "POLICY_DEFINED",
      penaltyMethod: "POLICY_DEFINED",
    },

    qualification: {
      type: "TYPING_SPEED_AND_EFFICIENCY_TEST",
    },

    formula: {
      version: "1.0.0",
      type: "WORD_STANDARD",
      officialEnabled: false,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "correctWords / timeMinutes",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "NOT_OFFICIALLY_VERIFIED",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title:
        "RSSB Clerk Grade-II / Junior Assistant Typing Speed and Efficiency Test",
      url: "https://rsmssb.rajasthan.gov.in/",
    },

    verificationNote:
      "Official RSSB material confirms English typing speed and efficiency testing. Exact current-cycle minimum speed and scoring formula must be established from the applicable recruitment notification before official calculation.",
  },

  /*
   * =========================================================
   * RAJASTHAN RSSB - INFORMATICS ASSISTANT
   * =========================================================
   *
   * This one has a much clearer official rule in the
   * published Phase-II instructions.
   */

  RSSB_INFORMATICS_ASSISTANT_HINDI: {
    id: "RSSB_INFORMATICS_ASSISTANT_HINDI",
    status: POLICY_STATUS.VERIFIED,

    authority: "RSSB",
    exam: "Rajasthan Informatics Assistant",
    post: "Informatics Assistant",

    language: "hindi",
    examType: EXAM_TYPES.WORD,

    durationSeconds: 900,

    target: {
      unit: "WPM",
      minimum: 20,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "CORRECT_WORDS / TIME_MINUTES",
      penaltyMethod: "ERROR_ADJUSTED",
    },

    qualification: {
      type: "MINIMUM_NET_WPM",
      minimumWpm: 20,
    },

    formula: {
      version: "1.0.0",
      type: "WORD_CORRECT_SPEED",
      officialEnabled: true,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "correctWords / timeMinutes",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "QUALIFYING_ONLY",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title:
        "RSSB Informatics Assistant 2023 Phase-II Typing Speed Test Instructions",
      url: "https://rsmssb.rajasthan.gov.in/",
    },

    verificationNote:
      "Official RSSB instructions specify 15 minutes and minimum average typing speed of 20 correct words per minute in Hindi.",
  },

  RSSB_INFORMATICS_ASSISTANT_ENGLISH: {
    id: "RSSB_INFORMATICS_ASSISTANT_ENGLISH",
    status: POLICY_STATUS.VERIFIED,

    authority: "RSSB",
    exam: "Rajasthan Informatics Assistant",
    post: "Informatics Assistant",

    language: "english",
    examType: EXAM_TYPES.WORD,

    durationSeconds: 900,

    target: {
      unit: "WPM",
      minimum: 20,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "CORRECT_WORDS / TIME_MINUTES",
      penaltyMethod: "ERROR_ADJUSTED",
    },

    qualification: {
      type: "MINIMUM_NET_WPM",
      minimumWpm: 20,
    },

    formula: {
      version: "1.0.0",
      type: "WORD_CORRECT_SPEED",
      officialEnabled: true,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "correctWords / timeMinutes",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "QUALIFYING_ONLY",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title:
        "RSSB Informatics Assistant 2023 Phase-II Typing Speed Test Instructions",
      url: "https://rsmssb.rajasthan.gov.in/",
    },

    verificationNote:
      "Official RSSB instructions specify 15 minutes and minimum average typing speed of 20 correct words per minute in English.",
  },

  SSC_CHSL_LDC_JSA_ENGLISH: {
    id: "SSC_CHSL_LDC_JSA_ENGLISH",
    status: POLICY_STATUS.VERIFIED,
    authority: "SSC",
    exam: "SSC CHSL",
    post: "LDC/JSA",
    language: "english",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 35,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "GROSS_WPM",
      penaltyMethod: "NONE",
    },

    qualification: {
      type: "MINIMUM_SPEED",
      minimumWpm: 35,
    },

    formula: {
      version: "1.0.0",
      type: "WORD_STANDARD",
      officialEnabled: true,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "grossWpm",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "QUALIFYING_ONLY",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title: "SSC CHSL Notice",
      url: "https://ssc.gov.in/",
    },
  },

  SSC_CHSL_LDC_JSA_HINDI: {
    id: "SSC_CHSL_LDC_JSA_HINDI",
    status: POLICY_STATUS.VERIFIED,
    authority: "SSC",
    exam: "SSC CHSL",
    post: "LDC/JSA",
    language: "hindi",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 30,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      netSpeed: "GROSS_WPM",
      penaltyMethod: "NONE",
    },

    qualification: {
      type: "MINIMUM_SPEED",
      minimumWpm: 30,
    },

    formula: {
      version: "1.0.0",
      type: "WORD_STANDARD",
      officialEnabled: true,
      grossWpm: "typedWords / timeMinutes",
      netWpm: "grossWpm",
      accuracy: "(correctWords / typedWords) * 100",
      errorPercentage:
        "((incorrectWords + missingWords + extraWords) / typedWords) * 100",
      marks: "QUALIFYING_ONLY",
      qualification: "netWpm >= qualification.minimumWpm",
    },

    officialSource: {
      title: "SSC CHSL Notice",
      url: "https://ssc.gov.in/",
    },
  },

  RRB_NTPC_UG_ENGLISH: {
    id: "RRB_NTPC_UG_ENGLISH",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,
    authority: "RRB",
    exam: "RRB NTPC Undergraduate",
    post: "Junior Clerk / Accounts Clerk and applicable typing posts",
    language: "english",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 30,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    errorRules: {
      fullMistakeWeight: 1,
      halfMistakeWeight: 0.5,
      ignoredErrorPercentage: 5,
      penaltyWordsPerFinalMistake: 10,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      finalMistakes: "MAX(0, TOTAL_MISTAKE_WEIGHT - TOTAL_WORDS * 0.05)",
      netSpeed: "(TOTAL_WORDS - FINAL_MISTAKES * 10) / TIME_MINUTES",
      penaltyMethod: "10_WORDS_PER_FINAL_MISTAKE",
    },

    qualification: {
      type: "MINIMUM_NET_WPM",
      minimumWpm: 30,
    },

    formula: {
      version: "1.0.0",
      type: "RRB_WORD_PENALTY",
      officialEnabled: false,
      grossWpm: "typedWords / timeMinutes",
      mistakeWeight: "(fullMistakes * 1) + (halfMistakes * 0.5)",
      ignoredMistakes: "typedWords * 0.05",
      finalMistakes: "MAX(0, mistakeWeight - ignoredMistakes)",
      penaltyWords: "finalMistakes * 10",
      netWpm: "(typedWords - penaltyWords) / timeMinutes",
      accuracy: "(correctWords / typedWords) * 100",
      marks: "QUALIFYING_ONLY",
      qualification: "netWpm >= qualification.minimumWpm",
      note: "Exact official RRB mistake classification must be implemented before official calculation is enabled.",
    },

    officialSource: {
      title: "RRB NTPC CBTST Instructions",
      url: "https://www.rrbcdg.gov.in/",
    },
  },

  RRB_NTPC_UG_HINDI: {
    id: "RRB_NTPC_UG_HINDI",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,
    authority: "RRB",
    exam: "RRB NTPC Undergraduate",
    post: "Junior Clerk / Accounts Clerk and applicable typing posts",
    language: "hindi",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 25,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    errorRules: {
      fullMistakeWeight: 1,
      halfMistakeWeight: 0.5,
      ignoredErrorPercentage: 5,
      penaltyWordsPerFinalMistake: 10,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      finalMistakes: "MAX(0, TOTAL_MISTAKE_WEIGHT - TOTAL_WORDS * 0.05)",
      netSpeed: "(TOTAL_WORDS - FINAL_MISTAKES * 10) / TIME_MINUTES",
      penaltyMethod: "10_WORDS_PER_FINAL_MISTAKE",
    },

    qualification: {
      type: "MINIMUM_NET_WPM",
      minimumWpm: 25,
    },

    formula: {
      version: "1.0.0",
      type: "RRB_WORD_PENALTY",
      officialEnabled: false,
      grossWpm: "typedWords / timeMinutes",
      mistakeWeight: "(fullMistakes * 1) + (halfMistakes * 0.5)",
      ignoredMistakes: "typedWords * 0.05",
      finalMistakes: "MAX(0, mistakeWeight - ignoredMistakes)",
      penaltyWords: "finalMistakes * 10",
      netWpm: "(typedWords - penaltyWords) / timeMinutes",
      accuracy: "(correctWords / typedWords) * 100",
      marks: "QUALIFYING_ONLY",
      qualification: "netWpm >= qualification.minimumWpm",
      note: "Exact official RRB mistake classification must be implemented before official calculation is enabled.",
    },

    officialSource: {
      title: "RRB NTPC CBTST Instructions",
      url: "https://www.rrbcdg.gov.in/",
    },
  },

  RRB_NTPC_GRADUATE_ENGLISH: {
    id: "RRB_NTPC_GRADUATE_ENGLISH",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,
    authority: "RRB",
    exam: "RRB NTPC Graduate",
    post: "Applicable typing posts",
    language: "english",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 30,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    errorRules: {
      fullMistakeWeight: 1,
      halfMistakeWeight: 0.5,
      ignoredErrorPercentage: 5,
      penaltyWordsPerFinalMistake: 10,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      finalMistakes: "MAX(0, TOTAL_MISTAKE_WEIGHT - TOTAL_WORDS * 0.05)",
      netSpeed: "(TOTAL_WORDS - FINAL_MISTAKES * 10) / TIME_MINUTES",
      penaltyMethod: "10_WORDS_PER_FINAL_MISTAKE",
    },

    qualification: {
      type: "MINIMUM_NET_WPM",
      minimumWpm: 30,
    },

    formula: {
      version: "1.0.0",
      type: "RRB_WORD_PENALTY",
      officialEnabled: false,
      grossWpm: "typedWords / timeMinutes",
      mistakeWeight: "(fullMistakes * 1) + (halfMistakes * 0.5)",
      ignoredMistakes: "typedWords * 0.05",
      finalMistakes: "MAX(0, mistakeWeight - ignoredMistakes)",
      penaltyWords: "finalMistakes * 10",
      netWpm: "(typedWords - penaltyWords) / timeMinutes",
      accuracy: "(correctWords / typedWords) * 100",
      marks: "QUALIFYING_ONLY",
      qualification: "netWpm >= qualification.minimumWpm",
      note: "Exact official RRB mistake classification must be implemented before official calculation is enabled.",
    },

    officialSource: {
      title: "RRB NTPC CBTST Instructions",
      url: "https://www.rrbcdg.gov.in/",
    },
  },

  RRB_NTPC_GRADUATE_HINDI: {
    id: "RRB_NTPC_GRADUATE_HINDI",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,
    authority: "RRB",
    exam: "RRB NTPC Graduate",
    post: "Applicable typing posts",
    language: "hindi",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimum: 25,
    },

    counting: {
      wordMethod: "SPACE_SEPARATED",
      caseSensitive: false,
      punctuationSensitive: true,
    },

    errorRules: {
      fullMistakeWeight: 1,
      halfMistakeWeight: 0.5,
      ignoredErrorPercentage: 5,
      penaltyWordsPerFinalMistake: 10,
    },

    scoring: {
      grossSpeed: "TOTAL_WORDS / TIME_MINUTES",
      finalMistakes: "MAX(0, TOTAL_MISTAKE_WEIGHT - TOTAL_WORDS * 0.05)",
      netSpeed: "(TOTAL_WORDS - FINAL_MISTAKES * 10) / TIME_MINUTES",
      penaltyMethod: "10_WORDS_PER_FINAL_MISTAKE",
    },

    qualification: {
      type: "MINIMUM_NET_WPM",
      minimumWpm: 25,
    },

    formula: {
      version: "1.0.0",
      type: "RRB_WORD_PENALTY",
      officialEnabled: false,
      grossWpm: "typedWords / timeMinutes",
      mistakeWeight: "(fullMistakes * 1) + (halfMistakes * 0.5)",
      ignoredMistakes: "typedWords * 0.05",
      finalMistakes: "MAX(0, mistakeWeight - ignoredMistakes)",
      penaltyWords: "finalMistakes * 10",
      netWpm: "(typedWords - penaltyWords) / timeMinutes",
      accuracy: "(correctWords / typedWords) * 100",
      marks: "QUALIFYING_ONLY",
      qualification: "netWpm >= qualification.minimumWpm",
      note: "Exact official RRB mistake classification must be implemented before official calculation is enabled.",
    },

    officialSource: {
      title: "RRB NTPC CBTST Instructions",
      url: "https://www.rrbcdg.gov.in/",
    },
  },

  SSC_CGL_DEST: {
    id: "SSC_CGL_DEST",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,
    authority: "SSC",
    exam: "SSC CGL",
    post: "Applicable posts requiring DEST",
    language: "english",
    examType: EXAM_TYPES.CHARACTER,
    durationSeconds: 900,

    target: {
      unit: "KEY_DEPRESSIONS",
      expectedKeyDepressions: 2000,
    },

    counting: {
      characterMethod: "KEY_EVENTS",
      includeSpaces: true,
      includePunctuation: true,
      normalization: "NFC",
    },

    scoring: {
      measurement: "KEY_DEPRESSIONS",
      qualification: "QUALIFYING_SKILL_TEST",
    },

    qualification: {
      type: "QUALIFYING_SKILL_TEST",
    },

    formula: {
      version: "1.0.0",
      type: "CHARACTER_KDPH",
      officialEnabled: false,
      grossKdph: "typedKeyDepressions / timeHours",
      netKdph: "correctKeyDepressions / timeHours",
      accuracy: "(correctKeyDepressions / typedKeyDepressions) * 100",
      marks: "QUALIFYING_ONLY",
      qualification: "POLICY_DEFINED",
      note: "Exact DEST qualification/error methodology must be verified for the applicable recruitment cycle before official calculation is enabled.",
    },

    officialSource: {
      title: "SSC CGL Notice",
      url: "https://ssc.gov.in/",
    },
  },

  SSC_STENOGRAPHER_GRADE_C: {
    id: "SSC_STENOGRAPHER_GRADE_C",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,
    authority: "SSC",
    exam: "SSC Stenographer",
    post: "Grade C",
    language: "english",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimumDictationWpm: 100,
    },

    stenography: {
      dictationWpm: 100,
      dictationMinutes: 10,
      transcription: true,
    },

    scoring: {
      errorPercentage:
        "(FULL_MISTAKES + HALF_MISTAKES / 2) * 100 / MASTER_WORDS",
    },

    qualification: {
      type: "TRANSCRIPTION_ERROR_THRESHOLD",
    },

    formula: {
      version: "1.0.0",
      type: "STENOGRAPHY",
      officialEnabled: false,
      dictationWpm: "configured",
      errorPercentage:
        "((fullMistakes + (halfMistakes / 2)) * 100) / masterWords",
      marks: "QUALIFYING_ONLY",
      qualification: "TRANSCRIPTION_ERROR_THRESHOLD",
      note: "Exact current-cycle transcription error limits and mistake classification must be verified before official calculation is enabled.",
    },

    officialSource: {
      title: "SSC Stenographer Notice / Evaluation Instructions",
      url: "https://ssc.gov.in/",
    },
  },

  SSC_STENOGRAPHER_GRADE_D: {
    id: "SSC_STENOGRAPHER_GRADE_D",
    status: POLICY_STATUS.PARTIALLY_VERIFIED,
    authority: "SSC",
    exam: "SSC Stenographer",
    post: "Grade D",
    language: "english",
    examType: EXAM_TYPES.WORD,
    durationSeconds: 600,

    target: {
      unit: "WPM",
      minimumDictationWpm: 80,
    },

    stenography: {
      dictationWpm: 80,
      dictationMinutes: 10,
      transcription: true,
    },

    scoring: {
      errorPercentage:
        "(FULL_MISTAKES + HALF_MISTAKES / 2) * 100 / MASTER_WORDS",
    },

    qualification: {
      type: "TRANSCRIPTION_ERROR_THRESHOLD",
    },

    formula: {
      version: "1.0.0",
      type: "STENOGRAPHY",
      officialEnabled: false,
      dictationWpm: "configured",
      errorPercentage:
        "((fullMistakes + (halfMistakes / 2)) * 100) / masterWords",
      marks: "QUALIFYING_ONLY",
      qualification: "TRANSCRIPTION_ERROR_THRESHOLD",
      note: "Exact current-cycle transcription error limits and mistake classification must be verified before official calculation is enabled.",
    },

    officialSource: {
      title: "SSC Stenographer Notice / Evaluation Instructions",
      url: "https://ssc.gov.in/",
    },
  },
});

export function getTypingPolicy(policyId) {
  return TYPING_EXAM_POLICIES[policyId] ?? null;
}

export function listVerifiedPolicies() {
  return Object.values(TYPING_EXAM_POLICIES).filter(
    (policy) => policy.status === POLICY_STATUS.VERIFIED,
  );
}

export function assertOfficialCalculationPolicy(policyId) {
  const policy = getTypingPolicy(policyId);

  if (!policy) {
    throw new Error(`Unknown typing policy: ${policyId}`);
  }

  if (policy.status !== POLICY_STATUS.VERIFIED) {
    throw new Error(
      `Policy ${policyId} is ${policy.status}. Official result calculation is disabled.`,
    );
  }

  if (!policy.formula || policy.formula.officialEnabled !== true) {
    throw new Error(
      `Policy ${policyId} does not have an enabled official calculation formula.`,
    );
  }

  return policy;
}

export function assertVerifiedPolicy(policyId) {
  const policy = getTypingPolicy(policyId);

  if (!policy) {
    throw new Error(`Unknown typing policy: ${policyId}`);
  }

  if (policy.status !== POLICY_STATUS.VERIFIED) {
    throw new Error(
      `Policy ${policyId} is ${policy.status}. Official result calculation is disabled.`,
    );
  }

  return policy;
}
