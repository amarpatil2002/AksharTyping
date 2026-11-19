import { countGraphemes } from "./text.utils.js";

const MAX_ALIGNMENT_CELLS = 4_000_000;
const graphemeSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

function assertAlignmentBudget(expectedLength, typedLength) {
  if ((expectedLength + 1) * (typedLength + 1) > MAX_ALIGNMENT_CELLS) {
    const error = new RangeError(
      "Text is too long to evaluate safely. Please contact the exam administrator.",
    );
    error.statusCode = 413;
    throw error;
  }
}

/**
 * Convert a string into Unicode grapheme clusters.
 *
 * Intl.Segmenter is preferred because Indian-language characters
 * can consist of multiple Unicode code points.
 */
function toGraphemes(value) {
  const text = String(value ?? "");

  if (graphemeSegmenter) {
    return [...graphemeSegmenter.segment(text)].map(({ segment }) => segment);
  }

  return Array.from(text);
}

/**
 * Tokenize text into whitespace-separated words.
 */
function tokenizeWords(text) {
  const value = String(text ?? "").trim();

  if (!value) {
    return [];
  }

  return value.split(/\s+/u).filter(Boolean);
}

/**
 * Normalize a word for exact comparison.
 *
 * The complete text is already normalized before this function
 * is called, so we don't perform case conversion here.
 */
function normalizeWord(word) {
  return String(word ?? "");
}

function isPunctuation(grapheme) {
  return /^\p{P}$/u.test(grapheme);
}

/**
 * Build a dynamic-programming alignment between expected words
 * and typed words.
 *
 * Operations:
 *   match
 *   substitute
 *   delete
 *   insert
 */
function buildWordAlignment(expectedWords, typedWords) {
  const expectedLength = expectedWords.length;
  const typedLength = typedWords.length;
  assertAlignmentBudget(expectedLength, typedLength);

  const matrix = Array.from({ length: expectedLength + 1 }, () =>
    new Array(typedLength + 1).fill(0),
  );

  // Deleting expected words.
  for (let row = 1; row <= expectedLength; row += 1) {
    matrix[row][0] = row;
  }

  // Inserting typed words.
  for (let column = 1; column <= typedLength; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= expectedLength; row += 1) {
    const expectedWord = normalizeWord(expectedWords[row - 1]);

    for (let column = 1; column <= typedLength; column += 1) {
      const typedWord = normalizeWord(typedWords[column - 1]);

      const substitutionCost = expectedWord === typedWord ? 0 : 1;

      const substitution = matrix[row - 1][column - 1] + substitutionCost;

      const deletion = matrix[row - 1][column] + 1;

      const insertion = matrix[row][column - 1] + 1;

      matrix[row][column] = Math.min(substitution, deletion, insertion);
    }
  }

  const operations = [];

  let row = expectedLength;
  let column = typedLength;

  while (row > 0 || column > 0) {
    const currentCost = matrix[row][column];

    /*
     * Prefer match/substitution when multiple paths have
     * the same cost. This makes the alignment deterministic.
     */
    if (row > 0 && column > 0) {
      const expectedWord = normalizeWord(expectedWords[row - 1]);

      const typedWord = normalizeWord(typedWords[column - 1]);

      const substitutionCost = expectedWord === typedWord ? 0 : 1;

      if (matrix[row - 1][column - 1] + substitutionCost === currentCost) {
        operations.push({
          operation: substitutionCost === 0 ? "match" : "substitute",
          expectedIndex: row - 1,
          typedIndex: column - 1,
        });

        row -= 1;
        column -= 1;

        continue;
      }
    }

    /*
     * Expected word exists but candidate did not type it.
     */
    if (row > 0 && matrix[row - 1][column] + 1 === currentCost) {
      operations.push({
        operation: "delete",
        expectedIndex: row - 1,
        typedIndex: null,
      });

      row -= 1;

      continue;
    }

    /*
     * Candidate typed an extra word.
     */
    if (column > 0 && matrix[row][column - 1] + 1 === currentCost) {
      operations.push({
        operation: "insert",
        expectedIndex: null,
        typedIndex: column - 1,
      });

      column -= 1;

      continue;
    }

    throw new Error("Unable to reconstruct word alignment.");
  }

  operations.reverse();

  return {
    operations,
    editCost: matrix[expectedLength][typedLength],
  };
}

/**
 * Build a Unicode grapheme-level alignment between two words.
 *
 * This detects:
 * - correct graphemes
 * - substitutions
 * - insertions
 * - deletions
 */
function buildGraphemeAlignment(expectedWord, typedWord) {
  const expected = toGraphemes(expectedWord);
  const typed = toGraphemes(typedWord);

  const expectedLength = expected.length;
  const typedLength = typed.length;
  assertAlignmentBudget(expectedLength, typedLength);

  const matrix = Array.from({ length: expectedLength + 1 }, () =>
    new Array(typedLength + 1).fill(0),
  );

  for (let row = 1; row <= expectedLength; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 1; column <= typedLength; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= expectedLength; row += 1) {
    for (let column = 1; column <= typedLength; column += 1) {
      const substitutionCost = expected[row - 1] === typed[column - 1] ? 0 : 1;

      const substitution = matrix[row - 1][column - 1] + substitutionCost;

      const deletion = matrix[row - 1][column] + 1;

      const insertion = matrix[row][column - 1] + 1;

      matrix[row][column] = Math.min(substitution, deletion, insertion);
    }
  }

  let row = expectedLength;
  let column = typedLength;

  let correctCharacters = 0;
  let substitutions = 0;
  let insertions = 0;
  let deletions = 0;
  let punctuationErrors = 0;

  while (row > 0 || column > 0) {
    const currentCost = matrix[row][column];

    /*
     * Match/substitution.
     */
    if (row > 0 && column > 0) {
      const substitutionCost = expected[row - 1] === typed[column - 1] ? 0 : 1;

      if (matrix[row - 1][column - 1] + substitutionCost === currentCost) {
        if (substitutionCost === 0) {
          correctCharacters += 1;
        } else {
          substitutions += 1;
          if (isPunctuation(expected[row - 1]) || isPunctuation(typed[column - 1])) {
            punctuationErrors += 1;
          }
        }

        row -= 1;
        column -= 1;

        continue;
      }
    }

    /*
     * Expected grapheme was deleted.
     */
    if (row > 0 && matrix[row - 1][column] + 1 === currentCost) {
      deletions += 1;
      if (isPunctuation(expected[row - 1])) punctuationErrors += 1;

      row -= 1;

      continue;
    }

    /*
     * Extra typed grapheme.
     */
    if (column > 0 && matrix[row][column - 1] + 1 === currentCost) {
      insertions += 1;
      if (isPunctuation(typed[column - 1])) punctuationErrors += 1;

      column -= 1;

      continue;
    }

    throw new Error("Unable to reconstruct grapheme alignment.");
  }

  return {
    expectedCharacters: expectedLength,
    typedCharacters: typedLength,
    correctCharacters,
    substitutions,
    insertions,
    deletions,
    punctuationErrors,
  };
}

/**
 * Compare expected passage with candidate typed text.
 *
 * IMPORTANT:
 *
 * Words are NOT compared using:
 *
 *   expectedWords[i] === typedWords[i]
 *
 * because an omitted word would shift every subsequent word.
 *
 * Instead, dynamic-programming alignment is used.
 */
export function compareText(expectedText, typedText) {
  const expected = String(expectedText ?? "");
  const typed = String(typedText ?? "");

  const expectedWords = tokenizeWords(expected);
  const typedWords = tokenizeWords(typed);

  const wordAlignment = buildWordAlignment(expectedWords, typedWords);

  let correctWords = 0;
  let wordErrors = 0;

  let insertions = 0;
  let deletions = 0;
  let substitutions = 0;

  let correctCharacters = 0;

  let characterInsertions = 0;
  let characterDeletions = 0;
  let characterSubstitutions = 0;
  let punctuationErrors = 0;

  /*
   * Process the word alignment.
   */
  for (const operation of wordAlignment.operations) {
    /*
     * Exact word match.
     */
    if (operation.operation === "match") {
      const expectedWord = expectedWords[operation.expectedIndex];

      correctWords += 1;

      const graphemes = toGraphemes(expectedWord);

      correctCharacters += graphemes.length;

      continue;
    }

    /*
     * Wrong typed word.
     *
     * Example:
     *
     * official -> officiasl
     *
     * This is ONE incorrect word.
     */
    if (operation.operation === "substitute") {
      const expectedWord = expectedWords[operation.expectedIndex];

      const typedWord = typedWords[operation.typedIndex];

      wordErrors += 1;
      substitutions += 1;

      const characterAlignment = buildGraphemeAlignment(
        expectedWord,
        typedWord,
      );

      correctCharacters += characterAlignment.correctCharacters;

      characterSubstitutions += characterAlignment.substitutions;

      characterInsertions += characterAlignment.insertions;

      characterDeletions += characterAlignment.deletions;
      punctuationErrors += characterAlignment.punctuationErrors;

      continue;
    }

    /*
     * Expected word was omitted.
     */
    if (operation.operation === "delete") {
      const expectedWord = expectedWords[operation.expectedIndex];

      wordErrors += 1;
      deletions += 1;

      const expectedGraphemes = toGraphemes(expectedWord);

      characterDeletions += expectedGraphemes.length;
      punctuationErrors += expectedGraphemes.filter(isPunctuation).length;

      continue;
    }

    /*
     * Candidate typed an extra word.
     */
    if (operation.operation === "insert") {
      const typedWord = typedWords[operation.typedIndex];

      wordErrors += 1;
      insertions += 1;

      const typedGraphemes = toGraphemes(typedWord);

      characterInsertions += typedGraphemes.length;
      punctuationErrors += typedGraphemes.filter(isPunctuation).length;

      continue;
    }
  }

  /*
   * Character-level error count.
   */
  /*
   * Character counts are Unicode grapheme-cluster counts.
   */
  const expectedCharacters = countGraphemes(expected);

  const typedCharacters = countGraphemes(typed);
  const expectedWhitespace = (expected.match(/\s/gu) ?? []).length;
  const typedWhitespace = (typed.match(/\s/gu) ?? []).length;
  // Word alignment intentionally strips separators. Include the matching
  // separators in character accuracy so an exact passage scores 100%.
  correctCharacters = Math.min(
    Math.min(expectedCharacters, typedCharacters),
    correctCharacters + Math.min(expectedWhitespace, typedWhitespace),
  );
  characterInsertions += Math.max(0, typedWhitespace - expectedWhitespace);
  characterDeletions += Math.max(0, expectedWhitespace - typedWhitespace);
  const incorrectCharacters =
    characterSubstitutions + characterInsertions + characterDeletions;

  /*
   * Grapheme counts.
   */
  const expectedGraphemes = countGraphemes(expected);

  const typedGraphemes = countGraphemes(typed);

  /*
   * Correct graphemes are bounded by expected graphemes.
   *
   * Deletions remove expected graphemes.
   * Substitutions replace an expected grapheme.
   * Insertions do not reduce the number of expected
   * graphemes that were correctly typed.
   */
  const correctGraphemes = Math.max(
    0,
    expectedGraphemes - characterSubstitutions - characterDeletions,
  );

  /*
   * Spacing differences.
   *
   * Word alignment handles word insertion/deletion,
   * while this metric records differences in whitespace count.
   */
  const spacingErrors = Math.abs(expectedWhitespace - typedWhitespace);

  /*
   * We intentionally keep totalErrors as WORD-LEVEL errors.
   *
   * This is important for your current government typing
   * exam policies where mistakes are generally evaluated
   * as word errors.
   *
   * Character-level errors are separately available through
   * incorrectCharacters and the detailed counters.
   */
  const totalErrors = wordErrors;

  return {
    expectedWords: expectedWords.length,
    typedWords: typedWords.length,

    correctWords,
    incorrectWords: Math.max(0, typedWords.length - correctWords),

    expectedCharacters,
    typedCharacters,
    correctCharacters,
    incorrectCharacters,

    expectedGraphemes,
    typedGraphemes,
    correctGraphemes,

    insertions,
    deletions,
    substitutions,

    wordErrors,

    spacingErrors,

    punctuationErrors,

    totalErrors,

    /*
     * Detailed character-level metrics.
     */
    characterInsertions,
    characterDeletions,
    characterSubstitutions,

    /*
     * Useful for diagnostics and future analytics.
     */
    alignment: {
      editCost: wordAlignment.editCost,
      operations: wordAlignment.operations,
    },
  };
}
