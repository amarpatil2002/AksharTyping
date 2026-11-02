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

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getIntervalDelta = (current, previous, field) => {
  return Math.max(0, toNumber(current?.[field]) - toNumber(previous?.[field]));
};

/* ============================================================
   ERROR DISTRIBUTION
============================================================ */

const ERROR_CATEGORIES = {
  misspelling: "spelling",
  wrong: "wrong_word",
  omitted: "omission",
  not_reached: "not_reached",
  extra: "extra_word",
};

export const buildErrorDistribution = (wordAnalysis = []) => {
  const distribution = new Map();

  for (const word of wordAnalysis) {
    const category = ERROR_CATEGORIES[word.type];

    if (!category) continue;

    const current = distribution.get(category) || {
      category,
      count: 0,
      marksLost: 0,
    };

    current.count += 1;
    current.marksLost += toNumber(word.marksLost);

    distribution.set(category, current);
  }

  const totalErrors = [...distribution.values()].reduce(
    (total, item) => total + item.count,
    0,
  );

  return [...distribution.values()].map((item) => ({
    ...item,
    percentage: totalErrors > 0 ? roundTo((item.count / totalErrors) * 100) : 0,
    marksLost: roundTo(item.marksLost, 4),
  }));
};

/* ============================================================
   MINUTE-WISE PERFORMANCE
============================================================ */

/**
 * Timeline entries contain cumulative metrics.
 *
 * Each interval's changes are assigned to the minute in which
 * its latest snapshot occurred. When autosaves are sparse,
 * this is an approximation, not an exact keystroke-level record.
 */
export const buildMinutePerformance = (timeline = []) => {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return [];
  }

  const sorted = [...timeline].sort(
    (a, b) => a.elapsedSeconds - b.elapsedSeconds,
  );

  const buckets = new Map();

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1] || null;

    const elapsed = toNumber(current.elapsedSeconds);

    const minute = Math.max(1, Math.ceil(elapsed / 60));

    const startElapsedSeconds = (minute - 1) * 60;
    const endElapsedSeconds = minute * 60;

    const wordsTyped = previous
      ? getIntervalDelta(current, previous, "wordsTyped")
      : toNumber(current.wordsTyped);

    const correctWords = previous
      ? getIntervalDelta(current, previous, "correctWords")
      : toNumber(current.correctWords);

    const incorrectWords = previous
      ? getIntervalDelta(current, previous, "incorrectWords")
      : toNumber(current.incorrectWords);

    const totalErrors = previous
      ? getIntervalDelta(current, previous, "totalErrors")
      : toNumber(current.totalErrors);

    const bucket = buckets.get(minute) || {
      minute,
      startElapsedSeconds,
      endElapsedSeconds,
      wordsTyped: 0,
      correctWords: 0,
      incorrectWords: 0,
      totalErrors: 0,
    };

    bucket.wordsTyped += wordsTyped;
    bucket.correctWords += correctWords;
    bucket.incorrectWords += incorrectWords;
    bucket.totalErrors += totalErrors;

    buckets.set(minute, bucket);
  }

  return [...buckets.values()]
    .sort((a, b) => a.minute - b.minute)
    .map((bucket) => {
      const minutesElapsed =
        (bucket.endElapsedSeconds - bucket.startElapsedSeconds) / 60;

      return {
        ...bucket,
        grossWpm: roundTo(bucket.wordsTyped / minutesElapsed),
        netWpm: roundTo(bucket.correctWords / minutesElapsed),
        accuracy:
          bucket.wordsTyped > 0
            ? roundTo((bucket.correctWords / bucket.wordsTyped) * 100)
            : 0,
      };
    });
};

/* ============================================================
   PERFORMANCE SEGMENTS
============================================================ */

/**
 * Groups timeline points into fixed-duration segments.
 *
 * Segment values represent changes between cumulative snapshots.
 */
export const buildPerformanceSegments = (
  timeline = [],
  segmentDurationSeconds = 60,
) => {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return [];
  }

  if (!Number.isInteger(segmentDurationSeconds) || segmentDurationSeconds < 1) {
    throw new TypeError("Segment duration must be a positive integer.");
  }

  const sorted = [...timeline].sort(
    (a, b) => a.elapsedSeconds - b.elapsedSeconds,
  );

  const segments = new Map();

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1] || null;

    const elapsed = toNumber(current.elapsedSeconds);

    const segmentIndex = Math.floor(
      Math.max(0, elapsed - 1) / segmentDurationSeconds,
    );

    const startElapsedSeconds = segmentIndex * segmentDurationSeconds;

    const endElapsedSeconds = (segmentIndex + 1) * segmentDurationSeconds;

    const wordsTyped = previous
      ? getIntervalDelta(current, previous, "wordsTyped")
      : toNumber(current.wordsTyped);

    const correctWords = previous
      ? getIntervalDelta(current, previous, "correctWords")
      : toNumber(current.correctWords);

    const totalErrors = previous
      ? getIntervalDelta(current, previous, "totalErrors")
      : toNumber(current.totalErrors);

    const segment = segments.get(segmentIndex) || {
      segmentIndex,
      label: `Segment ${segmentIndex + 1}`,
      startElapsedSeconds,
      endElapsedSeconds,
      wordsTyped: 0,
      correctWords: 0,
      totalErrors: 0,
    };

    segment.wordsTyped += wordsTyped;
    segment.correctWords += correctWords;
    segment.totalErrors += totalErrors;

    segments.set(segmentIndex, segment);
  }

  return [...segments.values()]
    .sort((a, b) => a.segmentIndex - b.segmentIndex)
    .map((segment) => {
      const durationMinutes = segmentDurationSeconds / 60;

      return {
        ...segment,
        grossWpm: roundTo(segment.wordsTyped / durationMinutes),
        netWpm: roundTo(segment.correctWords / durationMinutes),
        accuracy:
          segment.wordsTyped > 0
            ? roundTo((segment.correctWords / segment.wordsTyped) * 100)
            : 0,
      };
    });
};

/* ============================================================
   SUMMARY
============================================================ */

export const buildTypingSummary = ({
  metrics,
  marks,
  maximumMarks,
  passed,
}) => {
  const percentage =
    marks == null || maximumMarks <= 0
      ? null
      : roundTo((marks / maximumMarks) * 100);

  return {
    totalWords: toNumber(metrics.totalWords),
    wordsTyped: toNumber(metrics.wordsTyped),
    correctWords: toNumber(metrics.correctWords),
    incorrectWords: toNumber(metrics.incorrectWords),
    totalErrors: toNumber(metrics.totalErrors),

    grossWpm: toNumber(metrics.grossWpm),
    netWpm: toNumber(metrics.netWpm),
    accuracy: toNumber(metrics.accuracy),

    elapsedSeconds: toNumber(metrics.elapsedSeconds),

    marks,
    maximumMarks,
    percentage,
    passed,
  };
};

/* ============================================================
   ANALYTICS
============================================================ */

export const buildTypingAnalytics = ({
  metrics,
  timeline = [],
  errorDistribution = [],
}) => {
  const totalErrors = toNumber(metrics.totalErrors);
  const totalWords = toNumber(metrics.totalWords);
  const wordsTyped = toNumber(metrics.wordsTyped);

  const firstPoint = timeline[0] || null;
  const lastPoint = timeline[timeline.length - 1] || null;

  const errorRate =
    totalWords > 0 ? roundTo((totalErrors / totalWords) * 100) : 0;

  const topError =
    [...errorDistribution].sort((a, b) => b.count - a.count)[0] || null;

  return {
    referenceWords: totalWords,
    attemptedWords: wordsTyped,
    correctWords: toNumber(metrics.correctWords),
    totalErrors,

    errorRate,

    topErrorCategory: topError?.category || null,

    timelinePoints: timeline.length,

    firstRecordedSecond: firstPoint?.elapsedSeconds ?? null,

    lastRecordedSecond: lastPoint?.elapsedSeconds ?? null,

    hasTimelineData: timeline.length > 0,
  };
};

/* ============================================================
   PERFORMANCE INSIGHTS
============================================================ */

export const buildTypingInsights = ({
  metrics,
  errorDistribution = [],
  minutePerformance = [],
}) => {
  const insights = [];

  const accuracy = toNumber(metrics.accuracy);
  const netWpm = toNumber(metrics.netWpm);
  const grossWpm = toNumber(metrics.grossWpm);

  if (accuracy >= 98) {
    insights.push("Excellent typing accuracy. Maintain this consistency.");
  } else if (accuracy >= 90) {
    insights.push(
      "Good typing accuracy. Focus on reducing the remaining errors.",
    );
  } else if (accuracy > 0) {
    insights.push(
      "Accuracy needs improvement. Prioritize correct words over typing speed.",
    );
  }

  if (grossWpm > 0 && netWpm < grossWpm) {
    insights.push("Typing errors are reducing your effective typing speed.");
  }

  if (errorDistribution.length > 0) {
    const topError = [...errorDistribution].sort(
      (a, b) => b.count - a.count,
    )[0];

    insights.push(
      `Your most frequent error category is ${topError.category.replaceAll("_", " ")}.`,
    );
  }

  if (minutePerformance.length >= 2) {
    const first = minutePerformance[0];
    const last = minutePerformance[minutePerformance.length - 1];

    if (last.netWpm > first.netWpm) {
      insights.push(
        "Your recorded typing speed increased toward the end of the examination.",
      );
    } else if (last.netWpm < first.netWpm) {
      insights.push(
        "Your recorded typing speed decreased toward the end of the examination.",
      );
    }
  }

  if (totalErrorsIsZero(metrics)) {
    insights.push(
      "No word-level errors were recorded in the submitted passage.",
    );
  }

  return insights.slice(0, 30);
};

const totalErrorsIsZero = (metrics) => toNumber(metrics.totalErrors) === 0;

/* ============================================================
   COMPLETE REPORT BUILDER
============================================================ */

/**
 * Builds report sections without recalculating marks.
 */
export const buildTypingReport = ({
  evaluation,
  timeline = [],
  segmentDurationSeconds = 60,
}) => {
  if (!evaluation || typeof evaluation !== "object") {
    throw new TypeError("Evaluation result is required.");
  }

  const metrics = evaluation.wordMetrics || {};
  const wordAnalysis = evaluation.wordAnalysis || [];

  const errorDistribution = buildErrorDistribution(wordAnalysis);

  const minutePerformance = buildMinutePerformance(timeline);

  const performanceSegments = buildPerformanceSegments(
    timeline,
    segmentDurationSeconds,
  );

  const summary = buildTypingSummary({
    metrics,
    marks: evaluation.marks,
    maximumMarks: evaluation.maximumMarks,
    passed: evaluation.passed,
  });

  const analytics = buildTypingAnalytics({
    metrics,
    timeline,
    errorDistribution,
  });

  const insights = buildTypingInsights({
    metrics,
    errorDistribution,
    minutePerformance,
  });

  return {
    errorDistribution,
    minutePerformance,
    performanceSegments,
    timeline,

    summary,
    analytics,
    insights,
  };
};

export default buildTypingReport;
