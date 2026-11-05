import { safeDivide, clamp } from './number.utils.js';
export function percentage(correct, total) { return clamp(safeDivide(correct, total) * 100, 0, 100); }
export function calculateWordAccuracy(correctWords, typedWords) { return percentage(correctWords, typedWords); }
export function calculateCharacterAccuracy(correctCharacters, typedCharacters) { return percentage(correctCharacters, typedCharacters); }
export function calculateErrorPercentage(errors, evaluatedUnits) { return clamp(safeDivide(errors, evaluatedUnits) * 100, 0, 100); }
