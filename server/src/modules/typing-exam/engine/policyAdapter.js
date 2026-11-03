function plain(value) {
  if (!value || typeof value !== "object") throw new Error("Evaluation policy is required");
  return typeof value.toObject === "function" ? value.toObject() : value;
}

const enums = {
  grossSpeedMethod: ["TOTAL_WORDS", "TOTAL_CHARACTERS", "TOTAL_KEY_DEPRESSIONS", "POLICY_DEFINED"],
  netSpeedMethod: ["CORRECT_WORDS", "CORRECT_CHARACTERS", "CORRECT_KEY_DEPRESSIONS", "GROSS_MINUS_PENALTY", "POLICY_DEFINED"],
  errorCalculation: ["WORD_BASED", "CHARACTER_BASED", "STROKE_BASED", "POLICY_DEFINED"],
  penaltyMethod: ["NONE", "FIXED_PER_ERROR", "GROUPED_ERRORS", "PERCENTAGE", "POLICY_DEFINED"]
};

export function adaptEvaluationPolicy(document) {
  const policy = plain(document);
  if (!policy.measurement || !policy.scoring) throw new Error("Policy measurement/scoring configuration is missing");

  for (const [field, allowed] of Object.entries(enums)) {
    const value = field === "penaltyMethod" ? policy.scoring[field] : policy.measurement[field];
    if (!allowed.includes(value)) throw new Error(`Unsupported or missing policy ${field}: ${value}`);
  }

  const scoring = policy.scoring;
  const measurement = policy.measurement;
  const rules = policy.qualificationRules ?? {};
  const mistakeRules = policy.mistakeRules ?? {};

  if (!Number.isFinite(scoring.penaltyValue ?? 0) || (scoring.penaltyValue ?? 0) < 0) throw new Error("Invalid penaltyValue");
  if (!Number.isFinite(scoring.groupSize ?? 1) || (scoring.groupSize ?? 1) < 1) throw new Error("Invalid groupSize");

  return {
    name: policy.name,
    code: policy.code,
    version: policy.version ?? "1.0",
    examType: policy.examType,
    durationSeconds: policy.durationSeconds,
    measurement: { ...measurement },
    scoring: {
      ...scoring,
      penaltyMethod: scoring.penaltyMethod ?? "NONE",
      penaltyValue: scoring.penaltyValue ?? 0,
      groupSize: scoring.groupSize ?? 1,
      fullMistakeWeight: scoring.fullMistakeWeight ?? 1,
      halfMistakeWeight: scoring.halfMistakeWeight ?? 0.5
    },
    mistakeRules,
    errorAllowance: policy.errorAllowance ?? { enabled: false },
    qualificationRules: rules,
    inputRequirements: policy.inputRequirements ?? {},
    officialSources: policy.officialSources ?? [],
    status: policy.status
  };
}
