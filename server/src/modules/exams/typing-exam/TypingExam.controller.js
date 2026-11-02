import mongoose from "mongoose";

import TypingExam from "../../../models/typing/TypingExam.js";
import TypingPassage from "../../../models/typing/TypingPassage.js";
import TypingAttempt from "../../../models/typing/Typing.js";

import asyncHandler from "../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../utils/sendSuccess.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";

import { calculateTypingMetrics } from "./services/typingMetrics.service.js";
import { evaluateTypingAttempt } from "./services/typingEvaluation.service.js";
import { buildTypingReport } from "./services/typingReport.service.js";

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_DURATION_SECONDS = 7200;
const MAX_TYPED_TEXT_LENGTH = 100_000;
const MAX_TIMELINE_POINTS = 5000;

/* ============================================================
   COMMON HELPERS
============================================================ */

const getAuthenticatedUserId = (req) => {
  const userId = req.user?.userId || req.user?.id;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid authenticated user.");
    error.statusCode = 401;
    throw error;
  }

  return userId;
};

const throwHttpError = (res, statusCode, message) =>
  res.status(statusCode).json({
    success: false,
    message,
  });

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const roundTo = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const calculatePassingMarks = (maximumMarks, passingPercentage) =>
  roundTo((maximumMarks * passingPercentage) / 100, 2);

const getElapsedSeconds = (attempt, now = new Date()) => {
  const elapsed = Math.floor(
    (now.getTime() - new Date(attempt.startedAt).getTime()) / 1000,
  );

  return Math.max(
    0,
    Math.min(elapsed, Number(attempt.configSnapshot.durationSeconds)),
  );
};

const getRemainingSeconds = (attempt, now = new Date()) =>
  Math.max(
    0,
    Math.ceil((new Date(attempt.deadlineAt).getTime() - now.getTime()) / 1000),
  );

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
  elapsedSeconds: attempt.elapsedSeconds,
  remainingSeconds: attempt.remainingSeconds,
  progressVersion: attempt.progressVersion,
  timeline: attempt.timeline,
  result: attempt.result,
  createdAt: attempt.createdAt,
  updatedAt: attempt.updatedAt,
});

const getExamSnapshot = (exam) => ({
  title: exam.title,
  language: exam.language,
  durationSeconds: exam.durationSeconds,
  targetWpm: exam.targetWpm,
  maximumMarks: exam.maximumMarks,
  passingPercentage: exam.passingPercentage,
  passingMarks: calculatePassingMarks(
    exam.maximumMarks,
    exam.passingPercentage,
  ),
  scoring: exam.scoring?.toObject ? exam.scoring.toObject() : exam.scoring,
});

const getPassageSnapshot = (passage) => ({
  title: passage.title,
  language: passage.language,
  content: passage.content,
  wordCount: passage.wordCount,
  difficulty: passage.difficulty,
});

const validateTypedText = (typedText) => {
  if (typeof typedText !== "string") {
    const error = new Error("Typed text must be a string.");
    error.statusCode = 400;
    throw error;
  }

  if (typedText.length > MAX_TYPED_TEXT_LENGTH) {
    const error = new Error(
      `Typed text cannot exceed ${MAX_TYPED_TEXT_LENGTH} characters.`,
    );
    error.statusCode = 413;
    throw error;
  }
};

const buildTimelinePoint = (metrics, elapsedSeconds, savedAt) => ({
  elapsedSeconds,
  totalWords: metrics.totalWords,
  wordsTyped: metrics.wordsTyped,
  correctWords: metrics.correctWords,
  incorrectWords: metrics.incorrectWords,
  misspellings: metrics.misspellings,
  wrongWords: metrics.wrongWords,
  omissions: metrics.omissions,
  notReachedWords: metrics.notReachedWords,
  extraWords: metrics.extraWords,
  totalErrors: metrics.totalErrors,
  errorsInInterval: 0,
  grossWpm: metrics.grossWpm,
  netWpm: metrics.netWpm,
  accuracy: metrics.accuracy,
  savedAt,
});

const getCurrentMetrics = (attempt, typedText, elapsedSeconds) =>
  calculateTypingMetrics({
    expectedText: attempt.passageSnapshot.content,
    typedText,
    elapsedSeconds,
    scoring: attempt.configSnapshot.scoring,
  });

const getErrorResponse = (error) => {
  if (error?.name === "ValidationError") {
    return {
      statusCode: 400,
      message: error.message,
    };
  }

  if (error?.name === "CastError") {
    return {
      statusCode: 400,
      message: "Invalid identifier or request data.",
    };
  }

  return {
    statusCode: error?.statusCode || 500,
    message:
      error?.statusCode && error.statusCode < 500
        ? error.message
        : "An unexpected server error occurred.",
  };
};

/* ============================================================
   GET PUBLISHED EXAMS
   GET /
============================================================ */

export const getPublishedExams = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    language,
    sort = "newest",
  } = req.validatedQuery;

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
      { title: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
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

/* ============================================================
   GET PUBLISHED EXAM BY ID
   GET /:examId
============================================================ */

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

  return sendSuccess(res, "Exam fetched successfully.", {
    exam,
    marksConfiguration: {
      maximumMarks: exam.maximumMarks,
      passingPercentage: exam.passingPercentage,
      passingMarks: calculatePassingMarks(
        exam.maximumMarks,
        exam.passingPercentage,
      ),
    },
    passageCount,
    isAvailable: passageCount > 0,
  });
});

/* ============================================================
   GET PUBLISHED PASSAGES
   GET /:examId/passages
============================================================ */

export const getExamPassages = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;

  const { page = 1, limit = 10, difficulty, search } = req.validatedQuery;

  const { skip } = getPagination({ page, limit });

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
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    TypingPassage.countDocuments(filter),
  ]);

  return sendSuccess(res, "Exam passages fetched successfully.", {
    exam,
    marksConfiguration: {
      maximumMarks: exam.maximumMarks,
      passingPercentage: exam.passingPercentage,
      passingMarks: calculatePassingMarks(
        exam.maximumMarks,
        exam.passingPercentage,
      ),
    },
    passages,
    pagination: getPaginationMeta(page, limit, total),
  });
});

/* ============================================================
   START OR RESUME ATTEMPT
   POST /:examId/passages/:passageId/start
============================================================ */

export const startAttempt = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { examId, passageId } = req.validatedParams;

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

  const durationSeconds = Number(exam.durationSeconds);

  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 1 ||
    durationSeconds > MAX_DURATION_SECONDS
  ) {
    return throwHttpError(
      res,
      400,
      `Exam duration must be between 1 and ${MAX_DURATION_SECONDS} seconds.`,
    );
  }

  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId: exam._id,
    language: exam.language,
    status: "published",
  })
    .select("_id title language content wordCount difficulty")
    .lean();

  if (!passage) {
    return throwHttpError(
      res,
      404,
      "Published passage not found for this examination.",
    );
  }

  const now = new Date();

  const activeAttempt = await TypingAttempt.findOne({
    userId,
    examId: exam._id,
    status: "in_progress",
  });

  if (activeAttempt) {
    const remainingSeconds = getRemainingSeconds(activeAttempt, now);

    if (remainingSeconds > 0) {
      return sendSuccess(res, "Existing examination attempt resumed.", {
        attempt: getAttemptResponse(activeAttempt),
        exam: activeAttempt.configSnapshot,
        passage: activeAttempt.passageSnapshot,
        remainingSeconds,
        resumed: true,
      });
    }

    activeAttempt.status = "expired";
    activeAttempt.elapsedSeconds = getElapsedSeconds(activeAttempt, now);
    activeAttempt.remainingSeconds = 0;
    activeAttempt.lastActivityAt = now;

    await activeAttempt.save();
  }

  const configSnapshot = getExamSnapshot(exam);
  const passageSnapshot = getPassageSnapshot(passage);

  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + durationSeconds * 1000);

  let attempt;

  try {
    attempt = await TypingAttempt.create({
      userId,
      examId: exam._id,
      passageId: passage._id,
      configSnapshot,
      passageSnapshot,
      typedText: "",
      status: "in_progress",
      startedAt,
      deadlineAt,
      submittedAt: null,
      lastActivityAt: startedAt,
      elapsedSeconds: 0,
      remainingSeconds: durationSeconds,
      progressVersion: 0,
      timeline: [],
    });
  } catch (error) {
    if (error?.code === 11000) {
      const concurrentAttempt = await TypingAttempt.findOne({
        userId,
        examId: exam._id,
        status: "in_progress",
      });

      if (concurrentAttempt) {
        const remainingSeconds = getRemainingSeconds(concurrentAttempt);

        if (remainingSeconds > 0) {
          return sendSuccess(res, "Existing examination attempt resumed.", {
            attempt: getAttemptResponse(concurrentAttempt),
            exam: concurrentAttempt.configSnapshot,
            passage: concurrentAttempt.passageSnapshot,
            remainingSeconds,
            resumed: true,
          });
        }
      }

      return throwHttpError(
        res,
        409,
        "An attempt is already being created. Please try again.",
      );
    }

    throw error;
  }

  return sendSuccess(
    res,
    "Typing examination started successfully.",
    {
      attempt: getAttemptResponse(attempt),
      exam: configSnapshot,
      passage: passageSnapshot,
      remainingSeconds: durationSeconds,
      resumed: false,
    },
    201,
  );
});

/* ============================================================
   GET CANDIDATE ATTEMPT HISTORY
   GET /attempts/history
============================================================ */

export const getAttempts = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);

  const {
    page = 1,
    limit = 10,
    status,
    search,
    sort = "newest",
  } = req.validatedQuery;

  const { skip } = getPagination({ page, limit });

  const filter = { userId };

  if (status) {
    filter.status = status;
  }

  if (search) {
    const escapedSearch = escapeRegex(search);

    const matchingExams = await TypingExam.find({
      title: { $regex: escapedSearch, $options: "i" },
    })
      .select("_id")
      .lean();

    filter.$or = [
      { "configSnapshot.title": { $regex: escapedSearch, $options: "i" } },
      { examId: { $in: matchingExams.map((exam) => exam._id) } },
    ];
  }

  const sortOptions = {
    newest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
  };

  const [attempts, total] = await Promise.all([
    TypingAttempt.find(filter)
      .select(
        "examId passageId configSnapshot status startedAt deadlineAt submittedAt result createdAt",
      )
      .populate({
        path: "examId",
        select: "title slug language",
      })
      .populate({
        path: "passageId",
        select: "title language wordCount difficulty",
      })
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip(skip)
      .limit(limit)
      .lean(),

    TypingAttempt.countDocuments(filter),
  ]);

  return sendSuccess(res, "Typing attempt history fetched successfully.", {
    attempts,
    pagination: getPaginationMeta(page, limit, total),
  });
});

/* ============================================================
   UPDATE ATTEMPT PROGRESS / AUTOSAVE
   PATCH /attempts/:attemptId/progress
============================================================ */

export const updateAttemptProgress = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { attemptId } = req.validatedParams;
  const { typedText, progressVersion } = req.validatedBody;

  validateTypedText(typedText);

  if (!Number.isInteger(progressVersion) || progressVersion < 0) {
    return throwHttpError(res, 400, "A valid progressVersion is required.");
  }

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  });

  if (!attempt) {
    return throwHttpError(res, 404, "Typing attempt not found.");
  }

  if (attempt.status !== "in_progress") {
    return throwHttpError(
      res,
      409,
      "This examination attempt is no longer in progress.",
    );
  }

  if (attempt.progressVersion !== progressVersion) {
    return throwHttpError(
      res,
      409,
      "Your typing progress is outdated. Refresh the latest attempt before saving.",
    );
  }

  const now = new Date();
  const remainingSeconds = getRemainingSeconds(attempt, now);

  if (remainingSeconds <= 0) {
    attempt.status = "expired";
    attempt.elapsedSeconds = getElapsedSeconds(attempt, now);
    attempt.remainingSeconds = 0;
    attempt.lastActivityAt = now;
    await attempt.save();

    return throwHttpError(
      res,
      409,
      "The examination time has expired. Submit your final response.",
    );
  }

  const elapsedSeconds = getElapsedSeconds(attempt, now);

  const metrics = getCurrentMetrics(attempt, typedText, elapsedSeconds);

  const previousPoint = attempt.timeline.at(-1);

  const errorsInInterval = previousPoint
    ? Math.max(0, metrics.totalErrors - previousPoint.totalErrors)
    : metrics.totalErrors;

  const timelinePoint = {
    ...buildTimelinePoint(metrics, elapsedSeconds, now),
    errorsInInterval,
  };

  // Keep the timeline bounded. Retain the latest points.
  const timeline = [...attempt.timeline];

  if (timeline.length >= MAX_TIMELINE_POINTS) {
    timeline.shift();
  }

  // Do not append duplicate elapsed-time snapshots.
  if (
    timeline.length > 0 &&
    timeline[timeline.length - 1].elapsedSeconds === elapsedSeconds
  ) {
    timeline[timeline.length - 1] = timelinePoint;
  } else {
    timeline.push(timelinePoint);
  }

  // Atomic optimistic-concurrency update.
  const updatedAttempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attemptId,
      userId,
      status: "in_progress",
      progressVersion,
      deadlineAt: { $gt: now },
    },
    {
      $set: {
        typedText,
        elapsedSeconds,
        remainingSeconds,
        lastActivityAt: now,
        timeline,
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

  if (!updatedAttempt) {
    return throwHttpError(
      res,
      409,
      "Progress was updated by another request or the examination time expired.",
    );
  }

  return sendSuccess(res, "Typing progress saved successfully.", {
    attemptId: updatedAttempt._id,
    status: updatedAttempt.status,
    progressVersion: updatedAttempt.progressVersion,
    elapsedSeconds: updatedAttempt.elapsedSeconds,
    remainingSeconds: updatedAttempt.remainingSeconds,
    metrics: {
      totalWords: metrics.totalWords,
      wordsTyped: metrics.wordsTyped,
      correctWords: metrics.correctWords,
      incorrectWords: metrics.incorrectWords,
      misspellings: metrics.misspellings,
      wrongWords: metrics.wrongWords,
      omissions: metrics.omissions,
      notReachedWords: metrics.notReachedWords,
      extraWords: metrics.extraWords,
      totalErrors: metrics.totalErrors,
      grossWpm: metrics.grossWpm,
      netWpm: metrics.netWpm,
      accuracy: metrics.accuracy,
      elapsedSeconds: metrics.elapsedSeconds,
    },
    savedAt: updatedAttempt.lastActivityAt,
  });
});

/* ============================================================
   SUBMIT ATTEMPT
   POST /attempts/:attemptId/submit
============================================================ */

export const submitAttempt = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { attemptId } = req.validatedParams;
  const { typedText, progressVersion } = req.validatedBody;

  validateTypedText(typedText);

  if (!Number.isInteger(progressVersion) || progressVersion < 0) {
    return throwHttpError(res, 400, "A valid progressVersion is required.");
  }

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  });

  if (!attempt) {
    return throwHttpError(res, 404, "Typing attempt not found.");
  }

  // Idempotent response for a retry after a successful submission.
  if (attempt.status === "evaluated" && attempt.result) {
    return sendSuccess(res, "Examination has already been submitted.", {
      attemptId: attempt._id,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      progressVersion: attempt.progressVersion,
      elapsedSeconds: attempt.elapsedSeconds,
      remainingSeconds: 0,
      result: attempt.result,
    });
  }

  if (attempt.status !== "in_progress") {
    return throwHttpError(
      res,
      409,
      "This examination attempt cannot be submitted.",
    );
  }

  if (attempt.progressVersion !== progressVersion) {
    return throwHttpError(
      res,
      409,
      "Your progress version is outdated. Save or refresh your latest progress before submitting.",
    );
  }

  const submittedAt = new Date();

  const elapsedSeconds = getElapsedSeconds(attempt, submittedAt);

  // The deadline is authoritative. The server never accepts extra time.
  const effectiveElapsedSeconds = Math.min(
    elapsedSeconds,
    attempt.configSnapshot.durationSeconds,
  );

  // Evaluate from the submitted text and immutable snapshots.
  const evaluation = evaluateTypingAttempt({
    attempt: {
      ...attempt.toObject(),
      typedText,
      elapsedSeconds: effectiveElapsedSeconds,
    },
  });

  const report = buildTypingReport({
    evaluation,
    timeline: attempt.timeline,
  });

  const result = {
    ...evaluation,
    ...report,
    timeline: attempt.timeline,
    reportVersion: 1,
  };

  // Atomically transition the attempt to evaluated.
  const updatedAttempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attemptId,
      userId,
      status: "in_progress",
      progressVersion,
    },
    {
      $set: {
        typedText,
        elapsedSeconds: effectiveElapsedSeconds,
        remainingSeconds: 0,
        lastActivityAt: submittedAt,
        submittedAt,
        evaluatedAt: evaluation.evaluatedAt,
        result,
        status: "evaluated",
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

  if (!updatedAttempt) {
    return throwHttpError(
      res,
      409,
      "The attempt changed while submission was being processed. Please retrieve its current status.",
    );
  }

  return sendSuccess(res, "Examination submitted and evaluated successfully.", {
    attemptId: updatedAttempt._id,
    status: updatedAttempt.status,
    submittedAt: updatedAttempt.submittedAt,
    progressVersion: updatedAttempt.progressVersion,
    elapsedSeconds: updatedAttempt.elapsedSeconds,
    remainingSeconds: 0,
    result: updatedAttempt.result,
  });
});

/* ============================================================
   GET ATTEMPT RESULT
   GET /attempts/:attemptId/result
============================================================ */

export const getAttemptResult = asyncHandler(async (req, res) => {
  const userId = getAuthenticatedUserId(req);
  const { attemptId } = req.validatedParams;

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  })
    .select(
      [
        "examId",
        "passageId",
        "configSnapshot",
        "passageSnapshot",
        "status",
        "startedAt",
        "deadlineAt",
        "submittedAt",
        "elapsedSeconds",
        "result",
        "timeline",
        "createdAt",
        "updatedAt",
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

  if (attempt.status !== "evaluated" || !attempt.result) {
    return throwHttpError(
      res,
      409,
      "The examination result is not available yet.",
    );
  }

  return sendSuccess(res, "Examination result fetched successfully.", {
    attempt: {
      _id: attempt._id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      elapsedSeconds: attempt.elapsedSeconds,
      exam: attempt.examId,
      passage: attempt.passageId,
      configSnapshot: attempt.configSnapshot,
      passageSnapshot: attempt.passageSnapshot,
    },
    result: attempt.result,
  });
});
