import {
  tokenizeWords,
  normalizeWord,
  getCharacterEditDistance,
  MAX_WORDS_PER_ATTEMPT,
} from "./wordTokenizer.js";

/* ============================================================
   CONSTANTS
============================================================ */

// Maximum number of DP matrix cells.
// Prevents unexpectedly large memory consumption.
const DEFAULT_MAX_ALIGNMENT_CELLS = 4_000_000;

export const DEFAULT_SPELLING_THRESHOLD = 0.25;

/* ============================================================
   VALIDATION
============================================================ */

const validateThreshold = (threshold) => {
  if (
    typeof threshold !== "number" ||
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 1
  ) {
    throw new RangeError("Spelling threshold must be between 0 and 1.");
  }
};

const validateMaxAlignmentCells = (value) => {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(
      "Maximum alignment cells must be a positive safe integer.",
    );
  }
};

/* ============================================================
   WORD SIMILARITY
============================================================ */

/**
 * Determines whether two different words are likely to be
 * spelling variations of one another.
 */
export const isLikelySpellingMistake = (
  expectedWord,
  typedWord,
  { spellingThreshold = DEFAULT_SPELLING_THRESHOLD, caseSensitive = true } = {},
) => {
  validateThreshold(spellingThreshold);

  const expected = normalizeWord(expectedWord, {
    caseSensitive,
  });

  const typed = normalizeWord(typedWord, {
    caseSensitive,
  });

  if (expected === typed) {
    return false;
  }

  const expectedCharacters = Array.from(expected);
  const typedCharacters = Array.from(typed);

  const longestLength = Math.max(
    expectedCharacters.length,
    typedCharacters.length,
  );

  if (longestLength === 0) {
    return false;
  }

  const distance = getCharacterEditDistance(expected, typed);

  const similarityRatio = distance / longestLength;

  return similarityRatio <= spellingThreshold;
};

/* ============================================================
   WORD CLASSIFICATION
============================================================ */

export const classifyWord = (expectedWord, typedWord, options = {}) => {
  const { caseSensitive = true } = options;

  const expected = normalizeWord(expectedWord, {
    caseSensitive,
  });

  const typed = normalizeWord(typedWord, {
    caseSensitive,
  });

  if (expected === typed) {
    return {
      type: "correct",
      errorCategory: "none",
      editDistance: 0,
    };
  }

  const editDistance = getCharacterEditDistance(expected, typed);

  if (isLikelySpellingMistake(expectedWord, typedWord, options)) {
    return {
      type: "misspelling",
      errorCategory: "spelling",
      editDistance,
    };
  }

  return {
    type: "wrong",
    errorCategory: "wrong_word",
    editDistance,
  };
};

/* ============================================================
   WORD ALIGNMENT
============================================================ */

/**
 * Creates a minimum-edit-cost alignment between the expected
 * and typed word sequences.
 *
 * Operation priority when costs are equal:
 * 1. Match or substitution
 * 2. Deletion
 * 3. Insertion
 *
 * This makes alignment deterministic.
 */
const buildAlignment = (
  expectedWords,
  typedWords,
  { maxAlignmentCells = DEFAULT_MAX_ALIGNMENT_CELLS } = {},
) => {
  validateMaxAlignmentCells(maxAlignmentCells);

  const expectedLength = expectedWords.length;
  const typedLength = typedWords.length;

  const rows = expectedLength + 1;
  const columns = typedLength + 1;

  const cellCount = rows * columns;

  if (!Number.isSafeInteger(cellCount) || cellCount > maxAlignmentCells) {
    throw new RangeError(
      `Word alignment requires ${cellCount} cells. ` +
        `The configured limit is ${maxAlignmentCells}.`,
    );
  }

  /*
   * Each cell stores the minimum edit cost.
   *
   * Operations:
   * 0 = diagonal (match/substitution)
   * 1 = deletion (expected word missing)
   * 2 = insertion (extra typed word)
   */
  const matrix = new Uint32Array(cellCount);

  const indexOf = (row, column) => row * columns + column;

  /* Initialize first column: deletions */

  for (let row = 0; row <= expectedLength; row += 1) {
    matrix[indexOf(row, 0)] = row;
  }

  /* Initialize first row: insertions */

  for (let column = 0; column <= typedLength; column += 1) {
    matrix[indexOf(0, column)] = column;
  }

  /* Build edit-distance matrix */

  for (let row = 1; row <= expectedLength; row += 1) {
    for (let column = 1; column <= typedLength; column += 1) {
      const expectedWord = expectedWords[row - 1].normalizedWord;
      const typedWord = typedWords[column - 1].normalizedWord;

      const substitutionCost = expectedWord === typedWord ? 0 : 1;

      const diagonal = matrix[indexOf(row - 1, column - 1)] + substitutionCost;

      const deletion = matrix[indexOf(row - 1, column)] + 1;

      const insertion = matrix[indexOf(row, column - 1)] + 1;

      matrix[indexOf(row, column)] = Math.min(diagonal, deletion, insertion);
    }
  }

  /* ==========================================================
     BACKTRACKING
  ========================================================== */

  const operations = [];

  let row = expectedLength;
  let column = typedLength;

  while (row > 0 || column > 0) {
    const currentCost = matrix[indexOf(row, column)];

    // Prefer diagonal on ties.
    if (row > 0 && column > 0) {
      const expectedWord = expectedWords[row - 1].normalizedWord;
      const typedWord = typedWords[column - 1].normalizedWord;

      const substitutionCost = expectedWord === typedWord ? 0 : 1;

      if (
        matrix[indexOf(row - 1, column - 1)] + substitutionCost ===
        currentCost
      ) {
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

    // Prefer deletion before insertion on remaining ties.
    if (row > 0 && matrix[indexOf(row - 1, column)] + 1 === currentCost) {
      operations.push({
        operation: "delete",
        expectedIndex: row - 1,
        typedIndex: null,
      });

      row -= 1;
      continue;
    }

    if (column > 0 && matrix[indexOf(row, column - 1)] + 1 === currentCost) {
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
    editCost: matrix[indexOf(expectedLength, typedLength)],
  };
};

/* ============================================================
   ALIGNMENT CLASSIFICATION
============================================================ */

const classifyAlignment = (
  operations,
  expectedWords,
  typedWords,
  options = {},
) => {
  const alignedWords = [];

  const counts = {
    wordsTyped: typedWords.length,
    correctWords: 0,
    incorrectWords: 0,
    misspellings: 0,
    wrongWords: 0,
    omissions: 0,
    notReachedWords: 0,
    extraWords: 0,
    totalErrors: 0,
  };

  /*
   * Find the last operation that consumes a typed word.
   *
   * Expected words deleted after this point are classified
   * as not reached. Earlier deletions are omissions.
   */
  let lastTypedOperationIndex = -1;

  for (let index = 0; index < operations.length; index += 1) {
    if (operations[index].typedIndex !== null) {
      lastTypedOperationIndex = index;
    }
  }

  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];

    const expected =
      operation.expectedIndex === null
        ? null
        : expectedWords[operation.expectedIndex];

    const typed =
      operation.typedIndex === null ? null : typedWords[operation.typedIndex];

    const base = {
      position: alignedWords.length,

      referenceIndex: expected?.index ?? null,

      typedIndex: typed?.index ?? null,

      expectedWord: expected?.word ?? "",

      typedWord: typed?.word ?? "",

      editDistance: 0,

      marksLost: 0,
    };

    /* Exact match */

    if (operation.operation === "match") {
      alignedWords.push({
        ...base,
        type: "correct",
        errorCategory: "none",
      });

      counts.correctWords += 1;

      continue;
    }

    /* Substitution */

    if (operation.operation === "substitute") {
      const classification = classifyWord(expected.word, typed.word, options);

      alignedWords.push({
        ...base,
        ...classification,
      });

      if (classification.type === "misspelling") {
        counts.misspellings += 1;
      } else {
        counts.wrongWords += 1;
      }

      counts.incorrectWords += 1;

      continue;
    }

    /* Deletion: omitted or not reached */

    if (operation.operation === "delete") {
      const isNotReached = index > lastTypedOperationIndex;

      alignedWords.push({
        ...base,

        type: isNotReached ? "not_reached" : "omitted",

        errorCategory: isNotReached ? "not_reached" : "omission",
      });

      if (isNotReached) {
        counts.notReachedWords += 1;
      } else {
        counts.omissions += 1;
      }

      continue;
    }

    /* Insertion: extra typed word */

    if (operation.operation === "insert") {
      alignedWords.push({
        ...base,
        type: "extra",
        errorCategory: "extra_word",
      });

      counts.extraWords += 1;
    }
  }

  counts.totalErrors =
    counts.incorrectWords +
    counts.omissions +
    counts.notReachedWords +
    counts.extraWords;

  return {
    alignedWords,
    counts,
  };
};

/* ============================================================
   MAIN COMPARISON SERVICE
============================================================ */

/**
 * Compares the original passage with the candidate's typed text.
 *
 * @param {string} expectedText
 * @param {string} typedText
 * @param {Object} options
 *
 * @returns {Object}
 */
export const compareWordSequences = (
  expectedText,
  typedText,
  {
    spellingThreshold = DEFAULT_SPELLING_THRESHOLD,
    caseSensitive = true,
    maxWords = MAX_WORDS_PER_ATTEMPT,
    maxAlignmentCells = DEFAULT_MAX_ALIGNMENT_CELLS,
  } = {},
) => {
  if (typeof expectedText !== "string") {
    throw new TypeError("Expected passage must be a string.");
  }

  if (typeof typedText !== "string") {
    throw new TypeError("Typed text must be a string.");
  }

  validateThreshold(spellingThreshold);
  validateMaxAlignmentCells(maxAlignmentCells);

  const expectedTokens = tokenizeWords(expectedText, {
    maxWords,
  });

  const typedTokens = tokenizeWords(typedText, {
    maxWords,
  });

  /* ============================================================
   TOKEN VALIDATION
============================================================ */

  const validateTokens = (tokens, fieldName) => {
    const invalidTokens = tokens.words
      .map((token, index) => ({
        index,
        word: token.word,
        length: String(token.word ?? "").length,
      }))
      .filter((token) => token.length > 500);

    if (invalidTokens.length > 0) {
      console.error(`${fieldName} contains invalid tokens:`, invalidTokens);

      throw new Error(
        `${fieldName} contains a token exceeding 500 characters.`,
      );
    }
  };

  validateTokens(expectedTokens, "Expected passage");
  validateTokens(typedTokens, "Typed passage");

  /* ============================================================
   PRESERVE ORIGINAL TOKENS
============================================================ */

  // Existing code continues here.

  // Preserve original token values and positions.
  // Apply comparison normalization consistently.
  const expectedWords = expectedTokens.words.map((word) => ({
    ...word,
    normalizedWord: normalizeWord(word.word, {
      caseSensitive,
    }),
  }));

  const typedWords = typedTokens.words.map((word) => ({
    ...word,
    normalizedWord: normalizeWord(word.word, {
      caseSensitive,
    }),
  }));

  const alignment = buildAlignment(expectedWords, typedWords, {
    maxAlignmentCells,
  });

  const classification = classifyAlignment(
    alignment.operations,
    expectedWords,
    typedWords,
    {
      spellingThreshold,
      caseSensitive,
    },
  );

  return {
    expectedWordCount: expectedWords.length,

    typedWordCount: typedWords.length,

    alignedWords: classification.alignedWords,

    counts: classification.counts,

    editCost: alignment.editCost,

    expectedTokens,

    typedTokens,
  };
};

/* ============================================================
   EXPORT
============================================================ */

export default compareWordSequences;
