const crypto = require("crypto");

const {
  getTypingRule,
  POLICY_VERSION,
  ENGINE_VERSION,
} = require("../rules/typing.rules");

const {
  calculateCoreResult,
} = require("./coreResult.calculator");

const {
  calculateOfficialResult,
} = require("./officialResult.calculator");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function calculateTypingResult({
  policyId,
  expectedText,
  typedText,
  elapsedSeconds,
  candidateCategory = "default",
}) {
  const rule = getTypingRule(policyId);

  const coreResult = calculateCoreResult({
    expectedText,
    typedText,
    elapsedSeconds,
    rule,
  });

  const officialResult = calculateOfficialResult({
    coreResult,
    rule,
    candidateCategory,
  });

  return {
    policyId: rule.id,
    policyVersion: POLICY_VERSION,
    engineVersion: ENGINE_VERSION,
    examType: rule.examType,
    language: rule.language,
    coreResult,
    officialResult,
    officialCalculationAvailable:
      officialResult.available,
    finalScore: officialResult.marks,
    qualified: officialResult.qualified,
  };
}

module.exports = {
  calculateTypingResult,
  sha256,
};
