import mongoose from "mongoose";

import TypingPassage from "../../../../models/typing/TypingPassage.js";
import TypingExam from "../../../../models/typing/TypingExam.js";
import TypingAttempt from "../../../../models/typing/TypingAttempt.js";

import asyncHandler from "../../../../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../../../../utils/pagination.js";
import { sendSuccess } from "../../../../utils/sendSuccess.js";

const getAdminId = (req) => req.session?.admin?.userId;

const sendError = (res, status, message, errors) => {
  const body = { success: false, message };
  if (Array.isArray(errors) && errors.length) body.errors = errors;
  return res.status(status).json(body);
};

const notFound = (res, message) => sendError(res, 404, message);
const conflict = (res, message) => sendError(res, 409, message);
const badRequest = (res, message, errors) => sendError(res, 400, message, errors);

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugify = (value) => {
  const slug = String(value || "")
    .normalize("NFC")
    .toLocaleLowerCase("und")
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
  return slug || `passage-${new mongoose.Types.ObjectId().toString()}`;
};

const duplicateKeyResponse = (res, error) => {
  if (error?.code !== 11000) return null;
  const field = Object.keys(error.keyPattern || {})[0] || "slug";
  return conflict(res, `A passage with this ${field} already exists.`);
};

const mongooseValidationResponse = (res, error) => {
  if (error?.name !== "ValidationError") return null;
  const errors = Object.entries(error.errors || {}).map(([field, item]) => ({
    field, message: item.message
  }));
  return badRequest(res, "Database validation failed.", errors);
};

const sortOptions = (sortBy, sortOrder) => {
  const allowed = ["createdAt", "updatedAt", "title", "language", "difficulty"];
  const field = allowed.includes(sortBy) ? sortBy : "createdAt";
  return { [field]: sortOrder === "asc" ? 1 : -1, _id: -1 };
};

/*
 * TypingPassage is a reusable global library record. It is not owned by an
 * individual exam and intentionally has no examId field.
 */
export const createTypingPassage = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return sendError(res, 401, "Admin authentication required.");
  }

  const payload = { ...(req.validatedBody || {}) };
  const baseSlug = slugify(payload.slug || payload.title);
  let slug = baseSlug;
  let suffix = 1;

  while (await TypingPassage.exists({ slug })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const passage = new TypingPassage({
    ...payload,
    slug,
    difficulty: String(payload.difficulty || "MEDIUM").toUpperCase(),
    status: "DRAFT",
    isActive: false,
    createdBy: adminId
  });

  try {
    await passage.save();
  } catch (error) {
    const duplicate = duplicateKeyResponse(res, error);
    if (duplicate) return duplicate;
    const validation = mongooseValidationResponse(res, error);
    if (validation) return validation;
    throw error;
  }

  await passage.populate({ path: "createdBy", select: "name email" });
  return sendSuccess(res, "Typing passage created successfully as DRAFT.", { passage }, 201);
});

export const getTypingPassages = asyncHandler(async (req, res) => {
  const query = req.validatedQuery || {};
  const { page, limit, search, language, difficulty, category, isActive } = query;
  const { skip } = getPagination(query);

  const filter = {};
  if (language) filter.language = language;
  if (difficulty) filter.difficulty = String(difficulty).toUpperCase();
  if (category) filter.category = category;
  if (typeof isActive === "boolean") filter.isActive = isActive;

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: regex }, { slug: regex }, { content: regex }, { category: regex }];
  }

  const [passages, total] = await Promise.all([
    TypingPassage.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort(sortOptions(query.sortBy, query.sortOrder))
      .skip(skip).limit(limit).lean(),
    TypingPassage.countDocuments(filter)
  ]);

  return sendSuccess(res, "Typing passages fetched successfully.", {
    passages,
    pagination: getPaginationMeta(page, limit, total)
  });
});

export const getTypingPassageById = asyncHandler(async (req, res) => {
  const { passageId } = req.validatedParams;
  const passage = await TypingPassage.findById(passageId)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!passage) return notFound(res, "Typing passage not found.");

  const [attemptCount, assignedExamCount] = await Promise.all([
    TypingAttempt.countDocuments({ passageId }),
    TypingExam.countDocuments({ "passageSettings.fixedPassageIds": passageId })
  ]);

  return sendSuccess(res, "Typing passage fetched successfully.", {
    passage,
    usage: { attemptCount, assignedExamCount }
  });
});

export const updateTypingPassage = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return sendError(res, 401, "Admin authentication required.");
  }

  const { passageId } = req.validatedParams;
  const payload = { ...(req.validatedBody || {}) };
  const passage = await TypingPassage.findById(passageId);
  if (!passage) return notFound(res, "Typing passage not found.");

  const attemptsExist = await TypingAttempt.exists({ passageId });
  if (attemptsExist && (Object.hasOwn(payload, "content") || Object.hasOwn(payload, "language"))) {
    return conflict(res, "Passage content and language are locked after the passage has been used in an attempt.");
  }

  if (payload.difficulty) payload.difficulty = String(payload.difficulty).toUpperCase();
  if (payload.title && !Object.hasOwn(payload, "slug")) {
    // Preserve the existing stable slug when only the title changes.
  }
  if (payload.slug) {
    payload.slug = slugify(payload.slug);
    const duplicate = await TypingPassage.exists({ slug: payload.slug, _id: { $ne: passageId } });
    if (duplicate) return conflict(res, "This passage slug is already in use.");
  }

  for (const [field, value] of Object.entries(payload)) passage.set(field, value);
  passage.updatedBy = adminId;

  try {
    await passage.save();
  } catch (error) {
    const duplicate = duplicateKeyResponse(res, error);
    if (duplicate) return duplicate;
    const validation = mongooseValidationResponse(res, error);
    if (validation) return validation;
    throw error;
  }

  await passage.populate({ path: "updatedBy", select: "name email" });
  return sendSuccess(res, "Typing passage updated successfully.", { passage });
});

export const publishTypingPassage = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return sendError(res, 401, "Admin authentication required.");
  }

  const { passageId } = req.validatedParams;
  const passage = await TypingPassage.findById(passageId);
  if (!passage) return notFound(res, "Typing passage not found.");

  passage.status = "PUBLISHED";
  passage.isActive = true;
  passage.updatedBy = adminId;

  try {
    await passage.save();
  } catch (error) {
    const validation = mongooseValidationResponse(res, error);
    if (validation) return validation;
    throw error;
  }

  return sendSuccess(res, "Typing passage published successfully.", { passage });
});

export const archiveTypingPassage = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return sendError(res, 401, "Admin authentication required.");
  }

  const { passageId } = req.validatedParams;
  const passage = await TypingPassage.findById(passageId);
  if (!passage) return notFound(res, "Typing passage not found.");

  passage.status = "ARCHIVED";
  passage.isActive = false;
  passage.updatedBy = adminId;
  await passage.save();

  return sendSuccess(res, "Typing passage archived successfully.", { passage });
});

export const deleteTypingPassage = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return sendError(res, 401, "Admin authentication required.");
  }

  const { passageId } = req.validatedParams;
  const passage = await TypingPassage.findById(passageId);
  if (!passage) return notFound(res, "Typing passage not found.");

  const [attemptExists, examUsesPassage] = await Promise.all([
    TypingAttempt.exists({ passageId }),
    TypingExam.exists({ "passageSettings.fixedPassageIds": passageId })
  ]);

  if (attemptExists || examUsesPassage) {
    return conflict(res, "Cannot delete a passage used by an attempt or assigned to an exam. Archive it instead.");
  }

  await passage.deleteOne();
  return sendSuccess(res, "Typing passage deleted successfully.", { passageId, deletedBy: adminId });
});
