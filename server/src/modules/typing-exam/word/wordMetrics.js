function assertCount(name, value) {
  if (!Number.isInteger(value) || value < 0) throw new TypeError(`${name} must be a non-negative integer`);
}

export function calculateWordMetrics({ totalWords, wordsTyped, correctWords, durationSeconds }) {
  assertCount("totalWords", totalWords);
  assertCount("wordsTyped", wordsTyped);
  assertCount("correctWords", correctWords);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error("durationSeconds must be positive");
  if (correctWords > totalWords || correctWords > wordsTyped) throw new Error("Invalid word metric counts");

  const minutes = durationSeconds / 60;
  const grossWpm = wordsTyped / minutes;
  const netWpm = correctWords / minutes;
  return {
    totalWords, wordsTyped, correctWords,
    incorrectWords: Math.max(0, totalWords - correctWords),
    grossWpm: Number(grossWpm.toFixed(2)),
    netWpm: Number(netWpm.toFixed(2)),
    accuracy: totalWords ? Number(((correctWords / totalWords) * 100).toFixed(2)) : 0
  };
}
