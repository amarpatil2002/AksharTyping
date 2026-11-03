function assertCount(name, value) {
  if (!Number.isInteger(value) || value < 0) throw new TypeError(`${name} must be a non-negative integer`);
}

export function calculateCharacterMetrics({ totalCharacters, charactersTyped, correctCharacters, durationSeconds }) {
  assertCount("totalCharacters", totalCharacters);
  assertCount("charactersTyped", charactersTyped);
  assertCount("correctCharacters", correctCharacters);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error("durationSeconds must be positive");
  if (correctCharacters > totalCharacters || correctCharacters > charactersTyped) throw new Error("Invalid character metric counts");

  const minutes = durationSeconds / 60;
  const grossCpm = charactersTyped / minutes;
  const netCpm = correctCharacters / minutes;
  return {
    totalCharacters, charactersTyped, correctCharacters,
    incorrectCharacters: Math.max(0, totalCharacters - correctCharacters),
    grossCpm: Number(grossCpm.toFixed(2)),
    netCpm: Number(netCpm.toFixed(2)),
    grossKdph: Number((grossCpm * 60).toFixed(2)),
    netKdph: Number((netCpm * 60).toFixed(2)),
    accuracy: totalCharacters ? Number(((correctCharacters / totalCharacters) * 100).toFixed(2)) : 0
  };
}
