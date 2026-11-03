import crypto from "node:crypto";
import mongoose from "mongoose";

import TypingExam from "../../models/typing/TypingExam.model.js";
import TypingPassage from "../../models/typing/TypingPassage.model.js";
import TypingAttempt from "../../models/typing/TypingAttempt.model.js";
import TypingResult from "../../models/typing/TypingResult.model.js";

import asyncHandler from "../../utils/asyncHandler.js";
import { evaluateTypingPerformance } from "./service/typingEvaluation.service.js";

/*
 * Candidate APIs:
 * - only ACTIVE exams are visible
 * - only active passages in the same language are available
 * - every attempt belongs to the authenticated candidate
 * - the reference passage is copied into originalText at attempt creation
 *
 * Adjust getAuthenticatedUserId() to match the property populated by your
 * existing user authentication middleware.
 */
const getAuthenticatedUserId = (req) =>
  req.user?._id || req.user?.id || req.auth?.userId || req.userId || null;

const sendError = (res, status, message, errors) => {
  const body = { success: false, message };
  if (Array.isArray(errors) && errors.length) body.errors = errors;
  return res.status(status).json(body);
};

const success = (res, message, data, status = 200) =>
  res.status(status).json({ success: true, message, data });

const isValidId = (value) => mongoose.isValidObjectId(value);

const getPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(query.limit, 10) || 10),
  );
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const requireCandidate = (req, res) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId || !isValidId(userId)) {
    sendError(res, 401, "User authentication required.");
    return null;
  }
  return userId;
};

const getElapsedSeconds = (startedAt, durationSeconds) => {
  const elapsed = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );
  return Math.min(elapsed, durationSeconds);
};

/* =========================================================
   GET AVAILABLE EXAMS
   GET /api/typing/exams
========================================================= */
export const getAvailableTypingExams = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { status: "ACTIVE" };

  if (req.query.language) {
    filter.language = String(req.query.language).trim().toLowerCase();
  }
  if (req.query.examType) {
    filter.examType = String(req.query.examType).trim().toUpperCase();
  }
  if (req.query.examCategory) {
    filter.examCategory = String(req.query.examCategory).trim().toUpperCase();
  }
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [
      { title: regex },
      { code: regex },
      { authority: regex },
      { postName: regex },
    ];
  }

  const [items, total] = await Promise.all([
    TypingExam.find(filter)
      .select(
        "title slug code description authority examCategory postName recruitmentYear language examType durationSeconds measurement qualification policyVersion",
      )
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TypingExam.countDocuments(filter),
  ]);

  return success(res, "Available typing exams fetched successfully.", {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/* =========================================================
   GET EXAM DETAILS
   GET /api/typing/exams/:examId
========================================================= */
export const getAvailableTypingExamById = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  if (!isValidId(examId)) return sendError(res, 400, "Invalid exam ID.");

  const exam = await TypingExam.findOne({ _id: examId, status: "ACTIVE" })
    .select(
      "title slug code description authority examCategory postName recruitmentYear language examType durationSeconds measurement qualification officialSources policyVersion",
    )
    .lean();

  if (!exam)
    return sendError(res, 404, "Typing exam not found or not available.");

  return success(res, "Typing exam details fetched successfully.", { exam });
});

/* =========================================================
   GET PASSAGES FOR AN EXAM LANGUAGE
   GET /api/typing/exams/:examId/passages
========================================================= */
export const getAvailablePassages = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  if (!isValidId(examId)) return sendError(res, 400, "Invalid exam ID.");

  const exam = await TypingExam.findOne({ _id: examId, status: "ACTIVE" })
    .select("_id title language examType")
    .lean();

  if (!exam)
    return sendError(res, 404, "Typing exam not found or not available.");

  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    language: exam.language,
    isActive: true,
  };

  if (req.query.difficulty) {
    filter.difficulty = String(req.query.difficulty).trim().toLowerCase();
  }
  if (req.query.category) {
    filter.category = String(req.query.category).trim();
  }
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [{ title: regex }, { category: regex }, { content: regex }];
  }

  const [items, total] = await Promise.all([
    TypingPassage.find(filter)
      .select(
        "title language wordCount characterCount difficulty category tags",
      )
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TypingPassage.countDocuments(filter),
  ]);

  return success(res, "Available passages fetched successfully.", {
    exam,
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/* =========================================================
   START ATTEMPT
   POST /api/typing/exams/:examId/attempts
   Body: { passageId, attemptType?: "PRACTICE" | "MOCK" }
========================================================= */
export const startTypingAttempt = asyncHandler(async (req, res) => {
  const userId = requireCandidate(req, res);
  if (!userId) return;

  const { examId } = req.params;
  const { passageId, attemptType = "PRACTICE" } = req.body || {};

  if (!isValidId(examId)) return sendError(res, 400, "Invalid exam ID.");
  if (!isValidId(passageId))
    return sendError(res, 400, "A valid passageId is required.");

  if (!["PRACTICE", "MOCK"].includes(attemptType)) {
    return sendError(res, 400, "attemptType must be PRACTICE or MOCK.");
  }

  const exam = await TypingExam.findOne({ _id: examId, status: "ACTIVE" })
    .populate("wordConfigId")
    .populate("characterConfigId")
    .populate("hybridConfigId")
    .populate("evaluationPolicyId")
    .lean();

  if (!exam)
    return sendError(res, 404, "Typing exam not found or not available.");

  const passage = await TypingPassage.findOne({
    _id: passageId,
    language: exam.language,
    isActive: true,
  }).lean();

  if (!passage) {
    return sendError(
      res,
      404,
      "Passage not found or not available for this exam language.",
    );
  }

  const activeAttempt = await TypingAttempt.findOne({
    userId,
    examId,
    status: "IN_PROGRESS",
  }).select("_id timing.startedAt timing.durationSeconds");

  if (activeAttempt) {
    return sendError(
      res,
      409,
      "You already have an active attempt for this exam.",
      [
        {
          field: "examId",
          message: "Resume or submit your existing attempt first.",
        },
      ],
    );
  }

  const startedAt = new Date();
  const durationSeconds = exam.durationSeconds;
  const contentHash = crypto
    .createHash("sha256")
    .update(passage.content, "utf8")
    .digest("hex");

  const attempt = await TypingAttempt.create({
    userId,
    examId: exam._id,
    passageId: passage._id,
    attemptType,
    language: exam.language,
    examType: exam.examType,
    originalText: passage.content,
    passageSnapshot: {
      contentHash,
      version: passage.updatedAt ? new Date(passage.updatedAt).getTime() : 1,
      title: passage.title,
    },
    typedText: "",
    timing: {
      startedAt,
      submittedAt: null,
      durationSeconds,
      elapsedSeconds: 0,
    },
    progressVersion: 0,
    status: "IN_PROGRESS",
    evaluation: {
      status: "PENDING",
      attempts: 0,
      errorMessage: "",
    },
  });

  return success(
    res,
    "Typing attempt started successfully.",
    {
      attemptId: String(attempt._id),
      exam: {
        id: String(exam._id),
        title: exam.title,
        language: exam.language,
        examType: exam.examType,
      },
      passage: {
        id: String(passage._id),
        title: passage.title,
        text: passage.content,
        wordCount: passage.wordCount,
        characterCount: passage.characterCount,
      },
      durationSeconds,
      startedAt,
      deadlineAt: new Date(startedAt.getTime() + durationSeconds * 1000),
      progressVersion: attempt.progressVersion,
    },
    201,
  );
});

/* =========================================================
   AUTOSAVE ATTEMPT
   PATCH /api/typing/attempts/:attemptId/progress
   Body: { typedText, progressVersion }
========================================================= */
export const saveTypingProgress = asyncHandler(async (req, res) => {
  const userId = requireCandidate(req, res);
  if (!userId) return;

  const { attemptId } = req.params;
  const { typedText, progressVersion } = req.body || {};

  if (!isValidId(attemptId)) return sendError(res, 400, "Invalid attempt ID.");
  if (typeof typedText !== "string") {
    return sendError(res, 400, "typedText must be a string.");
  }
  if (typedText.length > 100000) {
    return sendError(
      res,
      413,
      "Typed text exceeds the 100000-character limit.",
    );
  }
  if (!Number.isInteger(progressVersion) || progressVersion < 0) {
    return sendError(res, 400, "A valid progressVersion is required.");
  }

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
    status: "IN_PROGRESS",
  }).select("timing progressVersion");

  if (!attempt) return sendError(res, 404, "Active attempt not found.");

  const elapsedSeconds = getElapsedSeconds(
    attempt.timing.startedAt,
    attempt.timing.durationSeconds,
  );

  if (elapsedSeconds >= attempt.timing.durationSeconds) {
    return sendError(
      res,
      409,
      "The examination time has ended. Submit your attempt.",
    );
  }

  const updated = await TypingAttempt.findOneAndUpdate(
    {
      _id: attemptId,
      userId,
      status: "IN_PROGRESS",
      progressVersion,
    },
    {
      $set: {
        typedText,
        "timing.elapsedSeconds": elapsedSeconds,
      },
      $inc: { progressVersion: 1 },
    },
    { new: true, runValidators: true },
  ).select("_id progressVersion timing.elapsedSeconds status");

  if (!updated) {
    return sendError(
      res,
      409,
      "Progress was updated elsewhere. Reload the latest attempt state.",
    );
  }

  return success(res, "Typing progress saved.", {
    attemptId: String(updated._id),
    progressVersion: updated.progressVersion,
    elapsedSeconds: updated.timing.elapsedSeconds,
    savedAt: new Date(),
  });
});

/* =========================================================
   SUBMIT ATTEMPT AND GENERATE DIAGNOSTIC RESULT
   POST /api/typing/attempts/:attemptId/submit
   Body: { typedText, idempotencyKey }
========================================================= */
export const submitTypingAttempt = asyncHandler(async (req, res) => {
  const userId = requireCandidate(req, res);
  if (!userId) return;

  const { attemptId } = req.params;
  const { typedText, idempotencyKey } = req.body || {};

  if (!isValidId(attemptId)) return sendError(res, 400, "Invalid attempt ID.");
  if (typeof typedText !== "string") {
    return sendError(res, 400, "typedText is required and must be a string.");
  }
  if (typedText.length > 100000) {
    return sendError(
      res,
      413,
      "Typed text exceeds the 100000-character limit.",
    );
  }
  if (
    typeof idempotencyKey !== "string" ||
    !idempotencyKey.trim() ||
    idempotencyKey.length > 128
  ) {
    return sendError(
      res,
      400,
      "A unique idempotencyKey (maximum 128 characters) is required.",
    );
  }

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    userId,
  });

  if (!attempt) return sendError(res, 404, "Attempt not found.");

  if (attempt.status === "COMPLETED") {
    const existingResult = attempt.resultId
      ? await TypingResult.findById(attempt.resultId).lean()
      : null;
    return success(res, "Attempt was already completed.", {
      attemptId: String(attempt._id),
      status: attempt.status,
      result: existingResult,
    });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return sendError(
      res,
      409,
      `Attempt cannot be submitted from status ${attempt.status}.`,
    );
  }

  const submittedAt = new Date();
  const actualElapsed = Math.max(
    1,
    Math.floor(
      (submittedAt.getTime() - attempt.timing.startedAt.getTime()) / 1000,
    ),
  );
  const elapsedSeconds = Math.min(
    actualElapsed,
    attempt.timing.durationSeconds,
  );
  const textHash = crypto
    .createHash("sha256")
    .update(typedText, "utf8")
    .digest("hex");

  // Claim submission atomically to prevent duplicate evaluation.
  const claimed = await TypingAttempt.findOneAndUpdate(
    { _id: attemptId, userId, status: "IN_PROGRESS" },
    {
      $set: {
        typedText,
        status: "EVALUATING",
        "timing.submittedAt": submittedAt,
        "timing.elapsedSeconds": elapsedSeconds,
        "submission.idempotencyKey": idempotencyKey.trim(),
        "submission.submittedTextHash": textHash,
        "evaluation.status": "PROCESSING",
        "evaluation.startedAt": submittedAt,
      },
    },
    { new: true, runValidators: true },
  );

  if (!claimed)
    return sendError(res, 409, "Attempt has already been submitted.");

  try {
    const exam = await TypingExam.findById(claimed.examId)
      .populate("wordConfigId")
      .populate("characterConfigId")
      .populate({
        path: "hybridConfigId",
        populate: [{ path: "wordConfigId" }, { path: "characterConfigId" }],
      })
      .populate("evaluationPolicyId")
      .lean();

    if (!exam)
      throw new Error("The exam configuration for this attempt was not found.");

    const wordConfigDoc =
      exam.wordConfigId ||
      (exam.hybridConfigId?.wordConfigId &&
      typeof exam.hybridConfigId.wordConfigId === "object"
        ? exam.hybridConfigId.wordConfigId
        : null);

    const characterConfigDoc =
      exam.characterConfigId ||
      (exam.hybridConfigId?.characterConfigId &&
      typeof exam.hybridConfigId.characterConfigId === "object"
        ? exam.hybridConfigId.characterConfigId
        : null);

    const diagnostic = evaluateTypingPerformance({
      originalText: claimed.originalText,
      typedText,
      examType: claimed.examType,
      durationSeconds: elapsedSeconds,
      wordConfig: wordConfigDoc?.counting || wordConfigDoc || {},
      characterConfig: characterConfigDoc?.counting || characterConfigDoc || {},
    });

    const word = diagnostic.wordMetrics;
    const character = diagnostic.characterMetrics;
    const wordMistakes = diagnostic.mistakes?.word;
    const characterMistakes = diagnostic.mistakes?.character;

    // Do not add word and character error totals in HYBRID mode:
    // those can describe the same underlying typing error.
    const primaryMistakes =
      claimed.examType === "CHARACTER" ? characterMistakes : wordMistakes;

    const isWord = claimed.examType === "WORD";
    const isCharacter = claimed.examType === "CHARACTER";
    const isHybrid = claimed.examType === "HYBRID";

    const result = await TypingResult.create({
      userId,
      attemptId: claimed._id,
      examId: claimed.examId,
      language: claimed.language,
      examType: claimed.examType,
      attemptType: claimed.attemptType,
      wordMetrics: word
        ? {
            totalWords: word.totalWords ?? 0,
            wordsTyped: word.wordsTyped ?? 0,
            correctWords: word.correctWords ?? 0,
            incorrectWords: word.incorrectWords ?? 0,
            grossWpm: word.grossWpm ?? null,
            netWpm: word.netWpm ?? null,
            accuracy: word.accuracy ?? null,
          }
        : undefined,
      characterMetrics: character
        ? {
            totalCharacters: character.totalCharacters ?? 0,
            charactersTyped: character.charactersTyped ?? 0,
            correctCharacters: character.correctCharacters ?? 0,
            incorrectCharacters: character.incorrectCharacters ?? 0,
            grossCpm: character.grossCpm ?? null,
            netCpm: character.netCpm ?? null,
            grossKdph:
              character.grossCpm == null ? null : character.grossCpm * 60,
            netKdph: character.netCpm == null ? null : character.netCpm * 60,
            accuracy: character.accuracy ?? null,
          }
        : undefined,
      performance: {
        grossSpeed: isWord
          ? (word?.grossWpm ?? null)
          : isCharacter
            ? (character?.grossCpm ?? null)
            : null,
        netSpeed: isWord
          ? (word?.netWpm ?? null)
          : isCharacter
            ? (character?.netCpm ?? null)
            : null,
        measurementUnit: isWord ? "WPM" : isCharacter ? "CPM" : "MIXED",
        accuracy: isWord
          ? (word?.accuracy ?? null)
          : isCharacter
            ? (character?.accuracy ?? null)
            : null,
        errorPercentage: null,
      },
      mistakes: {
        substitutions: primaryMistakes?.substitutions ?? 0,
        omissions: primaryMistakes?.omissions ?? 0,
        insertions: primaryMistakes?.insertions ?? 0,
        transpositions: primaryMistakes?.transpositions ?? 0,
      },
      timing: {
        durationSeconds: claimed.timing.durationSeconds,
        elapsedSeconds,
      },
      scoring: {
        method: "CUSTOM",
        status: "PENDING",
        qualified: null,
        qualificationDetails: {
          reason:
            "Diagnostic metrics generated. Official policy scoring has not yet been connected to this candidate submission flow.",
        },
      },
      evaluation: {
        evaluator: "DIAGNOSTIC",
        policyVersion: String(exam.policyVersion || "1.0"),
        calculationVersion: "1.0",
        reportVersion: 1,
      },
    });

    claimed.status = "COMPLETED";
    claimed.evaluation.status = "COMPLETED";
    claimed.evaluation.completedAt = new Date();
    claimed.resultId = result._id;
    claimed.evaluatedAt = new Date();
    await claimed.save();

    return success(
      res,
      "Typing attempt submitted and diagnostic result generated.",
      {
        attemptId: String(claimed._id),
        status: claimed.status,
        elapsedSeconds,
        result,
        diagnostic,
      },
    );
  } catch (error) {
    claimed.status = "EVALUATION_FAILED";
    claimed.evaluation.status = "FAILED";
    claimed.evaluation.errorMessage = error.message || "Evaluation failed.";
    claimed.evaluation.completedAt = new Date();
    await claimed.save();
    throw error;
  }
});

/* =========================================================
   USER ATTEMPT HISTORY
   GET /api/typing/attempts
========================================================= */
export const getMyTypingAttempts = asyncHandler(async (req, res) => {
  const userId = requireCandidate(req, res);
  if (!userId) return;

  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId };

  if (req.query.status) filter.status = String(req.query.status).toUpperCase();
  if (req.query.examId) {
    if (!isValidId(req.query.examId))
      return sendError(res, 400, "Invalid exam ID.");
    filter.examId = req.query.examId;
  }

  const [items, total] = await Promise.all([
    TypingAttempt.find(filter)
      .select(
        "examId passageId attemptType language examType timing status resultId createdAt",
      )
      .populate("examId", "title code authority")
      .populate("passageId", "title difficulty")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TypingAttempt.countDocuments(filter),
  ]);

  return success(res, "Your typing attempts fetched successfully.", {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/* =========================================================
   GET MY ATTEMPT RESULT
   GET /api/typing/attempts/:attemptId/result
========================================================= */
export const getMyTypingAttemptResult = asyncHandler(async (req, res) => {
  const userId = requireCandidate(req, res);
  if (!userId) return;

  const { attemptId } = req.params;
  if (!isValidId(attemptId)) return sendError(res, 400, "Invalid attempt ID.");

  const attempt = await TypingAttempt.findOne({ _id: attemptId, userId })
    .select("_id examId status timing evaluation resultId createdAt")
    .populate("examId", "title code language examType")
    .lean();

  if (!attempt) return sendError(res, 404, "Attempt not found.");

  if (attempt.status !== "COMPLETED" || !attempt.resultId) {
    return success(
      res,
      "Attempt result is not ready yet.",
      {
        attempt,
        result: null,
      },
      202,
    );
  }

  const result = await TypingResult.findOne({
    _id: attempt.resultId,
    userId,
    attemptId,
  }).lean();

  return success(res, "Typing result fetched successfully.", {
    attempt,
    result,
  });
});
