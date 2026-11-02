/* ============================================================
   HELPERS
============================================================ */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const roundTo = (value, decimals = 2) => {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/* ============================================================
   QUALIFICATION ENGINE
============================================================ */

/**
 * Evaluates typing examination qualification requirements.
 *
 * @param {Object} params
 * @param {Object} params.metrics
 * @param {number|null} params.marks
 * @param {Object} params.configSnapshot
 *
 * @returns {Object} Qualification result.
 */
export const calculateTypingQualification = ({
  metrics,
  marks = null,
  configSnapshot,
}) => {
  if (!metrics || typeof metrics !== "object") {
    throw new TypeError("Typing metrics are required.");
  }

  if (!configSnapshot || typeof configSnapshot !== "object") {
    throw new TypeError("Exam configuration snapshot is required.");
  }

  const scoring = configSnapshot.scoring || {};
  const qualification = scoring.qualification || {};

  /* ==========================================================
     CONFIGURED REQUIREMENTS
  ========================================================== */

  // Use the stricter requirement when both legacy top-level
  // scoring fields and qualification fields are configured.
  const minimumWpm = Math.max(
    toNumber(scoring.minimumWpm),
    toNumber(qualification.minimumWpm),
  );

  const minimumAccuracy = Math.max(
    toNumber(scoring.minimumAccuracy),
    toNumber(qualification.minimumAccuracy),
  );

  const minimumMarks = Math.max(
    toNumber(configSnapshot.passingMarks),
    toNumber(qualification.minimumMarks),
  );

  const maximumErrors =
    qualification.maximumErrors == null
      ? null
      : toNumber(qualification.maximumErrors);

  const maximumErrorPercentage =
    qualification.maximumErrorPercentage == null
      ? null
      : toNumber(qualification.maximumErrorPercentage);

  const requireAll = qualification.requireAll !== false;

  /* ==========================================================
     ACHIEVED METRICS
  ========================================================== */

  const achievedWpm = toNumber(metrics.netWpm);

  const achievedAccuracy = toNumber(metrics.accuracy);

  const achievedErrors = toNumber(metrics.totalErrors);

  const totalWords = toNumber(metrics.totalWords);

  const achievedMarks = marks == null ? null : toNumber(marks);

  const errorPercentage =
    totalWords > 0
      ? (achievedErrors / totalWords) * 100
      : achievedErrors > 0
        ? 100
        : 0;

  /* ==========================================================
     REQUIREMENT CHECKS
  ========================================================== */

  const hasWpmRequirement = minimumWpm > 0;
  const hasAccuracyRequirement = minimumAccuracy > 0;

  const hasErrorsRequirement = maximumErrors !== null;
  const hasErrorPercentageRequirement = maximumErrorPercentage !== null;

  const hasMarksRequirement = minimumMarks > 0;

  const wpmRequirementMet = !hasWpmRequirement || achievedWpm >= minimumWpm;

  const accuracyRequirementMet =
    !hasAccuracyRequirement || achievedAccuracy >= minimumAccuracy;

  const errorsRequirementMet =
    (!hasErrorsRequirement || achievedErrors <= maximumErrors) &&
    (!hasErrorPercentageRequirement ||
      errorPercentage <= maximumErrorPercentage);

  const marksRequirementMet =
    !hasMarksRequirement ||
    (achievedMarks !== null && achievedMarks >= minimumMarks);

  /* ==========================================================
     FINAL QUALIFICATION
  ========================================================== */

  const checks = [];

  if (hasWpmRequirement) {
    checks.push(wpmRequirementMet);
  }

  if (hasAccuracyRequirement) {
    checks.push(accuracyRequirementMet);
  }

  if (hasErrorsRequirement || hasErrorPercentageRequirement) {
    checks.push(errorsRequirementMet);
  }

  if (hasMarksRequirement) {
    checks.push(marksRequirementMet);
  }

  // No qualification restrictions means the candidate
  // satisfies the qualification policy.
  const passed =
    checks.length === 0
      ? true
      : requireAll
        ? checks.every(Boolean)
        : checks.some(Boolean);

  /* ==========================================================
     RESULT
  ========================================================== */

  return {
    minimumWpm,
    minimumAccuracy,
    maximumErrors,
    maximumErrorPercentage,
    minimumMarks,

    achievedWpm: roundTo(achievedWpm),
    achievedAccuracy: roundTo(achievedAccuracy),
    achievedMarks: achievedMarks === null ? 0 : roundTo(achievedMarks),

    achievedErrors,
    achievedErrorPercentage: roundTo(errorPercentage),

    wpmRequirementMet,
    accuracyRequirementMet,
    errorsRequirementMet,
    marksRequirementMet,

    requireAll,
    passed,
  };
};

export default calculateTypingQualification;
