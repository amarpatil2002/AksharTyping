import { calculateTypingMetrics } from "./typingMetrics.service.js";

import { calculateTypingQualification } from "./typingQualification.service.js";

/* ============================================================
   HELPERS
============================================================ */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const roundTo = (value, decimals = 2) => {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const clamp = (value, minimum, maximum) => {
  return Math.min(maximum, Math.max(minimum, value));
};

const getRoundedMarks = (value, rounding = "two_decimals") => {
  switch (rounding) {
    case "none":
      return value;

    case "integer":
      return Math.round(value);

    case "two_decimals":
    default:
      return roundTo(value, 2);
  }
};

const assertNonNegative = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new TypeError(`${fieldName} must be a non-negative number.`);
  }

  return number;
};

/* ============================================================
   ERROR COUNTS
============================================================ */

const getErrorCounts = (metrics, scoring) => {
  const notReachedPolicy = scoring.notReachedPolicy || "no_separate_penalty";

  const notReachedWords = toNumber(metrics.notReachedWords);

  return {
    spelling: toNumber(metrics.misspellings),

    wrongWord: toNumber(metrics.wrongWords),

    omission: toNumber(metrics.omissions),

    extraWord: toNumber(metrics.extraWords),

    notReached:
      notReachedPolicy === "no_separate_penalty" ? 0 : notReachedWords,
  };
};

/* ============================================================
   SPEED MARKS
============================================================ */

const calculateSpeedMarks = ({ netWpm, targetWpm, maximumMarks }) => {
  if (targetWpm <= 0) {
    return 0;
  }

  const speedRatio = netWpm / targetWpm;

  return clamp(speedRatio * maximumMarks, 0, maximumMarks);
};

/* ============================================================
   SCORING STRATEGIES
============================================================ */

/**
 * Standard:
 * Speed marks multiplied by accuracy.
 */
const evaluateStandard = ({ metrics, maximumMarks, targetWpm }) => {
  const speedMarks = calculateSpeedMarks({
    netWpm: metrics.netWpm,
    targetWpm,
    maximumMarks,
  });

  return {
    rawMarks: speedMarks * (metrics.accuracy / 100),
    speedMarks,
    deductions: 0,
  };
};

/**
 * Net WPM:
 * Marks are proportional to net typing speed.
 */
const evaluateNetWpm = ({ metrics, maximumMarks, targetWpm }) => {
  const marks = calculateSpeedMarks({
    netWpm: metrics.netWpm,
    targetWpm,
    maximumMarks,
  });

  return {
    rawMarks: marks,
    speedMarks: marks,
    deductions: 0,
  };
};

/**
 * Accuracy:
 * Marks are proportional to accuracy.
 */
const evaluateAccuracy = ({ metrics, maximumMarks }) => {
  return {
    rawMarks: maximumMarks * (metrics.accuracy / 100),

    speedMarks: 0,
    deductions: 0,
  };
};

/**
 * Weighted:
 * Speed and accuracy contribute according to configured weights.
 */
const evaluateWeighted = ({ metrics, maximumMarks, targetWpm, scoring }) => {
  const speedWeight = toNumber(scoring.speedWeight);
  const accuracyWeight = toNumber(scoring.accuracyWeight);

  if (Math.abs(speedWeight + accuracyWeight - 100) > 0.000001) {
    throw new Error(
      "Weighted scoring requires speed and accuracy weights totaling 100.",
    );
  }

  const speedMarks = calculateSpeedMarks({
    netWpm: metrics.netWpm,
    targetWpm,
    maximumMarks,
  });

  const accuracyMarks = maximumMarks * (metrics.accuracy / 100);

  const rawMarks =
    speedMarks * (speedWeight / 100) + accuracyMarks * (accuracyWeight / 100);

  return {
    rawMarks,
    speedMarks,
    accuracyMarks,
    deductions: 0,
  };
};

/**
 * Custom:
 * Speed marks minus a common penalty per error.
 */
const evaluateCustom = ({ metrics, maximumMarks, targetWpm, scoring }) => {
  const speedMarks = calculateSpeedMarks({
    netWpm: metrics.netWpm,
    targetWpm,
    maximumMarks,
  });

  const errorPenalty = toNumber(scoring.errorPenalty);

  const deductions = metrics.totalErrors * errorPenalty;

  return {
    rawMarks: speedMarks - deductions,
    speedMarks,
    deductions,
  };
};

/**
 * Fixed error penalty:
 * Deduct configured amounts for each error category.
 */
const evaluateFixedErrorPenalty = ({ metrics, maximumMarks, scoring }) => {
  const errorCounts = getErrorCounts(metrics, scoring);

  const penalties = scoring.errorPenalties || {};

  const breakdown = {};

  let deductions = 0;

  for (const [category, count] of Object.entries(errorCounts)) {
    const penalty = toNumber(penalties[category]);

    const categoryDeduction = count * penalty;

    deductions += categoryDeduction;

    breakdown[category] = {
      count,
      penaltyPerError: penalty,
      marksLost: roundTo(categoryDeduction, 4),
    };
  }

  return {
    rawMarks: maximumMarks - deductions,
    speedMarks: 0,
    deductions,
    errorBreakdown: breakdown,
  };
};

/**
 * Grouped error penalty:
 * Deduct marks for every completed group of errors.
 */
const evaluateGroupedErrorPenalty = ({ metrics, maximumMarks, scoring }) => {
  const errorsPerGroup = assertNonNegative(
    scoring.errorsPerGroup,
    "Errors per group",
  );

  if (!Number.isInteger(errorsPerGroup) || errorsPerGroup < 1) {
    throw new Error("Errors per group must be a positive integer.");
  }

  const groupPenalty = toNumber(scoring.groupPenalty);

  const errorCounts = getErrorCounts(metrics, scoring);

  const totalPenaltyEligibleErrors = Object.values(errorCounts).reduce(
    (total, count) => total + count,
    0,
  );

  const completedGroups = Math.floor(
    totalPenaltyEligibleErrors / errorsPerGroup,
  );

  const deductions = completedGroups * groupPenalty;

  return {
    rawMarks: maximumMarks - deductions,
    speedMarks: 0,
    deductions,

    errorBreakdown: {
      totalPenaltyEligibleErrors,
      errorsPerGroup,
      completedGroups,
      groupPenalty,
    },
  };
};

/**
 * Correct word ratio:
 * Marks are proportional to correctly typed reference words.
 */
const evaluateCorrectWordsRatio = ({ metrics, maximumMarks }) => {
  const totalWords = toNumber(metrics.totalWords);

  const ratio = totalWords > 0 ? metrics.correctWords / totalWords : 0;

  return {
    rawMarks: maximumMarks * ratio,
    speedMarks: 0,
    deductions: 0,
  };
};

/**
 * Qualifying only:
 * Does not calculate marks.
 */
const evaluateQualifyingOnly = () => {
  return {
    rawMarks: null,
    speedMarks: 0,
    deductions: 0,
  };
};

/**
 * Speed based:
 * Marks are proportional to net WPM.
 */
const evaluateSpeedBased = ({ metrics, maximumMarks, targetWpm }) => {
  const marks = calculateSpeedMarks({
    netWpm: metrics.netWpm,
    targetWpm,
    maximumMarks,
  });

  return {
    rawMarks: marks,
    speedMarks: marks,
    deductions: 0,
  };
};

/* ============================================================
   STRATEGY REGISTRY
============================================================ */

const scoringStrategies = {
  standard: evaluateStandard,

  net_wpm: evaluateNetWpm,

  accuracy: evaluateAccuracy,

  weighted: evaluateWeighted,

  custom: evaluateCustom,

  fixed_error_penalty: evaluateFixedErrorPenalty,

  grouped_error_penalty: evaluateGroupedErrorPenalty,

  correct_words_ratio: evaluateCorrectWordsRatio,

  qualifying_only: evaluateQualifyingOnly,

  speed_based: evaluateSpeedBased,
};

/* ============================================================
   MAIN EVALUATION SERVICE
============================================================ */

/**
 * Evaluates one completed typing attempt.
 *
 * @param {Object} params
 * @param {Object} params.attempt
 *
 * @returns {Object} Final evaluation result.
 */
export const evaluateTypingAttempt = ({ attempt }) => {
  if (!attempt || typeof attempt !== "object") {
    throw new TypeError("Typing attempt is required.");
  }

  const config = attempt.configSnapshot;
  const passage = attempt.passageSnapshot;

  if (!config || !passage) {
    throw new Error("Attempt must contain exam and passage snapshots.");
  }

  if (typeof attempt.typedText !== "string") {
    throw new TypeError("Attempt typedText must be a string.");
  }

  const scoring = config.scoring || {};

  const method = scoring.method || "standard";

  const strategy = scoringStrategies[method];

  if (!strategy) {
    throw new Error(`Unsupported typing scoring method: ${method}`);
  }

  const maximumMarks = assertNonNegative(config.maximumMarks, "Maximum marks");

  const targetWpm = assertNonNegative(config.targetWpm, "Target WPM");

  const elapsedSeconds = assertNonNegative(
    attempt.elapsedSeconds,
    "Elapsed seconds",
  );

  if (maximumMarks <= 0 && method !== "qualifying_only") {
    throw new Error(
      "Maximum marks must be greater than zero for marks-based scoring.",
    );
  }

  /* ==========================================================
     1. WORD-BASED METRICS
  ========================================================== */
  console.log("========== PASSAGE DEBUG ==========");

  console.log({
    passageId: attempt.passageId,
    passageTitle: attempt.passageSnapshot?.title,

    contentLength: attempt.passageSnapshot?.content?.length,

    contentPreview: attempt.passageSnapshot?.content?.slice(0, 300),

    wordCount: attempt.passageSnapshot?.wordCount,

    whitespaceCount: (attempt.passageSnapshot?.content?.match(/\s/gu) || [])
      .length,
  });

  console.log("===================================");

  const metrics = calculateTypingMetrics({
    expectedText: passage.content,
    typedText: attempt.typedText,
    elapsedSeconds,
    scoring,
  });

  /* ==========================================================
     2. SCORING STRATEGY
  ========================================================== */

  const scoringResult = strategy({
    metrics,
    maximumMarks,
    targetWpm,
    scoring,
  });

  let marks =
    scoringResult.rawMarks === null
      ? null
      : clamp(scoringResult.rawMarks, 0, maximumMarks);

  if (marks !== null) {
    marks = getRoundedMarks(marks, scoring.rounding);
  }

  const percentage =
    marks === null || maximumMarks <= 0
      ? null
      : roundTo((marks / maximumMarks) * 100, 2);

  const passingPercentage = toNumber(config.passingPercentage, 40);

  const passingMarks = maximumMarks * (passingPercentage / 100);

  /* ==========================================================
     3. QUALIFICATION
  ========================================================== */

  const qualification = calculateTypingQualification({
    metrics,
    marks,
    configSnapshot: {
      ...config,
      passingMarks,
    },
  });

  /* ==========================================================
     4. ERROR DISTRIBUTION
  ========================================================== */

  const errorCounts = getErrorCounts(metrics, scoring);

  const errorPenalties = scoring.errorPenalties || {};

  const errorTotal = Object.values(errorCounts).reduce(
    (total, count) => total + count,
    0,
  );

  const errorDistribution = Object.entries(errorCounts)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => {
      const categoryPenalty = toNumber(errorPenalties[category]);

      return {
        category,
        count,
        percentage: errorTotal > 0 ? roundTo((count / errorTotal) * 100, 2) : 0,
        marksLost: roundTo(count * categoryPenalty, 4),
      };
    });

  /* ==========================================================
     5. WORD ANALYSIS WITH MARKS LOST
  ========================================================== */

  const penalties = scoring.errorPenalties || {};

  const wordAnalysis = metrics.wordAnalysis.map((word) => {
    let marksLost = 0;

    switch (word.type) {
      case "misspelling":
        marksLost = toNumber(penalties.spelling);
        break;

      case "wrong":
        marksLost = toNumber(penalties.wrongWord);
        break;

      case "omitted":
        marksLost = toNumber(penalties.omission);
        break;

      case "extra":
        marksLost = toNumber(penalties.extraWord);
        break;

      case "not_reached":
        marksLost =
          scoring.notReachedPolicy === "apply_configured_penalty"
            ? toNumber(penalties.notReached)
            : 0;
        break;

      default:
        marksLost = 0;
    }

    return {
      ...word,
      marksLost: roundTo(marksLost, 4),
    };
  });

  /* ==========================================================
     6. FINAL RESULT
  ========================================================== */

  const passed = qualification.passed;

  return {
    status: passed ? "passed" : "failed",

    wordMetrics: {
      totalWords: metrics.totalWords,
      wordsTyped: metrics.wordsTyped,
      correctWords: metrics.correctWords,
      incorrectWords: metrics.incorrectWords,
      misspellings: metrics.misspellings,
      wrongWords: metrics.wrongWords,
      omissions: metrics.omissions,
      notReachedWords: metrics.notReachedWords,
      extraWords: metrics.extraWords,
      totalErrors: metrics.totalErrors,
      grossWpm: metrics.grossWpm,
      netWpm: metrics.netWpm,
      accuracy: metrics.accuracy,
      elapsedSeconds: metrics.elapsedSeconds,
    },

    wordAnalysis,

    marks,

    maximumMarks,

    passingPercentage,

    passingMarks: roundTo(passingMarks, 2),

    percentage,

    meetsMinimumWpm: qualification.wpmRequirementMet,

    meetsMinimumAccuracy: qualification.accuracyRequirementMet,

    meetsMaximumErrors: qualification.errorsRequirementMet,

    meetsPassingMarks: qualification.marksRequirementMet,

    passed,

    qualification,

    errorDistribution,

    scoringBreakdown: {
      method,
      policyVersion: scoring.policyVersion ?? 1,
      speedMarks: roundTo(scoringResult.speedMarks || 0, 4),
      deductions: roundTo(scoringResult.deductions || 0, 4),
      rawMarks:
        scoringResult.rawMarks === null
          ? null
          : roundTo(scoringResult.rawMarks, 4),
      details: scoringResult.errorBreakdown || {},
    },

    evaluatedAt: new Date(),
  };
};

export default evaluateTypingAttempt;
