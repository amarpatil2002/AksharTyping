function round(value) {
  return Number(value.toFixed(2));
}

function penaltyFor({
  method,
  value,
  groupSize,
  weightedMistakes,
  grossSpeed,
}) {
  switch (method) {
    case "NONE":
      return 0;
    case "FIXED_PER_ERROR":
      return weightedMistakes * value;
    case "GROUPED_ERRORS":
      return Math.floor(weightedMistakes / groupSize) * value;
    case "PERCENTAGE":
      return grossSpeed * (value / 100);
    case "POLICY_DEFINED":
      throw new Error(
        "POLICY_DEFINED penalty requires a custom scoring implementation",
      );
    default:
      throw new Error(`Unsupported penalty method: ${method}`);
  }
}

export function calculateOfficialScore({ measurement, mistakes, policy }) {
  const { measurement: measure, scoring } = policy;
  const { fullMistakes = 0, halfMistakes = 0 } = mistakes;
  const fullWeight = scoring.fullMistakeWeight ?? 1;
  const halfWeight = scoring.halfMistakeWeight ?? 0.5;
  const weightedMistakes =
    fullMistakes * fullWeight + halfMistakes * halfWeight;

  const totalUnits = measurement.totalUnits;
  const errorPercentage =
    totalUnits > 0 ? (weightedMistakes / totalUnits) * 100 : 0;
  const grossSpeed = measurement.grossSpeed;
  const penalty = penaltyFor({
    method: scoring.penaltyMethod,
    value: scoring.penaltyValue ?? 0,
    groupSize: scoring.groupSize ?? 1,
    weightedMistakes,
    grossSpeed,
  });

  let netSpeed;
  switch (measure.netSpeedMethod) {
    case "CORRECT_WORDS":
      if (measurement.correctWords == null)
        throw new Error("Correct word count unavailable for policy net speed");
      netSpeed = measurement.correctWords / measurement.durationMinutes;
      break;
    case "CORRECT_CHARACTERS":
      if (measurement.correctCharacters == null)
        throw new Error(
          "Correct character count unavailable for policy net speed",
        );
      netSpeed = measurement.correctCharacters / measurement.durationMinutes;
      break;
    case "CORRECT_KEY_DEPRESSIONS":
      if (measurement.correctKeyDepressions == null)
        throw new Error("Trusted correct key-depression count is required");
      netSpeed =
        measurement.correctKeyDepressions / measurement.durationMinutes;
      break;
    case "GROSS_MINUS_PENALTY":
      netSpeed = Math.max(0, grossSpeed - penalty);
      break;
    case "POLICY_DEFINED":
      throw new Error(
        "POLICY_DEFINED net speed requires a custom scoring implementation",
      );
    default:
      throw new Error(
        `Unsupported net speed method: ${measure.netSpeedMethod}`,
      );
  }

  const maximumMarks = scoring.maximumMarks ?? null;
  const marksDeducted = scoring.marksDeducted ? penalty : 0;
  const marksObtained =
    maximumMarks == null ? null : Math.max(0, maximumMarks - marksDeducted);
  const accuracy = measurement.accuracy ?? Math.max(0, 100 - errorPercentage);

  return {
    measurementUnit: measurement.measurementUnit,
    grossSpeed: round(grossSpeed),
    netSpeed: round(netSpeed),
    totalUnits,
    mistakes: {
      fullMistakes,
      halfMistakes,
      weightedMistakes: round(weightedMistakes),
    },
    errorPercentage: round(errorPercentage),
    accuracy: round(accuracy),
    penalty: round(penalty),
    marks: {
      maximumMarks,
      marksDeducted: round(marksDeducted),
      marksObtained: marksObtained == null ? null : round(marksObtained),
    },
  };
}
