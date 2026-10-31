import mongoose from "mongoose";

import TypingExam from "../../../models/typing/TypingExam.js";
import TypingPassage from "../../../models/typing/TypingPassage.js";
import TypingAttempt from "../../../models/typing/TypingAttempt.js";

import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/sendSuccess.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";

const getAuthenticatedUserId = (req) => {
  const userId = req.user?.userId || req.user?.id;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid authenticated user.");
    error.statusCode = 401;
    throw error;
  }

  return userId;
};

const throwHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAttemptElapsedSeconds = (attempt) => {
  const elapsed = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

  return Math.max(0, Math.min(elapsed, attempt.configSnapshot.durationSeconds));
};

const calculateTypingMetrics = ({
  originalText,
  typedText,
  elapsedSeconds,
  wordLength = 5,
}) => {
  const original = [...originalText];
  const typed = [...typedText];

  let correctCharacters = 0;
  let incorrectCharacters = 0;

  const comparableLength = Math.min(original.length, typed.length);

  for (let i = 0; i < comparableLength; i += 1) {
    if (original[i] === typed[i]) {
      correctCharacters += 1;
    } else {
      incorrectCharacters += 1;
    }
  }

  const missedCharacters = Math.max(0, original.length - typed.length);
  const extraCharacters = Math.max(0, typed.length - original.length);

  const totalErrors = incorrectCharacters + missedCharacters + extraCharacters;

  const totalCharacters = typed.length;

  const accuracy =
    totalCharacters > 0
      ? Number(((correctCharacters / totalCharacters) * 100).toFixed(2))
      : 0;

  const elapsedMinutes = elapsedSeconds / 60;

  const grossWpm =
    elapsedMinutes > 0
      ? Number((totalCharacters / wordLength / elapsedMinutes).toFixed(2))
      : 0;

  const netWpm =
    elapsedMinutes > 0
      ? Number(
          Math.max(
            0,
            grossWpm - totalErrors / wordLength / elapsedMinutes,
          ).toFixed(2),
        )
      : 0;

  return {
    totalCharacters,
    correctCharacters,
    incorrectCharacters,
    missedCharacters,
    extraCharacters,
    totalErrors,
    grossWpm,
    netWpm,
    accuracy,
  };
};

const createTimelineEntry = (metrics, elapsedSeconds, previousEntry) => {
  const previousErrors = previousEntry
    ? previousEntry.incorrectCharacters +
      previousEntry.missedCharacters +
      previousEntry.extraCharacters
    : 0;

  return {
    elapsedSeconds,
    typedCharacters: metrics.totalCharacters,
    correctCharacters: metrics.correctCharacters,
    incorrectCharacters: metrics.incorrectCharacters,
    missedCharacters: metrics.missedCharacters,
    extraCharacters: metrics.extraCharacters,
    grossWpm: metrics.grossWpm,
    netWpm: metrics.netWpm,
    accuracy: metrics.accuracy,
    errorsInInterval: Math.max(0, metrics.totalErrors - previousErrors),
  };
};

const calculateAttemptResult = (attempt, metrics) => {
  const scoring = attempt.configSnapshot.scoring;
  const targetWpm = attempt.configSnapshot.targetWpm;

  const maximumMarks = 100;
  let marks = 0;

  switch (scoring.method) {
    case "accuracy":
      marks = metrics.accuracy;
      break;

    case "net_wpm":
      marks = targetWpm > 0 ? (metrics.netWpm / targetWpm) * maximumMarks : 0;
      break;

    case "custom": {
      const speedMarks =
        targetWpm > 0 ? (metrics.netWpm / targetWpm) * maximumMarks : 0;

      marks = speedMarks - metrics.totalErrors * scoring.errorPenalty;
      break;
    }

    case "standard":
    default: {
      const speedMarks =
        targetWpm > 0 ? (metrics.netWpm / targetWpm) * maximumMarks : 0;

      marks = speedMarks * (metrics.accuracy / 100);
      break;
    }
  }

  marks = Number(Math.max(0, Math.min(maximumMarks, marks)).toFixed(2));

  const passed =
    metrics.netWpm >= scoring.minimumWpm &&
    metrics.accuracy >= scoring.minimumAccuracy;

  return {
    totalCharacters: metrics.totalCharacters,
    correctCharacters: metrics.correctCharacters,
    incorrectCharacters: metrics.incorrectCharacters,
    missedCharacters: metrics.missedCharacters,
    extraCharacters: metrics.extraCharacters,
    totalErrors: metrics.totalErrors,
    grossWpm: metrics.grossWpm,
    netWpm: metrics.netWpm,
    accuracy: metrics.accuracy,
    marks,
    maximumMarks,
    passed,
    evaluatedAt: new Date(),
  };
};

const getAttemptRemainingSeconds = (attempt) => {
  return Math.max(
    0,
    Math.floor((attempt.deadlineAt.getTime() - Date.now()) / 1000),
  );
};

export const getAttemptResponse = (attempt) => ({
  _id: attempt._id,
  examId: attempt.examId,
  passageId: attempt.passageId,
  configSnapshot: attempt.configSnapshot,
  passageSnapshot: attempt.passageSnapshot,
  typedText: attempt.typedText,
  status: attempt.status,
  startedAt: attempt.startedAt,
  deadlineAt: attempt.deadlineAt,
  submittedAt: attempt.submittedAt,
  progressVersion: attempt.progressVersion ?? 0,
  timeline: attempt.timeline,
  result: attempt.result,
  createdAt: attempt.createdAt,
  updatedAt: attempt.updatedAt,
});

export const getPublishedExams = asyncHandler(async (req, res) => {
  const { page, limit, search, language, sort } = req.validatedQuery;

  const { skip } = getPagination({ page, limit });

  const filter = {
    status: "published",
  };

  if (language) {
    filter.language = language;
  }

  if (search) {
    const escapedSearch = escapeRegex(search);

    filter.$or = [
      {
        title: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        description: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  const sortOptions = {
    newest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
    title_asc: { title: 1, _id: 1 },
    title_desc: { title: -1, _id: -1 },
  };

  const [exams, total] = await Promise.all([
    TypingExam.find(filter)
      .select(
        "title slug description language durationSeconds targetWpm scoring instructions createdAt",
      )
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip(skip)
      .limit(limit)
      .lean(),

    TypingExam.countDocuments(filter),
  ]);

  return sendSuccess(res, "Published exams fetched successfully.", {
    exams,
    pagination: getPaginationMeta(page, limit, total),
  });
});

export const getPublishedExamById = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;

  const exam = await TypingExam.findOne({
    _id: examId,
    status: "published",
  })
    .select(
      "title slug description language durationSeconds targetWpm scoring instructions createdAt",
    )
    .lean();

  if (!exam) {
    return throwHttpError(404, "Published exam not found.");
  }

  const passageCount = await TypingPassage.countDocuments({
    examId: exam._id,
    language: exam.language,
    status: "published",
  });

  return sendSuccess(res, "Exam fetched successfully.", {
    exam,
    passageCount,
    isAvailable: passageCount > 0,
  });
});

export const getExamPassages = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;

  const { page, limit, difficulty, search } = req.validatedQuery;

  const { skip } = getPagination({ page, limit });

  const exam = await TypingExam.findOne({
    _id: examId,
    status: "published",
  })
    .select("_id language")
    .lean();

  if (!exam) {
    return throwHttpError(404, "Published exam not found.");
  }

  const filter = {
    examId: exam._id,
    language: exam.language,
    status: "published",
  };

  if (difficulty) {
    filter.difficulty = difficulty;
  }

  if (search) {
    filter.title = {
      $regex: escapeRegex(search),
      $options: "i",
    };
  }

  const [passages, total] = await Promise.all([
    TypingPassage.find(filter)
      .select("title language wordCount difficulty createdAt")
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    TypingPassage.countDocuments(filter),
  ]);

  return sendSuccess(res, "Exam passages fetched successfully.", {
    passages,
    pagination: getPaginationMeta(page, limit, total),
  });
});

export const startAttempt = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { examId, passageId } = req.validatedParams;

  // 1. Verify the published exam.
  const exam = await TypingExam.findOne({
    _id: examId,
    status: "published",
  })
    .select("title language durationSeconds targetWpm scoring")
    .lean();

  if (!exam) {
    return throwHttpError(404, "Published exam not found.");
  }

  // 2. Verify the selected published passage.
  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId: exam._id,
    language: exam.language,
    status: "published",
  })
    .select("_id title language content wordCount difficulty")
    .lean();

  if (!passage) {
    return throwHttpError(404, "Published passage not found for this exam.");
  }

  const now = new Date();

  // 3. Find the user's existing active attempt.
  const activeAttempt = await TypingAttempt.findOne({
    userId,
    examId: exam._id,
    status: "in_progress",
  }).select("_id deadlineAt");

  // 4. Abandon or expire the existing attempt.
  if (activeAttempt) {
    const isExpired = now >= activeAttempt.deadlineAt;

    const updatedAttempt = await TypingAttempt.findOneAndUpdate(
      {
        _id: activeAttempt._id,
        userId,
        status: "in_progress",
      },
      {
        $set: {
          status: isExpired || "expired",
          submittedAt: now,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedAttempt) {
      return throwHttpError(
        409,
        "Your previous attempt has changed. Please try again.",
      );
    }
  }

  // 5. Prepare timing for the new attempt.
  const startedAt = new Date();

  const deadlineAt = new Date(
    startedAt.getTime() + exam.durationSeconds * 1000,
  );

  // 6. Create a fresh attempt.
  let attempt;

  try {
    attempt = await TypingAttempt.create({
      userId,
      examId: exam._id,
      passageId: passage._id,

      configSnapshot: {
        title: exam.title,
        language: exam.language,
        durationSeconds: exam.durationSeconds,
        targetWpm: exam.targetWpm,
        scoring: exam.scoring,
      },

      passageSnapshot: passage.content,
      typedText: "",
      progressVersion: 0,
      status: "in_progress",
      startedAt,
      deadlineAt,
      timeline: [],
    });
  } catch (error) {
    if (error.code === 11000) {
      return throwHttpError(
        409,
        "Another attempt is being started. Please try again.",
      );
    }

    throw error;
  }

  // 7. Return the new attempt and selected passage.
  return sendSuccess(
    res,
    "Typing examination started successfully.",
    {
      attempt: getAttemptResponse(attempt),

      passage: {
        title: passage.title,
        language: passage.language,
        content: passage.content,
        wordCount: passage.wordCount,
        difficulty: passage.difficulty,
      },

      remainingSeconds: exam.durationSeconds,
    },
    201,
  );
});

export const getAttempts = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  const { page, limit, status, examId, sort } = req.validatedQuery;

  const { skip } = getPagination({ page, limit });

  const filter = { userId };

  if (status) {
    filter.status = status;
  }

  if (examId) {
    filter.examId = examId;
  }

  const sortOptions = {
    newest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
  };

  const [attempts, total] = await Promise.all([
    TypingAttempt.find(filter)
      .select(
        [
          "_id",
          "examId",
          "passageId",
          "configSnapshot.title",
          "status",
          "startedAt",
          "deadlineAt",
          "submittedAt",
          "result",
          "createdAt",
        ].join(" "),
      )
      .populate({
        path: "examId",
        select: "title slug language",
      })
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip(skip)
      .limit(limit)
      .lean(),

    TypingAttempt.countDocuments(filter),
  ]);

  return sendSuccess(res, "Your typing attempts fetched successfully.", {
    attempts,
    pagination: getPaginationMeta(page, limit, total),
  });
});

export const updateAttemptProgress = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  const { attemptId } = req.validatedParams;
  const { typedText, progressVersion } = req.validatedBody;

  const now = new Date();
  const RETENTION_PERIOD_MS = 24 * 60 * 60 * 1000;

  // 1. Find the attempt belonging to the authenticated user.
  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  });

  if (!attempt) {
    return throwHttpError(404, "Typing attempt not found.");
  }

  // 2. Verify attempt status.
  if (attempt.status !== "in_progress") {
    return throwHttpError(409, "This typing attempt is no longer active.");
  }

  // 3. Enforce the server-side deadline.
  if (now >= attempt.deadlineAt) {
    await TypingAttempt.updateOne(
      {
        _id: attempt._id,
        userId,
        status: "in_progress",
        deadlineAt: { $lte: now },
      },
      {
        $set: {
          status: "expired",
          submittedAt: now,
          expiresAt: new Date(
            attempt.deadlineAt.getTime() + RETENTION_PERIOD_MS,
          ),
        },
      },
    );

    return throwHttpError(409, "The typing attempt has expired.");
  }

  // 4. Check the client's progress version.
  const currentVersion = attempt.progressVersion ?? 0;

  if (progressVersion !== currentVersion) {
    return res.status(409).json({
      success: false,
      message:
        "Your progress version is outdated. Fetch the latest attempt and retry.",
      data: {
        currentVersion,
      },
    });
  }

  // 5. Calculate elapsed time using the server clock.
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000),
  );

  // 6. Calculate typing metrics.
  const metrics = calculateTypingMetrics({
    originalText: attempt.passageSnapshot,
    typedText,
    elapsedSeconds,
    wordLength: attempt.configSnapshot?.scoring?.wordLength ?? 5,
  });

  // 7. Create timeline entry.
  const previousEntry = attempt.timeline[attempt.timeline.length - 1];

  const timelineEntry = createTimelineEntry(
    metrics,
    elapsedSeconds,
    previousEntry,
  );

  // 8. Atomically save progress.
  // Only one request using this version can succeed.
  const updatedAttempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      userId,
      status: "in_progress",
      deadlineAt: { $gt: now },
      progressVersion: currentVersion,
    },
    {
      $set: {
        typedText,
      },
      $inc: {
        progressVersion: 1,
      },
      $push: {
        timeline: {
          $each: [timelineEntry],
          $slice: -300,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  // 9. Handle concurrent requests or a changed attempt state.
  if (!updatedAttempt) {
    const latestAttempt = await TypingAttempt.findOne({
      _id: attempt._id,
      userId,
    })
      .select("status progressVersion deadlineAt")
      .lean();

    if (!latestAttempt) {
      return throwHttpError(404, "Typing attempt not found.");
    }

    if (
      latestAttempt.status === "in_progress" &&
      new Date() >= latestAttempt.deadlineAt
    ) {
      const expiryTime = new Date();

      await TypingAttempt.updateOne(
        {
          _id: attempt._id,
          userId,
          status: "in_progress",
          deadlineAt: { $lte: expiryTime },
        },
        {
          $set: {
            status: "expired",
            submittedAt: expiryTime,
            expiresAt: new Date(
              latestAttempt.deadlineAt.getTime() + RETENTION_PERIOD_MS,
            ),
          },
        },
      );

      return throwHttpError(409, "The typing attempt has expired.");
    }

    if (latestAttempt.status !== "in_progress") {
      return throwHttpError(409, "This typing attempt is no longer active.");
    }

    return res.status(409).json({
      success: false,
      message:
        "Another progress request was saved first. Retry using the latest version.",
      data: {
        currentVersion: latestAttempt.progressVersion ?? 0,
      },
    });
  }

  // 10. Return updated progress.
  return sendSuccess(res, "Typing progress saved successfully.", {
    attemptId: updatedAttempt._id,
    status: updatedAttempt.status,
    progressVersion: updatedAttempt.progressVersion,
    elapsedSeconds,
    remainingSeconds: getAttemptRemainingSeconds(updatedAttempt),
    metrics,
    savedAt: updatedAttempt.updatedAt,
  });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { attemptId } = req.validatedParams;
  const { typedText, progressVersion } = req.validatedBody;

  // 1. Find the user's attempt.
  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  });

  if (!attempt) {
    return throwHttpError(404, "Typing attempt not found.");
  }

  // 2. Check attempt status.
  if (attempt.status !== "in_progress") {
    return throwHttpError(
      409,
      "This typing attempt is no longer active or has already been submitted.",
    );
  }

  // 3. Check progress version.
  const currentVersion = attempt.progressVersion ?? 0;

  if (progressVersion !== currentVersion) {
    return throwHttpError(
      409,
      "Typing progress has changed. Please refresh and try again.",
    );
  }

  const now = new Date();

  // 4. Check examination deadline.
  if (now >= attempt.deadlineAt) {
    const expiredAttempt = await TypingAttempt.findOneAndUpdate(
      {
        _id: attempt._id,
        userId,
        status: "in_progress",
        progressVersion: currentVersion,
        deadlineAt: { $lte: now },
      },
      {
        $set: {
          status: "expired",
          submittedAt: now,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!expiredAttempt) {
      return throwHttpError(
        409,
        "The attempt has changed. Please refresh and try again.",
      );
    }

    return throwHttpError(409, "The examination time has expired.");
  }

  // 5. Calculate elapsed time.
  const elapsedSeconds = Math.max(
    1,
    Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000),
  );

  // 6. Calculate final typing metrics using submitted text.
  // 6. Calculate final typing metrics using submitted text.
  const metrics = calculateTypingMetrics({
    originalText: attempt.passageSnapshot,
    typedText,
    elapsedSeconds,
    wordLength: attempt.configSnapshot.scoring.wordLength,
  });

  // 7. Calculate final examination result.
  const result = calculateAttemptResult(attempt, metrics);

  // 8. Atomically save submitted text and final result.
  const submittedAttempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      userId,
      status: "in_progress",
      progressVersion: currentVersion,
      deadlineAt: { $gt: now },
    },
    {
      $set: {
        typedText,
        status: "evaluated",
        submittedAt: now,
        result: {
          ...result,
          evaluatedAt: now,
        },
      },
      $inc: {
        progressVersion: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!submittedAttempt) {
    return throwHttpError(
      409,
      "The attempt has changed or has already been submitted. Please refresh and try again.",
    );
  }

  // 9. Return final examination result.
  return sendSuccess(res, "Typing examination submitted successfully.", {
    attemptId: submittedAttempt._id,
    status: submittedAttempt.status,
    submittedAt: submittedAttempt.submittedAt,
    progressVersion: submittedAttempt.progressVersion,
    elapsedSeconds,
    result: submittedAttempt.result,
  });
});

const buildMinutePerformance = ({
  timeline = [],
  result,
  elapsedSeconds,
  wordLength = 5,
}) => {
  // 1. Sort timeline entries chronologically.
  const points = [...timeline].sort(
    (a, b) => a.elapsedSeconds - b.elapsedSeconds,
  );

  const lastPoint = points[points.length - 1];

  // 2. Add the final submission snapshot.
  const lastRecordedErrors = lastPoint
    ? lastPoint.incorrectCharacters +
      lastPoint.missedCharacters +
      lastPoint.extraCharacters
    : 0;

  const finalPoint = {
    elapsedSeconds,
    typedCharacters: result.totalCharacters,
    correctCharacters: result.correctCharacters,
    incorrectCharacters: result.incorrectCharacters,
    missedCharacters: result.missedCharacters,
    extraCharacters: result.extraCharacters,
    errorsInInterval: Math.max(0, result.totalErrors - lastRecordedErrors),
  };

  const finalPointAlreadyExists =
    lastPoint &&
    lastPoint.elapsedSeconds === finalPoint.elapsedSeconds &&
    lastPoint.typedCharacters === finalPoint.typedCharacters &&
    lastPoint.correctCharacters === finalPoint.correctCharacters;

  if (!finalPointAlreadyExists) {
    points.push(finalPoint);
  }

  // 3. Prepare minute buckets.
  const minuteMap = new Map();

  const getMinuteBucket = (minute) => {
    if (!minuteMap.has(minute)) {
      minuteMap.set(minute, {
        minute,
        label: `Minute ${minute}`,
        durationSeconds: 0,
        charactersTyped: 0,
        correctCharacters: 0,
        errors: 0,
      });
    }

    return minuteMap.get(minute);
  };

  // 4. Distribute each autosave interval into its corresponding minutes.
  let previous = {
    elapsedSeconds: 0,
    typedCharacters: 0,
    correctCharacters: 0,
  };

  for (const point of points) {
    const startSeconds = previous.elapsedSeconds;
    const endSeconds = point.elapsedSeconds;

    const intervalDuration = endSeconds - startSeconds;

    if (intervalDuration <= 0) {
      previous = {
        elapsedSeconds: point.elapsedSeconds,
        typedCharacters: point.typedCharacters,
        correctCharacters: point.correctCharacters,
      };

      continue;
    }

    const charactersAdded = Math.max(
      0,
      point.typedCharacters - previous.typedCharacters,
    );

    const correctAdded = Math.max(
      0,
      point.correctCharacters - previous.correctCharacters,
    );

    const errorsAdded = Math.max(0, point.errorsInInterval || 0);

    let cursor = startSeconds;

    while (cursor < endSeconds) {
      const minute = Math.floor(cursor / 60) + 1;
      const minuteBoundary = minute * 60;

      const segmentEnd = Math.min(endSeconds, minuteBoundary);

      const segmentDuration = segmentEnd - cursor;
      const proportion = segmentDuration / intervalDuration;

      const bucket = getMinuteBucket(minute);

      bucket.durationSeconds += segmentDuration;

      bucket.charactersTyped += charactersAdded * proportion;

      bucket.correctCharacters += correctAdded * proportion;

      bucket.errors += errorsAdded * proportion;

      cursor = segmentEnd;
    }

    previous = {
      elapsedSeconds: point.elapsedSeconds,
      typedCharacters: point.typedCharacters,
      correctCharacters: point.correctCharacters,
    };
  }

  // 5. Calculate minute-wise performance.
  const minutes = [...minuteMap.values()]
    .sort((a, b) => a.minute - b.minute)
    .map((item) => {
      const durationMinutes = item.durationSeconds / 60;

      const grossWpm =
        durationMinutes > 0
          ? item.charactersTyped / wordLength / durationMinutes
          : 0;

      const netWpm =
        durationMinutes > 0
          ? Math.max(0, grossWpm - item.errors / wordLength / durationMinutes)
          : 0;

      const accuracy =
        item.charactersTyped > 0
          ? (item.correctCharacters / item.charactersTyped) * 100
          : 0;

      return {
        minute: item.minute,
        label: item.label,

        durationSeconds: Number(item.durationSeconds.toFixed(2)),

        charactersTyped: Number(item.charactersTyped.toFixed(2)),

        correctCharacters: Number(item.correctCharacters.toFixed(2)),

        errors: Number(item.errors.toFixed(2)),

        grossWpm: Number(grossWpm.toFixed(2)),
        netWpm: Number(netWpm.toFixed(2)),
        accuracy: Number(accuracy.toFixed(2)),
      };
    });

  // 6. Calculate speed changes between consecutive minutes.
  minutes.forEach((item, index) => {
    const previousMinute = minutes[index - 1];

    const speedChange = previousMinute
      ? Number((item.netWpm - previousMinute.netWpm).toFixed(2))
      : 0;

    item.speedChange = speedChange;

    item.speedTrend = !previousMinute
      ? "initial"
      : speedChange > 0
        ? "increased"
        : speedChange < 0
          ? "decreased"
          : "stable";
  });

  // 7. Find the best and worst performing minutes.
  const getHighest = (key) =>
    minutes.reduce(
      (best, current) => (!best || current[key] > best[key] ? current : best),
      null,
    );

  const getLowest = (key) =>
    minutes.reduce(
      (best, current) => (!best || current[key] < best[key] ? current : best),
      null,
    );

  const fastestMinute = getHighest("netWpm");

  const slowestMinute = getLowest("netWpm");

  const highestAccuracyMinute = getHighest("accuracy");

  const lowestAccuracyMinute = getLowest("accuracy");

  const mostErrorsMinute = getHighest("errors");

  const biggestImprovement = minutes.reduce(
    (best, current) =>
      current.speedChange > 0 &&
      (!best || current.speedChange > best.speedChange)
        ? current
        : best,
    null,
  );

  const biggestDecline = minutes.reduce(
    (worst, current) =>
      current.speedChange < 0 &&
      (!worst || current.speedChange < worst.speedChange)
        ? current
        : worst,
    null,
  );

  return {
    minutes,

    insights: {
      fastestMinute,
      slowestMinute,
      highestAccuracyMinute,
      lowestAccuracyMinute,
      mostErrorsMinute,
      biggestImprovement,
      biggestDecline,
    },
  };
};

export const getAttemptResult = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { attemptId } = req.validatedParams;

  // 1. Fetch the evaluated attempt.
  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  })
    .select(
      [
        "_id",
        "examId",
        "passageId",
        "status",
        "configSnapshot",
        "startedAt",
        "deadlineAt",
        "submittedAt",
        "result",
        "timeline",
        "createdAt",
      ].join(" "),
    )
    .populate({
      path: "examId",
      select: "title slug language",
    })
    .populate({
      path: "passageId",
      select: "title language wordCount difficulty",
    })
    .lean();

  if (!attempt) {
    return throwHttpError(404, "Typing attempt not found.");
  }

  // 2. Verify that the result is available.
  if (attempt.status !== "evaluated" || !attempt.result) {
    return throwHttpError(409, "The examination result is not available yet.");
  }

  const result = attempt.result;

  const scoring = attempt.configSnapshot?.scoring || {};

  const wordLength = scoring.wordLength || 5;

  // 3. Calculate examination duration.
  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (new Date(attempt.submittedAt).getTime() -
        new Date(attempt.startedAt).getTime()) /
        1000,
    ),
  );

  // 4. Build minute-wise performance.
  const minutePerformance = buildMinutePerformance({
    timeline: attempt.timeline || [],
    result,
    elapsedSeconds,
    wordLength,
  });

  // 5. Build performance timeline for line charts.
  const performanceTimeline = (attempt.timeline || []).map((entry) => ({
    elapsedSeconds: entry.elapsedSeconds,
    typedCharacters: entry.typedCharacters,
    correctCharacters: entry.correctCharacters,
    incorrectCharacters: entry.incorrectCharacters,
    missedCharacters: entry.missedCharacters,
    extraCharacters: entry.extraCharacters,
    grossWpm: entry.grossWpm,
    netWpm: entry.netWpm,
    accuracy: entry.accuracy,
    errorsInInterval: entry.errorsInInterval,
  }));

  // 6. Add final result to performance timeline.
  const lastTimelinePoint = performanceTimeline[performanceTimeline.length - 1];

  const hasFinalPoint =
    lastTimelinePoint &&
    lastTimelinePoint.elapsedSeconds === elapsedSeconds &&
    lastTimelinePoint.typedCharacters === result.totalCharacters &&
    lastTimelinePoint.correctCharacters === result.correctCharacters;

  if (!hasFinalPoint) {
    performanceTimeline.push({
      elapsedSeconds,
      typedCharacters: result.totalCharacters,
      correctCharacters: result.correctCharacters,
      incorrectCharacters: result.incorrectCharacters,
      missedCharacters: result.missedCharacters,
      extraCharacters: result.extraCharacters,
      grossWpm: result.grossWpm,
      netWpm: result.netWpm,
      accuracy: result.accuracy,
      errorsInInterval: 0,
    });
  }

  // 7. Character distribution for pie/doughnut charts.
  const characterBreakdown = [
    {
      label: "Correct characters",
      value: result.correctCharacters,
    },
    {
      label: "Incorrect characters",
      value: result.incorrectCharacters,
    },
    {
      label: "Missed characters",
      value: result.missedCharacters,
    },
    {
      label: "Extra characters",
      value: result.extraCharacters,
    },
  ];

  // 8. Error distribution for bar charts.
  const errorBreakdown = [
    {
      label: "Incorrect",
      value: result.incorrectCharacters,
    },
    {
      label: "Missed",
      value: result.missedCharacters,
    },
    {
      label: "Extra",
      value: result.extraCharacters,
    },
  ];

  // 9. Summary cards.
  const percentage =
    result.maximumMarks > 0
      ? Number(((result.marks / result.maximumMarks) * 100).toFixed(2))
      : 0;

  const summary = {
    totalCharacters: result.totalCharacters,
    correctCharacters: result.correctCharacters,
    incorrectCharacters: result.incorrectCharacters,
    missedCharacters: result.missedCharacters,
    extraCharacters: result.extraCharacters,
    totalErrors: result.totalErrors,

    grossWpm: result.grossWpm,
    netWpm: result.netWpm,
    accuracy: result.accuracy,

    marks: result.marks,
    maximumMarks: result.maximumMarks,
    percentage,

    passed: result.passed,
  };

  // 10. Examination requirements and comparison.
  const requirements = {
    targetWpm: attempt.configSnapshot?.targetWpm ?? 0,

    minimumWpm: scoring.minimumWpm ?? 0,

    minimumAccuracy: scoring.minimumAccuracy ?? 0,

    achievedWpm: result.netWpm,

    achievedAccuracy: result.accuracy,

    wpmRequirementMet: result.netWpm >= (scoring.minimumWpm ?? 0),

    accuracyRequirementMet: result.accuracy >= (scoring.minimumAccuracy ?? 0),
  };

  // 11. Return complete examination analytics.
  return sendSuccess(res, "Typing examination result fetched successfully.", {
    attempt: {
      attemptId: attempt._id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      deadlineAt: attempt.deadlineAt,
      elapsedSeconds,
      durationSeconds: attempt.configSnapshot?.durationSeconds ?? 0,
    },

    exam: attempt.examId,

    passage: attempt.passageId,

    scoringConfiguration: {
      method: scoring.method,
      wordLength,
      minimumWpm: scoring.minimumWpm,
      minimumAccuracy: scoring.minimumAccuracy,
      errorPenalty: scoring.errorPenalty,
      targetWpm: attempt.configSnapshot?.targetWpm ?? 0,
    },

    summary,

    requirements,

    charts: {
      // WPM and accuracy over elapsed time.
      performanceTimeline,

      // Minute-wise speed, accuracy and errors.
      minutePerformance: minutePerformance.minutes,

      // Pie and doughnut charts.
      characterBreakdown,

      // Error comparison bar chart.
      errorBreakdown,
    },

    performanceInsights: minutePerformance.insights,

    result,
  });
});
