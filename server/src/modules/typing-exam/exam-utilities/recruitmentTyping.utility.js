import { roundTo } from "../utils/number.utils.js";

const finiteNonNegative = (name, value) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative number`);
  }
};

/** RSSB LDC/Junior Assistant 2026 typing-speed paper evaluator. */
export function evaluateRssbLdcTyping({
  correctWords,
  durationSeconds,
  language,
  maximumMarks = 25,
  minimumMarks = 9,
  correctWordMark,
  rounding = { method: "ROUND", decimalPlaces: 2 },
}) {
  finiteNonNegative("correctWords", correctWords);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new RangeError("durationSeconds must be greater than zero");
  }
  if (!(["hindi", "english"].includes(language))) {
    throw new TypeError("RSSB typing language must be hindi or english");
  }
  finiteNonNegative("maximumMarks", maximumMarks);
  finiteNonNegative("minimumMarks", minimumMarks);
  const perWord = correctWordMark ?? (language === "hindi" ? 0.0625 : 0.05);
  finiteNonNegative("correctWordMark", perWord);
  const r = (value) => roundTo(value, rounding.decimalPlaces, rounding.method);
  const marks = r(Math.min(maximumMarks, correctWords * perWord));
  const speedWpm = r((correctWords * 60) / durationSeconds);
  const qualified = marks >= minimumMarks;
  return {
    calculation: {
      formula: "RSSB_LDC_CORRECT_WORDS",
      grossSpeed: r((correctWords * 60) / durationSeconds),
      netSpeed: speedWpm,
      effectiveMistakes: 0,
      penalty: 0,
    },
    score: {
      marks,
      maximumMarks,
      percentage: maximumMarks > 0 ? r((marks / maximumMarks) * 100) : 0,
    },
    qualification: {
      minimumMarks,
      achievedMarks: marks,
      speedQualified: qualified,
      errorQualified: true,
      overallQualified: qualified,
    },
    result: qualified ? "PASS" : "FAIL",
    resultScope: "TYPING_SPEED_SECTION_ONLY",
    engineVersion: "1.0.0",
  };
}

/** MPSC Clerk-Typist certificate-practice evaluator; it is not an MPSC skill test. */
export function evaluateMpscClerkTyping({
  correctWords,
  durationSeconds,
  language,
  minimumWpm,
  rounding = { method: "ROUND", decimalPlaces: 2 },
}) {
  finiteNonNegative("correctWords", correctWords);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new RangeError("durationSeconds must be greater than zero");
  }
  const languageDefault = { marathi: 30, english: 40 }[language];
  if (languageDefault === undefined) {
    throw new TypeError("MPSC Clerk-Typist language must be marathi or english");
  }
  const requiredWpm = minimumWpm ?? languageDefault;
  finiteNonNegative("minimumWpm", requiredWpm);
  const wpm = roundTo((correctWords * 60) / durationSeconds, rounding.decimalPlaces, rounding.method);
  const qualified = wpm >= requiredWpm;
  return {
    calculation: {
      formula: "MPSC_TYPING_CERTIFICATE_PRACTICE_WPM",
      grossSpeed: wpm,
      netSpeed: wpm,
      effectiveMistakes: 0,
      penalty: 0,
    },
    score: {},
    qualification: {
      minimumSpeed: requiredWpm,
      achievedSpeed: wpm,
      speedQualified: qualified,
      errorQualified: true,
      overallQualified: qualified,
    },
    result: qualified ? "PASS" : "FAIL",
    resultScope: "PRACTICE_ONLY",
    practiceOnly: true,
    engineVersion: "1.0.0",
  };
}
