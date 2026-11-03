const DEFAULT_RULES = {
  substitution: "FULL", omission: "FULL", insertion: "FULL",
  transposition: "FULL", spelling: "FULL", spacing: "HALF",
  punctuation: "HALF", case: "IGNORE", other: "FULL"
};

export function classifyMistakes({ alignment, rules = {}, source = "WORD" }) {
  if (!Array.isArray(alignment)) throw new TypeError("alignment must be an array");
  const configured = { ...DEFAULT_RULES, ...rules };
  const result = {
    source,
    fullMistakes: 0,
    halfMistakes: 0,
    ignoredMistakes: 0,
    byType: {}
  };

  for (const item of alignment) {
    if (item.type === "CORRECT") continue;
    const key = String(item.type || "OTHER").toLowerCase();
    const classification = configured[key] ?? configured.other;
    if (!["FULL", "HALF", "IGNORE"].includes(classification)) throw new Error(`Invalid mistake rule for ${key}`);
    result.byType[key] ??= { full: 0, half: 0, ignored: 0 };
    if (classification === "FULL") {
      result.fullMistakes++;
      result.byType[key].full++;
    } else if (classification === "HALF") {
      result.halfMistakes++;
      result.byType[key].half++;
    } else {
      result.ignoredMistakes++;
      result.byType[key].ignored++;
    }
  }
  return result;
}
