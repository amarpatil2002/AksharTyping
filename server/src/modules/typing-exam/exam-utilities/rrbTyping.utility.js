import { clamp, safeDivide, roundTo } from '../utils/number.utils.js';

/**
 * RRB CBTST utility.
 * Current NTPC CBTST notices use 30 WPM English / 25 WPM Hindi,
 * with a 10-minute test and no editing/spell-check facility.
 *
 * The 5% ignorable-mistake + 10-word deduction formula is kept as a
 * configurable legacy RRB rule because RRB notices/circulars can differ.
 */
export function evaluateRrbTyping({
  totalWords,
  finalMistakes,
  durationSeconds,
  language = 'english',
  minimumWpm,
  ignorableMistakePercentage = 5,
  deductionWordsPerMistake = 10,
  useIgnorableMistakes = true,
  rounding = { method: 'ROUND', decimalPlaces: 2 }
}) {
  const minutes = safeDivide(durationSeconds, 60);
  const requiredWpm = minimumWpm ?? (language === 'hindi' ? 25 : 30);

  const ignorableMistakes = useIgnorableMistakes
    ? Math.floor(totalWords * ignorableMistakePercentage / 100)
    : 0;

  const effectiveMistakes = Math.max(0, finalMistakes - ignorableMistakes);
  const adjustedWords = Math.max(
    0,
    totalWords - effectiveMistakes * deductionWordsPerMistake
  );

  const achievedWpm = roundTo(
    safeDivide(adjustedWords, minutes),
    rounding.decimalPlaces,
    rounding.method
  );

  return {
    formula: useIgnorableMistakes
      ? 'adjustedWords = totalWords - ((finalMistakes - floor(totalWords * ignorableMistakePercentage / 100)) * deductionWordsPerMistake)'
      : 'adjustedWords = totalWords - (finalMistakes * deductionWordsPerMistake)',
    totalWords,
    finalMistakes,
    ignorableMistakes,
    effectiveMistakes,
    adjustedWords,
    durationSeconds,
    achievedWpm,
    requiredWpm,
    language,
    qualified: achievedWpm >= requiredWpm
  };
}

export function rrbNtpcPolicy(language = 'english') {
  return {
    evaluator: 'RRB_NTPC_CBTST',
    durationSeconds: 600,
    minimumWpm: language === 'hindi' ? 25 : 30,
    language,
    editingToolsAllowed: false,
    spellCheckAllowed: false,
    fontOptions: language === 'hindi' ? ['Kruti Dev', 'Mangal'] : [],
    useIgnorableMistakes: false,
    ignorableMistakePercentage: 0,
    deductionWordsPerMistake: 10
  };
}

export function rrbLegacy25_30Policy(language = 'english') {
  return {
    evaluator: 'RRB_LEGACY_25_30',
    durationSeconds: 600,
    minimumWpm: language === 'hindi' ? 25 : 30,
    language,
    editingToolsAllowed: false,
    spellCheckAllowed: false,
    useIgnorableMistakes: true,
    ignorableMistakePercentage: 5,
    deductionWordsPerMistake: 10
  };
}

export function rrb40_35Policy(language = 'english') {
  return {
    evaluator: 'RRB_40_35_NO_IGNORABLE',
    durationSeconds: 600,
    minimumWpm: language === 'hindi' ? 35 : 40,
    language,
    editingToolsAllowed: true,
    spellCheckAllowed: false,
    useIgnorableMistakes: false,
    ignorableMistakePercentage: 0,
    deductionWordsPerMistake: 10
  };
}
