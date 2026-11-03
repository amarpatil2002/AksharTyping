import { alignWords } from "./word/wordAlignment.js";
import { calculateWordMetrics } from "./word/wordMetrics.js";
import { alignCharacters } from "./character/characterAlignment.js";
import { calculateCharacterMetrics } from "./character/characterMetrics.js";
import { adaptEvaluationPolicy } from "./policyAdapter.js";
import { classifyMistakes } from "./mistakeClassifier.js";
import { calculateMistakes } from "./mistakeCalculator.js";
import { calculateOfficialScore } from "./scoringCalculator.js";
import { calculateQualification } from "./qualificationCalculator.js";

function rate(count, durationSeconds) {
  return count / (durationSeconds / 60);
}

export function evaluateTypingPerformance({
  originalText,
  typedText,
  examType,
  durationSeconds,
  wordConfig = {},
  characterConfig = {},
  policy: policyDocument = null,
  keyMetrics = null,
}) {
  if (typeof originalText !== "string" || !originalText.length)
    throw new Error("Original passage is required");
  if (typeof typedText !== "string")
    throw new Error("typedText must be a string");
  if (!["WORD", "CHARACTER", "HYBRID"].includes(examType))
    throw new Error("Invalid examType");
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0)
    throw new Error("durationSeconds must be positive");

  const policy = policyDocument ? adaptEvaluationPolicy(policyDocument) : null;
  if (policy && policy.examType !== examType)
    throw new Error("Exam type does not match evaluation policy");
  const duration = durationSeconds;

  let wordAlignment = null,
    characterAlignment = null;
  let wordMetrics = null,
    characterMetrics = null;

  if (examType === "WORD" || examType === "HYBRID") {
    wordAlignment = alignWords({
      originalText,
      typedText,
      options: {
        caseSensitive: wordConfig.caseSensitive ?? false,
        punctuationSensitive: wordConfig.punctuationSensitive ?? true,
        normalization: wordConfig.normalization ?? "NFC",
        maxTokens: wordConfig.maxTokens ?? 5000,
        maxAlignmentCells: wordConfig.maxAlignmentCells ?? 1_000_000,
      },
    });
    wordMetrics = calculateWordMetrics({
      totalWords: wordAlignment.totalWords,
      wordsTyped: wordAlignment.wordsTyped,
      correctWords: wordAlignment.correctWords,
      durationSeconds: duration,
    });
  }

  if (examType === "CHARACTER" || examType === "HYBRID") {
    characterAlignment = alignCharacters({
      originalText,
      typedText,
      options: {
        normalization: characterConfig.normalization ?? "NFC",
        caseSensitive: characterConfig.caseSensitive ?? false,
        includeSpaces: characterConfig.includeSpaces ?? true,
        includePunctuation: characterConfig.includePunctuation ?? true,
        maxCharacters: characterConfig.maxCharacters ?? 10000,
        maxAlignmentCells: characterConfig.maxAlignmentCells ?? 1_000_000,
      },
    });
    characterMetrics = calculateCharacterMetrics({
      totalCharacters: characterAlignment.totalCharacters,
      charactersTyped: characterAlignment.charactersTyped,
      correctCharacters: characterAlignment.correctCharacters,
      durationSeconds: duration,
    });
  }

  const diagnostic = {
    examType,
    durationSeconds: duration,
    wordMetrics,
    characterMetrics,
    mistakes: {
      word: wordAlignment
        ? {
            substitutions: wordAlignment.substitutions,
            omissions: wordAlignment.omissions,
            insertions: wordAlignment.insertions,
            transpositions: wordAlignment.transpositions,
          }
        : null,
      character: characterAlignment
        ? {
            substitutions: characterAlignment.substitutions,
            omissions: characterAlignment.omissions,
            insertions: characterAlignment.insertions,
            transpositions: characterAlignment.transpositions,
          }
        : null,
    },
  };

  if (!policy) {
    return {
      ...diagnostic,
      scoring: null,
      qualification: { qualified: null, status: "NOT_APPLICABLE", checks: [] },
      alignment: {
        word: wordAlignment?.alignment ?? null,
        character: characterAlignment?.alignment ?? null,
      },
    };
  }

  let chosenAlignment,
    totalUnits,
    correctWords = null,
    correctCharacters = null;
  let measurementUnit, grossSpeed, accuracy;

  switch (policy.measurement.errorCalculation) {
    case "WORD_BASED":
      if (!wordAlignment)
        throw new Error("WORD_BASED policy requires WORD or HYBRID exam");
      chosenAlignment = wordAlignment.alignment;
      totalUnits = wordAlignment.totalWords;
      correctWords = wordAlignment.correctWords;
      measurementUnit = "WPM";
      accuracy = wordMetrics.accuracy;
      break;
    case "CHARACTER_BASED":
      if (!characterAlignment)
        throw new Error(
          "CHARACTER_BASED policy requires CHARACTER or HYBRID exam",
        );
      chosenAlignment = characterAlignment.alignment;
      totalUnits = characterAlignment.totalCharacters;
      correctCharacters = characterAlignment.correctCharacters;
      measurementUnit = "CPM";
      accuracy = characterMetrics.accuracy;
      break;
    case "STROKE_BASED":
      chosenAlignment = [];
      totalUnits = keyMetrics?.totalKeyDepressions;
      measurementUnit = "KDPH";
      accuracy = keyMetrics?.accuracy ?? null;
      if (!Number.isFinite(totalUnits))
        throw new Error(
          "STROKE_BASED scoring requires trusted keyMetrics.totalKeyDepressions",
        );
      break;
    case "POLICY_DEFINED":
      throw new Error(
        "POLICY_DEFINED error calculation requires a custom evaluator",
      );
    default:
      throw new Error("Unsupported error calculation method");
  }

  const classified = classifyMistakes({
    alignment: chosenAlignment,
    rules: policy.mistakeRules,
    source: policy.measurement.errorCalculation,
  });
  const mistakes = calculateMistakes({
    fullMistakes: classified.fullMistakes,
    halfMistakes: classified.halfMistakes,
    fullMistakeWeight: policy.scoring.fullMistakeWeight,
    halfMistakeWeight: policy.scoring.halfMistakeWeight,
  });

  switch (policy.measurement.grossSpeedMethod) {
    case "TOTAL_WORDS":
      if (!wordAlignment)
        throw new Error("TOTAL_WORDS requires word alignment");
      grossSpeed = rate(wordAlignment.wordsTyped, duration);
      measurementUnit = "WPM";
      break;
    case "TOTAL_CHARACTERS":
      if (!characterAlignment)
        throw new Error("TOTAL_CHARACTERS requires character alignment");
      grossSpeed = rate(characterAlignment.charactersTyped, duration);
      measurementUnit = "CPM";
      break;
    case "TOTAL_KEY_DEPRESSIONS":
      if (!Number.isFinite(keyMetrics?.totalKeyDepressions))
        throw new Error("TOTAL_KEY_DEPRESSIONS requires trusted keyMetrics");
      grossSpeed = rate(keyMetrics.totalKeyDepressions, duration);
      measurementUnit = "KDPH";
      break;
    case "POLICY_DEFINED":
      throw new Error("POLICY_DEFINED gross speed requires a custom evaluator");
    default:
      throw new Error("Unsupported gross speed method");
  }

  const scoreMeasurement = {
    grossSpeed,
    totalUnits,
    measurementUnit,
    durationMinutes: duration / 60,
    correctWords,
    correctCharacters,
    correctKeyDepressions: keyMetrics?.correctKeyDepressions,
    accuracy,
  };
  const scoring = calculateOfficialScore({
    measurement: scoreMeasurement,
    mistakes,
    policy,
  });
  const qualification = calculateQualification({
    metrics: {
      netSpeed: scoring.netSpeed,
      accuracy: scoring.accuracy,
      errorPercentage: scoring.errorPercentage,
      marksObtained: scoring.marks.marksObtained,
    },
    rules: policy.qualificationRules,
    errorAllowance: policy.errorAllowance,
  });

  return {
    ...diagnostic,
    scoring: {
      ...scoring,
      mistakes: {
        ...mistakes,
        byType: classified.byType,
        ignoredMistakes: classified.ignoredMistakes,
      },
    },
    qualification,
    policy: { code: policy.code, version: policy.version },
    alignment: {
      word: wordAlignment?.alignment ?? null,
      character: characterAlignment?.alignment ?? null,
    },
  };
}
