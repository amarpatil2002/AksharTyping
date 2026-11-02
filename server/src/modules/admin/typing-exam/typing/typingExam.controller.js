import TypingExam from "../../../../models/typing/TypingExam.js";
import WordExamConfig from "../../../../models/typing/WordExamConfig.js";
import CharacterExamConfig from "../../../../models/typing/CharacterExamConfig.js";
import HybridExamConfig from "../../../../models/typing/HybridExamConfig.js";
import EvaluationPolicy from "../../../../models/typing/EvaluationPolicy.js";

import asyncHandler from "../../../../utils/asyncHandler.js";
import { sendSuccess } from "../../../../utils/sendSuccess.js";
import {
  getPagination,
  getPaginationMeta,
} from "../../../../utils/pagination.js";

// ============================================================
// RESPONSE HELPERS
// ============================================================

const badRequestResponse = (res, message, errors = []) =>
  res.status(400).json({
    success: false,
    message,
    ...(errors.length ? { errors } : {}),
  });

const notFoundResponse = (res, message) =>
  res.status(404).json({
    success: false,
    message,
  });

const conflictResponse = (res, message, errors = []) =>
  res.status(409).json({
    success: false,
    message,
    ...(errors.length ? { errors } : {}),
  });

const unauthorizedResponse = (res) =>
  res.status(401).json({
    success: false,
    message: "Admin authentication required.",
  });

// ============================================================
// SEARCH HELPER
// ============================================================

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ============================================================
// ADMIN HELPERS
// ============================================================

const getAdminId = (req) => req.session?.admin?.userId;

const requireAdmin = (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    unauthorizedResponse(res);
    return null;
  }

  return adminId;
};

// ============================================================
// MONGOOSE VALIDATION ERROR
// ============================================================

const sendMongooseValidationError = (res, error) => {
  const errors = Object.entries(error.errors || {}).map(([field, item]) => ({
    field,
    message: item.message,
  }));

  return badRequestResponse(
    res,
    "Exam validation failed.",
    errors.length ? errors : [{ field: "request", message: error.message }],
  );
};

// ============================================================
// DUPLICATE KEY HANDLER
// ============================================================

const handleDuplicateKey = (res, error) => {
  if (error?.code !== 11000) return null;

  const duplicateField =
    Object.keys(error.keyPattern || {})[0] ||
    Object.keys(error.keyValue || {})[0] ||
    "field";

  return conflictResponse(res, `This ${duplicateField} is already in use.`, [
    {
      field: duplicateField,
      message: `A record with this ${duplicateField} already exists.`,
    },
  ]);
};

// ============================================================
// EXAM AUDIT POPULATION
// ============================================================

const populateExamAudit = async (exam) => {
  await exam.populate([
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ]);

  return exam;
};

// ============================================================
// VALIDATE EXAM REFERENCES
// ============================================================

const validateExamReferences = async (payload) => {
  // ----------------------------------------------------------
  // 1. EVALUATION POLICY
  // ----------------------------------------------------------

  const policy = await EvaluationPolicy.findById(
    payload.evaluationPolicyId,
  ).lean();

  if (!policy) {
    return {
      status: 404,
      message: "Evaluation policy not found.",
      errors: [
        {
          field: "evaluationPolicyId",
          message: "Select an existing evaluation policy.",
        },
      ],
    };
  }

  if (policy.status === "RETIRED") {
    return {
      status: 409,
      message: "Retired evaluation policies cannot be assigned.",
      errors: [
        {
          field: "evaluationPolicyId",
          message: "Select a draft or verified evaluation policy.",
        },
      ],
    };
  }

  // Policy must belong to the same recruitment exam.
  const policyMatches =
    policy.examCode === payload.examCode.toUpperCase() &&
    policy.examType === payload.examType &&
    policy.language === payload.language &&
    policy.authority === payload.authority &&
    policy.recruitmentCycle === payload.recruitmentCycle &&
    policy.measurementUnit === payload.target.unit;

  if (!policyMatches) {
    return {
      status: 400,
      message: "Evaluation policy does not match the exam configuration.",
      errors: [
        {
          field: "evaluationPolicyId",
          message:
            "Check exam code, exam type, language, authority, recruitment cycle and measurement unit.",
        },
      ],
    };
  }

  // ----------------------------------------------------------
  // 2. WORD CONFIGURATION
  // ----------------------------------------------------------

  if (payload.examType === "WORD") {
    const wordConfig = await WordExamConfig.findById(
      payload.wordConfigId,
    ).lean();

    if (!wordConfig) {
      return {
        status: 404,
        message: "Word exam configuration not found.",
        errors: [
          {
            field: "wordConfigId",
            message: "Select an existing word configuration.",
          },
        ],
      };
    }

    if (!wordConfig.isActive) {
      return {
        status: 409,
        message: "Word exam configuration is inactive.",
      };
    }

    if (wordConfig.target?.unit !== "WPM") {
      return {
        status: 400,
        message: "Word configuration must use WPM.",
      };
    }
  }

  // ----------------------------------------------------------
  // 3. CHARACTER CONFIGURATION
  // ----------------------------------------------------------

  if (payload.examType === "CHARACTER") {
    const characterConfig = await CharacterExamConfig.findById(
      payload.characterConfigId,
    ).lean();

    if (!characterConfig) {
      return {
        status: 404,
        message: "Character exam configuration not found.",
        errors: [
          {
            field: "characterConfigId",
            message: "Select an existing character configuration.",
          },
        ],
      };
    }

    if (!characterConfig.isActive) {
      return {
        status: 409,
        message: "Character exam configuration is inactive.",
      };
    }

    if (characterConfig.target?.unit !== payload.target.unit) {
      return {
        status: 400,
        message:
          "Character configuration measurement unit does not match exam target.",
      };
    }
  }

  // ----------------------------------------------------------
  // 4. HYBRID CONFIGURATION
  // ----------------------------------------------------------

  if (payload.examType === "HYBRID") {
    const hybridConfig = await HybridExamConfig.findById(
      payload.hybridConfigId,
    ).lean();

    if (!hybridConfig) {
      return {
        status: 404,
        message: "Hybrid exam configuration not found.",
        errors: [
          {
            field: "hybridConfigId",
            message: "Select an existing hybrid configuration.",
          },
        ],
      };
    }

    if (!hybridConfig.isActive) {
      return {
        status: 409,
        message: "Hybrid exam configuration is inactive.",
      };
    }

    const [wordConfig, characterConfig] = await Promise.all([
      WordExamConfig.findById(hybridConfig.wordConfigId)
        .select("_id isActive")
        .lean(),

      CharacterExamConfig.findById(hybridConfig.characterConfigId)
        .select("_id isActive")
        .lean(),
    ]);

    if (!wordConfig || !characterConfig) {
      return {
        status: 400,
        message: "Hybrid configuration has invalid child configurations.",
      };
    }

    if (!wordConfig.isActive || !characterConfig.isActive) {
      return {
        status: 409,
        message:
          "Hybrid configuration contains an inactive child configuration.",
      };
    }
  }

  return null;
};

// ============================================================
// 1. CREATE EXAM
// POST /admin/typing-exams
// ============================================================

export const createExam = asyncHandler(async (req, res) => {
  // ----------------------------------------------------------
  // 1. AUTHENTICATE ADMIN
  // ----------------------------------------------------------

  const adminId = requireAdmin(req, res);
  if (!adminId) return;

  // ----------------------------------------------------------
  // 2. GET VALIDATED REQUEST BODY
  // ----------------------------------------------------------

  const payload = {
    ...(req.validatedBody || {}),
  };

  // Exam must first be created as DRAFT.
  // Publishing is handled by the separate status endpoint.
  if (payload.status && payload.status !== "DRAFT") {
    return badRequestResponse(
      res,
      "New exams must be created in DRAFT status.",
    );
  }

  // ----------------------------------------------------------
  // 3. NORMALIZE SLUG
  // ----------------------------------------------------------

  payload.slug = payload.slug.trim().toLowerCase();

  // ----------------------------------------------------------
  // 4. VALIDATE REFERENCED CONFIGURATIONS AND POLICY
  // ----------------------------------------------------------

  const referenceError = await validateExamReferences(payload);

  if (referenceError) {
    return res.status(referenceError.status).json({
      success: false,
      message: referenceError.message,
      ...(referenceError.errors ? { errors: referenceError.errors } : {}),
    });
  }

  // ----------------------------------------------------------
  // 5. CREATE MONGOOSE DOCUMENT
  // ----------------------------------------------------------

  const exam = new TypingExam({
    ...payload,

    status: "DRAFT",

    createdBy: adminId,
    updatedBy: null,
  });

  // ----------------------------------------------------------
  // 6. SAVE EXAM
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // 7. POPULATE AUDIT FIELDS
  // ----------------------------------------------------------

  await populateExamAudit(exam);

  // ----------------------------------------------------------
  // 8. SUCCESS RESPONSE
  // ----------------------------------------------------------

  return sendSuccess(res, "Typing exam created successfully.", { exam }, 201);
});

/* ============================================================
   2. GET ALL EXAMS
   GET /admin/typing-exams
============================================================ */

export const getExams = asyncHandler(async (req, res) => {
  // ----------------------------------------------------------
  // 1. GET VALIDATED QUERY
  // ----------------------------------------------------------

  const query = req.validatedQuery || {};

  const {
    page,
    limit,
    search,
    examType,
    language,
    authority,
    recruitmentCycle,
    status,
    isActive,
    sortBy,
    sortOrder,
  } = query;

  const { skip } = getPagination(query);

  // ----------------------------------------------------------
  // 2. BUILD FILTER
  // ----------------------------------------------------------

  const filter = {};

  if (examType) {
    filter.examType = examType;
  }

  if (language) {
    filter.language = language;
  }

  if (authority) {
    filter.authority = new RegExp(escapeRegex(authority), "i");
  }

  if (recruitmentCycle) {
    filter.recruitmentCycle = recruitmentCycle;
  }

  if (status) {
    filter.status = status;
  }

  if (typeof isActive === "boolean") {
    filter.isActive = isActive;
  }

  // ----------------------------------------------------------
  // 3. SEARCH
  // ----------------------------------------------------------

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { title: searchRegex },
      { slug: searchRegex },
      { description: searchRegex },
      { examCode: searchRegex },
      { authority: searchRegex },
      { postName: searchRegex },
    ];
  }

  // ----------------------------------------------------------
  // 4. SORTING
  // ----------------------------------------------------------

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "title",
    "examCode",
    "recruitmentCycle",
    "durationSeconds",
    "status",
  ];

  const selectedSortField = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const sort = {
    [selectedSortField]: sortDirection,
    _id: -1,
  };

  // ----------------------------------------------------------
  // 5. FETCH EXAMS AND COUNT
  // ----------------------------------------------------------

  const [exams, total] = await Promise.all([
    TypingExam.find(filter)
      .select(
        [
          "title",
          "slug",
          "description",
          "authority",
          "examCode",
          "postName",
          "recruitmentCycle",
          "examType",
          "language",
          "durationSeconds",
          "target",
          "wordConfigId",
          "characterConfigId",
          "hybridConfigId",
          "evaluationPolicyId",
          "passageSettings",
          "attemptSettings",
          "access",
          "availability",
          "status",
          "isActive",
          "createdBy",
          "updatedBy",
          "publishedAt",
          "createdAt",
          "updatedAt",
        ].join(" "),
      )
      .populate({
        path: "wordConfigId",
        select: "name version target isActive",
      })
      .populate({
        path: "characterConfigId",
        select: "name version target isActive",
      })
      .populate({
        path: "hybridConfigId",
        select: "name version resultCombination isActive",
      })
      .populate({
        path: "evaluationPolicyId",
        select:
          "name examCode examType language authority recruitmentCycle version evaluator measurementUnit status isOfficial",
      })
      .populate({
        path: "createdBy",
        select: "name email",
      })
      .populate({
        path: "updatedBy",
        select: "name email",
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    TypingExam.countDocuments(filter),
  ]);

  // ----------------------------------------------------------
  // 6. RESPONSE
  // ----------------------------------------------------------

  return sendSuccess(res, "Typing exams fetched successfully.", {
    exams,
    pagination: getPaginationMeta(page, limit, total),
    filters: {
      examType: examType || null,
      language: language || null,
      authority: authority || null,
      recruitmentCycle: recruitmentCycle || null,
      status: status || null,
      isActive: isActive ?? null,
      search: search || null,
    },
  });
});

export const getExamById = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const { examId } = req.params;

  const exam = await TypingExam.findById(examId)
    .populate("wordConfigId")
    .populate("characterConfigId")
    .populate("hybridConfigId")
    .populate("evaluationPolicyId")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!exam) {
    return notFoundResponse(res, "Typing exam not found");
  }

  return sendSuccess(res, "Typing exam fetched successfully", {
    exam,
  });
});

export const updateExam = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const { examId } = req.params;
  const payload = req.validatedBody;

  const exam = await TypingExam.findById(examId);

  if (!exam) {
    return notFoundResponse(res, "Typing exam not found");
  }

  if (!["DRAFT", "PAUSED"].includes(exam.status)) {
    return badRequestResponse(res, "Only draft or paused exams can be updated");
  }

  const mergedPayload = {
    ...exam.toObject(),
    ...payload,
    slug: payload.slug ? payload.slug.trim().toLowerCase() : exam.slug,
  };

  const referenceError = await validateExamReferences(mergedPayload);

  if (referenceError) {
    return badRequestResponse(res, referenceError);
  }

  const { createdBy, updatedBy, status, publishedAt, ...updateData } = payload;

  exam.set({
    ...updateData,
    ...(payload.slug && {
      slug: payload.slug.trim().toLowerCase(),
    }),
    updatedBy: adminId,
  });

  try {
    await exam.save();
  } catch (error) {
    if (error.code === 11000) {
      return handleDuplicateKey(res, error);
    }

    if (error.name === "ValidationError") {
      return sendMongooseValidationError(res, error);
    }

    throw error;
  }

  await exam.populate([
    { path: "wordConfigId" },
    { path: "characterConfigId" },
    { path: "hybridConfigId" },
    { path: "evaluationPolicyId" },
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ]);

  return sendSuccess(res, "Typing exam updated successfully", {
    exam,
  });
});

export const updateExamStatus = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const { examId } = req.params;
  const { status } = req.validatedBody;

  const exam = await TypingExam.findById(examId);

  if (!exam) {
    return notFoundResponse(res, "Typing exam not found");
  }

  const allowedTransitions = {
    DRAFT: ["PUBLISHED", "ARCHIVED"],
    PUBLISHED: ["PAUSED", "ARCHIVED"],
    PAUSED: ["PUBLISHED", "ARCHIVED"],
    ARCHIVED: [],
  };

  if (!allowedTransitions[exam.status]?.includes(status)) {
    return badRequestResponse(
      res,
      `Cannot change exam status from ${exam.status} to ${status}`,
    );
  }

  if (status === "PUBLISHED") {
    const referenceError = await validateExamReferences(exam.toObject());

    if (referenceError) {
      return badRequestResponse(res, referenceError);
    }
  }

  exam.status = status;
  exam.updatedBy = adminId;

  try {
    await exam.save();
  } catch (error) {
    if (error.name === "ValidationError") {
      return sendMongooseValidationError(res, error);
    }

    throw error;
  }

  await exam.populate([
    { path: "wordConfigId" },
    { path: "characterConfigId" },
    { path: "hybridConfigId" },
    { path: "evaluationPolicyId" },
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ]);

  return sendSuccess(res, "Exam status updated successfully", {
    exam,
  });
});

export const deleteExam = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const { examId } = req.params;

  const exam = await TypingExam.findById(examId);

  if (!exam) {
    return notFoundResponse(res, "Typing exam not found");
  }

  if (exam.status === "PUBLISHED") {
    return badRequestResponse(
      res,
      "Published exams must be paused or archived before deletion",
    );
  }

  if (!exam.isActive) {
    return badRequestResponse(res, "Exam is already inactive");
  }

  exam.status = "ARCHIVED";
  exam.isActive = false;
  exam.updatedBy = adminId;

  await exam.save();

  return sendSuccess(res, "Exam deleted successfully", {
    examId: exam._id,
    status: exam.status,
    isActive: exam.isActive,
  });
});

export const createTypingPassage = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const payload = req.validatedBody;
  const content = payload.content.trim();

  const wordCount = content.split(/\s+/u).filter(Boolean).length;

  const segmenter = new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  });

  const characterCount = [...segmenter.segment(content)].length;

  const passage = await TypingPassage.create({
    ...payload,
    content,
    wordCount,
    characterCount,
    createdBy: adminId,
    updatedBy: null,
  });

  return sendSuccess(
    res,
    "Typing passage created successfully",
    { passage },
    201,
  );
});

export const getTypingPassages = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const query = req.validatedQuery || {};
  const { page, limit, skip } = getPagination(query);

  const filter = {};

  if (query.language) filter.language = query.language;
  if (query.difficulty) filter.difficulty = query.difficulty;
  if (query.category) filter.category = query.category;

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.search?.trim()) {
    const search = new RegExp(escapeRegex(query.search.trim()), "i");

    filter.$or = [
      { title: search },
      { content: search },
      { category: search },
      { tags: search },
    ];
  }

  const [passages, total] = await Promise.all([
    TypingPassage.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    TypingPassage.countDocuments(filter),
  ]);

  return sendSuccess(res, "Typing passages fetched successfully", {
    passages,
    pagination: getPaginationMeta(page, limit, total),
  });
});

export const getTypingPassageById = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const { passageId } = req.params;

  const passage = await TypingPassage.findById(passageId)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!passage) {
    return notFoundResponse(res, "Typing passage not found");
  }

  return sendSuccess(res, "Typing passage fetched successfully", {
    passage,
  });
});

export const updateTypingPassage = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const { passageId } = req.params;
  const payload = req.validatedBody;

  const passage = await TypingPassage.findById(passageId);

  if (!passage) {
    return notFoundResponse(res, "Typing passage not found");
  }

  const updateData = { ...payload };

  if (payload.content !== undefined) {
    const content = payload.content.trim();

    const wordCount = content.split(/\s+/u).filter(Boolean).length;

    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });

    updateData.content = content;
    updateData.wordCount = wordCount;
    updateData.characterCount = [...segmenter.segment(content)].length;
  }

  passage.set({
    ...updateData,
    updatedBy: adminId,
  });

  await passage.save();

  await passage.populate([
    { path: "createdBy", select: "name email" },
    { path: "updatedBy", select: "name email" },
  ]);

  return sendSuccess(res, "Typing passage updated successfully", {
    passage,
  });
});

export const deleteTypingPassage = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const { passageId } = req.params;

  const passage = await TypingPassage.findById(passageId);

  if (!passage) {
    return notFoundResponse(res, "Typing passage not found");
  }

  if (!passage.isActive) {
    return badRequestResponse(res, "Passage is already inactive");
  }

  passage.isActive = false;
  passage.updatedBy = adminId;

  await passage.save();

  return sendSuccess(res, "Typing passage deleted successfully", {
    passageId: passage._id,
    isActive: passage.isActive,
  });
});

export const updatePassageStatus = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const { passageId } = req.params;
  const { isActive } = req.validatedBody;

  const passage = await TypingPassage.findById(passageId);

  if (!passage) {
    return notFoundResponse(res, "Typing passage not found");
  }

  passage.isActive = isActive;
  passage.updatedBy = adminId;

  await passage.save();

  return sendSuccess(res, "Passage status updated successfully", {
    passageId: passage._id,
    isActive: passage.isActive,
  });
});

export const getExamDashboardStats = asyncHandler(async (req, res) => {
  const adminId = getAdminId(req);

  if (!adminId) {
    return unauthorizedResponse(res);
  }

  const { examId } = req.params;

  const examExists = await TypingExam.exists({ _id: examId });

  if (!examExists) {
    return notFoundResponse(res, "Typing exam not found");
  }

  const [totalAttempts, stats] = await Promise.all([
    TypingAttempt.countDocuments({ examId }),

    TypingAttempt.aggregate([
      { $match: { examId: new mongoose.Types.ObjectId(examId) } },
      {
        $group: {
          _id: null,

          completed: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] },
          },
          paused: {
            $sum: { $cond: [{ $eq: ["$status", "PAUSED"] }, 1, 0] },
          },
          submitted: {
            $sum: { $cond: [{ $eq: ["$status", "SUBMITTED"] }, 1, 0] },
          },
          expired: {
            $sum: { $cond: [{ $eq: ["$status", "EXPIRED"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
          qualified: {
            $sum: {
              $cond: [{ $eq: ["$result.isQualified", true] }, 1, 0],
            },
          },
          averageSpeed: {
            $avg: {
              $cond: [
                { $eq: ["$status", "COMPLETED"] },
                "$result.netSpeed",
                null,
              ],
            },
          },
          averageAccuracy: {
            $avg: {
              $cond: [
                { $eq: ["$status", "COMPLETED"] },
                "$result.accuracy",
                null,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const result = stats[0] || {
    completed: 0,
    inProgress: 0,
    paused: 0,
    submitted: 0,
    expired: 0,
    cancelled: 0,
    qualified: 0,
    averageSpeed: null,
    averageAccuracy: null,
  };

  return sendSuccess(res, "Exam dashboard statistics fetched successfully", {
    totalAttempts,
    ...result,
  });
});
