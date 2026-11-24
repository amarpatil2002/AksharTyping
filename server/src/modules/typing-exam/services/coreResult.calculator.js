function normalizeText(text, rule) {
  let value = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!rule.counting.caseSensitive) value = value.toLowerCase();
  return value;
}

function tokenize(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function compareWords(expectedWords, typedWords) {
  const maxLength = Math.max(expectedWords.length, typedWords.length);
  let correctWords = 0;
  let incorrectWords = 0;
  let missingWords = 0;
  let extraWords = 0;

  for (let i = 0; i < maxLength; i++) {
    const expected = expectedWords[i];
    const typed = typedWords[i];

    if (expected !== undefined && typed !== undefined) {
      if (expected === typed) correctWords++;
      else incorrectWords++;
    } else if (expected !== undefined) {
      missingWords++;
    } else {
      extraWords++;
    }
  }

  return { correctWords, incorrectWords, missingWords, extraWords };
}

function calculateCoreResult({ expectedText, typedText, elapsedSeconds, rule }) {
  const safeElapsedSeconds = Math.max(1, Number(elapsedSeconds || 1));
  const expectedWords = tokenize(normalizeText(expectedText, rule));
  const typedWords = tokenize(normalizeText(typedText, rule));
  const comparison = compareWords(expectedWords, typedWords);

  const totalExpectedWords = expectedWords.length;
  const totalTypedWords = typedWords.length;
  const totalErrors =
    comparison.incorrectWords +
    comparison.missingWords +
    comparison.extraWords;

  // Error percentage is bounded to 0..100 by using the larger
  // of expected/typed word counts as denominator.
  const denominator = Math.max(totalExpectedWords, totalTypedWords, 1);

  const accuracyPercentage = Number(
    ((comparison.correctWords / denominator) * 100).toFixed(2)
  );

  const errorPercentage = Number(
    ((totalErrors / denominator) * 100).toFixed(2)
  );

  const elapsedMinutes = safeElapsedSeconds / 60;

  const grossWpm = Number(
    (totalTypedWords / elapsedMinutes).toFixed(2)
  );

  const netWpm = Number(
    (comparison.correctWords / elapsedMinutes).toFixed(2)
  );

  return {
    type: rule.examType,
    words: {
      expected: totalExpectedWords,
      typed: totalTypedWords,
      correct: comparison.correctWords,
      incorrect: comparison.incorrectWords,
      missing: comparison.missingWords,
      extra: comparison.extraWords,
      errors: totalErrors,
    },
    metrics: {
      grossWpm,
      netWpm,
      accuracyPercentage,
      errorPercentage,
      elapsedSeconds: safeElapsedSeconds,
      elapsedMinutes: Number(elapsedMinutes.toFixed(2)),
    },
    status: { calculated: true },
  };
}

module.exports = {
  normalizeText,
  tokenize,
  compareWords,
  calculateCoreResult,
};
