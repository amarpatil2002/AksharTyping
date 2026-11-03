const DEFAULTS = {
  caseSensitive: false,
  punctuationSensitive: true,
  normalization: "NFC",
  maxTokens: 5000,
  maxAlignmentCells: 1_000_000
};

function tokenize(text) {
  const value = text.normalize("NFC").trim();
  return value ? value.split(/\s+/u) : [];
}

function normalizeToken(token, options) {
  let value = token.normalize(options.normalization);
  if (!options.caseSensitive) value = value.toLocaleLowerCase("und");
  if (!options.punctuationSensitive) value = value.replace(/\p{P}/gu, "");
  return value;
}

export function alignWords({ originalText, typedText, options = {} }) {
  if (typeof originalText !== "string" || typeof typedText !== "string") {
    throw new TypeError("originalText and typedText must be strings");
  }

  const config = { ...DEFAULTS, ...options };
  const expected = tokenize(originalText);
  const typed = tokenize(typedText);

  if (expected.length > config.maxTokens || typed.length > config.maxTokens) {
    throw new Error("Word count exceeds configured alignment limit");
  }
  const n = expected.length, m = typed.length;
  if ((n + 1) * (m + 1) > config.maxAlignmentCells) {
    throw new Error("Word alignment matrix exceeds configured memory limit");
  }

  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  const op = Array.from({ length: n + 1 }, () => new Array(m + 1));
  for (let i = 1; i <= n; i++) { dp[i][0] = i; op[i][0] = "OMISSION"; }
  for (let j = 1; j <= m; j++) { dp[0][j] = j; op[0][j] = "INSERTION"; }

  const a = expected.map(x => normalizeToken(x, config));
  const b = typed.map(x => normalizeToken(x, config));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = a[i - 1] === b[j - 1];
      let best = dp[i - 1][j - 1] + (same ? 0 : 1);
      let action = same ? "CORRECT" : "SUBSTITUTION";
      if (dp[i - 1][j] + 1 < best) { best = dp[i - 1][j] + 1; action = "OMISSION"; }
      if (dp[i][j - 1] + 1 < best) { best = dp[i][j - 1] + 1; action = "INSERTION"; }
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] &&
          dp[i - 2][j - 2] + 1 < best) {
        best = dp[i - 2][j - 2] + 1; action = "TRANSPOSITION";
      }
      dp[i][j] = best; op[i][j] = action;
    }
  }

  const counts = { correctWords: 0, substitutions: 0, omissions: 0, insertions: 0, transpositions: 0 };
  const alignment = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const action = op[i][j];
    if (action === "CORRECT" || action === "SUBSTITUTION") {
      counts[action === "CORRECT" ? "correctWords" : "substitutions"]++;
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
    } else {
      throw new Error("Unable to reconstruct word alignment");
    }
  }
  alignment.reverse();

  return {
    totalWords: n,
    wordsTyped: m,
    ...counts,
    incorrectWords: counts.substitutions + counts.omissions + counts.insertions + counts.transpositions,
    accuracy: n ? Number(((counts.correctWords / n) * 100).toFixed(2)) : 0,
    totalEditDistance: dp[n][m],
    alignment
  };
}
