function calculateOfficialResult({
  coreResult,
  rule,
  candidateCategory = "default",
}) {
  if (rule.id === "BHC_CLERK_ENGLISH") {
    return {
      available: false,
      status: "NOT_CALCULABLE_FROM_PUBLISHED_FORMULA",
      marks: null,
      maximumMarks: rule.scoring.maximumMarks,
      qualified: null,
      reason:
        "The configured BHC public rule does not contain a published formula converting typing performance into the 20 marks.",
      criteria: {
        minimumMarks: rule.scoring.minimumPassingMarks,
        targetWpm: rule.target.minimum,
      },
      formulaVersion: "1.0.0",
    };
  }

  if (rule.authority === "MPSC") {
    const qualification =
      rule.qualification[candidateCategory] ||
      rule.qualification.default;

    const speedPass =
      coreResult.metrics.netWpm >= qualification.minimumWpm;

    const errorPass =
      coreResult.metrics.errorPercentage <=
      qualification.maximumMistakePercentage;

    const correctPass =
      coreResult.words.correct >= qualification.minimumCorrectWords;

    const qualified =
      speedPass && errorPass && correctPass;

    return {
      available: true,
      status: "QUALIFYING",
      marks: 0,
      maximumMarks: 0,
      qualified,
      criteria: {
        minimumWpm: qualification.minimumWpm,
        actualWpm: coreResult.metrics.netWpm,
        maximumErrorPercentage:
          qualification.maximumMistakePercentage,
        actualErrorPercentage:
          coreResult.metrics.errorPercentage,
        minimumCorrectWords:
          qualification.minimumCorrectWords,
        actualCorrectWords:
          coreResult.words.correct,
        speedPass,
        errorPass,
        correctPass,
      },
      formulaVersion: "1.0.0",
    };
  }

  return {
    available: false,
    status: "UNSUPPORTED_POLICY",
    marks: null,
    maximumMarks: null,
    qualified: null,
    reason: "No official calculation engine is configured for this policy.",
    criteria: null,
    formulaVersion: "1.0.0",
  };
}

module.exports = {
  calculateOfficialResult,
};
