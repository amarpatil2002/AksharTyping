import mongoose from "mongoose";

import WordExamConfig from "../../../../models/typing/WordExamConfig.js";
import CharacterExamConfig from "../../../../models/typing/CharacterExamConfig.js";
import EvaluationPolicy from "../../../../models/typing/EvaluationPolicy.js";
import HybridExamConfig from "../../../../models/typing/HybridExamConfig.js";
import TypingExam from "../../../../models/typing/TypingExam.js";

import asyncHandler from "../../../../utils/asyncHandler.js";
import { getPaginationMeta } from "../../../../utils/pagination.js";
import { sendSuccess } from "../../../../utils/sendSuccess.js";

// ============================================================
// COMMON HELPERS
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

const conflict = (res, message) =>
  res.status(409).json({
    success: false,
    message,
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

const validateId = (id) => mongoose.isValidObjectId(id);

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const handleWriteError = (res, error) => {
  if (error?.code === 11000) {
    return conflict(res, "A configuration with this version already exists.");
  }

  if (error?.name === "ValidationError") {
    const errors = Object.entries(error.errors || {}).map(([field, item]) => ({
      field,
      message: item.message,
    }));

    return badRequest(res, "Configuration validation failed.", errors);
  }

  if (error?.name === "StrictModeError") {
    return badRequest(res, "Request contains unsupported fields.");
  }

  return null;
};

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  !(value instanceof Date) &&
  !mongoose.isValidObjectId(value);

const deepMerge = (current = {}, incoming = {}) => {
  const output = { ...current };

  for (const [key, value] of Object.entries(incoming)) {
    if (isPlainObject(value) && isPlainObject(output[key])) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = value;
    }
  }

  return output;
};

const getPlainValue = (value) => value?.toObject?.() || value || {};

const getNestedValue = (object, path) =>
  path.split(".").reduce((value, key) => value?.[key], object);

const setNestedValue = (object, path, value) => {
  const keys = path.split(".");
  const lastKey = keys.pop();

  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, object);

  target[lastKey] = value;
};

const sanitizePayload = (body = {}, blockedFields = []) => {
  const payload = { ...body };

  const forbiddenFields = [
    "_id",
    "__v",
    "createdBy",
    "updatedBy",
    "createdAt",
    "updatedAt",
    "version",
    ...blockedFields,
  ];

  for (const field of forbiddenFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      return {
        error: `${field} cannot be changed through this endpoint.`,
      };
    }
  }

  return { payload };
};

const buildPagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const buildSort = (query, allowedFields) => {
  const sortBy = allowedFields.includes(query.sortBy)
    ? query.sortBy
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  return { [sortBy]: sortOrder, _id: 1 };
};

const parseBoolean = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const isPublishedExamFilter = {
  status: { $in: ["PUBLISHED", "published"] },
};

// ============================================================
// REFERENCE CHECKS
// ============================================================

const wordConfigIsReferenced = async (configId) => {
  const [exam, hybrid] = await Promise.all([
    TypingExam.exists({ wordConfigId: configId }),
    HybridExamConfig.exists({ wordConfigId: configId }),
  ]);

  return Boolean(exam || hybrid);
};

const characterConfigIsReferenced = async (configId) => {
  const [exam, hybrid] = await Promise.all([
    TypingExam.exists({ characterConfigId: configId }),
    HybridExamConfig.exists({ characterConfigId: configId }),
  ]);

  return Boolean(exam || hybrid);
};

const evaluationPolicyIsReferenced = async (policyId) =>
  Boolean(
    await TypingExam.exists({
      evaluationPolicyId: policyId,
    }),
  );

const wordConfigHasPublishedUse = async (configId) => {
  const directExam = await TypingExam.exists({
    wordConfigId: configId,
    ...isPublishedExamFilter,
  });

  if (directExam) return true;

  const hybridConfigs = await HybridExamConfig.find({
    wordConfigId: configId,
  })
    .select("_id")
    .lean();

  if (!hybridConfigs.length) return false;

  return Boolean(
    await TypingExam.exists({
      hybridConfigId: {
        $in: hybridConfigs.map((item) => item._id),
      },
      ...isPublishedExamFilter,
    }),
  );
};

const characterConfigHasPublishedUse = async (configId) => {
  const directExam = await TypingExam.exists({
    characterConfigId: configId,
    ...isPublishedExamFilter,
  });

  if (directExam) return true;

  const hybridConfigs = await HybridExamConfig.find({
    characterConfigId: configId,
  })
    .select("_id")
    .lean();

  if (!hybridConfigs.length) return false;

  return Boolean(
    await TypingExam.exists({
      hybridConfigId: {
        $in: hybridConfigs.map((item) => item._id),
      },
      ...isPublishedExamFilter,
    }),
  );
};

const evaluationPolicyHasPublishedUse = async (policyId) =>
  Boolean(
    await TypingExam.exists({
      evaluationPolicyId: policyId,
      ...isPublishedExamFilter,
    }),
  );

// ============================================================
// COMMON CONFIGURATION CONTROLLER FACTORY
// ============================================================

const createConfigHandlers = ({
  Model,
  resourceName,
  idParam,
  listKey,
  searchFields = [],
  sortFields = [],
  nestedFields = [],
  referenceCheck,
  publishedUseCheck,
  statusField,
  statusPath = statusField,
  statusValues = [],
}) => {
  const create = asyncHandler(async (req, res) => {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return badRequest(res, "Request body must be an object.");
    }

    const { payload, error } = sanitizePayload(req.body, [statusField]);

    if (error) return badRequest(res, error);

    try {
      const document = await Model.create({
        ...payload,
        createdBy: adminId,
      });

      return sendSuccess(
        res,
        `${resourceName} created successfully.`,
        { [resourceName]: document },
        201,
      );
    } catch (error) {
      const response = handleWriteError(res, error);
      if (response) return response;
      throw error;
    }
  });

  const getAll = asyncHandler(async (req, res) => {
    const { page, limit, skip } = buildPagination(req.query);

    const filter = {};

    const active = parseBoolean(req.query.isActive);

    if (typeof active === "boolean" && statusField === "isActive") {
      filter.isActive = active;
    }

    if (statusField === "status" && req.query.status) {
      if (!statusValues.includes(req.query.status)) {
        return badRequest(res, "Invalid configuration status.");
      }

      filter[statusPath] = req.query.status;
    }

    for (const field of [
      "language",
      "examType",
      "examCode",
      "authority",
      "recruitmentCycle",
    ]) {
      if (req.query[field] !== undefined) {
        filter[field] = req.query[field];
      }
    }

    if (req.query.search) {
      const regex = new RegExp(
        escapeRegex(String(req.query.search).trim()),
        "i",
      );

      filter.$or = searchFields.map((field) => ({
        [field]: regex,
      }));
    }

    const [documents, total] = await Promise.all([
      Model.find(filter)
        .sort(buildSort(req.query, sortFields))
        .skip(skip)
        .limit(limit)
        .lean(),

      Model.countDocuments(filter),
    ]);

    return sendSuccess(res, `${resourceName} list fetched successfully.`, {
      [listKey]: documents,
      pagination: getPaginationMeta(page, limit, total),
    });
  });

  const getById = asyncHandler(async (req, res) => {
    const id = req.params[idParam];

    if (!validateId(id)) {
      return badRequest(res, `Invalid ${idParam}.`);
    }

    const document = await Model.findById(id).lean();

    if (!document) {
      return notFound(res, `${resourceName} not found.`);
    }

    return sendSuccess(res, `${resourceName} fetched successfully.`, {
      [resourceName]: document,
    });
  });

  const update = asyncHandler(async (req, res) => {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    const id = req.params[idParam];

    if (!validateId(id)) {
      return badRequest(res, `Invalid ${idParam}.`);
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body) ||
      !Object.keys(req.body).length
    ) {
      return badRequest(res, "At least one update field is required.");
    }

    const { payload, error } = sanitizePayload(req.body, [statusField]);

    if (error) return badRequest(res, error);

    if (referenceCheck && (await referenceCheck(id))) {
      return conflict(
        res,
        `${resourceName} is already referenced. Create a new version instead of modifying it.`,
      );
    }

    const document = await Model.findById(id);

    if (!document) {
      return notFound(res, `${resourceName} not found.`);
    }

    try {
      const normalFields = { ...payload };

      for (const field of nestedFields) {
        if (normalFields[field]) {
          normalFields[field] = deepMerge(
            getPlainValue(document.get(field)),
            normalFields[field],
          );
        }
      }

      document.set(normalFields);
      document.updatedBy = adminId;

      await document.save();

      return sendSuccess(res, `${resourceName} updated successfully.`, {
        [resourceName]: document,
      });
    } catch (error) {
      const response = handleWriteError(res, error);
      if (response) return response;
      throw error;
    }
  });

  const updateStatus = asyncHandler(async (req, res) => {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    const id = req.params[idParam];

    if (!validateId(id)) {
      return badRequest(res, `Invalid ${idParam}.`);
    }

    if (
      !req.body ||
      Object.keys(req.body).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(req.body, statusField)
    ) {
      return badRequest(res, `Only ${statusField} is allowed in this request.`);
    }

    const newStatus = req.body[statusField];

    if (statusValues && !statusValues.includes(newStatus)) {
      return badRequest(
        res,
        `Invalid ${statusField}. Allowed values: ${statusValues.join(", ")}.`,
      );
    }

    if (statusField === "isActive" && typeof newStatus !== "boolean") {
      return badRequest(res, "isActive must be a boolean.");
    }

    const document = await Model.findById(id);

    if (!document) {
      return notFound(res, `${resourceName} not found.`);
    }

    if (statusField === "isActive" && newStatus === false) {
      if (publishedUseCheck && (await publishedUseCheck(id))) {
        return conflict(
          res,
          `Cannot deactivate ${resourceName} because a published exam uses it.`,
        );
      }
    }

    if (
      statusField === "status" &&
      newStatus === "RETIRED" &&
      publishedUseCheck &&
      (await publishedUseCheck(id))
    ) {
      return conflict(
        res,
        "Cannot retire this policy because a published exam uses it.",
      );
    }

    if (statusField === "status") {
      if (statusPath === "verification.status") {
        if (newStatus === "VERIFIED") {
          const hasSource = document.officialSources?.some(
            (source) => source.title?.trim() && source.url?.trim(),
          );

          if (!hasSource) {
            return badRequest(
              res,
              "Add at least one official source before verifying this policy.",
            );
          }

          setNestedValue(document, "verification.status", "VERIFIED");
          setNestedValue(document, "verification.isOfficial", true);
          setNestedValue(document, "verification.verifiedAt", new Date());
          setNestedValue(document, "verification.verifiedBy", adminId);
        } else {
          setNestedValue(document, "verification.status", newStatus);
          setNestedValue(document, "verification.isOfficial", false);
          setNestedValue(document, "verification.verifiedAt", null);
          setNestedValue(document, "verification.verifiedBy", null);
        }
      } else {
        setNestedValue(document, statusPath, newStatus);
      }
    } else {
      document[statusField] = newStatus;
    }

    document.updatedBy = adminId;

    try {
      await document.save();

      return sendSuccess(res, `${resourceName} status updated successfully.`, {
        [resourceName]: document,
      });
    } catch (error) {
      const response = handleWriteError(res, error);
      if (response) return response;

      throw error;
    }
  });

  const remove = asyncHandler(async (req, res) => {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    const id = req.params[idParam];

    if (!validateId(id)) {
      return badRequest(res, `Invalid ${idParam}.`);
    }

    if (referenceCheck && (await referenceCheck(id))) {
      return conflict(
        res,
        `Cannot delete ${resourceName} because another record references it.`,
      );
    }

    const document = await Model.findByIdAndDelete(id);

    if (!document) {
      return notFound(res, `${resourceName} not found.`);
    }

    return sendSuccess(res, `${resourceName} deleted successfully.`, {
      deletedId: id,
    });
  });

  return {
    create,
    getAll,
    getById,
    update,
    updateStatus,
    remove,
  };
};

// ============================================================
// WORD CONFIG HANDLERS
// ============================================================

const wordHandlers = createConfigHandlers({
  Model: WordExamConfig,
  resourceName: "Word configuration",
  idParam: "configId",
  listKey: "configs",
  searchFields: ["name"],
  sortFields: ["name", "version", "createdAt", "updatedAt"],
  nestedFields: ["target", "counting", "mistakeRules", "qualification"],
  referenceCheck: wordConfigIsReferenced,
  publishedUseCheck: wordConfigHasPublishedUse,
  statusField: "isActive",
});

// ============================================================
// CHARACTER CONFIG HANDLERS
// ============================================================

const characterHandlers = createConfigHandlers({
  Model: CharacterExamConfig,
  resourceName: "Character configuration",
  idParam: "configId",
  listKey: "configs",
  searchFields: ["name"],
  sortFields: ["name", "version", "createdAt", "updatedAt"],
  nestedFields: [
    "target",
    "counting",
    "inputRules",
    "mistakeRules",
    "qualification",
  ],
  referenceCheck: characterConfigIsReferenced,
  publishedUseCheck: characterConfigHasPublishedUse,
  statusField: "isActive",
});

// ============================================================
// EVALUATION POLICY HANDLERS
// ============================================================

const evaluationHandlers = createConfigHandlers({
  Model: EvaluationPolicy,
  resourceName: "Evaluation policy",
  idParam: "policyId",
  listKey: "policies",

  searchFields: [
    "name",
    "examCode",
    "authority",
    "postName",
    "recruitmentCycle",
  ],

  sortFields: [
    "name",
    "examCode",
    "authority",
    "recruitmentCycle",
    "version",
    "createdAt",
    "updatedAt",
  ],

  nestedFields: [
    "measurement",
    "scoring",
    "qualification",
    "inputRequirements",
    "verification",
  ],

  referenceCheck: evaluationPolicyIsReferenced,
  publishedUseCheck: evaluationPolicyHasPublishedUse,

  statusField: "status",
  statusPath: "verification.status",

  statusValues: [
    "DRAFT",
    "PENDING_VERIFICATION",
    "VERIFIED",
    "REJECTED",
    "RETIRED",
  ],
});

// ============================================================
// WORD EXPORTS
// ============================================================

export const createWordConfig = wordHandlers.create;
export const getWordConfigs = wordHandlers.getAll;
export const getWordConfigById = wordHandlers.getById;
export const updateWordConfig = wordHandlers.update;
export const updateWordConfigStatus = wordHandlers.updateStatus;
export const deleteWordConfig = wordHandlers.remove;

// ============================================================
// CHARACTER EXPORTS
// ============================================================

export const createCharacterConfig = characterHandlers.create;
export const getCharacterConfigs = characterHandlers.getAll;
export const getCharacterConfigById = characterHandlers.getById;
export const updateCharacterConfig = characterHandlers.update;
export const updateCharacterConfigStatus = characterHandlers.updateStatus;
export const deleteCharacterConfig = characterHandlers.remove;

// ============================================================
// EVALUATION POLICY EXPORTS
// ============================================================

export const createEvaluationPolicy = evaluationHandlers.create;
export const getEvaluationPolicies = evaluationHandlers.getAll;
export const getEvaluationPolicyById = evaluationHandlers.getById;
export const updateEvaluationPolicy = evaluationHandlers.update;
export const updateEvaluationPolicyStatus = evaluationHandlers.updateStatus;
export const deleteEvaluationPolicy = evaluationHandlers.remove;
