/* ============================================================
   CONSTANTS
============================================================ */

export const MAX_WORDS_PER_ATTEMPT = 20_000;

/* ============================================================
   TEXT NORMALIZATION
============================================================ */

/**
 * Normalize Unicode text.
 *
 * NFC combines canonically equivalent Unicode sequences.
 * This is important for Indian-language text.
 */
export const normalizeText = (text = "") => {
  if (typeof text !== "string") {
    throw new TypeError("Text must be a string.");
  }

  return text.normalize("NFC");
};

/**
 * Normalize an individual word for comparison.
 *
 * Case sensitivity is configurable because examination
 * authorities may have different capitalization rules.
 */
export const normalizeWord = (word = "", { caseSensitive = true } = {}) => {
  if (typeof word !== "string") {
    throw new TypeError("Word must be a string.");
  }

  const normalized = word.normalize("NFC");

  return caseSensitive ? normalized : normalized.toLocaleLowerCase("en-US");
};

/* ============================================================
   TOKENIZATION
============================================================ */

/**
 * Split text into whitespace-separated words.
 *
 * Punctuation is preserved as part of each word.
 *
 * Example:
 * "India is great."
 *
 * Produces:
 * ["India", "is", "great."]
 *
 * @param {string} text
 * @param {Object} options
 * @param {number} options.maxWords
 *
 * @returns {Object}
 */

export const tokenizeWords = (
  text = "",
  { maxWords = MAX_WORDS_PER_ATTEMPT } = {},
) => {
  if (typeof text !== "string") {
    throw new TypeError("Text must be a string.");
  }

  if (
    !Number.isInteger(maxWords) ||
    maxWords < 1 ||
    maxWords > MAX_WORDS_PER_ATTEMPT
  ) {
    throw new RangeError(
      `maxWords must be between 1 and ${MAX_WORDS_PER_ATTEMPT}.`,
    );
  }

  const normalizedText = normalizeText(text);

  const words = [];
  const wordPattern = /\S+/gu;

  let match;

  while ((match = wordPattern.exec(normalizedText)) !== null) {
    if (words.length >= maxWords) {
      throw new RangeError(
        `Text exceeds the maximum allowed limit of ${maxWords} words.`,
      );
    }

    const word = match[0];

    if (word.length > 500) {
      console.error("Oversized token detected:", {
        index: words.length,
        length: word.length,
        preview: word.slice(0, 100),
        textLength: normalizedText.length,
        containsWhitespace: /\s/u.test(word),
      });

      throw new Error(
        `Invalid token at index ${words.length}: ${word.length} characters.`,
      );
    }

    words.push({
      index: words.length,
      word,
      normalizedWord: normalizeWord(word),
      start: match.index,
      end: match.index + word.length,
    });
  }

  return {
    text: normalizedText,
    totalWords: words.length,
    words,
  };
};

/* ============================================================
   CHARACTER EDIT DISTANCE
============================================================ */

/**
 * Calculates Levenshtein distance between two strings.
 *
 * This function compares characters only to determine whether
 * a word-level substitution is likely a spelling mistake.
 *
 * It does not calculate typing speed or typing marks.
 */
export const getCharacterEditDistance = (first = "", second = "") => {
  if (typeof first !== "string" || typeof second !== "string") {
    throw new TypeError("Both values must be strings.");
  }

  const a = Array.from(normalizeText(first));
  const b = Array.from(normalizeText(second));

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Keep the second array shorter to reduce memory usage.
  if (b.length > a.length) {
    return getCharacterEditDistance(second, first);
  }

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  let current = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;

      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost,
      );
    }

    [previous, current] = [current, previous];
  }

  return previous[b.length];
};

/* ============================================================
   EXPORT
============================================================ */

export default tokenizeWords;
