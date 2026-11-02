import { compareWordSequences } from "./wordAlignment.service.js";

/* ============================================================
   HELPERS
============================================================ */

const roundTo = (value, decimals = 4) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const toNonNegativeNumber = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new TypeError(`${fieldName} must be a non-negative number.`);
  }

  return number;
};

/* ============================================================
   TYPING METRICS
============================================================ */

/**
 * Calculates word-based typing metrics.
 *
 * @param {Object} params
 * @param {string} params.expectedText
 * @param {string} params.typedText
 * @param {number} params.elapsedSeconds
 * @param {Object} params.scoring
 *
 * @returns {Object} Metrics compatible with wordMetricsSchema.
 */
export const calculateTypingMetrics = ({
  expectedText,
  typedText,
  elapsedSeconds,
  scoring = {},
}) => {
  if (typeof expectedText !== "string") {
    throw new TypeError("Expected passage text must be a string.");
  }

  if (typeof typedText !== "string") {
    throw new TypeError("Typed text must be a string.");
  }

  const elapsed = toNonNegativeNumber(elapsedSeconds, "Elapsed seconds");

  const comparison = compareWordSequences(expectedText, typedText);

  const counts = comparison.counts;

  const totalWords = Number(comparison.expectedWordCount ?? 0);
  const wordsTyped = Number(counts.wordsTyped ?? 0);

  const correctWords = Number(counts.correctWords ?? 0);
  const misspellings = Number(counts.misspellings ?? 0);
  const wrongWords = Number(counts.wrongWords ?? 0);

  const omissions = Number(counts.omissions ?? 0);
  const notReachedWords = Number(counts.notReachedWords ?? 0);
  const extraWords = Number(counts.extraWords ?? 0);

  const incorrectWords = misspellings + wrongWords;

  // Each error category is counted exactly once.
  const totalErrors = incorrectWords + omissions + notReachedWords + extraWords;

  const elapsedMinutes = elapsed / 60;

  const grossWpm = elapsedMinutes > 0 ? wordsTyped / elapsedMinutes : 0;

  const correctWordsWpm =
    elapsedMinutes > 0 ? correctWords / elapsedMinutes : 0;

  let netWpm = correctWordsWpm;

  switch (scoring.speedCalculation) {
    case "gross_words_per_minute":
      netWpm = grossWpm;
      break;

    case "gross_minus_error_penalty":
      netWpm = Math.max(
        0,
        grossWpm - (elapsedMinutes > 0 ? totalErrors / elapsedMinutes : 0),
      );
      break;

    case "correct_words_per_minute":
    default:
      netWpm = correctWordsWpm;
      break;
  }

  let accuracy = 0;

  if (
    scoring.accuracyCalculation === "correct_words_divided_by_reference_words"
  ) {
    accuracy = totalWords > 0 ? (correctWords / totalWords) * 100 : 0;
  } else {
    accuracy = wordsTyped > 0 ? (correctWords / wordsTyped) * 100 : 0;
  }

  return {
    totalWords,
    wordsTyped,
    correctWords,
    incorrectWords,
    misspellings,
    wrongWords,
    omissions,
    notReachedWords,
    extraWords,
    totalErrors,

    grossWpm: roundTo(grossWpm),
    netWpm: roundTo(netWpm),
    accuracy: roundTo(accuracy),

    elapsedSeconds: roundTo(elapsed, 2),

    // Keep the detailed alignment for the evaluator.
    wordAnalysis: comparison.alignedWords,

    // Useful for debugging and reporting.
    comparison: {
      expectedWordCount: totalWords,
      typedWordCount: comparison.typedWordCount,
    },
  };
};

export default calculateTypingMetrics;
