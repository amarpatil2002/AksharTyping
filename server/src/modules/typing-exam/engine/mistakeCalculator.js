export function calculateMistakes({
  fullMistakes = 0,
  halfMistakes = 0,
  fullMistakeWeight = 1,
  halfMistakeWeight = 0.5
}) {
  for (const [name, value] of Object.entries({ fullMistakes, halfMistakes, fullMistakeWeight, halfMistakeWeight })) {
    if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be a non-negative number`);
  }
  const weightedMistakes = fullMistakes * fullMistakeWeight + halfMistakes * halfMistakeWeight;
  return {
    fullMistakes,
    halfMistakes,
    weightedMistakes: Number(weightedMistakes.toFixed(2)),
    finalMistakes: fullMistakes + halfMistakes
  };
}
