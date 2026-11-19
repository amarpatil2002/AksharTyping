import { roundTo } from "../utils/number.utils.js";
import {
  calculateCorrectWpm,
  calculateCpm,
} from "../utils/speed.utils.js";

function calculatePenalty(policy, common) {
  const errors = getEffectiveMistakes(policy, common);
  if (policy.penalty?.method === "FIXED_PER_ERROR")
    return errors * (policy.penalty.value ?? 0);
  if (policy.penalty?.method === "PERCENTAGE")
    return calculateGrossSpeed(policy, common) * ((policy.penalty.value ?? 0) / 100);
  if (policy.penalty?.method === "GROUPED_ERRORS" || policy.penalty?.method === "POLICY_DEFINED") {
    throw new TypeError(`Penalty method "${policy.penalty.method}" requires a dedicated evaluator.`);
  }
  return 0;
}

function getEffectiveMistakes(policy, common) {
  const metrics = common.errorMetrics ?? common.errors ?? {};
  const errorRules = policy.errorRules ?? policy.errors;
  switch (errorRules?.method) {
    case "CHARACTER_BASED":
    case "STROKE_BASED":
      return metrics.characterErrors ?? 0;
    case "FULL_HALF":
    case "POLICY_DEFINED":
      throw new TypeError(`Error method "${errorRules.method}" requires a dedicated evaluator.`);
    case "WORD_BASED":
    default:
      return metrics.wordErrors ?? metrics.total ?? 0;
  }
}

function calculateGrossSpeed(policy, common) {
  switch (policy.speed.grossMethod) {
    case "TOTAL_WORDS":
      return common.speed.grossWpm;
    case "TOTAL_CHARACTERS":
      return common.speed.grossCpm;
    case "TOTAL_KEY_DEPRESSIONS":
      return common.speed.kdph;
    case "CORRECT_WORDS":
      return calculateCorrectWpm(common.words.correct, common.duration.seconds);
    case "CORRECT_CHARACTERS":
      return calculateCpm(common.characters.correct, common.duration.seconds);
    case "GROSS_MINUS_PENALTY":
      return common.speed.grossWpm;
    case "POLICY_DEFINED":
      throw new TypeError("Policy-defined speed requires a dedicated evaluator.");
    default:
      return common.speed.grossWpm;
  }
}

function calculateNetSpeed(policy, common, penalty) {
  switch (policy.speed.netMethod) {
    case "CORRECT_WORDS":
      return calculateCorrectWpm(common.words.correct, common.duration.seconds);
    case "CORRECT_CHARACTERS":
      return calculateCpm(common.characters.correct, common.duration.seconds);
    case "GROSS_MINUS_PENALTY":
      return Math.max(0, calculateGrossSpeed(policy, common) - penalty);
    case "TOTAL_WORDS":
      return common.speed.grossWpm;
    case "TOTAL_CHARACTERS":
      return common.speed.grossCpm;
    case "TOTAL_KEY_DEPRESSIONS":
      return common.speed.kdph;
    case "POLICY_DEFINED":
      throw new TypeError("Policy-defined speed requires a dedicated evaluator.");
    default:
      return calculateGrossSpeed(policy, common);
  }
}

export function evaluateExamPolicy({ commonResult, policy }) {
  if (!commonResult || !policy)
    throw new TypeError("commonResult and policy are required");
  const rounding = policy.rounding ?? { method: "ROUND", decimalPlaces: 2 };
  const r = (v) => roundTo(v, rounding.decimalPlaces, rounding.method);
  const grossSpeed = calculateGrossSpeed(policy, commonResult);
  const penalty = calculatePenalty(policy, commonResult);
  const netSpeed = calculateNetSpeed(policy, commonResult, penalty);
  const effectiveMistakes = getEffectiveMistakes(policy, commonResult);
  const errorRules = policy.errorRules ?? policy.errors;
  const allowedPercentage = errorRules?.allowedPercentage;
  const permissibleMistakes =
    allowedPercentage == null
      ? undefined
      : Math.floor(
          ((errorRules?.method === "CHARACTER_BASED" ||
          errorRules?.method === "STROKE_BASED"
            ? commonResult.characters.typed
            : commonResult.words.typed) *
            allowedPercentage) /
            100,
        );
  const speedQualified =
    policy.qualification?.minimumSpeed == null
      ? true
      : netSpeed >= policy.qualification.minimumSpeed;
  const maximumErrors = [
    policy.qualification?.maximumErrors,
    permissibleMistakes,
  ].filter(Number.isFinite);
  const errorQualified = maximumErrors.length
    ? effectiveMistakes <= Math.min(...maximumErrors)
    : true;
  const overallQualified = speedQualified && errorQualified;
  const maximumMarks = policy.scoring?.maximumMarks;
  const scoringPenalty =
    policy.scoring?.marksPerMistake != null
      ? effectiveMistakes * policy.scoring.marksPerMistake
      : policy.penalty?.method === "FIXED_PER_ERROR"
        ? penalty
        : 0;
  const marks =
    maximumMarks == null
      ? undefined
      : r(
          Math.max(
            0,
            maximumMarks - scoringPenalty,
          ),
        );
  return {
    calculation: {
      formula: policy.speed.netMethod || policy.speed.grossMethod,
      grossSpeed: r(grossSpeed),
      netSpeed: r(Math.max(0, netSpeed)),
      effectiveMistakes,
      permissibleMistakes,
      penalty: r(penalty),
    },
    score: {
      ...(marks !== undefined ? { marks, maximumMarks } : {}),
      ...(marks !== undefined && maximumMarks > 0
        ? { percentage: r((marks / maximumMarks) * 100) }
        : {}),
    },
    qualification: {
      minimumSpeed: policy.qualification?.minimumSpeed,
      achievedSpeed: r(netSpeed),
      speedQualified,
      errorQualified,
      overallQualified,
    },
    result: overallQualified ? "PASS" : "FAIL",
    engineVersion: "1.0.0",
  };
}
