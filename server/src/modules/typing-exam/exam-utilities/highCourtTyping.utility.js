import { safeDivide, roundTo } from '../utils/number.utils.js';

/**
 * Generic High Court typing utility.
 * High Courts publish post/recruitment-specific rules, so the utility is
 * deliberately parameterized rather than pretending one rule applies to all courts.
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
  language = 'english',
  rounding = { method: 'ROUND', decimalPlaces: 2 }
}) {
  const minutes = safeDivide(durationSeconds, 60);
  const grossWpm = roundTo(safeDivide(totalWords, minutes), rounding.decimalPlaces, rounding.method);
  const correctWpm = roundTo(safeDivide(correctWords, minutes), rounding.decimalPlaces, rounding.method);

  let penalty = 0;
  let marks = maximumMarks;

  if (penaltyPerMistake > 0) penalty = mistakes * penaltyPerMistake;

  if (maximumMarks !== null && marksPerMistake !== null) {
    marks = Math.max(0, maximumMarks - mistakes * marksPerMistake);
  } else if (maximumMarks !== null) {
    marks = Math.max(0, maximumMarks - penalty);
  }

  const speedQualified = requiredWpm <= 0 || grossWpm >= requiredWpm;
  const errorQualified = allowedMistakes === null || mistakes <= allowedMistakes;

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
    penalty,
    maximumMarks,
    marks,
    speedQualified,
    errorQualified,
    qualified: speedQualified && errorQualified
  };
}

export function highCourtGenericWpmPolicy({ requiredWpm, language = 'english' } = {}) {
  return {
    evaluator: 'HIGH_COURT_GENERIC_WPM',
    language,
    requiredWpm,
    durationSeconds: 600
  };
}

export function highCourtMarksPerMistakePolicy({
  requiredWpm = 0,
  maximumMarks,
  marksPerMistake,
  language = 'english'
} = {}) {
  return {
    evaluator: 'HIGH_COURT_MARKS_PER_MISTAKE',
    language,
    requiredWpm,
    maximumMarks,
    marksPerMistake,
    durationSeconds: 600
  };
}

export function highCourtMultiLanguagePolicy({
  modules,
  durationSeconds = 600
} = {}) {
  return {
    evaluator: 'HIGH_COURT_MULTI_LANGUAGE',
    durationSeconds,
    modules
  };
}
