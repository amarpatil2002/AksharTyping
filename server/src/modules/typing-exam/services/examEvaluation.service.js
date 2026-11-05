import { roundTo, safeDivide } from "../utils/number.utils.js";
import { calculateCorrectWpm } from "../utils/speed.utils.js";

function calculatePenalty(policy, common) {
  const errors = common.errors.total;
  if (policy.penalty?.method === "FIXED_PER_ERROR")
    return errors * (policy.penalty.value ?? 0);
  if (policy.penalty?.method === "PERCENTAGE")
    return common.speed.grossWpm * ((policy.penalty.value ?? 0) / 100);
  return 0;
}

function calculateGrossSpeed(policy, common) {
  switch (policy.speed.grossMethod) {
    case "TOTAL_WORDS":
      return common.speed.grossWpm;
    case "TOTAL_CHARACTERS":
      return common.speed.grossCpm;
    case "TOTAL_KEY_DEPRESSIONS":
      return common.speed.kdph;
    default:
      return common.speed.grossWpm;
  }
}

function calculateNetSpeed(policy, common, penalty) {
  switch (policy.speed.netMethod) {
    case "CORRECT_WORDS":
      return calculateCorrectWpm(common.words.correct, common.duration.seconds);
    case "CORRECT_CHARACTERS":
      return safeDivide(common.characters.correct, common.duration.minutes);
    case "GROSS_MINUS_PENALTY":
      return Math.max(0, common.speed.grossWpm - penalty);
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
  const evaluatedUnits =
    policy.errors?.method === "CHARACTER_BASED"
      ? commonResult.characters.typed
      : commonResult.words.typed;
  const permissibleMistakes =
    policy.errors?.allowedPercentage != null
      ? (evaluatedUnits * policy.errors.allowedPercentage) / 100
      : undefined;
  const effectiveMistakes = commonResult.errors.total;
  const speedQualified =
    policy.qualification?.minimumSpeed == null
      ? true
      : netSpeed >= policy.qualification.minimumSpeed;
  const errorQualified =
    policy.qualification?.maximumErrors == null
      ? true
      : effectiveMistakes <= policy.qualification.maximumErrors;
  const overallQualified = speedQualified && errorQualified;
  return {
    calculation: {
      formula: policy.speed.netMethod || policy.speed.grossMethod,
      grossSpeed: r(grossSpeed),
      netSpeed: r(Math.max(0, netSpeed)),
      effectiveMistakes,
      permissibleMistakes:
        permissibleMistakes == null ? undefined : r(permissibleMistakes),
      penalty: r(penalty),
    },
    score: {},
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
