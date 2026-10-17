export interface TypingMetrics {
  wpm: number;
  accuracy: number;
  errors: number;
  correctCharacters: number;
  incorrectCharacters: number;
  missedCharacters: number;
  extraCharacters: number;
  totalTypedCharacters: number;
}

export function calculateExamResult(
  originalText: string,
  typedText: string,
  elapsedSeconds: number,
): TypingMetrics {
  const original = Array.from(originalText);
  const typed = Array.from(typedText);

  const totalTypedCharacters = typed.length;
  const timeInMinutes = elapsedSeconds / 60;

  let correctCharacters = 0;
  let incorrectCharacters = 0;
  let extraCharacters = 0;

  // Compare each typed character with the expected character.
  for (let i = 0; i < typed.length; i++) {
    if (i >= original.length) {
      extraCharacters++;
    } else if (typed[i] === original[i]) {
      correctCharacters++;
    } else {
      incorrectCharacters++;
    }
  }

  // Expected characters the user did not type.
  const missedCharacters = Math.max(0, original.length - typed.length);

  // Character-level accuracy across the passage's typed positions.
  const accuracy =
    typed.length === 0 ? 0 : (correctCharacters / typed.length) * 100;

  // Standard five-character word convention.
  const wpm =
    timeInMinutes > 0 ? Math.round(correctCharacters / 5 / timeInMinutes) : 0;

  return {
    wpm,
    accuracy: Number(accuracy.toFixed(2)),
    errors: incorrectCharacters + extraCharacters,
    correctCharacters,
    incorrectCharacters,
    missedCharacters,
    extraCharacters,
    totalTypedCharacters,
  };
}
