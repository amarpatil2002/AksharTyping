import { normalizeText } from "../utils/text.utils.js";
import { compareText } from "../utils/alignment.utils.js";
import {
  calculateGrossWpm,
  calculateCpm,
  calculateKdph,
} from "../utils/speed.utils.js";
import {
  calculateWordAccuracy,
  calculateCharacterAccuracy,
  calculateErrorPercentage,
} from "../utils/accuracy.utils.js";
import { roundTo } from "../utils/number.utils.js";

export function calculateCommonTypingResult({
  expectedText,
  typedText,
  durationSeconds,
  normalization = "NFC",
  rounding = { method: "ROUND", decimalPlaces: 2 },
}) {
  if (typeof expectedText !== "string" || typeof typedText !== "string")
    throw new TypeError("expectedText and typedText must be strings");
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0)
    throw new RangeError("durationSeconds must be greater than zero");
  const expected = normalizeText(expectedText, normalization);
  const typed = normalizeText(typedText, normalization);
  const alignment = compareText(expected, typed);
  const r = (v) => roundTo(v, rounding.decimalPlaces, rounding.method);
  const minutes = durationSeconds / 60;
  return {
    duration: { seconds: r(durationSeconds), minutes: r(minutes) },
    words: {
      expected: alignment.expectedWords,
      typed: alignment.typedWords,
      correct: alignment.correctWords,
      incorrect: alignment.incorrectWords,
    },
    characters: {
      expected: alignment.expectedCharacters,
      typed: alignment.typedCharacters,
      correct: alignment.correctCharacters,
      incorrect: alignment.incorrectCharacters,
    },
    graphemes: {
      expected: alignment.expectedGraphemes,
      typed: alignment.typedGraphemes,
      correct: alignment.correctGraphemes,
    },
    errors: {
      total: alignment.totalErrors,
      wordErrors: alignment.wordErrors,
      characterErrors: alignment.incorrectCharacters,
      insertions: alignment.insertions,
      deletions: alignment.deletions,
      substitutions: alignment.substitutions,
      spacingErrors: alignment.spacingErrors,
      punctuationErrors: alignment.punctuationErrors,
    },
    speed: {
      grossWpm: r(calculateGrossWpm(alignment.typedWords, durationSeconds)),
      grossCpm: r(calculateCpm(alignment.typedCharacters, durationSeconds)),
      kdph: r(calculateKdph(alignment.typedCharacters, durationSeconds)),
    },
    accuracy: {
      word: r(
        calculateWordAccuracy(alignment.correctWords, alignment.typedWords),
      ),
      character: r(
        calculateCharacterAccuracy(
          alignment.correctCharacters,
          alignment.typedCharacters,
        ),
      ),
    },
    errorPercentage: r(
      calculateErrorPercentage(alignment.totalErrors, alignment.typedWords),
    ),
    engineVersion: "1.0.0",
  };
}
