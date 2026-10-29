// import type {
//   CreateTypingExamConfigPayload,
//   ExamMetadata,
//   PassageSettings,
//   EvaluationRules,
//   ExamInterface,
//   ExamWorkflow,
//   AnalyticsSettings,
// } from "../types/config.types";

// export const DEFAULT_EXAM_METADATA: ExamMetadata = {
//   country: "India",
//   state: "Maharashtra",
//   jurisdiction: "Bombay High Court",
//   recruitmentAuthority: "High Court of Judicature at Bombay",
//   courtName: "Bombay High Court",
//   postName: "Clerk",
//   examCategory: "typing",
//   examStage: "typing_test",
//   notificationNumber: "",
//   officialSourceUrl: "",
//   officialRulesVerified: false,
//   ruleVersion: "",
//   notes:
//     "Practice configuration. Verify official recruitment requirements before using for an actual examination.",
// };

// export const DEFAULT_PASSAGE_SETTINGS: PassageSettings = {
//   sourceType: "fixed",
//   expectedLineCount: 10,
//   preserveLineBreaks: true,
//   allowParagraphs: true,
//   allowNumbers: true,
//   allowPunctuation: true,
// };

// export const DEFAULT_EVALUATION_RULES: EvaluationRules = {
//   strategy: "gross_net_wpm",
//   wordLength: 5,
//   wpmMethod: "net",
//   accuracyMethod: "allCharacters",
//   minimumWpm: 30,
//   minimumAccuracy: 90,
//   passingMode: "all",
//   countPunctuation: true,
//   ignoreRepeatedSpaces: false,
//   ignoreCase: false,
//   errorPenaltyPerError: 0,
//   qualificationOnly: false,
//   allowIncompletePassage: true,
// };

// export const DEFAULT_EXAM_INTERFACE: ExamInterface = {
//   allowBackspace: true,
//   allowDelete: true,
//   allowArrowKeys: true,
//   allowNavigationKeys: true,
//   allowHomeEnd: true,
//   allowPaste: false,
//   allowCopy: false,
//   allowCut: false,
//   allowContextMenu: false,
//   allowUndo: true,
//   showReferencePassage: true,
//   autoSubmitOnTimeout: true,
//   showTimer: true,
//   showLiveWpm: true,
//   showLiveAccuracy: true,
//   showErrorCount: true,
//   enableSpellcheck: false,
//   requireFullscreen: false,
//   preventTextSelection: false,
//   inputMode: "restricted",
// };

// export const DEFAULT_EXAM_WORKFLOW: ExamWorkflow = {
//   stages: [
//     {
//       key: "read_instructions",
//       type: "instructions",
//       enabled: true,
//       required: true,
//     },
//     {
//       key: "check_keyboard",
//       type: "keyboard_test",
//       enabled: true,
//       required: true,
//       durationSeconds: 30,
//     },
//     {
//       key: "english_typing",
//       type: "typing_test",
//       enabled: true,
//       required: true,
//       durationSeconds: 600,
//     },
//     {
//       key: "review_submission",
//       type: "submission",
//       enabled: true,
//       required: true,
//     },
//     {
//       key: "view_result",
//       type: "result",
//       enabled: true,
//       required: true,
//     },
//   ],
// };

// export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
//   recordIntervalSeconds: 5,
//   showSpeedTimeline: true,
//   showAccuracyTimeline: true,
//   showErrorAnalysis: true,
//   showImprovementPlan: true,
//   storeKeystrokeTimeline: true,
// };

// export const DEFAULT_CONFIG_VALUES: CreateTypingExamConfigPayload = {
//   name: "Bombay High Court Clerk English Typing",
//   description:
//     "English typing test configuration for clerk examination practice.",
//   language: "en",
//   durationSeconds: 600,
//   targetWpm: 40,
//   examMetadata: { ...DEFAULT_EXAM_METADATA },
//   passageSettings: { ...DEFAULT_PASSAGE_SETTINGS },
//   instructions: [
//     "Read the instructions carefully before starting.",
//     "Type the displayed passage accurately.",
//     "Avoid unnecessary corrections and spelling errors.",
//     "Submit your test before the timer expires.",
//   ],
//   evaluationRules: { ...DEFAULT_EVALUATION_RULES },
//   examInterface: { ...DEFAULT_EXAM_INTERFACE },
//   examWorkflow: {
//     stages: DEFAULT_EXAM_WORKFLOW.stages.map((stage) => ({
//       ...stage,
//     })),
//   },
//   analyticsSettings: { ...DEFAULT_ANALYTICS_SETTINGS },
// };

// Bombay high court

import type {
  CreateTypingExamConfigPayload,
  ExamMetadata,
  PassageSettings,
  EvaluationRules,
  ExamInterface,
  ExamWorkflow,
  AnalyticsSettings,
  ExamLanguage,
} from "../types/config.types";

// ============================================================
// DEFAULT EXAM SETTINGS
// ============================================================

export const DEFAULT_EXAM_METADATA: ExamMetadata = {
  country: "India",
  state: "Maharashtra",
  jurisdiction: "Bombay High Court",
  recruitmentAuthority: "High Court of Judicature at Bombay",
  courtName: "Bombay High Court",
  postName: "Clerk",
  examCategory: "typing",
  examStage: "typing_test",
  notificationNumber: "",
  officialSourceUrl: "",
  officialRulesVerified: false,
  ruleVersion: "",
  notes:
    "Practice configuration. Verify official recruitment requirements before using for an actual examination.",
};

export const DEFAULT_PASSAGE_SETTINGS: PassageSettings = {
  sourceType: "fixed",
  expectedLineCount: 10,
  preserveLineBreaks: true,
  allowParagraphs: true,
  allowNumbers: true,
  allowPunctuation: true,
};

export const DEFAULT_EVALUATION_RULES: EvaluationRules = {
  strategy: "gross_net_wpm",
  wordLength: 5,
  wpmMethod: "net",
  accuracyMethod: "allCharacters",
  minimumWpm: 30,
  minimumAccuracy: 90,
  passingMode: "all",
  countPunctuation: true,
  ignoreRepeatedSpaces: false,
  ignoreCase: false,
  errorPenaltyPerError: 0,
  qualificationOnly: false,
  allowIncompletePassage: true,
};

export const DEFAULT_EXAM_INTERFACE: ExamInterface = {
  allowBackspace: true,
  allowDelete: true,
  allowArrowKeys: true,
  allowNavigationKeys: true,
  allowHomeEnd: true,
  allowPaste: false,
  allowCopy: false,
  allowCut: false,
  allowContextMenu: false,
  allowUndo: true,
  showReferencePassage: true,
  autoSubmitOnTimeout: true,
  showTimer: true,
  showLiveWpm: true,
  showLiveAccuracy: true,
  showErrorCount: true,
  enableSpellcheck: false,
  requireFullscreen: false,
  preventTextSelection: false,
  inputMode: "restricted",
};

export const DEFAULT_EXAM_WORKFLOW: ExamWorkflow = {
  stages: [
    {
      key: "read_instructions",
      type: "instructions",
      enabled: true,
      required: true,
    },
    {
      key: "check_keyboard",
      type: "keyboard_test",
      enabled: true,
      required: true,
      durationSeconds: 30,
    },
    {
      key: "english_typing",
      type: "typing_test",
      enabled: true,
      required: true,
      durationSeconds: 600,
    },
    {
      key: "review_submission",
      type: "submission",
      enabled: true,
      required: true,
    },
    {
      key: "view_result",
      type: "result",
      enabled: true,
      required: true,
    },
  ],
};

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  recordIntervalSeconds: 5,
  showSpeedTimeline: true,
  showAccuracyTimeline: true,
  showErrorAnalysis: true,
  showImprovementPlan: true,
  storeKeystrokeTimeline: true,
};

// ============================================================
// ORIGINAL DEFAULT CONFIGURATION
// ============================================================

export const DEFAULT_CONFIG_VALUES: CreateTypingExamConfigPayload = {
  name: "Bombay High Court Clerk English Typing",
  description:
    "English typing test configuration for clerk examination practice.",
  language: "en",
  durationSeconds: 600,
  targetWpm: 40,
  examMetadata: { ...DEFAULT_EXAM_METADATA },
  passageSettings: { ...DEFAULT_PASSAGE_SETTINGS },
  instructions: [
    "Read the instructions carefully before starting.",
    "Type the displayed passage accurately.",
    "Avoid unnecessary corrections and spelling errors.",
    "Submit your test before the timer expires.",
  ],
  evaluationRules: { ...DEFAULT_EVALUATION_RULES },
  examInterface: { ...DEFAULT_EXAM_INTERFACE },
  examWorkflow: {
    stages: DEFAULT_EXAM_WORKFLOW.stages.map((stage) => ({
      ...stage,
    })),
  },
  analyticsSettings: { ...DEFAULT_ANALYTICS_SETTINGS },
};

// ============================================================
// HELPER: CREATE A COMPLETE, INDEPENDENT COURT CONFIGURATION
// ============================================================

interface CourtPresetOptions {
  name: string;
  description: string;
  courtName: string;
  state: string;
  recruitmentAuthority: string;
  postName: string;
  language?: ExamLanguage;
  durationSeconds?: number;
  targetWpm: number;
  minimumWpm: number;
  minimumAccuracy?: number;
  instructions?: string[];
}

function createCourtConfig(
  options: CourtPresetOptions,
): CreateTypingExamConfigPayload {
  const language = options.language ?? "en";
  const durationSeconds = options.durationSeconds ?? 600;

  const typingStageKey =
    language === "hi"
      ? "hindi_typing"
      : language === "mr"
        ? "marathi_typing"
        : "english_typing";

  return {
    ...DEFAULT_CONFIG_VALUES,

    name: options.name,
    description: options.description,
    language,
    durationSeconds,
    targetWpm: options.targetWpm,

    examMetadata: {
      ...DEFAULT_EXAM_METADATA,
      state: options.state,
      jurisdiction: options.courtName,
      courtName: options.courtName,
      recruitmentAuthority: options.recruitmentAuthority,
      postName: options.postName,
      officialRulesVerified: false,
      notificationNumber: "",
      officialSourceUrl: "",
      ruleVersion: "",
      notes:
        "Practice configuration only. Verify the relevant official recruitment notification before using for an actual examination.",
    },

    passageSettings: {
      ...DEFAULT_PASSAGE_SETTINGS,
    },

    instructions: options.instructions ?? [
      "Read the instructions carefully before starting.",
      "Type the displayed passage accurately.",
      "Maintain a consistent typing speed and minimize errors.",
      "Do not paste copied text into the examination input.",
      "Submit your test before the timer expires.",
    ],

    evaluationRules: {
      ...DEFAULT_EVALUATION_RULES,
      minimumWpm: options.minimumWpm,
      minimumAccuracy: options.minimumAccuracy ?? 90,
    },

    examInterface: {
      ...DEFAULT_EXAM_INTERFACE,
    },

    examWorkflow: {
      stages: DEFAULT_EXAM_WORKFLOW.stages.map((stage) => ({
        ...stage,
        key: stage.type === "typing_test" ? typingStageKey : stage.key,
        durationSeconds:
          stage.type === "typing_test"
            ? durationSeconds
            : stage.durationSeconds,
      })),
    },

    analyticsSettings: {
      ...DEFAULT_ANALYTICS_SETTINGS,
    },
  };
}

// ============================================================
// MULTIPLE READY-TO-SAVE COURT CONFIGURATIONS
// ============================================================

export const DEFAULT_COURT_CONFIGS: CreateTypingExamConfigPayload[] = [
  // 1. Bombay High Court
  createCourtConfig({
    name: "Bombay High Court - Clerk English Typing",
    description:
      "English typing practice configuration for Bombay High Court Clerk preparation.",
    courtName: "Bombay High Court",
    state: "Maharashtra",
    recruitmentAuthority: "High Court of Judicature at Bombay",
    postName: "Clerk",
    language: "en",
    durationSeconds: 600,
    targetWpm: 40,
    minimumWpm: 30,
    minimumAccuracy: 90,
  }),

  // 2. Maharashtra District Courts
  createCourtConfig({
    name: "Maharashtra District Court - Junior Clerk",
    description:
      "English typing practice for Maharashtra district court recruitment preparation.",
    courtName: "District and Subordinate Courts of Maharashtra",
    state: "Maharashtra",
    recruitmentAuthority: "Relevant District Court Recruitment Authority",
    postName: "Junior Clerk",
    language: "en",
    durationSeconds: 600,
    targetWpm: 30,
    minimumWpm: 25,
    minimumAccuracy: 90,
  }),

  // 3. Gujarat High Court
  createCourtConfig({
    name: "Gujarat High Court - Assistant",
    description:
      "English typing practice for Gujarat High Court recruitment preparation.",
    courtName: "High Court of Gujarat",
    state: "Gujarat",
    recruitmentAuthority: "High Court of Gujarat",
    postName: "Assistant",
    language: "en",
    durationSeconds: 600,
    targetWpm: 35,
    minimumWpm: 25,
    minimumAccuracy: 90,
  }),

  // 4. Madhya Pradesh High Court
  createCourtConfig({
    name: "Madhya Pradesh High Court - Assistant",
    description:
      "English typing practice for Madhya Pradesh High Court recruitment preparation.",
    courtName: "High Court of Madhya Pradesh",
    state: "Madhya Pradesh",
    recruitmentAuthority: "High Court of Madhya Pradesh",
    postName: "Assistant",
    language: "en",
    durationSeconds: 600,
    targetWpm: 35,
    minimumWpm: 25,
    minimumAccuracy: 90,
  }),

  // 5. Allahabad High Court
  createCourtConfig({
    name: "Allahabad High Court - Review Officer Practice",
    description:
      "English typing practice for Review Officer recruitment preparation.",
    courtName: "High Court of Judicature at Allahabad",
    state: "Uttar Pradesh",
    recruitmentAuthority: "High Court of Judicature at Allahabad",
    postName: "Review Officer",
    language: "en",
    durationSeconds: 600,
    targetWpm: 35,
    minimumWpm: 25,
    minimumAccuracy: 90,
  }),

  // 6. Delhi District Courts
  createCourtConfig({
    name: "Delhi District Courts - Junior Judicial Assistant",
    description:
      "English typing practice for Junior Judicial Assistant preparation.",
    courtName: "District Courts of Delhi",
    state: "Delhi",
    recruitmentAuthority:
      "Relevant Delhi District Courts Recruitment Authority",
    postName: "Junior Judicial Assistant",
    language: "en",
    durationSeconds: 600,
    targetWpm: 35,
    minimumWpm: 25,
    minimumAccuracy: 90,
  }),

  // 7. Rajasthan High Court
  createCourtConfig({
    name: "Rajasthan High Court - Junior Judicial Assistant",
    description:
      "English typing practice for Rajasthan High Court recruitment preparation.",
    courtName: "High Court of Rajasthan",
    state: "Rajasthan",
    recruitmentAuthority: "Rajasthan High Court",
    postName: "Junior Judicial Assistant",
    language: "en",
    durationSeconds: 600,
    targetWpm: 35,
    minimumWpm: 25,
    minimumAccuracy: 90,
  }),

  // 8. Calcutta High Court
  createCourtConfig({
    name: "Calcutta High Court - Lower Division Assistant",
    description:
      "English typing practice for Calcutta High Court recruitment preparation.",
    courtName: "High Court at Calcutta",
    state: "West Bengal",
    recruitmentAuthority: "High Court at Calcutta",
    postName: "Lower Division Assistant",
    language: "en",
    durationSeconds: 600,
    targetWpm: 30,
    minimumWpm: 25,
    minimumAccuracy: 90,
  }),

  // 9. Bombay High Court - Marathi
  createCourtConfig({
    name: "Bombay High Court - Marathi Typing Practice",
    description: "Marathi typing practice for court recruitment preparation.",
    courtName: "Bombay High Court",
    state: "Maharashtra",
    recruitmentAuthority: "High Court of Judicature at Bombay",
    postName: "Clerk",
    language: "mr",
    durationSeconds: 600,
    targetWpm: 25,
    minimumWpm: 20,
    minimumAccuracy: 90,
    instructions: [
      "सूचना काळजीपूर्वक वाचा.",
      "दिलेला मराठी परिच्छेद अचूकपणे टाइप करा.",
      "शब्दलेखन आणि मात्रांची अचूकता राखा.",
      "वेळ संपण्यापूर्वी परीक्षा पूर्ण करा.",
    ],
  }),

  // 10. Hindi Court Typing Practice
  createCourtConfig({
    name: "District Court - Hindi Typing Practice",
    description:
      "Hindi typing practice configuration for court recruitment preparation.",
    courtName: "District Court Typing Practice",
    state: "Uttar Pradesh",
    recruitmentAuthority: "Practice Configuration",
    postName: "Clerk",
    language: "hi",
    durationSeconds: 600,
    targetWpm: 25,
    minimumWpm: 20,
    minimumAccuracy: 90,
    instructions: [
      "निर्देशों को ध्यानपूर्वक पढ़ें।",
      "दिए गए अनुच्छेद को सही-सही टाइप करें।",
      "शब्दों और मात्राओं की शुद्धता बनाए रखें।",
      "समय समाप्त होने से पहले परीक्षा पूरी करें।",
    ],
  }),

  // 11. General beginner practice
  createCourtConfig({
    name: "Court Clerk - Beginner Typing Practice",
    description:
      "Beginner-friendly typing practice for court clerk candidates.",
    courtName: "General Court Typing Practice",
    state: "India",
    recruitmentAuthority: "Practice Configuration",
    postName: "Clerk",
    language: "en",
    durationSeconds: 300,
    targetWpm: 20,
    minimumWpm: 15,
    minimumAccuracy: 85,
  }),

  // 12. General advanced practice
  createCourtConfig({
    name: "Court Clerk - Advanced English Typing",
    description:
      "Advanced English typing practice with higher speed and accuracy targets.",
    courtName: "General Court Typing Practice",
    state: "India",
    recruitmentAuthority: "Practice Configuration",
    postName: "Clerk",
    language: "en",
    durationSeconds: 900,
    targetWpm: 45,
    minimumWpm: 40,
    minimumAccuracy: 95,
  }),
];
