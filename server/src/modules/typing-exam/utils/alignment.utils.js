import { countGraphemes } from './text.utils.js';

// Deterministic baseline. For official exam scoring, replace this with a full
// Unicode-aware word/character alignment service and preserve its output contract.
export function compareText(expectedText, typedText) {
  const expected = String(expectedText ?? '');
  const typed = String(typedText ?? '');
  const expectedChars = Array.from(expected);
  const typedChars = Array.from(typed);
  const max = Math.max(expectedChars.length, typedChars.length);
  let substitutions = 0, insertions = 0, deletions = 0, correctCharacters = 0;
  for (let i = 0; i < max; i += 1) {
    const e = expectedChars[i]; const t = typedChars[i];
    if (e !== undefined && t !== undefined) { if (e === t) correctCharacters += 1; else substitutions += 1; }
    else if (e === undefined) insertions += 1;
    else deletions += 1;
  }
  const expectedWords = expected.trim() ? expected.trim().split(/\s+/u).filter(Boolean) : [];
  const typedWords = typed.trim() ? typed.trim().split(/\s+/u).filter(Boolean) : [];
  const wordMax = Math.max(expectedWords.length, typedWords.length);
  let correctWords = 0, wordErrors = 0;
  for (let i = 0; i < wordMax; i += 1) {
    if (expectedWords[i] !== undefined && typedWords[i] !== undefined && expectedWords[i] === typedWords[i]) correctWords += 1;
    else wordErrors += 1;
  }
  return {
    expectedWords: expectedWords.length,
    typedWords: typedWords.length,
    correctWords,
    incorrectWords: wordErrors,
    expectedCharacters: expectedChars.length,
    typedCharacters: typedChars.length,
    correctCharacters,
    incorrectCharacters: substitutions + insertions + deletions,
    expectedGraphemes: countGraphemes(expected),
    typedGraphemes: countGraphemes(typed),
    correctGraphemes: Math.max(0, countGraphemes(expected) - substitutions - insertions - deletions),
    insertions, deletions, substitutions,
    wordErrors,
    spacingErrors: 0,
    punctuationErrors: 0,
    totalErrors: wordErrors
  };
}
