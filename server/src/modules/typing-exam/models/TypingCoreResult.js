/**
 * Akshar AI - Typing Result Core
 *
 * Result engine v2:
 * 1. Always calculates a neutral CORE result.
 * 2. Separately calculates OFFICIAL exam result when the policy
 *    has an enabled, verified formula.
 * 3. Never decides exam behavior from exam/policy names.
 * 4. Stores the policy formula in the returned official snapshot.
 *
 * CORE RESULT
 *   - word counts: correct / incorrect / missing / extra
 *   - character counts: correct / incorrect / missing / extra
 *   - hybrid comparison summary
 *
 * OFFICIAL RESULT
 *   - selected by policy.evaluator + policy.formula.type
 *   - uses policy-defined thresholds, penalties and marks
 *
 * Historical results must store:
 *   policyId
 *   policyVersion
 *   formulaVersion
 *   engineVersion
 */

import {
  getTypingPolicy,
  assertOfficialCalculationPolicy,
  EXAM_TYPES,
  POLICY_VERSION,
} from "../config/typingExamPolicies.config.js";

import { tokenizeWords } from "../utils/tokenize.js";
import { compareWords } from "../utils/wordComparison.js";
import { compareCharacters } from "../utils/characterComparison.js";

export const RESULT_ENGINE_VERSION = "2.0.0";

export const EVALUATORS = Object.freeze({
  STANDARD_WORD: "STANDARD_WORD",
  RRB_WORD_PENALTY: "RRB_WORD_PENALTY",
  CORRECT_WPM: "CORRECT_WPM",
  CHARACTER_KDPH: "CHARACTER_KDPH",
  CHARACTER_CPM: "CHARACTER_CPM",
  HYBRID: "HYBRID",
  STENOGRAPHY: "STENOGRAPHY",
});

function round(value, decimals = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function percentage(numerator, denominator) {
  if (!Number.isFinite(numerator) || denominator <= 0) return 0;
  return clamp((numerator / denominator) * 100, 0, 100);
}

function assertString(value, fieldName, allowEmpty = false) {
  if (typeof value !== "string") {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  if (!allowEmpty && value.length === 0) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
}

function assertElapsedSeconds(elapsedSeconds) {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    throw new Error("elapsedSeconds must be a finite number greater than 0.");
  }
}

function minutes(seconds) {
  return Math.max(seconds, 0.001) / 60;
}

function hours(seconds) {
  return Math.max(seconds, 0.001) / 3600;
}

function normalizeComparison(comparison) {
  return {
    expectedCount: comparison.expectedCount ?? 0,
    typedCount: comparison.typedCount ?? 0,
    totalCorrect: comparison.totalCorrect ?? 0,
    totalIncorrect: comparison.totalIncorrect ?? 0,
    totalMissing: comparison.totalMissing ?? 0,
    totalExtra: comparison.totalExtra ?? 0,
    correct: comparison.correct ?? [],
    incorrect: comparison.incorrect ?? [],
    missing: comparison.missing ?? [],
    extra: comparison.extra ?? [],
  };
}

/**
 * CORE comparison.
 *
 * This is NOT an exam score. It is the factual comparison of
 * candidate input against the expected passage.
 */
function calculateCoreResult({ expectedText, typedText, elapsedSeconds }) {
  const expectedWords = tokenizeWords(expectedText);
  const typedWords = tokenizeWords(typedText);

  const wordComparison = normalizeComparison(
    compareWords(expectedWords, typedWords),
  );

  const characterComparison = normalizeComparison(
    compareCharacters(expectedText, typedText),
  );

  const wordAccuracy = percentage(
    wordComparison.totalCorrect,
    wordComparison.typedCount,
  );

  const characterAccuracy = percentage(
    characterComparison.totalCorrect,
    characterComparison.typedCount,
  );

  const timeMinutes = minutes(elapsedSeconds);

  return {
    elapsedSeconds,

    word: {
      expectedWords: wordComparison.expectedCount,
      typedWords: wordComparison.typedCount,
      correctWords: wordComparison.totalCorrect,
      incorrectWords: wordComparison.totalIncorrect,
      missingWords: wordComparison.totalMissing,
      extraWords: wordComparison.totalExtra,

      grossWpm: round(wordComparison.typedCount / timeMinutes),
      correctWpm: round(wordComparison.totalCorrect / timeMinutes),

      accuracy: round(wordAccuracy),

      errorPercentage: round(
        percentage(
          wordComparison.totalIncorrect +
            wordComparison.totalMissing +
            wordComparison.totalExtra,
          wordComparison.typedCount,
        ),
      ),

      comparison: {
        correct: wordComparison.correct,
        incorrect: wordComparison.incorrect,
        missing: wordComparison.missing,
        extra: wordComparison.extra,
      },
    },

    character: {
      expectedCharacters: characterComparison.expectedCount,
      typedCharacters: characterComparison.typedCount,
      correctCharacters: characterComparison.totalCorrect,
      incorrectCharacters: characterComparison.totalIncorrect,
      missingCharacters: characterComparison.totalMissing,
      extraCharacters: characterComparison.totalExtra,

      grossCpm: round(characterComparison.typedCount / timeMinutes),
      correctCpm: round(characterComparison.totalCorrect / timeMinutes),

      grossKDPH: round(characterComparison.typedCount / hours(elapsedSeconds)),
      correctKDPH: round(
        characterComparison.totalCorrect / hours(elapsedSeconds),
      ),

      accuracy: round(characterAccuracy),

      errorPercentage: round(
        percentage(
          characterComparison.totalIncorrect +
            characterComparison.totalMissing +
            characterComparison.totalExtra,
          characterComparison.typedCount,
        ),
      ),

      comparison: {
        correct: characterComparison.correct,
        incorrect: characterComparison.incorrect,
        missing: characterComparison.missing,
        extra: characterComparison.extra,
      },
    },

    hybrid: {
      wordAccuracy: round(wordAccuracy),
      characterAccuracy: round(characterAccuracy),
      wordCorrectWpm: round(wordComparison.totalCorrect / timeMinutes),
      characterCorrectCpm: round(
        characterComparison.totalCorrect / timeMinutes,
      ),
      wordComparison: {
        correct: wordComparison.totalCorrect,
        incorrect: wordComparison.totalIncorrect,
        missing: wordComparison.totalMissing,
        extra: wordComparison.totalExtra,
      },
      characterComparison: {
        correct: characterComparison.totalCorrect,
        incorrect: characterComparison.totalIncorrect,
        missing: characterComparison.totalMissing,
        extra: characterComparison.totalExtra,
      },
    },
  };
}

function getMinimumWpm(policy) {
  return policy?.qualification?.minimumWpm ?? policy?.target?.minimum ?? null;
}

function calculateStandardWordOfficial({ policy, core }) {
  const typedWords = core.word.typedWords;
  const timeMinutes = minutes(core.elapsedSeconds);

  const grossWpm = typedWords / timeMinutes;
  const netWpm = grossWpm;

  const minimumWpm = getMinimumWpm(policy);
  const qualified = minimumWpm === null ? null : netWpm >= Number(minimumWpm);

  return {
    evaluator: policy.evaluator,
    formulaType: policy.formula.type,

    metrics: {
      grossWpm: round(grossWpm),
      netWpm: round(netWpm),
      accuracy: core.word.accuracy,
      errorPercentage: core.word.errorPercentage,
    },

    mistakes: {
      fullMistakes: core.word.incorrectWords,
      halfMistakes: 0,
      weightedMistakes: core.word.incorrectWords,
      ignoredMistakes: 0,
      finalMistakes: core.word.incorrectWords,
      penaltyWords: 0,
    },

    marks: calculateMarks(policy, { netWpm }),

    qualification: {
      metric: "netWpm",
      value: round(netWpm),
      operator: ">=",
      threshold: minimumWpm,
      qualified,
    },

    formula: policy.formula,
  };
}

function calculateCorrectWpmOfficial({ policy, core }) {
  const timeMinutes = minutes(core.elapsedSeconds);
  const grossWpm = core.word.typedWords / timeMinutes;
  const netWpm = core.word.correctWords / timeMinutes;

  const minimumWpm = getMinimumWpm(policy);
  const qualified = minimumWpm === null ? null : netWpm >= Number(minimumWpm);

  return {
    evaluator: policy.evaluator,
    formulaType: policy.formula.type,

    metrics: {
      grossWpm: round(grossWpm),
      netWpm: round(netWpm),
      accuracy: core.word.accuracy,
      errorPercentage: core.word.errorPercentage,
    },

    mistakes: {
      fullMistakes: core.word.incorrectWords,
      halfMistakes: 0,
      weightedMistakes: core.word.incorrectWords,
      ignoredMistakes: 0,
      finalMistakes: core.word.incorrectWords,
      penaltyWords: 0,
    },

    marks: calculateMarks(policy, { netWpm }),

    qualification: {
      metric: "netWpm",
      value: round(netWpm),
      operator: ">=",
      threshold: minimumWpm,
      qualified,
    },

    formula: policy.formula,
  };
}

/**
 * RRB formula executor.
 *
 * IMPORTANT:
 * The policy must supply the exact mistake classifier before
 * officialEnabled can be true. This engine does not invent
 * official full/half mistake categories.
 */
function calculateRrbOfficial({ policy, core }) {
  const rules = policy.errorRules ?? {};
  const fullMistakes = core.word.incorrectWords;
  const halfMistakes = core.word.missingWords + core.word.extraWords;

  const fullWeight = Number(rules.fullMistakeWeight ?? 1);
  const halfWeight = Number(rules.halfMistakeWeight ?? 0.5);
  const ignoredPercentage = Number(rules.ignoredErrorPercentage ?? 0);
  const penaltyWordsPerFinalMistake = Number(
    rules.penaltyWordsPerFinalMistake ?? 0,
  );

  const weightedMistakes =
    fullMistakes * fullWeight + halfMistakes * halfWeight;

  const ignoredMistakes = core.word.typedWords * (ignoredPercentage / 100);

  const finalMistakes = Math.max(0, weightedMistakes - ignoredMistakes);

  const penaltyWords = finalMistakes * penaltyWordsPerFinalMistake;

  const timeMinutes = minutes(core.elapsedSeconds);
  const grossWpm = core.word.typedWords / timeMinutes;
  const netWpm = Math.max(0, core.word.typedWords - penaltyWords) / timeMinutes;

  const minimumWpm = getMinimumWpm(policy);
  const qualified = minimumWpm === null ? null : netWpm >= Number(minimumWpm);

  return {
    evaluator: policy.evaluator,
    formulaType: policy.formula.type,

    metrics: {
      grossWpm: round(grossWpm),
      netWpm: round(netWpm),
      accuracy: core.word.accuracy,
      errorPercentage: round(
        percentage(weightedMistakes, core.word.typedWords),
      ),
    },

    mistakes: {
      fullMistakes: round(fullMistakes),
      halfMistakes: round(halfMistakes),
      weightedMistakes: round(weightedMistakes),
      ignoredMistakes: round(ignoredMistakes),
      finalMistakes: round(finalMistakes),
      penaltyWords: round(penaltyWords),
    },

    marks: calculateMarks(policy, { netWpm }),

    qualification: {
      metric: "netWpm",
      value: round(netWpm),
      operator: ">=",
      threshold: minimumWpm,
      qualified,
    },

    formula: policy.formula,
  };
}

function calculateCharacterOfficial({ policy, core }) {
  const formulaType = policy.formula?.type;
  const metricUnit = formulaType === "CHARACTER_CPM" ? "CPM" : "KDPH";

  const rawTyped =
    metricUnit === "CPM"
      ? core.character.typedCharacters / minutes(core.elapsedSeconds)
      : core.character.typedCharacters / hours(core.elapsedSeconds);

  const rawCorrect =
    metricUnit === "CPM"
      ? core.character.correctCharacters / minutes(core.elapsedSeconds)
      : core.character.correctCharacters / hours(core.elapsedSeconds);

  const threshold =
    metricUnit === "CPM"
      ? (policy?.qualification?.minimumCpm ??
        policy?.target?.minimumCpm ??
        null)
      : (policy?.qualification?.minimumKdph ??
        policy?.target?.minimumKdph ??
        null);

  const qualified = threshold === null ? null : rawCorrect >= Number(threshold);

  return {
    evaluator: policy.evaluator,
    formulaType,

    metrics: {
      gross: round(rawTyped),
      net: round(rawCorrect),
      unit: metricUnit,
      accuracy: core.character.accuracy,
      errorPercentage: core.character.errorPercentage,
    },

    marks: calculateMarks(policy, {
      netCpm: metricUnit === "CPM" ? rawCorrect : undefined,
      netKdph: metricUnit === "KDPH" ? rawCorrect : undefined,
    }),

    qualification: {
      metric: metricUnit === "CPM" ? "netCpm" : "netKdph",
      value: round(rawCorrect),
      operator: ">=",
      threshold,
      qualified,
    },

    formula: policy.formula,
  };
}

function calculateHybridOfficial({ policy, core }) {
  const wordWeight = Number(
    policy?.formula?.wordWeight ?? policy?.hybridScoring?.wordWeight ?? 0.5,
  );

  const characterWeight = Number(
    policy?.formula?.characterWeight ??
      policy?.hybridScoring?.characterWeight ??
      0.5,
  );

  const totalWeight = wordWeight + characterWeight;

  if (totalWeight <= 0) {
    throw new Error("Hybrid formula weights must have a positive total.");
  }

  const normalizedWordWeight = wordWeight / totalWeight;
  const normalizedCharacterWeight = characterWeight / totalWeight;

  const finalScore =
    core.hybrid.wordAccuracy * normalizedWordWeight +
    core.hybrid.characterAccuracy * normalizedCharacterWeight;

  const threshold =
    policy?.qualification?.minimumScore ?? policy?.target?.minimumScore ?? null;

  const qualified = threshold === null ? null : finalScore >= Number(threshold);

  return {
    evaluator: policy.evaluator,
    formulaType: policy.formula.type,

    metrics: {
      wordAccuracy: core.hybrid.wordAccuracy,
      characterAccuracy: core.hybrid.characterAccuracy,
      wordWeight: round(normalizedWordWeight, 4),
      characterWeight: round(normalizedCharacterWeight, 4),
      finalScore: round(finalScore),
    },

    marks: calculateMarks(policy, { finalScore }),

    qualification: {
      metric: "finalScore",
      value: round(finalScore),
      operator: ">=",
      threshold,
      qualified,
    },

    formula: policy.formula,
  };
}

/**
 * Marks are deliberately formula-driven.
 *
 * Supported:
 *   NONE / QUALIFYING_ONLY
 *   LINEAR
 *   DIRECT
 *
 * LINEAR:
 *   score = clamp(
 *     ((metric - minMetric) / (maxMetric - minMetric))
 *       * maxMarks,
 *     0,
 *     maxMarks
 *   )
 *
 * The policy must explicitly define the formula.
 */
function calculateMarks(policy, metrics) {
  const marks = policy?.formula?.marks;

  if (
    marks === undefined ||
    marks === null ||
    marks === "NONE" ||
    marks === "QUALIFYING_ONLY" ||
    marks === "NOT_OFFICIALLY_VERIFIED"
  ) {
    return {
      available: false,
      value: null,
      maxMarks: policy?.qualification?.typingTestMarks ?? null,
      formula: marks ?? "NONE",
    };
  }

  if (typeof marks !== "object") {
    throw new Error(`Policy ${policy.id}: marks formula must be an object.`);
  }

  const maxMarks = Number(marks.maxMarks);
  const metricValue = Number(metrics[marks.metric]);

  if (!Number.isFinite(maxMarks) || !Number.isFinite(metricValue)) {
    throw new Error(
      `Policy ${policy.id}: marks formula has invalid maxMarks or metric.`,
    );
  }

  if (marks.type === "DIRECT") {
    return {
      available: true,
      value: round(clamp(metricValue, 0, maxMarks)),
      maxMarks,
      formula: marks,
    };
  }

  if (marks.type === "LINEAR") {
    const minMetric = Number(marks.minMetric);
    const maxMetric = Number(marks.maxMetric);

    if (
      !Number.isFinite(minMetric) ||
      !Number.isFinite(maxMetric) ||
      maxMetric <= minMetric
    ) {
      throw new Error(`Policy ${policy.id}: invalid LINEAR marks range.`);
    }

    const value =
      ((metricValue - minMetric) / (maxMetric - minMetric)) * maxMarks;

    return {
      available: true,
      value: round(clamp(value, 0, maxMarks)),
      maxMarks,
      formula: marks,
    };
  }

  throw new Error(
    `Policy ${policy.id}: unsupported marks formula type "${marks.type}".`,
  );
}

function calculateOfficialResult(policy, core) {
  const evaluator = policy.evaluator;

  switch (evaluator) {
    case EVALUATORS.STANDARD_WORD:
      return calculateStandardWordOfficial({ policy, core });

    case EVALUATORS.CORRECT_WPM:
      return calculateCorrectWpmOfficial({ policy, core });

    case EVALUATORS.RRB_WORD_PENALTY:
      return calculateRrbOfficial({ policy, core });

    case EVALUATORS.CHARACTER_KDPH:
    case EVALUATORS.CHARACTER_CPM:
      return calculateCharacterOfficial({ policy, core });

    case EVALUATORS.HYBRID:
      return calculateHybridOfficial({ policy, core });

    case EVALUATORS.STENOGRAPHY:
      throw new Error(
        `STENOGRAPHY evaluator is declared but its complete official formula implementation is not enabled yet for policy ${policy.id}.`,
      );

    default:
      throw new Error(
        `Unsupported evaluator "${evaluator}" for policy ${policy.id}.`,
      );
  }
}

function validatePolicy(policy) {
  if (!policy) throw new Error("Typing policy is required.");
  if (!policy.id) throw new Error("Typing policy is missing id.");
  if (!policy.examType) {
    throw new Error(`Policy ${policy.id} is missing examType.`);
  }
  if (!policy.evaluator) {
    throw new Error(`Policy ${policy.id} is missing evaluator.`);
  }

  if (!Object.values(EVALUATORS).includes(policy.evaluator)) {
    throw new Error(
      `Unsupported evaluator "${policy.evaluator}" for policy "${policy.id}".`,
    );
  }

  if (
    policy.examType === EXAM_TYPES.HYBRID &&
    policy.evaluator !== EVALUATORS.HYBRID
  ) {
    throw new Error(`HYBRID policy ${policy.id} must use HYBRID evaluator.`);
  }
}

/**
 * Main API.
 *
 * Core calculation is available for every configured policy.
 *
 * Official calculation is available only when:
 *   status === VERIFIED
 *   formula.officialEnabled === true
 */
export function calculateTypingResult({
  policyId,
  expectedText,
  typedText,
  elapsedSeconds,
}) {
  if (typeof policyId !== "string" || policyId.trim() === "") {
    throw new Error("policyId is required.");
  }

  assertString(expectedText, "expectedText");
  assertString(typedText, "typedText", true);
  assertElapsedSeconds(elapsedSeconds);

  const policy = getTypingPolicy(policyId);

  if (!policy) {
    throw new Error(`Unknown typing policy: ${policyId}`);
  }

  validatePolicy(policy);

  const coreResult = calculateCoreResult({
    expectedText,
    typedText,
    elapsedSeconds,
  });

  let officialResult = null;
  let officialCalculationAvailable = false;
  let officialCalculationReason = null;

  if (
    policy.status === "VERIFIED" &&
    policy.formula?.officialEnabled === true
  ) {
    const officialPolicy = assertOfficialCalculationPolicy(policyId);

    officialResult = calculateOfficialResult(officialPolicy, coreResult);

    officialCalculationAvailable = true;
  } else {
    officialCalculationReason =
      `Official calculation disabled because policy is ${policy.status} ` +
      `or its formula is not enabled. Core comparison remains available.`;
  }

  return {
    policyId: policy.id,
    policyVersion: policy.version ?? POLICY_VERSION,
    formulaVersion: policy.formula?.version ?? null,
    engineVersion: RESULT_ENGINE_VERSION,

    official: officialCalculationAvailable,

    exam: {
      authority: policy.authority,
      name: policy.exam,
      post: policy.post,
      language: policy.language,
      type: policy.examType,
    },

    elapsedSeconds,

    coreResult,

    officialResult,

    audit: {
      policyStatus: policy.status,
      evaluator: policy.evaluator,
      formula: policy.formula ?? null,
      officialCalculationAvailable,
      officialCalculationReason,
      calculatedAt: new Date().toISOString(),
      engineVersion: RESULT_ENGINE_VERSION,
      policyVersion: policy.version ?? POLICY_VERSION,
      formulaVersion: policy.formula?.version ?? null,
    },
  };
}

export function listSupportedEvaluators() {
  return Object.values(EVALUATORS);
}

export function isSupportedEvaluator(evaluator) {
  return Object.values(EVALUATORS).includes(evaluator);
}
