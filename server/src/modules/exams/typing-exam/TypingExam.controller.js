import mongoose from "mongoose";

import TypingExam from "../../../models/typing/TypingExam.js";
import TypingPassage from "../../../models/typing/TypingPassage.js";
import TypingAttempt from "../../../models/typing/TypingAttempt.js";

import asyncHandler from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/sendSuccess.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";

// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

const getAuthenticatedUserId = (req) => {
  const userId = req.user?.userId || req.user?.id;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid authenticated user.");
    error.statusCode = 401;
    throw error;
  }

  return userId;
};

// ============================================================
// ERROR HELPER
// ============================================================

const throwHttpError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// ============================================================
// REGEX HELPER
// ============================================================

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ============================================================
// ATTEMPT TIME HELPERS
// ============================================================

const getAttemptElapsedSeconds = (attempt) => {
  const elapsed = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

  return Math.max(0, Math.min(elapsed, attempt.configSnapshot.durationSeconds));
};

const getAttemptRemainingSeconds = (attempt) => {
  return Math.max(
    0,
    Math.floor((attempt.deadlineAt.getTime() - Date.now()) / 1000),
  );
};

// ============================================================
// TYPING METRICS CALCULATION
// ============================================================

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

// ============================================================
// TIMELINE HELPER
// ============================================================

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

// ============================================================
// ATTEMPT RESULT CALCULATION
// ============================================================

const calculateAttemptResult = (attempt, metrics) => {
  const config = attempt.configSnapshot;
  const scoring = config.scoring;

  const targetWpm = config.targetWpm;
  const maximumMarks = config.maximumMarks;
  const passingPercentage = config.passingPercentage;

  let marks = 0;

  switch (scoring.method) {
    // --------------------------------------------------------
    // ACCURACY-BASED SCORING
    // --------------------------------------------------------

    case "accuracy": {
      marks = (metrics.accuracy / 100) * maximumMarks;

      break;
    }

    // --------------------------------------------------------
    // NET WPM SCORING
    // --------------------------------------------------------

    case "net_wpm": {
      marks = targetWpm > 0 ? (metrics.netWpm / targetWpm) * maximumMarks : 0;

      break;
    }

    // --------------------------------------------------------
    // CUSTOM SCORING
    // --------------------------------------------------------

    case "custom": {
      const speedMarks =
        targetWpm > 0 ? (metrics.netWpm / targetWpm) * maximumMarks : 0;

      marks = speedMarks - metrics.totalErrors * scoring.errorPenalty;

      break;
    }

    // --------------------------------------------------------
    // WEIGHTED SCORING
    // --------------------------------------------------------

    case "weighted": {
      const speedMarks =
        targetWpm > 0
          ? (metrics.netWpm / targetWpm) *
            maximumMarks *
            (scoring.speedWeight / 100)
          : 0;

      const accuracyMarks =
        (metrics.accuracy / 100) *
        maximumMarks *
        (scoring.accuracyWeight / 100);

      marks = speedMarks + accuracyMarks;

      break;
    }

    // --------------------------------------------------------
    // STANDARD SCORING
    // --------------------------------------------------------

    case "standard":
    default: {
      const speedMarks =
        targetWpm > 0 ? (metrics.netWpm / targetWpm) * maximumMarks : 0;

      marks = speedMarks * (metrics.accuracy / 100);

      break;
    }
  }

  // Keep marks within the configured maximum.
  marks = Number(Math.max(0, Math.min(maximumMarks, marks)).toFixed(2));

  // Calculate qualifying marks.
  const passingMarks = Number(
    ((maximumMarks * passingPercentage) / 100).toFixed(2),
  );

  // Check minimum requirements.
  const meetsMinimumWpm = metrics.netWpm >= scoring.minimumWpm;

  const meetsMinimumAccuracy = metrics.accuracy >= scoring.minimumAccuracy;

  const meetsPassingMarks = marks >= passingMarks;

  const passed = meetsMinimumWpm && meetsMinimumAccuracy && meetsPassingMarks;

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
    passingPercentage,
    passingMarks,

    meetsMinimumWpm,
    meetsMinimumAccuracy,
    meetsPassingMarks,

    passed,
    evaluatedAt: new Date(),
  };
};

// ============================================================
// ATTEMPT RESPONSE
// ============================================================

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

// ============================================================
// GET PUBLISHED EXAMS
// GET /exams
// ============================================================

export const getPublishedExams = asyncHandler(async (req, res) => {
  const { page, limit, search, language, sort } = req.validatedQuery;

  const { skip } = getPagination({
    page,
    limit,
  });

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
    newest: {
      createdAt: -1,
      _id: -1,
    },

    oldest: {
      createdAt: 1,
      _id: 1,
    },

    title_asc: {
      title: 1,
      _id: 1,
    },

    title_desc: {
      title: -1,
      _id: -1,
    },
  };

  const [exams, total] = await Promise.all([
    TypingExam.find(filter)
      .select(
        "title slug description language durationSeconds targetWpm maximumMarks passingPercentage scoring instructions createdAt",
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

// GET /exams/:examId
export const getPublishedExamById = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;

  const exam = await TypingExam.findOne({
    _id: examId,
    status: "published",
  })
    .select(
      "title slug description language durationSeconds targetWpm maximumMarks passingPercentage scoring instructions createdAt",
    )
    .lean();

  if (!exam) {
    return throwHttpError(res, 404, "Published exam not found.");
  }

  const passageCount = await TypingPassage.countDocuments({
    examId: exam._id,
    language: exam.language,
    status: "published",
  });

  const passingMarks = Number(
    ((exam.maximumMarks * exam.passingPercentage) / 100).toFixed(2),
  );

  return sendSuccess(res, "Exam fetched successfully.", {
    exam,
    marksConfiguration: {
      maximumMarks: exam.maximumMarks,
      passingPercentage: exam.passingPercentage,
      passingMarks,
    },
    passageCount,
    isAvailable: passageCount > 0,
  });
});

// GET /exams/:examId/passages
export const getExamPassages = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;

  const { page, limit, difficulty, search } = req.validatedQuery;

  const { skip } = getPagination({ page, limit });

  // 1. Fetch published exam and its marks configuration.
  const exam = await TypingExam.findOne({
    _id: examId,
    status: "published",
  })
    .select(
      "title language durationSeconds targetWpm maximumMarks passingPercentage scoring",
    )
    .lean();

  if (!exam) {
    return throwHttpError(res, 404, "Published exam not found.");
  }

  // 2. Calculate passing marks.
  const passingMarks = Number(
    ((exam.maximumMarks * exam.passingPercentage) / 100).toFixed(2),
  );

  // 3. Build passage filters.
  const filter = {
    examId,
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

  // 4. Fetch passages and count concurrently.
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

  // 5. Return response.
  return sendSuccess(res, "Exam passages fetched successfully.", {
    exam,
    marksConfiguration: {
      maximumMarks: exam.maximumMarks,
      passingPercentage: exam.passingPercentage,
      passingMarks,
    },
    passages,
    pagination: getPaginationMeta(page, limit, total),
  });
});

// POST /exams/:examId/passages/:passageId/start

export const startAttempt = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { examId, passageId } = req.validatedParams;

  // 1. Verify the published exam.
  const exam = await TypingExam.findOne({
    _id: examId,
    status: "published",
  })
    .select(
      "title language durationSeconds targetWpm maximumMarks passingPercentage scoring",
    )
    .lean();

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Published exam not found.",
    });
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
    return res.status(404).json({
      success: false,
      message: "Published passage not found for this exam.",
    });
  }

  const now = new Date();

  // 3. Find the user's existing active attempt.
  const activeAttempt = await TypingAttempt.findOne({
    userId,
    examId: exam._id,
    status: "in_progress",
  }).select("_id deadlineAt");

  // 4. Expire the existing active attempt.
  if (activeAttempt) {
    const updatedAttempt = await TypingAttempt.findOneAndUpdate(
      {
        _id: activeAttempt._id,
        userId,
        status: "in_progress",
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

    if (!updatedAttempt) {
      return res.status(409).json({
        success: false,
        message: "Your previous attempt has changed. Please try again.",
      });
    }
  }

  // 5. Prepare examination timing.
  const startedAt = new Date();

  const deadlineAt = new Date(
    startedAt.getTime() + exam.durationSeconds * 1000,
  );

  // 6. Calculate passing marks.
  const passingMarks = Number(
    ((exam.maximumMarks * exam.passingPercentage) / 100).toFixed(2),
  );

  // 7. Create a fresh attempt.
  let attempt;

  try {
    attempt = await TypingAttempt.create({
      userId,
      examId: exam._id,
      passageId: passage._id,

      // Save examination configuration at attempt start.
      configSnapshot: {
        title: exam.title,
        language: exam.language,

        durationSeconds: exam.durationSeconds,
        targetWpm: exam.targetWpm,

        maximumMarks: exam.maximumMarks,
        passingPercentage: exam.passingPercentage,
        passingMarks,

        scoring: {
          method: exam.scoring.method,
          wordLength: exam.scoring.wordLength,
          minimumWpm: exam.scoring.minimumWpm,
          minimumAccuracy: exam.scoring.minimumAccuracy,
          errorPenalty: exam.scoring.errorPenalty,
          speedWeight: exam.scoring.speedWeight,
          accuracyWeight: exam.scoring.accuracyWeight,
        },
      },

      // Save passage content as an immutable snapshot.
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
      return res.status(409).json({
        success: false,
        message: "Another attempt is being started. Please try again.",
      });
    }

    throw error;
  }

  // 8. Delete all previously expired attempts belonging to this user.
  const cleanupResult = await TypingAttempt.deleteMany({
    userId,
    status: "expired",
    _id: { $ne: attempt._id },
  });

  // 9. Return the new attempt and selected passage.
  return sendSuccess(
    res,
    "Typing examination started successfully.",
    {
      attempt: getAttemptResponse(attempt),

      exam: {
        title: exam.title,
        language: exam.language,
        durationSeconds: exam.durationSeconds,
        targetWpm: exam.targetWpm,
        maximumMarks: exam.maximumMarks,
        passingPercentage: exam.passingPercentage,
        passingMarks,
        scoring: exam.scoring,
      },

      passage: {
        title: passage.title,
        language: passage.language,
        content: passage.content,
        wordCount: passage.wordCount,
        difficulty: passage.difficulty,
      },

      remainingSeconds: exam.durationSeconds,
      deletedExpiredAttempts: cleanupResult.deletedCount,
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

// PATCH /attempts/:attemptId/progress
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
    return throwHttpError(res, 404, "Typing attempt not found.");
  }

  // 2. Verify attempt status.
  if (attempt.status !== "in_progress") {
    return throwHttpError(res, 409, "This typing attempt is no longer active.");
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

    return throwHttpError(res, 409, "The typing attempt has expired.");
  }

  // 4. Check progress version.
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
  const elapsedSeconds = getAttemptElapsedSeconds(attempt);

  // 6. Calculate typing metrics using the saved scoring configuration.
  const metrics = calculateTypingMetrics({
    originalText: attempt.passageSnapshot,
    typedText,
    elapsedSeconds,
    wordLength: attempt.configSnapshot?.scoring?.wordLength ?? 5,
  });

  // 7. Create timeline entry.
  const previousEntry = attempt.timeline?.[attempt.timeline.length - 1] ?? null;

  const timelineEntry = createTimelineEntry(
    metrics,
    elapsedSeconds,
    previousEntry,
  );

  // 8. Atomically save progress.
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

  // 9. Handle concurrent requests or changed attempt state.
  if (!updatedAttempt) {
    const latestAttempt = await TypingAttempt.findOne({
      _id: attempt._id,
      userId,
    })
      .select("status progressVersion deadlineAt")
      .lean();

    if (!latestAttempt) {
      return throwHttpError(res, 404, "Typing attempt not found.");
    }

    // Check whether the attempt expired during the save operation.
    const currentTime = new Date();

    if (
      latestAttempt.status === "in_progress" &&
      currentTime >= latestAttempt.deadlineAt
    ) {
      await TypingAttempt.updateOne(
        {
          _id: attempt._id,
          userId,
          status: "in_progress",
          deadlineAt: { $lte: currentTime },
        },
        {
          $set: {
            status: "expired",
            submittedAt: currentTime,
            expiresAt: new Date(
              latestAttempt.deadlineAt.getTime() + RETENTION_PERIOD_MS,
            ),
          },
        },
      );

      return throwHttpError(res, 409, "The typing attempt has expired.");
    }

    if (latestAttempt.status !== "in_progress") {
      return throwHttpError(
        res,
        409,
        "This typing attempt is no longer active.",
      );
    }

    // Another request saved progress first.
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

// POST /attempts/:attemptId/submit
export const submitAttempt = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  const { attemptId } = req.validatedParams;
  const { typedText, progressVersion } = req.validatedBody;

  const now = new Date();
  const RETENTION_PERIOD_MS = 24 * 60 * 60 * 1000;

  // 1. Find the user's attempt.
  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  });

  if (!attempt) {
    return throwHttpError(res, 404, "Typing attempt not found.");
  }

  // 2. Verify attempt status.
  if (attempt.status !== "in_progress") {
    return throwHttpError(
      res,
      409,
      "This typing attempt is no longer active or has already been submitted.",
    );
  }

  // 3. Verify progress version.
  const currentVersion = attempt.progressVersion ?? 0;

  if (progressVersion !== currentVersion) {
    return res.status(409).json({
      success: false,
      message: "Your progress version is outdated.",
      data: {
        currentVersion,
        requestedVersion: progressVersion,
        attemptId: attempt._id,
      },
    });
  }

  // 4. Enforce the server-side examination deadline.
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
          expiresAt: new Date(
            attempt.deadlineAt.getTime() + RETENTION_PERIOD_MS,
          ),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!expiredAttempt) {
      return throwHttpError(
        res,
        409,
        "The attempt has changed. Please refresh and try again.",
      );
    }

    return throwHttpError(res, 409, "The examination time has expired.");
  }

  // 5. Calculate elapsed time using the server clock.
  const elapsedSeconds = Math.max(1, getAttemptElapsedSeconds(attempt));

  // 6. Calculate final typing metrics.
  const metrics = calculateTypingMetrics({
    originalText: attempt.passageSnapshot,
    typedText,
    elapsedSeconds,
    wordLength: attempt.configSnapshot?.scoring?.wordLength ?? 5,
  });

  // 7. Calculate final examination result.
  // Uses maximumMarks, passingPercentage and scoring
  // configuration saved when the attempt started.
  const result = calculateAttemptResult(attempt, metrics);

  // 8. Create final timeline entry.
  const previousEntry = attempt.timeline?.[attempt.timeline.length - 1] ?? null;

  const finalTimelineEntry = createTimelineEntry(
    metrics,
    elapsedSeconds,
    previousEntry,
  );

  // 9. Atomically submit and evaluate the attempt.
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

      $push: {
        timeline: {
          $each: [finalTimelineEntry],
          $slice: -300,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  // 10. Handle concurrent submission or deadline changes.
  if (!submittedAttempt) {
    const latestAttempt = await TypingAttempt.findOne({
      _id: attempt._id,
      userId,
    })
      .select("status progressVersion deadlineAt")
      .lean();

    if (!latestAttempt) {
      return throwHttpError(res, 404, "Typing attempt not found.");
    }

    const currentTime = new Date();

    if (
      latestAttempt.status === "in_progress" &&
      currentTime >= latestAttempt.deadlineAt
    ) {
      await TypingAttempt.updateOne(
        {
          _id: attempt._id,
          userId,
          status: "in_progress",
          deadlineAt: { $lte: currentTime },
        },
        {
          $set: {
            status: "expired",
            submittedAt: currentTime,
            expiresAt: new Date(
              latestAttempt.deadlineAt.getTime() + RETENTION_PERIOD_MS,
            ),
          },
        },
      );

      return throwHttpError(res, 409, "The examination time has expired.");
    }

    if (latestAttempt.status !== "in_progress") {
      return throwHttpError(
        res,
        409,
        "This typing attempt has already been submitted or is no longer active.",
      );
    }

    return throwHttpError(
      res,
      409,
      "The attempt has changed. Please refresh and try again.",
    );
  }

  // 11. Return final examination result.
  return sendSuccess(res, "Typing examination submitted successfully.", {
    attemptId: submittedAttempt._id,
    status: submittedAttempt.status,
    submittedAt: submittedAttempt.submittedAt,
    progressVersion: submittedAttempt.progressVersion,
    elapsedSeconds,
    remainingSeconds: 0,

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

const roundTo = (value, decimals = 2) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  const factor = 10 ** decimals;

  return Math.round(number * factor) / factor;
};

const average = (values = []) => {
  const valid = values.map(Number).filter(Number.isFinite);

  if (!valid.length) return 0;

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const calculateStandardDeviation = (values = []) => {
  if (!values.length) return 0;

  const mean = average(values);

  const variance = average(values.map((value) => (value - mean) ** 2));

  return Math.sqrt(variance);
};

const percentageOf = (value, total) => {
  if (!total || total <= 0) return 0;

  return roundTo((value / total) * 100);
};

// ============================================================
// ADVANCED TYPING ANALYTICS
// ============================================================

const buildAdvancedTypingAnalytics = ({
  timeline = [],
  minutePerformance = [],
  result,
  elapsedSeconds = 0,
}) => {
  const validTimeline = timeline
    .filter((item) => Number.isFinite(Number(item.elapsedSeconds)))
    .slice()
    .sort((a, b) => Number(a.elapsedSeconds) - Number(b.elapsedSeconds));

  const speedValues = validTimeline
    .map((item) => Number(item.netWpm))
    .filter(Number.isFinite);

  const grossSpeedValues = validTimeline
    .map((item) => Number(item.grossWpm))
    .filter(Number.isFinite);

  const accuracyValues = validTimeline
    .map((item) => Number(item.accuracy))
    .filter(Number.isFinite);

  const peakNetWpm = speedValues.length
    ? Math.max(...speedValues)
    : Number(result.netWpm || 0);

  const lowestNetWpm = speedValues.length ? Math.min(...speedValues) : 0;

  const averageNetWpm = average(speedValues);
  const averageGrossWpm = average(grossSpeedValues);
  const averageAccuracy = average(accuracyValues);

  const speedDeviation = calculateStandardDeviation(speedValues);

  const speedConsistency =
    averageNetWpm > 0
      ? Math.max(0, Math.min(100, 100 - (speedDeviation / averageNetWpm) * 100))
      : 0;

  const firstSpeed = speedValues[0] ?? 0;
  const lastSpeed = speedValues[speedValues.length - 1] ?? 0;

  const speedChange = lastSpeed - firstSpeed;

  const firstAccuracy = accuracyValues[0] ?? 0;
  const lastAccuracy = accuracyValues[accuracyValues.length - 1] ?? 0;

  const accuracyChange = lastAccuracy - firstAccuracy;

  const totalCharacters = Number(result.totalCharacters || 0);

  const correctCharacters = Number(result.correctCharacters || 0);

  const incorrectCharacters = Number(result.incorrectCharacters || 0);

  const missedCharacters = Number(result.missedCharacters || 0);

  const extraCharacters = Number(result.extraCharacters || 0);

  const totalErrors = Number(result.totalErrors || 0);

  const errorRate = percentageOf(totalErrors, totalCharacters);

  const correctCharacterRate = percentageOf(correctCharacters, totalCharacters);

  const charactersPerMinute =
    elapsedSeconds > 0 ? (totalCharacters / elapsedSeconds) * 60 : 0;

  const estimatedWords = totalCharacters / 5;

  // First-half and second-half comparison.
  const midpoint = elapsedSeconds / 2;

  const firstHalf = validTimeline.filter(
    (item) => Number(item.elapsedSeconds) <= midpoint,
  );

  const secondHalf = validTimeline.filter(
    (item) => Number(item.elapsedSeconds) > midpoint,
  );

  const firstHalfSpeed = average(firstHalf.map((item) => Number(item.netWpm)));

  const secondHalfSpeed = average(
    secondHalf.map((item) => Number(item.netWpm)),
  );

  const improvementPercentage =
    firstHalfSpeed > 0
      ? ((secondHalfSpeed - firstHalfSpeed) / firstHalfSpeed) * 100
      : 0;

  // Best and weakest minute.
  const bestMinute = minutePerformance.length
    ? minutePerformance.reduce((best, current) =>
        Number(current.netWpm || 0) > Number(best.netWpm || 0) ? current : best,
      )
    : null;

  const weakestMinute = minutePerformance.length
    ? minutePerformance.reduce((weakest, current) =>
        Number(current.netWpm || 0) < Number(weakest.netWpm || 0)
          ? current
          : weakest,
      )
    : null;

  // Performance insights.
  const insights = [];

  if (speedConsistency >= 85) {
    insights.push({
      type: "positive",
      title: "Consistent typing speed",
      description:
        "Your recorded net typing speed remained relatively stable during the examination.",
    });
  } else if (speedValues.length > 1) {
    insights.push({
      type: "improvement",
      title: "Improve speed consistency",
      description:
        "Your typing speed varied during the examination. Practise maintaining a steady typing rhythm.",
    });
  }

  if (Number(result.accuracy || 0) >= 95) {
    insights.push({
      type: "positive",
      title: "Excellent accuracy",
      description: "You maintained very high typing accuracy.",
    });
  } else if (Number(result.accuracy || 0) < 85) {
    insights.push({
      type: "improvement",
      title: "Improve typing accuracy",
      description:
        "Focus on correct keystrokes before increasing your typing speed.",
    });
  }

  if (improvementPercentage > 5) {
    insights.push({
      type: "positive",
      title: "Speed improved during the examination",
      description:
        "Your second-half average speed was higher than your first-half average.",
    });
  } else if (improvementPercentage < -5) {
    insights.push({
      type: "improvement",
      title: "Late-examination speed decreased",
      description:
        "Your second-half average speed was lower. Practise maintaining typing endurance.",
    });
  }

  if (totalErrors > 0) {
    insights.push({
      type: "improvement",
      title: "Reduce typing errors",
      description: `You recorded ${totalErrors} total errors. Review incorrect, missed and extra characters.`,
    });
  }

  if (bestMinute) {
    insights.push({
      type: "positive",
      title: "Your strongest minute",
      description: `Your highest minute-wise net speed was ${roundTo(bestMinute.netWpm)} WPM.`,
    });
  }

  return {
    overview: {
      averageNetWpm: roundTo(averageNetWpm),
      averageGrossWpm: roundTo(averageGrossWpm),

      peakNetWpm: roundTo(peakNetWpm),
      lowestNetWpm: roundTo(lowestNetWpm),

      averageAccuracy: roundTo(averageAccuracy),

      speedConsistency: roundTo(speedConsistency),
      speedDeviation: roundTo(speedDeviation),

      speedChange: roundTo(speedChange),
      accuracyChange: roundTo(accuracyChange),

      errorRate: roundTo(errorRate),
      correctCharacterRate: roundTo(correctCharacterRate),

      charactersPerMinute: roundTo(charactersPerMinute),
      estimatedWords: roundTo(estimatedWords),

      improvementPercentage: roundTo(improvementPercentage),

      timelineSamples: validTimeline.length,
    },

    bestMinute: bestMinute
      ? {
          minute: bestMinute.minute ?? null,
          elapsedMinute: bestMinute.elapsedMinute ?? null,
          netWpm: roundTo(bestMinute.netWpm),
          grossWpm: roundTo(bestMinute.grossWpm),
          accuracy: roundTo(bestMinute.accuracy),
        }
      : null,

    weakestMinute: weakestMinute
      ? {
          minute: weakestMinute.minute ?? null,
          elapsedMinute: weakestMinute.elapsedMinute ?? null,
          netWpm: roundTo(weakestMinute.netWpm),
          grossWpm: roundTo(weakestMinute.grossWpm),
          accuracy: roundTo(weakestMinute.accuracy),
        }
      : null,

    characterMetrics: {
      totalCharacters,
      correctCharacters,
      incorrectCharacters,
      missedCharacters,
      extraCharacters,
      totalErrors,

      errorRate: roundTo(errorRate),
      correctCharacterRate: roundTo(correctCharacterRate),
    },

    halfComparison: {
      firstHalfAverageNetWpm: roundTo(firstHalfSpeed),
      secondHalfAverageNetWpm: roundTo(secondHalfSpeed),

      improvementPercentage: roundTo(improvementPercentage),
    },

    insights,
  };
};

// ============================================================
// GET TYPING ATTEMPT RESULT
// ============================================================

export const getAttemptResult = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { attemptId } = req.validatedParams;

  // 1. Fetch evaluated attempt.
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
    return throwHttpError(res, 404, "Typing attempt not found.");
  }

  // 2. Verify result availability.
  if (attempt.status !== "evaluated" || !attempt.result) {
    return throwHttpError(
      res,
      409,
      "The examination result is not available yet.",
    );
  }

  const result = attempt.result;
  const config = attempt.configSnapshot || {};
  const scoring = config.scoring || {};

  const wordLength = scoring.wordLength || 5;

  // 3. Get examination marks configuration.
  // Prefer the values saved in the evaluated result.
  // Fall back to the immutable attempt snapshot.
  const maximumMarks = Number(result.maximumMarks ?? config.maximumMarks ?? 0);

  const passingPercentage = Number(
    result.passingPercentage ?? config.passingPercentage ?? 0,
  );

  const passingMarks = Number(
    result.passingMarks ??
      config.passingMarks ??
      (maximumMarks * passingPercentage) / 100,
  );

  const marks = Number(result.marks ?? 0);

  const percentage =
    maximumMarks > 0 ? roundTo((marks / maximumMarks) * 100) : 0;

  // 4. Calculate examination duration.
  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (new Date(attempt.submittedAt).getTime() -
        new Date(attempt.startedAt).getTime()) /
        1000,
    ),
  );

  // 5. Build minute-wise performance.
  const minutePerformance = buildMinutePerformance({
    timeline: attempt.timeline || [],
    result,
    elapsedSeconds,
    wordLength,
  });

  const minuteData = minutePerformance.minutes || [];

  // 6. Build performance timeline.
  const performanceTimeline = (attempt.timeline || [])
    .map((entry) => ({
      elapsedSeconds: Number(entry.elapsedSeconds || 0),
      typedCharacters: Number(entry.typedCharacters || 0),
      correctCharacters: Number(entry.correctCharacters || 0),
      incorrectCharacters: Number(entry.incorrectCharacters || 0),
      missedCharacters: Number(entry.missedCharacters || 0),
      extraCharacters: Number(entry.extraCharacters || 0),
      grossWpm: Number(entry.grossWpm || 0),
      netWpm: Number(entry.netWpm || 0),
      accuracy: Number(entry.accuracy || 0),
      errorsInInterval: Number(entry.errorsInInterval || 0),
    }))
    .sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);

  // 7. Add final result to performance timeline.
  const lastTimelinePoint = performanceTimeline[performanceTimeline.length - 1];

  const hasFinalPoint =
    lastTimelinePoint &&
    lastTimelinePoint.elapsedSeconds === elapsedSeconds &&
    lastTimelinePoint.typedCharacters === Number(result.totalCharacters || 0) &&
    lastTimelinePoint.correctCharacters ===
      Number(result.correctCharacters || 0);

  if (!hasFinalPoint) {
    const lastRecordedErrors = lastTimelinePoint
      ? lastTimelinePoint.incorrectCharacters +
        lastTimelinePoint.missedCharacters +
        lastTimelinePoint.extraCharacters
      : 0;

    performanceTimeline.push({
      elapsedSeconds,
      typedCharacters: Number(result.totalCharacters || 0),
      correctCharacters: Number(result.correctCharacters || 0),
      incorrectCharacters: Number(result.incorrectCharacters || 0),
      missedCharacters: Number(result.missedCharacters || 0),
      extraCharacters: Number(result.extraCharacters || 0),
      grossWpm: Number(result.grossWpm || 0),
      netWpm: Number(result.netWpm || 0),
      accuracy: Number(result.accuracy || 0),
      errorsInInterval: Math.max(
        0,
        Number(result.totalErrors || 0) - lastRecordedErrors,
      ),
    });
  }

  // 8. Character breakdown.
  const characterBreakdown = [
    {
      label: "Correct characters",
      value: Number(result.correctCharacters || 0),
    },
    {
      label: "Incorrect characters",
      value: Number(result.incorrectCharacters || 0),
    },
    {
      label: "Missed characters",
      value: Number(result.missedCharacters || 0),
    },
    {
      label: "Extra characters",
      value: Number(result.extraCharacters || 0),
    },
  ];

  // 9. Error breakdown.
  const errorBreakdown = [
    {
      label: "Incorrect",
      value: Number(result.incorrectCharacters || 0),
    },
    {
      label: "Missed",
      value: Number(result.missedCharacters || 0),
    },
    {
      label: "Extra",
      value: Number(result.extraCharacters || 0),
    },
  ];

  // 10. Examination summary.
  // Do not recalculate candidate marks here.
  const summary = {
    totalCharacters: Number(result.totalCharacters || 0),
    correctCharacters: Number(result.correctCharacters || 0),
    incorrectCharacters: Number(result.incorrectCharacters || 0),
    missedCharacters: Number(result.missedCharacters || 0),
    extraCharacters: Number(result.extraCharacters || 0),
    totalErrors: Number(result.totalErrors || 0),

    grossWpm: Number(result.grossWpm || 0),
    netWpm: Number(result.netWpm || 0),
    accuracy: Number(result.accuracy || 0),

    marks,
    maximumMarks,
    percentage,

    passingPercentage,
    passingMarks,

    passed: Boolean(result.passed),
  };

  // 11. Examination requirements.
  const targetWpm = Number(config.targetWpm ?? 0);
  const minimumWpm = Number(scoring.minimumWpm ?? 0);
  const minimumAccuracy = Number(scoring.minimumAccuracy ?? 0);

  const meetsMinimumWpm =
    result.meetsMinimumWpm ?? summary.netWpm >= minimumWpm;

  const meetsMinimumAccuracy =
    result.meetsMinimumAccuracy ?? summary.accuracy >= minimumAccuracy;

  const meetsPassingMarks = result.meetsPassingMarks ?? marks >= passingMarks;

  const requirements = {
    targetWpm,
    minimumWpm,
    minimumAccuracy,

    maximumMarks,
    passingPercentage,
    passingMarks,

    achievedWpm: summary.netWpm,
    achievedAccuracy: summary.accuracy,
    achievedMarks: marks,

    wpmRequirementMet: Boolean(meetsMinimumWpm),
    accuracyRequirementMet: Boolean(meetsMinimumAccuracy),
    passingMarksRequirementMet: Boolean(meetsPassingMarks),

    passed: Boolean(result.passed),
  };

  // 12. Advanced typing analytics.
  const advancedAnalytics = buildAdvancedTypingAnalytics({
    timeline: performanceTimeline,
    minutePerformance: minuteData,
    result,
    elapsedSeconds,
  });

  // 13. Chart data.
  const charts = {
    performanceTimeline,

    minutePerformance: minuteData,

    characterBreakdown,

    errorBreakdown,

    speedComparison: {
      grossWpm: summary.grossWpm,
      netWpm: summary.netWpm,
      targetWpm,
      minimumWpm,
    },

    accuracyComparison: {
      achievedAccuracy: summary.accuracy,
      minimumAccuracy,
    },

    marksComparison: {
      achievedMarks: marks,
      maximumMarks,
      passingMarks,
      passingPercentage,
      percentage,
    },

    errorPercentages: {
      incorrect: percentageOf(
        summary.incorrectCharacters,
        summary.totalCharacters,
      ),

      missed: percentageOf(summary.missedCharacters, summary.totalCharacters),

      extra: percentageOf(summary.extraCharacters, summary.totalCharacters),
    },

    halfComparison: advancedAnalytics.halfComparison,
  };

  // 14. Normalize performance insights.
  const normalizeInsights = (value) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      return [
        {
          type: "info",
          title: "Performance insight",
          description: value,
        },
      ];
    }

    return [];
  };

  const minuteInsights = normalizeInsights(
    minutePerformance?.insights
      ? Object.values(minutePerformance.insights)
          .filter(Boolean)
          .map((item) => ({
            type: "info",
            title: item.minute
              ? `${item.label || `Minute ${item.minute}`} performance`
              : "Performance insight",
            description: item.minute
              ? `Net speed: ${item.netWpm} WPM, accuracy: ${item.accuracy}%.`
              : String(item),
          }))
      : [],
  );

  const advancedInsights = normalizeInsights(advancedAnalytics?.insights);

  const performanceInsights = [...minuteInsights, ...advancedInsights];

  // 15. Complete result response.
  return sendSuccess(res, "Typing examination result fetched successfully.", {
    attempt: {
      attemptId: attempt._id,
      status: attempt.status,

      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      deadlineAt: attempt.deadlineAt,

      elapsedSeconds,

      durationSeconds: config.durationSeconds ?? 0,
    },

    exam: attempt.examId,

    passage: attempt.passageId,

    scoringConfiguration: {
      method: scoring.method,
      wordLength,

      minimumWpm,
      minimumAccuracy,

      errorPenalty: scoring.errorPenalty ?? 0,

      speedWeight: scoring.speedWeight ?? 0,
      accuracyWeight: scoring.accuracyWeight ?? 0,

      targetWpm,

      maximumMarks,
      passingPercentage,
      passingMarks,
    },

    summary,

    requirements,

    charts,

    analytics: advancedAnalytics,

    performanceInsights,

    // Original evaluator output.
    result,
  });
});
