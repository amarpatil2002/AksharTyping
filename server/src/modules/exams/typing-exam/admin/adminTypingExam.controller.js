import mongoose from "mongoose";

import TypingExam from "../../../../models/typing/TypingExam.js";
import TypingPassage from "../../../../models/typing/TypingPassage.js";
import TypingAttempt from "../../../../models/typing/TypingAttempt.js";

import asyncHandler from "../../../../utils/asyncHandler.js";
import {
  getPagination,
  getPaginationMeta,
} from "../../../../utils/pagination.js";
import { sendSuccess } from "../../../../utils/sendSuccess.js";

/* =========================================================
   CONSTANTS
========================================================= */

const EXAM_SELECT_FIELDS = [
  "title",
  "slug",
  "description",
  "language",
  "durationSeconds",
  "targetWpm",
  "maximumMarks",
  "passingPercentage",
  "scoring",
  "instructions",
  "status",
  "createdBy",
  "updatedBy",
  "createdAt",
  "updatedAt",
].join(" ");

const PASSAGE_SELECT_FIELDS = [
  "examId",
  "title",
  "language",
  "content",
  "wordCount",
  "difficulty",
  "status",
  "createdBy",
  "updatedBy",
  "createdAt",
  "updatedAt",
].join(" ");

const RESTRICTED_EXAM_FIELDS = [
  "durationSeconds",
  "targetWpm",
  "maximumMarks",
  "passingPercentage",
  "scoring",
  "language",
];

/* =========================================================
   HELPERS
========================================================= */

const validateAdmin = (adminId) =>
  Boolean(adminId && mongoose.isValidObjectId(adminId));

const getAdminId = (req) => req.session?.admin?.userId;

const requireAdmin = (req, res) => {
  const adminId = getAdminId(req);

  if (!validateAdmin(adminId)) {
    res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
    return null;
  }

  return adminId;
};

const notFoundResponse = (res, message) =>
  res.status(404).json({ success: false, message });

const conflictResponse = (res, message, errors) => {
  const response = { success: false, message };
  if (Array.isArray(errors) && errors.length) response.errors = errors;
  return res.status(409).json(response);
};

const badRequestResponse = (res, message, errors) => {
  const response = { success: false, message };
  if (Array.isArray(errors) && errors.length) response.errors = errors;
  return res.status(400).json(response);
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getScoringObject = (scoring) => {
  if (!scoring) return {};
  return typeof scoring.toObject === "function"
    ? scoring.toObject()
    : { ...scoring };
};

const mergeScoring = (existingScoring, incomingScoring) => {
  const existing = getScoringObject(existingScoring);
  const incoming = incomingScoring || {};

  return {
    ...existing,
    ...incoming,
    errorPenalties: {
      ...(existing.errorPenalties?.toObject?.() ??
        existing.errorPenalties ??
        {}),
      ...(incoming.errorPenalties || {}),
    },
    qualification: {
      ...(existing.qualification?.toObject?.() ?? existing.qualification ?? {}),
      ...(incoming.qualification || {}),
    },
  };
};

const sendMongooseValidationError = (res, error) => {
  const errors = Object.entries(error?.errors || {}).map(([field, item]) => ({
    field,
    message: item.message,
  }));

  return badRequestResponse(
    res,
    "Validation failed.",
    errors.length ? errors : [{ field: "request", message: error.message }],
  );
};

const handleDuplicateKey = (res, error, fallbackField = "slug") => {
  if (error?.code !== 11000) return null;

  const field =
    Object.keys(error.keyPattern || {})[0] ||
    Object.keys(error.keyValue || {})[0] ||
    fallbackField;

  return conflictResponse(res, `A record with this ${field} already exists.`, [
    {
      field,
      message: `This ${field} is already in use.`,
    },
  ]);
};

const populateExamAudit = async (exam) => {
  await exam.populate([
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ]);
  return exam;
};

const populatePassageAudit = async (passage) => {
  await passage.populate([
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ]);
  return passage;
};

const validateEffectiveExam = async (exam) => {
  try {
    await exam.validate();
    return null;
  } catch (error) {
    return error;
  }
};

/* =========================================================
   CREATE EXAM
   POST /exams
========================================================= */

export const createExam = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const payload = req.validatedBody || {};

  const exam = new TypingExam({
    ...payload,
    slug: String(payload.slug || "")
      .trim()
      .toLowerCase(),
    createdBy: adminId,
  });

  const validationError = await validateEffectiveExam(exam);
  if (validationError) {
    return sendMongooseValidationError(res, validationError);
  }

  try {
    await exam.save();
  } catch (error) {
    const duplicateResponse = handleDuplicateKey(res, error);
    if (duplicateResponse) return duplicateResponse;

    if (error?.name === "ValidationError") {
      return sendMongooseValidationError(res, error);
    }

    throw error;
  }

  await populateExamAudit(exam);

  return sendSuccess(res, "Typing exam created successfully.", { exam }, 201);
});

/* =========================================================
   GET ALL EXAMS
   GET /exams
========================================================= */

export const getExams = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || {};
  const { page, limit, search, status, language } = query;
  const { skip } = getPagination(query);

  const filter = {};

  if (status) filter.status = status;
  if (language) filter.language = language;

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");

    filter.$or = [{ title: regex }, { slug: regex }, { description: regex }];
  }

  const [exams, total] = await Promise.all([
    TypingExam.find(filter)
      .select(EXAM_SELECT_FIELDS)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    TypingExam.countDocuments(filter),
  ]);

  return sendSuccess(res, "Typing exams fetched successfully.", {
    exams,
    pagination: getPaginationMeta(page, limit, total),
  });
});

/* =========================================================
   GET EXAM BY ID
   GET /exams/:examId
========================================================= */

export const getExamById = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;

  const exam = await TypingExam.findById(examId)
    .select(EXAM_SELECT_FIELDS)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!exam) return notFoundResponse(res, "Typing exam not found.");

  const [
    totalPassages,
    publishedPassages,
    draftPassages,
    archivedPassages,
    totalAttempts,
    inProgressAttempts,
    evaluatedAttempts,
    expiredAttempts,
    abandonedAttempts,
  ] = await Promise.all([
    TypingPassage.countDocuments({ examId }),
    TypingPassage.countDocuments({ examId, status: "published" }),
    TypingPassage.countDocuments({ examId, status: "draft" }),
    TypingPassage.countDocuments({ examId, status: "archived" }),
    TypingAttempt.countDocuments({ examId }),
    TypingAttempt.countDocuments({ examId, status: "in_progress" }),
    TypingAttempt.countDocuments({ examId, status: "evaluated" }),
    TypingAttempt.countDocuments({ examId, status: "expired" }),
    TypingAttempt.countDocuments({ examId, status: "abandoned" }),
  ]);

  return sendSuccess(res, "Typing exam fetched successfully.", {
    exam,
    statistics: {
      passages: {
        total: totalPassages,
        published: publishedPassages,
        draft: draftPassages,
        archived: archivedPassages,
      },
      attempts: {
        total: totalAttempts,
        inProgress: inProgressAttempts,
        evaluated: evaluatedAttempts,
        expired: expiredAttempts,
        abandoned: abandonedAttempts,
      },
    },
  });
});

/* =========================================================
   UPDATE EXAM
   PATCH /exams/:examId
========================================================= */

export const updateExam = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { examId } = req.validatedParams;
  const payload = { ...(req.validatedBody || {}) };

  const exam = await TypingExam.findById(examId);
  if (!exam) return notFoundResponse(res, "Typing exam not found.");

  if (Object.prototype.hasOwnProperty.call(payload, "slug")) {
    payload.slug = String(payload.slug || "")
      .trim()
      .toLowerCase();
  }

  // Lock exam configuration once historical attempts exist.
  const hasAttempts = await TypingAttempt.exists({ examId });

  if (hasAttempts) {
    const changedRestrictedFields = RESTRICTED_EXAM_FIELDS.filter((field) =>
      Object.prototype.hasOwnProperty.call(payload, field),
    );

    if (changedRestrictedFields.length) {
      return conflictResponse(
        res,
        "Exam configuration cannot be changed after attempts have been created.",
        changedRestrictedFields.map((field) => ({
          field,
          message: "This field is locked because attempts already exist.",
        })),
      );
    }
  }

  if (payload.scoring) {
    payload.scoring = mergeScoring(exam.scoring, payload.scoring);
  }

  for (const [field, value] of Object.entries(payload)) {
    exam.set(field, value);
  }

  exam.updatedBy = adminId;

  try {
    await exam.save();
  } catch (error) {
    const duplicateResponse = handleDuplicateKey(res, error, "slug");
    if (duplicateResponse) return duplicateResponse;

    if (error?.name === "ValidationError") {
      return sendMongooseValidationError(res, error);
    }

    throw error;
  }

  await populateExamAudit(exam);

  return sendSuccess(res, "Typing exam updated successfully.", { exam });
});

/* =========================================================
   UPDATE EXAM STATUS
   PATCH /exams/:examId/status
========================================================= */

export const updateExamStatus = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { examId } = req.validatedParams;
  const { status } = req.validatedBody;

  const exam = await TypingExam.findById(examId);
  if (!exam) return notFoundResponse(res, "Typing exam not found.");

  if (exam.status === status) {
    return sendSuccess(res, "Exam already has the requested status.", {
      exam,
    });
  }

  if (status === "published") {
    const publishedPassageCount = await TypingPassage.countDocuments({
      examId,
      language: exam.language,
      status: "published",
    });

    if (publishedPassageCount < 1) {
      return conflictResponse(
        res,
        "Cannot publish an exam without at least one published passage.",
        [
          {
            field: "status",
            message: "Publish at least one matching-language passage first.",
          },
        ],
      );
    }
  }

  if (status === "archived") {
    const activeAttemptExists = await TypingAttempt.exists({
      examId,
      status: "in_progress",
    });

    if (activeAttemptExists) {
      return conflictResponse(
        res,
        "Cannot archive an exam while attempts are in progress.",
      );
    }
  }

  exam.status = status;
  exam.updatedBy = adminId;

  try {
    await exam.save();
  } catch (error) {
    if (error?.name === "ValidationError") {
      return sendMongooseValidationError(res, error);
    }
    throw error;
  }

  await populateExamAudit(exam);

  return sendSuccess(res, "Exam status updated successfully.", { exam });
});

/* =========================================================
   DELETE EXAM
   DELETE /exams/:examId

   Requires MongoDB transactions.
========================================================= */

export const deleteExam = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { examId } = req.validatedParams;
  const session = await mongoose.startSession();

  let deletedPassages = 0;
  let deleted = false;

  try {
    await session.withTransaction(async () => {
      const exam = await TypingExam.findById(examId).session(session);

      if (!exam) {
        const error = new Error("Typing exam not found.");
        error.statusCode = 404;
        throw error;
      }

      const attemptExists = await TypingAttempt.exists({ examId }).session(
        session,
      );

      if (attemptExists) {
        const error = new Error(
          "Cannot delete an exam with existing attempts. Archive it instead.",
        );
        error.statusCode = 409;
        throw error;
      }

      const passageDelete = await TypingPassage.deleteMany(
        { examId },
        { session },
      );

      deletedPassages = passageDelete.deletedCount || 0;

      await TypingExam.deleteOne({ _id: examId }, { session });

      deleted = true;
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return notFoundResponse(res, error.message);
    }

    if (error.statusCode === 409) {
      return conflictResponse(res, error.message);
    }

    throw error;
  } finally {
    await session.endSession();
  }

  if (!deleted) {
    return conflictResponse(res, "Exam could not be deleted.");
  }

  return sendSuccess(
    res,
    "Exam and associated passages deleted successfully.",
    {
      examId,
      deletedPassages,
      deletedBy: adminId,
    },
  );
});
/* =========================================================
   CREATE PASSAGE
   POST /exams/:examId/passages
========================================================= */

export const createPassage = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { examId } = req.validatedParams;
  const payload = req.validatedBody || {};

  const exam = await TypingExam.findById(examId)
    .select("_id language status")
    .lean();

  if (!exam) return notFoundResponse(res, "Typing exam not found.");

  if (exam.status === "archived") {
    return conflictResponse(res, "Cannot add passages to an archived exam.");
  }

  if (payload.language !== exam.language) {
    return badRequestResponse(
      res,
      "Passage language must match the exam language.",
      [
        {
          field: "language",
          message: `This exam requires passages in '${exam.language}'.`,
        },
      ],
    );
  }

  const passage = new TypingPassage({
    ...payload,
    examId,
    createdBy: adminId,
  });

  try {
    await passage.save();
  } catch (error) {
    if (error?.name === "ValidationError") {
      return sendMongooseValidationError(res, error);
    }
    throw error;
  }

  await populatePassageAudit(passage);

  return sendSuccess(res, "Passage created successfully.", { passage }, 201);
});

/* =========================================================
   GET ALL PASSAGES
   GET /exams/:examId/passages
========================================================= */

export const getPassages = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;
  const query = req.validatedQuery || {};

  const { page, limit, search, language, difficulty, status } = query;

  const { skip } = getPagination(query);

  const exam = await TypingExam.findById(examId)
    .select(
      "title slug language durationSeconds targetWpm maximumMarks passingPercentage scoring",
    )
    .lean();

  if (!exam) return notFoundResponse(res, "Typing exam not found.");

  const filter = { examId };

  if (language) filter.language = language;
  if (difficulty) filter.difficulty = difficulty;
  if (status) filter.status = status;

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");

    filter.$or = [{ title: regex }, { content: regex }];
  }

  const [passages, total] = await Promise.all([
    TypingPassage.find(filter)
      .select(PASSAGE_SELECT_FIELDS)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    TypingPassage.countDocuments(filter),
  ]);

  return sendSuccess(res, "Passages fetched successfully.", {
    exam,
    passages,
    pagination: getPaginationMeta(page, limit, total),
  });
});

/* =========================================================
   GET PASSAGE BY ID
   GET /exams/:examId/passages/:passageId
========================================================= */

export const getPassageById = asyncHandler(async (req, res) => {
  const { examId, passageId } = req.validatedParams;

  const [exam, passage] = await Promise.all([
    TypingExam.findById(examId)
      .select(
        "title slug language durationSeconds targetWpm maximumMarks passingPercentage scoring",
      )
      .lean(),

    TypingPassage.findOne({ _id: passageId, examId })
      .select(PASSAGE_SELECT_FIELDS)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean(),
  ]);

  if (!exam) return notFoundResponse(res, "Typing exam not found.");

  if (!passage) {
    return notFoundResponse(res, "Passage not found for the specified exam.");
  }

  return sendSuccess(res, "Passage fetched successfully.", {
    exam,
    passage,
  });
});

/* =========================================================
   UPDATE PASSAGE
   PATCH /exams/:examId/passages/:passageId
========================================================= */

export const updatePassage = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { examId, passageId } = req.validatedParams;
  const payload = req.validatedBody || {};

  const exam = await TypingExam.findById(examId)
    .select("_id language status")
    .lean();

  if (!exam) return notFoundResponse(res, "Typing exam not found.");

  if (exam.status === "archived") {
    return conflictResponse(res, "Cannot update passages of an archived exam.");
  }

  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId,
  });

  if (!passage) {
    return notFoundResponse(res, "Passage not found for the specified exam.");
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, "language") &&
    payload.language !== exam.language
  ) {
    return badRequestResponse(
      res,
      "Passage language must match the exam language.",
      [
        {
          field: "language",
          message: `This exam requires passages in '${exam.language}'.`,
        },
      ],
    );
  }

  // Preserve reference content and language used by historical attempts.
  const attemptExists = await TypingAttempt.exists({ passageId });

  if (
    attemptExists &&
    ["content", "language"].some((field) =>
      Object.prototype.hasOwnProperty.call(payload, field),
    )
  ) {
    return conflictResponse(
      res,
      "Cannot change passage content or language because it is used by existing attempts.",
      [
        {
          field: "content/language",
          message: "Historical passage source data must remain unchanged.",
        },
      ],
    );
  }

  passage.set(payload);
  passage.updatedBy = adminId;

  try {
    await passage.save();
  } catch (error) {
    if (error?.name === "ValidationError") {
      return sendMongooseValidationError(res, error);
    }
    throw error;
  }

  await populatePassageAudit(passage);

  return sendSuccess(res, "Passage updated successfully.", {
    passage,
  });
});

/* =========================================================
   UPDATE PASSAGE STATUS
   PATCH /exams/:examId/passages/:passageId/status
========================================================= */

export const updatePassageStatus = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { examId, passageId } = req.validatedParams;
  const { status } = req.validatedBody;

  const exam = await TypingExam.findById(examId).select("_id status language");

  if (!exam) return notFoundResponse(res, "Typing exam not found.");

  if (exam.status === "archived") {
    return conflictResponse(
      res,
      "Cannot change passage status of an archived exam.",
    );
  }

  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId,
  });

  if (!passage) {
    return notFoundResponse(res, "Passage not found for the specified exam.");
  }

  if (status === "published" && passage.language !== exam.language) {
    return conflictResponse(
      res,
      "Passage language does not match the parent exam language.",
    );
  }

  if (passage.status === status) {
    return sendSuccess(res, "Passage already has the requested status.", {
      passage,
    });
  }

  passage.status = status;
  passage.updatedBy = adminId;

  try {
    await passage.save();
  } catch (error) {
    if (error?.name === "ValidationError") {
      return sendMongooseValidationError(res, error);
    }
    throw error;
  }

  await populatePassageAudit(passage);

  return sendSuccess(res, "Passage status updated successfully.", {
    passage,
  });
});

/* =========================================================
   DELETE PASSAGE
   DELETE /exams/:examId/passages/:passageId
========================================================= */

export const deletePassage = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { examId, passageId } = req.validatedParams;

  const exam = await TypingExam.findById(examId).select("_id status");

  if (!exam) return notFoundResponse(res, "Typing exam not found.");

  if (exam.status === "archived") {
    return conflictResponse(res, "Cannot delete passages of an archived exam.");
  }

  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId,
  });

  if (!passage) {
    return notFoundResponse(res, "Passage not found for the specified exam.");
  }

  const attemptExists = await TypingAttempt.exists({ passageId });

  if (attemptExists) {
    return conflictResponse(
      res,
      "Cannot delete a passage used in existing attempts. Archive it instead.",
    );
  }

  await passage.deleteOne();

  return sendSuccess(res, "Passage deleted successfully.", {
    examId,
    passageId,
    deletedBy: adminId,
  });
});

/* =========================================================
   TYPING DASHBOARD
   GET /dashboard
========================================================= */

export const getTypingDashboard = asyncHandler(async (req, res) => {
  const [
    totalExams,
    publishedExams,
    draftExams,
    archivedExams,
    totalPassages,
    publishedPassages,
    totalAttempts,
    inProgressAttempts,
    evaluatedAttempts,
    expiredAttempts,
    abandonedAttempts,
  ] = await Promise.all([
    TypingExam.countDocuments(),
    TypingExam.countDocuments({ status: "published" }),
    TypingExam.countDocuments({ status: "draft" }),
    TypingExam.countDocuments({ status: "archived" }),

    TypingPassage.countDocuments(),
    TypingPassage.countDocuments({ status: "published" }),

    TypingAttempt.countDocuments(),
    TypingAttempt.countDocuments({ status: "in_progress" }),
    TypingAttempt.countDocuments({ status: "evaluated" }),
    TypingAttempt.countDocuments({ status: "expired" }),
    TypingAttempt.countDocuments({ status: "abandoned" }),
  ]);

  return sendSuccess(res, "Dashboard fetched successfully.", {
    exams: {
      total: totalExams,
      published: publishedExams,
      draft: draftExams,
      archived: archivedExams,
    },
    passages: {
      total: totalPassages,
      published: publishedPassages,
    },
    attempts: {
      total: totalAttempts,
      inProgress: inProgressAttempts,
      evaluated: evaluatedAttempts,
      expired: expiredAttempts,
      abandoned: abandonedAttempts,
    },
  });
});
