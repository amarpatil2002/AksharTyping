import {
  getTypingPolicy,
  assertVerifiedPolicy,
  EXAM_TYPES,
  POLICY_VERSION,
} from "../config/typingExamPolicies.config.js";

import { tokenizeWords, tokenizeCharacters } from "../utils/tokenize.js";

import { compareWords } from "../utils/wordComparison.js";
import { compareCharacters } from "../utils/characterComparison.js";

const tokenizeExpectedText = (text, options = {}) =>
  options.mode === "CHARACTER" ? tokenizeCharacters(text) : tokenizeWords(text);

const tokenizeTypedText = tokenizeExpectedText;

const compareWordTokens = compareWords;

const compareCharacterTokens = (expected, typed) =>
  compareCharacters(expected.join(""), typed.join(""));

const RESULT_ENGINE_VERSION = "1.0.0";

const EVALUATORS = Object.freeze({
  STANDARD_WORD: "STANDARD_WORD",
  RRB_WORD_PENALTY: "RRB_WORD_PENALTY",
  CORRECT_WPM: "CORRECT_WPM",
  CHARACTER_KDPH: "CHARACTER_KDPH",
  CHARACTER_CPM: "CHARACTER_CPM",
  HYBRID: "HYBRID",
  STENOGRAPHY: "STENOGRAPHY",
});

/**
 * Resolve evaluator from the policy.
 *
 * Priority:
 * 1. Explicit policy.evaluator
 * 2. policy.formula.type
 *
 * This allows older policies that contain evaluator
 * and newer policies that only declare formula.type.
 */
function resolveEvaluator(policy) {
  if (
    policy?.evaluator &&
    Object.values(EVALUATORS).includes(policy.evaluator)
  ) {
    return policy.evaluator;
  }

  const formulaType = policy?.formula?.type;

  const evaluatorByFormulaType = {
    WORD_STANDARD: EVALUATORS.STANDARD_WORD,
    WORD_CORRECT_SPEED: EVALUATORS.CORRECT_WPM,
    RRB_WORD_PENALTY: EVALUATORS.RRB_WORD_PENALTY,
    CHARACTER_KDPH: EVALUATORS.CHARACTER_KDPH,
    CHARACTER_CPM: EVALUATORS.CHARACTER_CPM,
    HYBRID: EVALUATORS.HYBRID,
    STENOGRAPHY: EVALUATORS.STENOGRAPHY,
  };

  return evaluatorByFormulaType[formulaType] ?? null;
}

/**
 * Validate the minimum structure required by the calculation engine.
 *
 * This does NOT require VERIFIED status because CORE calculation
 * is allowed for PARTIALLY_VERIFIED policies.
 */
function validatePolicy(policy) {
  if (!policy) {
    throw new Error("Typing policy is required.");
  }

  if (!policy.id) {
    throw new Error("Typing policy id is required.");
  }

  if (!policy.examType) {
    throw new Error(`Policy ${policy.id} has no examType.`);
  }

  if (!Object.values(EXAM_TYPES).includes(policy.examType)) {
    throw new Error(
      `Policy ${policy.id} has invalid examType: ${policy.examType}`,
    );
  }

  if (!policy.formula?.type) {
    throw new Error(`Policy ${policy.id} has no formula.type configured.`);
  }

  const evaluator = resolveEvaluator(policy);

  if (!evaluator) {
    throw new Error(
      `No evaluator configured for policy ${policy.id}. ` +
        `formula.type="${policy.formula.type}"`,
    );
  }

  return evaluator;
}

/**
 * Validate elapsed time and return reusable time metrics.
 */
function calculateTimeMetrics(elapsedSeconds) {
  const seconds = Number(elapsedSeconds);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error("elapsedSeconds must be greater than zero.");
  }

  return {
    elapsedSeconds: seconds,
    elapsedMinutes: seconds / 60,
  };
}

/**
 * CORE WORD CALCULATION
 *
 * This is policy-neutral.
 *
 * It calculates:
 * - expected words
 * - typed words
 * - correct words
 * - incorrect words
 * - missing words
 * - extra words
 * - error count
 * - gross WPM
 * - correct WPM
 * - accuracy
 * - error percentage
 *
 * Official exam rules are NOT applied here.
 */
function calculateWordCore(expectedText, typedText, elapsedSeconds) {
  const expectedTokens = tokenizeExpectedText(expectedText);
  const typedTokens = tokenizeTypedText(typedText);

  const comparison = compareWordTokens(expectedTokens, typedTokens);

  const typedWords = typedTokens.length;
  const expectedWords = expectedTokens.length;

  const correctWords = comparison.correct.length;
  const incorrectWords = comparison.incorrect.length;
  const missingWords = comparison.missing.length;
  const extraWords = comparison.extra.length;

  const { elapsedMinutes } = calculateTimeMetrics(elapsedSeconds);

  const grossWpm = typedWords / elapsedMinutes;

  const correctWpm = correctWords / elapsedMinutes;

  const errorCount = incorrectWords + missingWords + extraWords;

  /**
   * Error percentage is normalized against expected words.
   *
   * The result model allows 0..100.
   *
   * Do NOT calculate this against typedWords because
   * missing words can make the value exceed 100.
   */
  const errorPercentage =
    expectedWords > 0 ? Math.min(100, (errorCount / expectedWords) * 100) : 0;

  const accuracy =
    typedWords > 0 ? Math.min(100, (correctWords / typedWords) * 100) : 0;

  return {
    metrics: {
      expectedWords,
      typedWords,
      correctWords,
      incorrectWords,
      missingWords,
      extraWords,
      errorCount,
      grossWpm,
      correctWpm,
      accuracy,
      errorPercentage,
    },

    comparison,
  };
}

/**
 * CORE CHARACTER CALCULATION
 */
function calculateCharacterCore(expectedText, typedText, elapsedSeconds) {
  const expectedCharacters = tokenizeExpectedText(expectedText, {
    mode: "CHARACTER",
  });

  const typedCharacters = tokenizeTypedText(typedText, {
    mode: "CHARACTER",
  });

  const comparison = compareCharacterTokens(
    expectedCharacters,
    typedCharacters,
  );

  const expectedCount = expectedCharacters.length;

  const typedCount = typedCharacters.length;

  const correctCharacters = comparison.correct.length;

  const incorrectCharacters = comparison.incorrect.length;

  const missingCharacters = comparison.missing.length;

  const extraCharacters = comparison.extra.length;

  const { elapsedMinutes } = calculateTimeMetrics(elapsedSeconds);

  const grossCpm = typedCount / elapsedMinutes;

  const correctCpm = correctCharacters / elapsedMinutes;

  const grossKDPH = grossCpm * 60;

  const correctKDPH = correctCpm * 60;

  const errorCount = incorrectCharacters + missingCharacters + extraCharacters;

  /**
   * Normalize to 0..100 because the result schema
   * allows maximum 100.
   */
  const errorPercentage =
    expectedCount > 0 ? Math.min(100, (errorCount / expectedCount) * 100) : 0;

  const accuracy =
    typedCount > 0 ? Math.min(100, (correctCharacters / typedCount) * 100) : 0;

  return {
    metrics: {
      expectedCharacters: expectedCount,
      typedCharacters: typedCount,
      correctCharacters,
      incorrectCharacters,
      missingCharacters,
      extraCharacters,
      errorCount,
      grossCpm,
      correctCpm,
      grossKDPH,
      correctKDPH,
      accuracy,
      errorPercentage,
    },

    comparison,
  };
}

/**
 * CORE RESULT DISPATCH
 *
 * Exam type comes from the policy.
 */
function calculateCoreResult({
  policy,
  expectedText,
  typedText,
  elapsedSeconds,
}) {
  switch (policy.examType) {
    case EXAM_TYPES.WORD:
      return {
        word: calculateWordCore(expectedText, typedText, elapsedSeconds),
        character: null,
        hybrid: null,
      };

    case EXAM_TYPES.CHARACTER:
      return {
        word: null,
        character: calculateCharacterCore(
          expectedText,
          typedText,
          elapsedSeconds,
        ),
        hybrid: null,
      };

    case EXAM_TYPES.HYBRID:
      return {
        word: calculateWordCore(expectedText, typedText, elapsedSeconds),

        character: calculateCharacterCore(
          expectedText,
          typedText,
          elapsedSeconds,
        ),

        hybrid: {
          available: true,
        },
      };

    default:
      throw new Error(`Unsupported exam type: ${policy.examType}`);
  }
}

/**
 * STANDARD WORD OFFICIAL CALCULATION
 *
 * Used by policies whose formula.type is:
 * WORD_STANDARD
 *
 * The policy's qualification threshold is used.
 */
function calculateStandardWordOfficial(policy, coreResult) {
  const word = coreResult.word?.metrics;

  if (!word) {
    throw new Error(
      `Policy ${policy.id}: WORD_STANDARD requires word core metrics.`,
    );
  }

  const qualification =
    policy.qualification?.minimumWpm != null
      ? word.grossWpm >= Number(policy.qualification.minimumWpm)
      : null;

  return {
    evaluator: EVALUATORS.STANDARD_WORD,

    metrics: {
      grossWpm: word.grossWpm,

      /*
       * This is the engine's standard word metric.
       *
       * Do not claim this is an official penalty formula
       * unless the policy has been verified for it.
       */
      netWpm: word.correctWpm,

      accuracy: word.accuracy,

      errorPercentage: word.errorPercentage,

      finalScore: word.correctWpm,
    },

    marks: {
      value: null,
      maxMarks: Number(
        policy.formula?.marks?.maxMarks ??
          policy.qualification?.typingTestMarks ??
          0,
      ),
      minimumPassingMarks: Number(
        policy.formula?.marks?.minimumPassingMarks ??
          policy.qualification?.minimumPassingMarks ??
          0,
      ),
      available: false,
      reason: "Official marks calculation formula is not verified.",
    },

    qualification: {
      qualified: qualification,

      minimumWpm: policy.qualification?.minimumWpm ?? null,
    },
  };
}

/**
 * CORRECT-WPM OFFICIAL CALCULATION
 *
 * Used by:
 * WORD_CORRECT_SPEED
 */
function calculateCorrectWpmOfficial(policy, coreResult) {
  const word = coreResult.word?.metrics;

  if (!word) {
    throw new Error(
      `Policy ${policy.id}: WORD_CORRECT_SPEED requires word core metrics.`,
    );
  }

  const qualification =
    policy.qualification?.minimumWpm != null
      ? word.correctWpm >= Number(policy.qualification.minimumWpm)
      : null;

  return {
    evaluator: EVALUATORS.CORRECT_WPM,

    metrics: {
      grossWpm: word.grossWpm,
      netWpm: word.correctWpm,
      accuracy: word.accuracy,
      errorPercentage: word.errorPercentage,
      finalScore: word.correctWpm,
    },

    marks: {
      value: null,
      maxMarks: null,
    },

    qualification: {
      qualified: qualification,

      minimumWpm: policy.qualification?.minimumWpm ?? null,
    },
  };
}

/**
 * RRB WORD PENALTY
 *
 * Used by policies whose formula.type is:
 * RRB_WORD_PENALTY
 *
 * penaltyValue comes from the policy.
 */
function calculateRrbWordPenaltyOfficial(policy, coreResult) {
  const word = coreResult.word?.metrics;

  if (!word) {
    throw new Error(
      `Policy ${policy.id}: RRB_WORD_PENALTY requires word core metrics.`,
    );
  }

  const penaltyValue = Number(policy.scoring?.penaltyValue ?? 0);

  if (!Number.isFinite(penaltyValue)) {
    throw new Error(`Policy ${policy.id}: invalid scoring.penaltyValue.`);
  }

  const penalty = word.errorCount * penaltyValue;

  const netWpm = word.grossWpm - penalty;

  const qualification =
    policy.qualification?.minimumWpm != null
      ? netWpm >= Number(policy.qualification.minimumWpm)
      : null;

  return {
    evaluator: EVALUATORS.RRB_WORD_PENALTY,

    metrics: {
      grossWpm: word.grossWpm,

      penalty,

      netWpm,

      accuracy: word.accuracy,

      errorPercentage: word.errorPercentage,

      finalScore: netWpm,
    },

    marks: {
      value: null,
      maxMarks: null,
    },

    qualification: {
      qualified: qualification,

      minimumWpm: policy.qualification?.minimumWpm ?? null,
    },
  };
}

/**
 * CHARACTER KDPH OFFICIAL CALCULATION
 */
function calculateCharacterKDPHOfficial(policy, coreResult) {
  const character = coreResult.character?.metrics;

  if (!character) {
    throw new Error(
      `Policy ${policy.id}: CHARACTER_KDPH requires character core metrics.`,
    );
  }

  const qualification =
    policy.qualification?.minimumKDPH != null
      ? character.correctKDPH >= Number(policy.qualification.minimumKDPH)
      : null;

  return {
    evaluator: EVALUATORS.CHARACTER_KDPH,

    metrics: {
      grossKDPH: character.grossKDPH,

      netKDPH: character.correctKDPH,

      accuracy: character.accuracy,

      errorPercentage: character.errorPercentage,

      finalScore: character.correctKDPH,
    },

    marks: {
      value: null,
      maxMarks: null,
    },

    qualification: {
      qualified: qualification,

      minimumKDPH: policy.qualification?.minimumKDPH ?? null,
    },
  };
}

/**
 * CHARACTER CPM OFFICIAL CALCULATION
 */
function calculateCharacterCpmOfficial(policy, coreResult) {
  const character = coreResult.character?.metrics;

  if (!character) {
    throw new Error(
      `Policy ${policy.id}: CHARACTER_CPM requires character core metrics.`,
    );
  }

  const qualification =
    policy.qualification?.minimumCPM != null
      ? character.correctCpm >= Number(policy.qualification.minimumCPM)
      : null;

  return {
    evaluator: EVALUATORS.CHARACTER_CPM,

    metrics: {
      grossCpm: character.grossCpm,

      netCpm: character.correctCpm,

      accuracy: character.accuracy,

      errorPercentage: character.errorPercentage,

      finalScore: character.correctCpm,
    },

    marks: {
      value: null,
      maxMarks: null,
    },

    qualification: {
      qualified: qualification,

      minimumCPM: policy.qualification?.minimumCPM ?? null,
    },
  };
}

/**
 * OFFICIAL RESULT DISPATCH
 *
 * The evaluator is resolved from the policy.
 *
 * No exam name is hard-coded here.
 */
function calculateOfficialResult({ policy, coreResult }) {
  const evaluator = resolveEvaluator(policy);

  switch (evaluator) {
    case EVALUATORS.STANDARD_WORD:
      return calculateStandardWordOfficial(policy, coreResult);

    case EVALUATORS.CORRECT_WPM:
      return calculateCorrectWpmOfficial(policy, coreResult);

    case EVALUATORS.RRB_WORD_PENALTY:
      return calculateRrbWordPenaltyOfficial(policy, coreResult);

    case EVALUATORS.CHARACTER_KDPH:
      return calculateCharacterKDPHOfficial(policy, coreResult);

    case EVALUATORS.CHARACTER_CPM:
      return calculateCharacterCpmOfficial(policy, coreResult);

    case EVALUATORS.HYBRID:
      throw new Error(
        `Official evaluator HYBRID is declared but its complete official formula implementation is not enabled yet for policy ${policy.id}.`,
      );

    case EVALUATORS.STENOGRAPHY:
      throw new Error(
        `Official evaluator STENOGRAPHY is declared but its complete official formula implementation is not enabled yet for policy ${policy.id}.`,
      );

    default:
      throw new Error(
        `Official evaluator ${evaluator} is not implemented for policy ${policy.id}.`,
      );
  }
}

/**
 * MAIN TYPING RESULT CALCULATOR
 *
 * Flow:
 *
 * policyId
 *    ↓
 * getTypingPolicy()
 *    ↓
 * validatePolicy()
 *    ↓
 * resolve evaluator
 *    ↓
 * calculate CORE result
 *    ↓
 * check VERIFIED + officialEnabled
 *    ↓
 * calculate OFFICIAL result
 */
export function calculateTypingResult({
  policyId,
  expectedText,
  typedText,
  elapsedSeconds,
}) {
  if (!policyId) {
    throw new Error("policyId is required for typing result calculation.");
  }

  if (typeof expectedText !== "string") {
    throw new Error("expectedText must be a string.");
  }

  if (typeof typedText !== "string") {
    throw new Error("typedText must be a string.");
  }

  const policy = getTypingPolicy(policyId);

  if (!policy) {
    throw new Error(`Unknown typing policy: ${policyId}`);
  }

  /**
   * Validate the policy before calculation.
   *
   * This also resolves evaluator from:
   * policy.evaluator
   * OR
   * policy.formula.type
   */
  const evaluator = validatePolicy(policy);

  /**
   * CORE RESULT
   *
   * Core calculation is intentionally allowed
   * for PARTIALLY_VERIFIED policies.
   *
   * This gives us neutral metrics without
   * pretending that an unverified official
   * formula is official.
   */
  const coreResult = calculateCoreResult({
    policy,
    expectedText,
    typedText,
    elapsedSeconds,
  });

  let official = false;

  let officialResult = null;

  let officialCalculationReason = null;

  /**
   * OFFICIAL RESULT
   *
   * Official calculation requires:
   *
   * 1. Policy exists
   * 2. Policy status is VERIFIED
   * 3. formula.officialEnabled === true
   */
  if (
    policy.status === "VERIFIED" &&
    policy.formula?.officialEnabled === true
  ) {
    const verifiedPolicy = assertVerifiedPolicy(policyId);

    /**
     * Preserve the evaluator resolved from
     * the current policy.
     *
     * This is important for policies that
     * do not explicitly define evaluator
     * but define formula.type.
     */
    const officialPolicy = {
      ...verifiedPolicy,
      evaluator,
    };

    officialResult = calculateOfficialResult({
      policy: officialPolicy,
      coreResult,
    });

    official = true;

    officialCalculationReason =
      "Official calculation completed using the verified policy formula.";
  } else {
    officialCalculationReason =
      policy.status !== "VERIFIED"
        ? `Policy is ${policy.status}. Official result calculation is disabled.`
        : "Official calculation formula is not enabled for this policy.";
  }

  /**
   * IMPORTANT:
   *
   * policyVersion comes from the configured
   * global POLICY_VERSION.
   *
   * Do not depend on policy.version because
   * the current policy configuration does not
   * consistently define policy.version.
   */
  const policyVersion = POLICY_VERSION;

  const formulaVersion = policy.formula?.version ?? null;

  return {
    policyId: policy.id,

    policyVersion,

    formulaVersion,

    engineVersion: RESULT_ENGINE_VERSION,

    official,

    exam: {
      type: policy.examType,
      language: policy.language,
    },

    elapsedSeconds: Number(elapsedSeconds),

    coreResult,

    officialResult,

    audit: {
      policyStatus: policy.status,

      evaluator,

      formula: policy.formula ?? null,

      officialCalculationAvailable: official,

      officialCalculationReason,

      calculatedAt: new Date(),

      engineVersion: RESULT_ENGINE_VERSION,

      policyVersion,

      formulaVersion,
    },
  };
}

export { RESULT_ENGINE_VERSION, EVALUATORS };
