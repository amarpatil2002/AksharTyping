import { safeDivide } from './number.utils.js';

export function calculateGrossWpm(typedWords, durationSeconds) {
  return safeDivide(Number(typedWords), Number(durationSeconds) / 60);
}
export function calculateFiveCharacterWpm(typedCharacters, durationSeconds, wordLength = 5) {
  return safeDivide(Number(typedCharacters), Number(wordLength) * (Number(durationSeconds) / 60));
}
export function calculateCpm(typedCharacters, durationSeconds) {
  return safeDivide(Number(typedCharacters), Number(durationSeconds) / 60);
}
export function calculateKdph(keyDepressions, durationSeconds) {
  return safeDivide(Number(keyDepressions), Number(durationSeconds) / 60) * 60;
}
export function calculateCorrectWpm(correctWords, durationSeconds) {
  return safeDivide(Number(correctWords), Number(durationSeconds) / 60);
}
