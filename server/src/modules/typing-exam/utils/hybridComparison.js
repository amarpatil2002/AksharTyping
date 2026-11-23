import { tokenizeWords } from "./tokenize.js";
import { compareWords } from "./wordComparison.js";
import { compareCharacters } from "./characterComparison.js";

export function compareHybrid(expectedText, typedText) {
  const wordResult = compareWords(
    tokenizeWords(expectedText),
    tokenizeWords(typedText)
  );

  const characterResult = compareCharacters(expectedText, typedText);

  return {
    type: "HYBRID",
    words: wordResult,
    characters: characterResult,
    totals: {
      correctWords: wordResult.totalCorrect,
      incorrectWords: wordResult.totalIncorrect,
      missingWords: wordResult.totalMissing,
      extraWords: wordResult.totalExtra,

      correctCharacters: characterResult.totalCorrect,
      incorrectCharacters: characterResult.totalIncorrect,
      missingCharacters: characterResult.totalMissing,
      extraCharacters: characterResult.totalExtra,
    },
  };
}
