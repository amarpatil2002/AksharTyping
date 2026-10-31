import mongoose from "mongoose";

import TypingExam from "../../../models/typing/TypingExam.js";
import TypingPassage from "../../../models/typing/TypingPassage.js";
import TypingAttempt from "../../../models/typing/TypingAttempt.js";

import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/sendSuccess.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";

const getAuthenticatedUserId = (req) => {
  const userId = req.user?.userId;

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

const getAttemptResponse = (attempt) => ({
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

  // 1. Find the published exam.
  const exam = await TypingExam.findOne({
    _id: examId,
    status: "published",
  })
    .select("title language durationSeconds targetWpm scoring")
    .lean();

  if (!exam) {
    return throwHttpError(404, "Published exam not found.");
  }

  // 2. Find the exact published passage selected by the user.
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

  // 3. Check for an existing active attempt for this exam.
  const activeAttempt = await TypingAttempt.findOne({
    userId,
    examId: exam._id,
    status: "in_progress",
  });

  if (activeAttempt) {
    const now = new Date();

    if (now >= activeAttempt.deadlineAt) {
      // Expire the overdue attempt atomically.
      await TypingAttempt.updateOne(
        {
          _id: activeAttempt._id,
          status: "in_progress",
          deadlineAt: { $lte: now },
        },
        {
          $set: {
            status: "expired",
            submittedAt: now,
          },
        },
      );
    } else {
      // Do not allow starting another passage while an attempt is active.
      if (activeAttempt.passageId.toString() !== passage._id.toString()) {
        return throwHttpError(
          409,
          "You already have an active attempt for another passage in this exam.",
        );
      }

      // Resume the existing attempt.
      return sendSuccess(
        res,
        "You already have an active attempt for this passage.",
        {
          attempt: getAttemptResponse(activeAttempt),
          passage: {
            title: passage.title,
            language: passage.language,
            content: activeAttempt.passageSnapshot,
            wordCount: passage.wordCount,
            difficulty: passage.difficulty,
          },
          remainingSeconds: getAttemptRemainingSeconds(activeAttempt),
        },
      );
    }
  }

  // 4. Set the attempt start and deadline.
  const startedAt = new Date();

  const deadlineAt = new Date(
    startedAt.getTime() + exam.durationSeconds * 1000,
  );

  // 5. Create the attempt with immutable snapshots.
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
      status: "in_progress",
      startedAt,
      deadlineAt,
      timeline: [],
    });
  } catch (error) {
    if (error.code === 11000) {
      return throwHttpError(
        409,
        "An active attempt already exists for this exam.",
      );
    }

    throw error;
  }

  // 6. Return the newly started attempt and selected passage.
  return sendSuccess(
    res,
    "Typing attempt started successfully.",
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

  const filter = {
    userId,
  };

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
        "examId passageId configSnapshot.title status startedAt deadlineAt submittedAt result createdAt",
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

export const getAttemptById = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { attemptId } = req.validatedParams;

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  })
    .populate({
      path: "examId",
      select: "title slug language",
    })
    .lean();

  if (!attempt) {
    return throwHttpError(404, "Typing attempt not found.");
  }

  return sendSuccess(res, "Typing attempt fetched successfully.", {
    attempt,
  });
});

export const updateAttemptProgress = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { attemptId } = req.validatedParams;
  const { typedText } = req.validatedBody;

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  });

  if (!attempt) {
    return throwHttpError(404, "Typing attempt not found.");
  }

  if (attempt.status !== "in_progress") {
    return throwHttpError(409, "This typing attempt is no longer active.");
  }

  const now = new Date();

  if (now >= attempt.deadlineAt) {
    await TypingAttempt.updateOne(
      {
        _id: attempt._id,
        status: "in_progress",
      },
      {
        $set: {
          status: "expired",
          submittedAt: now,
        },
      },
    );

    return throwHttpError(409, "The typing attempt has expired.");
  }

  const elapsedSeconds = getAttemptElapsedSeconds(attempt);

  const metrics = calculateTypingMetrics({
    originalText: attempt.passageSnapshot,
    typedText,
    elapsedSeconds,
    wordLength: attempt.configSnapshot.scoring.wordLength,
  });

  const previousEntry = attempt.timeline[attempt.timeline.length - 1];

  const timelineEntry = createTimelineEntry(
    metrics,
    elapsedSeconds,
    previousEntry,
  );

  // Atomically save progress only while the attempt is active.
  const updatedAttempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      userId,
      status: "in_progress",
      deadlineAt: { $gt: now },
    },
    {
      $set: {
        typedText,
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

  if (!updatedAttempt) {
    return throwHttpError(
      409,
      "The attempt has expired or is no longer active.",
    );
  }

  return sendSuccess(res, "Typing progress saved successfully.", {
    attemptId: updatedAttempt._id,
    status: updatedAttempt.status,
    elapsedSeconds,
    remainingSeconds: getAttemptRemainingSeconds(updatedAttempt),
    metrics,
  });
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { attemptId } = req.validatedParams;
  const { typedText } = req.validatedBody;

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  });

  if (!attempt) {
    return throwHttpError(404, "Typing attempt not found.");
  }

  // Idempotent response for already evaluated attempts.
  if (attempt.status === "evaluated") {
    return sendSuccess(res, "Attempt has already been evaluated.", {
      attemptId: attempt._id,
      status: attempt.status,
      result: attempt.result,
      submittedAt: attempt.submittedAt,
    });
  }

  if (attempt.status !== "in_progress") {
    return throwHttpError(409, "This typing attempt cannot be submitted.");
  }

  const now = new Date();
  const isExpired = now >= attempt.deadlineAt;

  // After the deadline, use the last saved progress.
  const finalTypedText = isExpired
    ? attempt.typedText
    : (typedText ?? attempt.typedText);

  const effectiveEndTime = new Date(
    Math.min(now.getTime(), attempt.deadlineAt.getTime()),
  );

  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (effectiveEndTime.getTime() - attempt.startedAt.getTime()) / 1000,
    ),
  );

  const metrics = calculateTypingMetrics({
    originalText: attempt.passageSnapshot,
    typedText: finalTypedText,
    elapsedSeconds,
    wordLength: attempt.configSnapshot.scoring.wordLength,
  });

  const result = calculateAttemptResult(attempt, metrics);

  const previousEntry = attempt.timeline[attempt.timeline.length - 1];

  const finalTimelineEntry = createTimelineEntry(
    metrics,
    elapsedSeconds,
    previousEntry,
  );

  // Conditional update prevents two concurrent submissions.
  const updatedAttempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      userId,
      status: "in_progress",
    },
    {
      $set: {
        typedText: finalTypedText,
        submittedAt: now,
        status: "evaluated",
        result,
      },
      $push: {
        timeline: {
          $each: [finalTimelineEntry],
          $slice: -300,
        },
      },
      $setOnInsert: {},
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedAttempt) {
    const latestAttempt = await TypingAttempt.findOne({
      _id: attempt._id,
      userId,
    }).lean();

    if (latestAttempt?.status === "evaluated") {
      return sendSuccess(res, "Attempt has already been evaluated.", {
        attemptId: latestAttempt._id,
        status: latestAttempt.status,
        result: latestAttempt.result,
        submittedAt: latestAttempt.submittedAt,
      });
    }

    return throwHttpError(
      409,
      "The attempt has already been submitted or is no longer active.",
    );
  }

  return sendSuccess(
    res,
    "Typing attempt submitted and evaluated successfully.",
    {
      attemptId: updatedAttempt._id,
      status: updatedAttempt.status,
      result: updatedAttempt.result,
      submittedAt: updatedAttempt.submittedAt,
    },
  );
});
