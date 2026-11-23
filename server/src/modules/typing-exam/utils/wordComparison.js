/**
 * Word comparison using Levenshtein alignment.
 *
 * Output:
 * - correct: exact matched words
 * - incorrect: substituted words
 * - missing: expected words not typed
 * - extra: typed words not present in expected passage
 *
 * This is an engine-level comparison result.
 * Exam-specific penalty rules are applied separately by the policy.
 */

function buildMatrix(expected, typed) {
  const rows = expected.length + 1;
  const cols = typed.length + 1;

  const dp = Array.from({ length: rows }, () =>
    Array(cols).fill(0)
  );

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const substitution =
        expected[i - 1].toLowerCase() === typed[j - 1].toLowerCase()
          ? 0
          : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + substitution
      );
    }
  }

  return dp;
}

export function compareWords(expectedWords, typedWords) {
  const expected = [...expectedWords];
  const typed = [...typedWords];
  const dp = buildMatrix(expected, typed);

  const correct = [];
  const incorrect = [];
  const missing = [];
  const extra = [];

  let i = expected.length;
  let j = typed.length;

  const reverse = [];

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      expected[i - 1].toLowerCase() === typed[j - 1].toLowerCase() &&
      dp[i][j] === dp[i - 1][j - 1]
    ) {
      reverse.push({
        type: "correct",
        expected: expected[i - 1],
        typed: typed[j - 1],
        expectedIndex: i - 1,
        typedIndex: j - 1,
      });
      i--;
      j--;
      continue;
    }

    if (
      i > 0 &&
      j > 0 &&
      dp[i][j] === dp[i - 1][j - 1] + 1
    ) {
      reverse.push({
        type: "incorrect",
        expected: expected[i - 1],
        typed: typed[j - 1],
        expectedIndex: i - 1,
        typedIndex: j - 1,
      });
      i--;
      j--;
      continue;
    }

    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      reverse.push({
        type: "missing",
        expected: expected[i - 1],
        typed: null,
        expectedIndex: i - 1,
        typedIndex: null,
      });
      i--;
      continue;
    }

    reverse.push({
      type: "extra",
      expected: null,
      typed: typed[j - 1],
      expectedIndex: null,
      typedIndex: j - 1,
    });
    j--;
  }

  const aligned = reverse.reverse();

  for (const item of aligned) {
    if (item.type === "correct") correct.push(item);
    if (item.type === "incorrect") incorrect.push(item);
    if (item.type === "missing") missing.push(item);
    if (item.type === "extra") extra.push(item);
  }

  return {
    expectedCount: expected.length,
    typedCount: typed.length,
    correct,
    incorrect,
    missing,
    extra,
    totalCorrect: correct.length,
    totalIncorrect: incorrect.length,
    totalMissing: missing.length,
    totalExtra: extra.length,
  };
}
