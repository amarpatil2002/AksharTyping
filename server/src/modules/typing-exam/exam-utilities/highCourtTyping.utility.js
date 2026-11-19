import { safeDivide, roundTo } from "../utils/number.utils.js";

/**
 * Generic High Court typing evaluator.
 *
 * This utility receives COMMON typing metrics and applies
 * High-Court-specific scoring rules.
 *
 * It does NOT perform text comparison.
 * Text comparison belongs to the common typing engine.
 */
export function evaluateHighCourtTyping({
  totalWords,
  correctWords,
  mistakes = 0,
  durationSeconds,

  requiredWpm = 0,
  allowedMistakes = null,

  penaltyPerMistake = 0,

  maximumMarks = null,
  marksPerMistake = null,

  language = "english",

  rounding = {
    method: "ROUND",
    decimalPlaces: 2,
  },
}) {
  if (!Number.isFinite(totalWords) || totalWords < 0) {
    throw new TypeError("totalWords must be a non-negative number");
  }

  if (!Number.isFinite(correctWords) || correctWords < 0) {
    throw new TypeError("correctWords must be a non-negative number");
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new RangeError("durationSeconds must be greater than zero");
  }

  if (!Number.isFinite(mistakes) || mistakes < 0) {
    throw new TypeError("mistakes must be a non-negative number");
  }
  for (const [name, value] of Object.entries({
    requiredWpm,
    penaltyPerMistake,
    maximumMarks,
    marksPerMistake,
  })) {
    if (value !== null && value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new TypeError(`${name} must be a non-negative number`);
    }
  }

  const minutes = safeDivide(durationSeconds, 60);

  /*
   * Gross typing speed.
   *
   * Example:
   *
   * 57 typed words / 1.4667 minutes
   * = 38.86 WPM
   */
  const grossWpm = roundTo(
    safeDivide(totalWords, minutes),
    rounding.decimalPlaces,
    rounding.method,
  );

  /*
   * Correct-word speed.
   *
   * Example:
   *
   * 56 correct words / 1.4667 minutes
   * = 38.18 WPM
   */
  const correctWpm = roundTo(
    safeDivide(correctWords, minutes),
    rounding.decimalPlaces,
    rounding.method,
  );

  /*
   * Mistake penalty.
   *
   * Example:
   *
   * 2 mistakes × 1 mark
   * = 2 marks penalty
   */
  const penalty = roundTo(
    Math.max(0, mistakes * penaltyPerMistake),
    rounding.decimalPlaces,
    rounding.method,
  );

  /*
   * Calculate marks.
   *
   * There are two supported models:
   *
   * 1. maximumMarks + marksPerMistake
   *
   *    marks = maximumMarks -
   *            (mistakes × marksPerMistake)
   *
   * 2. maximumMarks + penaltyPerMistake
   *
   *    marks = maximumMarks - penalty
   */
  let marks = null;

  if (maximumMarks !== null && maximumMarks !== undefined) {
    if (marksPerMistake !== null && marksPerMistake !== undefined) {
      marks = maximumMarks - mistakes * marksPerMistake;
    } else {
      marks = maximumMarks - penalty;
    }

    marks = roundTo(
      Math.max(0, marks),
      rounding.decimalPlaces,
      rounding.method,
    );
  }

  /*
   * Speed qualification.
   */
  const speedQualified = requiredWpm <= 0 || grossWpm >= requiredWpm;

  /*
   * Error qualification.
   */
  const errorQualified =
    allowedMistakes === null ||
    allowedMistakes === undefined ||
    mistakes <= allowedMistakes;

  /*
   * Overall qualification.
   */
  const qualified = speedQualified && errorQualified;

  /*
   * Percentage of maximum marks.
   */
  let percentage = null;

  if (marks !== null && maximumMarks !== null && maximumMarks > 0) {
    percentage = roundTo(
      (marks / maximumMarks) * 100,
      rounding.decimalPlaces,
      rounding.method,
    );
  }

  return {
    language,

    durationSeconds,

    totalWords,
    correctWords,
    mistakes,

    grossWpm,
    correctWpm,

    requiredWpm,
    allowedMistakes,

    penaltyPerMistake,
    penalty,

    maximumMarks,
    marksPerMistake,

    marks,
    percentage,

    speedQualified,
    errorQualified,

    qualified,
  };
}

/**
 * Generic High Court WPM policy.
 *
 * This policy means:
 *
 *   - minimum WPM is required
 *   - mistakes may optionally be restricted
 *   - no marks penalty unless configured
 */
export function highCourtGenericWpmPolicy({
  requiredWpm,
  language = "english",

  allowedMistakes = null,

  maximumMarks = null,
  penaltyPerMistake = 0,
  marksPerMistake = null,
} = {}) {
  return {
    evaluator: "HIGH_COURT_GENERIC_WPM",

    language,

    requiredWpm,

    durationSeconds: 600,

    allowedMistakes,

    maximumMarks,

    penaltyPerMistake,

    marksPerMistake,
  };
}

/**
 * High Court marks-per-mistake policy.
 *
 * Example:
 *
 * maximumMarks = 40
 * marksPerMistake = 1
 *
 * 3 mistakes:
 *
 * 40 - (3 × 1) = 37 marks
 */
export function highCourtMarksPerMistakePolicy({
  requiredWpm = 0,

  maximumMarks,

  marksPerMistake,

  allowedMistakes = null,

  language = "english",
} = {}) {
  return {
    evaluator: "HIGH_COURT_MARKS_PER_MISTAKE",

    language,

    requiredWpm,

    durationSeconds: 600,

    maximumMarks,

    marksPerMistake,

    allowedMistakes,

    penaltyPerMistake: 0,
  };
}

/**
 * Multi-language High Court policy.
 *
 * Each language/module can have its own configuration.
 */
export function highCourtMultiLanguagePolicy({
  modules,

  durationSeconds = 600,
} = {}) {
  return {
    evaluator: "HIGH_COURT_MULTI_LANGUAGE",

    durationSeconds,

    modules,
  };
}
