import mongoose from "mongoose";

import TypingExam from "../../../../models/typing/TypingExam.js";
import TypingPassage from "../../../../models/typing/TypingPassage.js";
import TypingAttempt from "../../../../models/typing/TypingAttempt.js";
import EvaluationPolicy from "../../../../models/typing/EvaluationPolicy.js";

import asyncHandler from "../../../../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../../../../utils/pagination.js";
import { sendSuccess } from "../../../../utils/sendSuccess.js";

/*
 * Admin authentication is enforced by requireAdminSession in the route.
 * This helper supplies the authenticated admin ID for audit fields.
 */
const getAdminId = (req) => req.session?.admin?.userId;

const sendError = (res, status, message, errors) => {
  const body = { success: false, message };
  if (Array.isArray(errors) && errors.length) body.errors = errors;
  return res.status(status).json(body);
};

const notFound = (res, message) => sendError(res, 404, message);
const conflict = (res, message, errors) => sendError(res, 409, message, errors);
const badRequest = (res, message, errors) => sendError(res, 400, message, errors);

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const duplicateKeyResponse = (res, error, fallback = "slug") => {
  if (error?.code !== 11000) return null;
  const field =
    Object.keys(error.keyPattern || {})[0] ||
    Object.keys(error.keyValue || {})[0] ||
    fallback;
  return conflict(res, `A record with this ${field} already exists.`, [
    { field, message: `This ${field} is already in use.` }
  ]);
};

const mongooseValidationResponse = (res, error) => {
  if (error?.name !== "ValidationError") return null;
  const errors = Object.entries(error.errors || {}).map(([field, item]) => ({
    field,
    message: item.message
  }));
  return badRequest(res, "Database validation failed.", errors);
};

const sortOptions = (sortBy, sortOrder, allowed, fallback) => {
  const field = allowed.includes(sortBy) ? sortBy : fallback;
  return { [field]: sortOrder === "asc" ? 1 : -1, _id: -1 };
};

const mergeNested = (document, payload, fields) => {
  for (const field of fields) {
    if (payload[field] && typeof payload[field] === "object" && !Array.isArray(payload[field])) {
      const current = document.get(field)?.toObject?.() ?? document.get(field) ?? {};
      document.set(field, { ...current, ...payload[field] });
      delete payload[field];
    }
  }
};

/*
 * An exam is always created as DRAFT. Publishing is a separate operation
 * which checks the policy and the selected passage library records.
 */
export const createTypingExam = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return sendError(res, 401, "Admin authentication required.");
  }

  const payload = { ...(req.validatedBody || {}) };
  payload.slug = String(payload.slug).trim().toLowerCase();

  const policy = await EvaluationPolicy.findById(payload.evaluationPolicyId).lean();
  if (!policy) return badRequest(res, "Evaluation policy not found.", [
    { field: "evaluationPolicyId", message: "Select an existing evaluation policy." }
  ]);

  if (policy.examType !== payload.examType || policy.language !== payload.language) {
    return badRequest(res, "Evaluation policy does not match the exam.", [
      { field: "evaluationPolicyId", message: "Policy examType and language must match the exam." }
    ]);
  }

  if (policy.status === "RETIRED") {
    return conflict(res, "A retired evaluation policy cannot be assigned to a new exam.");
  }

  const exam = new TypingExam({
    ...payload,
    status: "DRAFT",
    isActive: false,
    createdBy: adminId
  });

  try {
    await exam.save();
  } catch (error) {
    const duplicate = duplicateKeyResponse(res, error, "slug");
    if (duplicate) return duplicate;
    const validation = mongooseValidationResponse(res, error);
    if (validation) return validation;
    throw error;
  }

  await exam.populate([
    { path: "evaluationPolicyId" },
    { path: "createdBy", select: "name email" }
  ]);

  return sendSuccess(res, "Typing exam created successfully as DRAFT.", { exam }, 201);
});

export const getTypingExams = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || {};
  const { page, limit, search, status, language, examType, authority, recruitmentCycle, isActive } = query;
  const { skip } = getPagination(query);

  const filter = {};
  if (status) filter.status = status;
  if (language) filter.language = language;
  if (examType) filter.examType = examType;
  if (authority) filter.authority = new RegExp(escapeRegex(authority), "i");
  if (recruitmentCycle) filter.recruitmentCycle = recruitmentCycle;
  if (typeof isActive === "boolean") filter.isActive = isActive;

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { title: regex }, { slug: regex }, { examCode: regex },
      { authority: regex }, { postName: regex }, { description: regex }
    ];
  }

  const [exams, total] = await Promise.all([
    TypingExam.find(filter)
      .populate("evaluationPolicyId", "name examCode examType language version status")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort(sortOptions(query.sortBy, query.sortOrder, ["createdAt", "updatedAt", "title", "recruitmentCycle"], "createdAt"))
      .skip(skip).limit(limit).lean(),
    TypingExam.countDocuments(filter)
  ]);

  return sendSuccess(res, "Typing exams fetched successfully.", {
    exams,
    pagination: getPaginationMeta(page, limit, total)
  });
});

export const getTypingExamById = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;
  const exam = await TypingExam.findById(examId)
    .populate("evaluationPolicyId")
    .populate("wordConfigId")
    .populate("characterConfigId")
    .populate("hybridConfigId")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!exam) return notFound(res, "Typing exam not found.");

  const passageIds = exam.passageSettings?.fixedPassageIds || [];
  const [passages, totalAttempts] = await Promise.all([
    passageIds.length
      ? TypingPassage.find({ _id: { $in: passageIds } })
          .select("title slug language difficulty status isActive statistics")
          .lean()
      : Promise.resolve([]),
    TypingAttempt.countDocuments({ examId })
  ]);

  return sendSuccess(res, "Typing exam fetched successfully.", {
    exam,
    passages,
    statistics: { totalAttempts, fixedPassageCount: passageIds.length }
  });
});

export const updateTypingExam = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return sendError(res, 401, "Admin authentication required.");
  }

  const { examId } = req.validatedParams;
  const payload = { ...(req.validatedBody || {}) };
  const exam = await TypingExam.findById(examId);
  if (!exam) return notFound(res, "Typing exam not found.");

  const attemptsExist = await TypingAttempt.exists({ examId });
  const lockedFields = [
    "language", "examType", "durationSeconds", "target",
    "wordConfigId", "characterConfigId", "hybridConfigId", "evaluationPolicyId"
  ];
  if (attemptsExist) {
    const attemptedChanges = lockedFields.filter((field) =>
      Object.prototype.hasOwnProperty.call(payload, field)
    );
    if (attemptedChanges.length) {
      return conflict(res, "Exam evaluation settings cannot be changed after attempts exist.",
        attemptedChanges.map((field) => ({
          field, message: "This field is locked to protect historical attempts."
        }))
      );
    }
  }

  if (payload.slug) payload.slug = String(payload.slug).trim().toLowerCase();

  if (payload.evaluationPolicyId) {
    const policy = await EvaluationPolicy.findById(payload.evaluationPolicyId).lean();
    if (!policy) return badRequest(res, "Evaluation policy not found.");
    const nextType = payload.examType || exam.examType;
    const nextLanguage = payload.language || exam.language;
    if (policy.examType !== nextType || policy.language !== nextLanguage) {
      return badRequest(res, "Evaluation policy does not match the exam type and language.");
    }
    if (policy.status === "RETIRED") return conflict(res, "Retired policy cannot be assigned.");
  }

  mergeNested(exam, payload, ["target", "passageSettings", "attemptSettings", "access", "availability"]);
  for (const [field, value] of Object.entries(payload)) exam.set(field, value);
  exam.updatedBy = adminId;

  try {
    await exam.save();
  } catch (error) {
    const duplicate = duplicateKeyResponse(res, error, "slug");
    if (duplicate) return duplicate;
    const validation = mongooseValidationResponse(res, error);
    if (validation) return validation;
    throw error;
  }

  await exam.populate([
    { path: "evaluationPolicyId", select: "name examCode examType language version status" },
    { path: "updatedBy", select: "name email" }
  ]);
  return sendSuccess(res, "Typing exam updated successfully.", { exam });
});

const validateExamReadyToPublish = async (exam) => {
  const policy = await EvaluationPolicy.findById(exam.evaluationPolicyId).lean();
  if (!policy) return "Evaluation policy not found.";
  if (policy.status !== "VERIFIED") return "Only VERIFIED evaluation policies can be used for a published exam.";
  if (policy.examType !== exam.examType || policy.language !== exam.language) {
    return "Evaluation policy exam type and language must match the exam.";
  }

  const settings = exam.passageSettings || {};
  let passageFilter = {
    language: exam.language,
    status: "PUBLISHED",
    isActive: true
  };

  if (settings.selectionMode === "FIXED") {
    const ids = settings.fixedPassageIds || [];
    if (!ids.length) return "Add at least one fixed passage before publishing.";
    passageFilter._id = { $in: ids };
  } else if (Array.isArray(settings.allowedCategories) && settings.allowedCategories.length) {
    passageFilter.category = { $in: settings.allowedCategories };
  }

  const count = await TypingPassage.countDocuments(passageFilter);
  if (!count) return "At least one active, published passage in the exam language is required.";
  if (settings.selectionMode === "FIXED" && count !== settings.fixedPassageIds.length) {
    return "Every fixed passage must be published, active and in the exam language.";
  }
  return null;
};

export const updateTypingExamStatus = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return sendError(res, 401, "Admin authentication required.");
  }

  const { examId } = req.validatedParams;
  const { status } = req.validatedBody;
  const exam = await TypingExam.findById(examId);
  if (!exam) return notFound(res, "Typing exam not found.");

  if (status === "PUBLISHED") {
    const readinessError = await validateExamReadyToPublish(exam);
    if (readinessError) return conflict(res, readinessError);
  }

  if (status === "ARCHIVED") {
    const activeAttempt = await TypingAttempt.exists({
      examId,
      status: { $in: ["IN_PROGRESS", "in_progress", "EVALUATING"] }
    });
    if (activeAttempt) return conflict(res, "Cannot archive an exam while attempts are in progress.");
  }

  exam.status = status;
  exam.isActive = status === "PUBLISHED";
  exam.updatedBy = adminId;
  await exam.save();

  return sendSuccess(res, "Exam status updated successfully.", { exam });
});

export const deleteTypingExam = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return sendError(res, 401, "Admin authentication required.");
  }

  const { examId } = req.validatedParams;
  const exam = await TypingExam.findById(examId);
  if (!exam) return notFound(res, "Typing exam not found.");

  const attemptsExist = await TypingAttempt.exists({ examId });
  if (attemptsExist) {
    return conflict(res, "Cannot delete an exam with attempts. Archive it instead.");
  }

  await exam.deleteOne();
  return sendSuccess(res, "Typing exam deleted successfully.", { examId, deletedBy: adminId });
});
