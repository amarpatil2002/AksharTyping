import mongoose from "mongoose";

import LanguageConfig from "../../../../models/typing/LanguageConfig.js";
import TypingExam from "../../../../models/typing/TypingExam.js";

import asyncHandler from "../../../../utils/asyncHandler.js";

import {
  getPagination,
  getPaginationMeta,
} from "../../../../utils/pagination.js";

import { sendSuccess } from "../../../../utils/sendSuccess.js";

// ============================================================
// HELPERS
// ============================================================

const badRequest = (res, message, errors = []) =>
  res.status(400).json({
    success: false,
    message,
    ...(errors.length ? { errors } : {}),
  });

const notFound = (res, message) =>
  res.status(404).json({
    success: false,
    message,
  });

const conflict = (res, message, errors = []) =>
  res.status(409).json({
    success: false,
    message,
    ...(errors.length ? { errors } : {}),
  });

const requireAdmin = (req, res) => {
  const adminId = req.session?.admin?.userId;

  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });

    return null;
  }

  return adminId;
};

const normalizeLanguagePayload = (payload = {}) => {
  const normalized = { ...payload };

  if (normalized.languageCode) {
    normalized.languageCode = String(normalized.languageCode)
      .trim()
      .toUpperCase();
  }

  if (normalized.languageName) {
    normalized.languageName = String(normalized.languageName).trim();
  }

  if (normalized.nativeName) {
    normalized.nativeName = String(normalized.nativeName).trim();
  }

  if (normalized.script) {
    normalized.script = String(normalized.script).trim();
  }

  if (normalized.direction) {
    normalized.direction = String(normalized.direction).toUpperCase();
  }

  if (Array.isArray(normalized.supportedInputMethods)) {
    normalized.supportedInputMethods = [
      ...new Set(normalized.supportedInputMethods),
    ];
  }

  if (Array.isArray(normalized.supportedLayouts)) {
    normalized.supportedLayouts = [
      ...new Set(
        normalized.supportedLayouts.map((item) => String(item).trim()),
      ),
    ];
  }

  return normalized;
};

const sendValidationError = (res, error) => {
  const errors = Object.entries(error.errors || {}).map(([field, item]) => ({
    field,
    message: item.message,
  }));

  return badRequest(
    res,
    "Language validation failed.",
    errors.length ? errors : [{ field: "request", message: error.message }],
  );
};

const handleDuplicateLanguage = (res, error) => {
  if (error?.code !== 11000) return null;

  return conflict(res, "Language code already exists.", [
    {
      field: "languageCode",
      message: "This language code is already registered.",
    },
  ]);
};

// ============================================================
// 1. CREATE LANGUAGE
// POST /language-config
// ============================================================

export const createLanguage = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const payload = normalizeLanguagePayload(req.validatedBody);

  const existingLanguage = await LanguageConfig.findOne({
    languageCode: payload.languageCode,
  }).lean();

  if (existingLanguage) {
    return conflict(res, "Language already exists.");
  }

  const language = new LanguageConfig({
    ...payload,
    isActive: payload.isActive ?? true,
  });

  try {
    await language.save();
  } catch (error) {
    const duplicateResponse = handleDuplicateLanguage(res, error);
    if (duplicateResponse) return duplicateResponse;

    if (error.name === "ValidationError") {
      return sendValidationError(res, error);
    }

    throw error;
  }

  return sendSuccess(res, "Language created successfully.", { language }, 201);
});

// ============================================================
// 2. GET ALL LANGUAGES
// GET /language-config
// ============================================================

export const getLanguages = asyncHandler(async (req, res) => {
  const query = req.validatedQuery;

  const { page, limit, search, isActive, languageCode, direction } = query;

  const { skip } = getPagination(query);

  const filter = {};

  if (typeof isActive === "boolean") {
    filter.isActive = isActive;
  }

  if (languageCode) {
    filter.languageCode = languageCode;
  }

  if (direction) {
    filter.direction = direction;
  }

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    filter.$or = [
      { languageCode: regex },
      { languageName: regex },
      { nativeName: regex },
      { script: regex },
    ];
  }

  const [languages, total] = await Promise.all([
    LanguageConfig.find(filter)
      .sort({ languageName: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    LanguageConfig.countDocuments(filter),
  ]);

  return sendSuccess(res, "Languages fetched successfully.", {
    languages,
    pagination: getPaginationMeta(page, limit, total),
  });
});

// ============================================================
// 3. GET LANGUAGE BY ID
// GET /language-config/:languageId
// ============================================================

export const getLanguageById = asyncHandler(async (req, res) => {
  const { languageId } = req.validatedParams;

  const language = await LanguageConfig.findById(languageId).lean();

  if (!language) {
    return notFound(res, "Language configuration not found.");
  }

  return sendSuccess(res, "Language fetched successfully.", {
    language,
  });
});

// ============================================================
// 4. UPDATE LANGUAGE
// PATCH /language-config/:languageId
// ============================================================

export const updateLanguage = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { languageId } = req.validatedParams;
  const payload = normalizeLanguagePayload(req.validatedBody);

  const language = await LanguageConfig.findById(languageId);

  if (!language) {
    return notFound(res, "Language configuration not found.");
  }

  const hasExams = await TypingExam.exists({
    languageConfigId: languageId,
  });

  if (
    hasExams &&
    ["languageCode", "languageName", "script"].some((field) =>
      Object.prototype.hasOwnProperty.call(payload, field),
    )
  ) {
    return conflict(
      res,
      "Language identity cannot be changed because exams already reference it.",
      [
        {
          field: "languageCode/languageName/script",
          message:
            "Create a separate language configuration instead of changing the identity of a referenced language.",
        },
      ],
    );
  }

  delete payload.isActive;
  delete payload._id;
  delete payload.createdAt;
  delete payload.updatedAt;

  for (const field of ["unicode", "counting"]) {
    if (payload[field]) {
      payload[field] = {
        ...(language[field]?.toObject?.() || language[field] || {}),
        ...payload[field],
      };
    }
  }

  language.set(payload);

  try {
    await language.save();
  } catch (error) {
    const duplicateResponse = handleDuplicateLanguage(res, error);
    if (duplicateResponse) return duplicateResponse;

    if (error.name === "ValidationError") {
      return sendValidationError(res, error);
    }

    throw error;
  }

  return sendSuccess(res, "Language updated successfully.", {
    language,
  });
});

// ============================================================
// 5. ACTIVATE / DEACTIVATE LANGUAGE
// PATCH /language-config/:languageId/status
// ============================================================

export const updateLanguageStatus = asyncHandler(async (req, res) => {
  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  const { languageId } = req.validatedParams;
  const { isActive } = req.validatedBody;

  const language = await LanguageConfig.findById(languageId);

  if (!language) {
    return notFound(res, "Language configuration not found.");
  }

  if (language.isActive === isActive) {
    return sendSuccess(res, "Language already has the requested status.", {
      language,
    });
  }

  if (!isActive) {
    const publishedExamExists = await TypingExam.exists({
      languageConfigId: languageId,
      status: "PUBLISHED",
      isActive: true,
    });

    if (publishedExamExists) {
      return conflict(
        res,
        "Cannot deactivate a language used by published exams.",
      );
    }
  }

  language.isActive = isActive;

  await language.save();

  return sendSuccess(
    res,
    isActive
      ? "Language activated successfully."
      : "Language deactivated successfully.",
    { language },
  );
});
