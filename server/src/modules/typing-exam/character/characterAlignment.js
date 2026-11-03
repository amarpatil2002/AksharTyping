const DEFAULTS = {
  normalization: "NFC",
  caseSensitive: false,
  includeSpaces: true,
  includePunctuation: true,
  maxCharacters: 10000,
  maxAlignmentCells: 1_000_000
};

function tokenize(text, options) {
  if (typeof Intl.Segmenter !== "function") throw new Error("This Node.js runtime must support Intl.Segmenter");
  let value = text.normalize(options.normalization);
  if (!options.caseSensitive) value = value.toLocaleLowerCase("und");
  const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });
  return Array.from(segmenter.segment(value), x => x.segment).filter(segment => {
    if (!options.includeSpaces && /^\s+$/u.test(segment)) return false;
    if (!options.includePunctuation && /^\p{P}+$/u.test(segment)) return false;
    return true;
  });
}

export function alignCharacters({ originalText, typedText, options = {} }) {
  if (typeof originalText !== "string" || typeof typedText !== "string") throw new TypeError("Both texts must be strings");
  const config = { ...DEFAULTS, ...options };
  if (!["NFC", "NFD", "NFKC", "NFKD"].includes(config.normalization)) throw new Error("Unsupported Unicode normalization");
  const expected = tokenize(originalText, config), typed = tokenize(typedText, config);
  const n = expected.length, m = typed.length;
  if (n > config.maxCharacters || m > config.maxCharacters) throw new Error("Character count exceeds configured limit");
  if ((n + 1) * (m + 1) > config.maxAlignmentCells) throw new Error("Character alignment matrix exceeds configured memory limit");

  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  const op = Array.from({ length: n + 1 }, () => new Array(m + 1));
  for (let i = 1; i <= n; i++) { dp[i][0] = i; op[i][0] = "OMISSION"; }
  for (let j = 1; j <= m; j++) { dp[0][j] = j; op[0][j] = "INSERTION"; }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = expected[i - 1] === typed[j - 1];
      let best = dp[i - 1][j - 1] + (same ? 0 : 1);
      let action = same ? "CORRECT" : "SUBSTITUTION";
      if (dp[i - 1][j] + 1 < best) { best = dp[i - 1][j] + 1; action = "OMISSION"; }
      if (dp[i][j - 1] + 1 < best) { best = dp[i][j - 1] + 1; action = "INSERTION"; }
      if (i > 1 && j > 1 && expected[i - 1] === typed[j - 2] && expected[i - 2] === typed[j - 1] &&
          dp[i - 2][j - 2] + 1 < best) {
        best = dp[i - 2][j - 2] + 1; action = "TRANSPOSITION";
      }
      dp[i][j] = best; op[i][j] = action;
    }
  }

  const counts = { correctCharacters: 0, substitutions: 0, omissions: 0, insertions: 0, transpositions: 0 };
  const alignment = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const action = op[i][j];
    if (action === "CORRECT" || action === "SUBSTITUTION") {
      counts[action === "CORRECT" ? "correctCharacters" : "substitutions"]++;
      alignment.push({ type: action, expected: expected[i - 1], typed: typed[j - 1], expectedIndex: i - 1, typedIndex: j - 1 });
      i--; j--;
    } else if (action === "TRANSPOSITION") {
      counts.transpositions++;
      alignment.push({ type: action, expected: expected.slice(i - 2, i), typed: typed.slice(j - 2, j), expectedIndex: i - 2, typedIndex: j - 2 });
      i -= 2; j -= 2;
    } else if (action === "OMISSION") {
      counts.omissions++;
      alignment.push({ type: action, expected: expected[i - 1], typed: null, expectedIndex: i - 1, typedIndex: null });
      i--;
    } else if (action === "INSERTION") {
      counts.insertions++;
      alignment.push({ type: action, expected: null, typed: typed[j - 1], expectedIndex: null, typedIndex: j - 1 });
      j--;
    } else throw new Error("Unable to reconstruct character alignment");
  }
  alignment.reverse();

  return {
    totalCharacters: n,
    charactersTyped: m,
    ...counts,
    incorrectCharacters: counts.substitutions + counts.omissions + counts.insertions + counts.transpositions,
    accuracy: n ? Number(((counts.correctCharacters / n) * 100).toFixed(2)) : 0,
    totalEditDistance: dp[n][m],
    alignment
  };
}
