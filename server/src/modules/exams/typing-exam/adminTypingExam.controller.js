import mongoose from "mongoose";

import TypingExam from "../../../models/typing/TypingExam.js";
import TypingPassage from "../../../models/typing/TypingPassage.js";
import TypingAttempt from "../../../models/typing/TypingAttempt.js";

import asyncHandler from "../../../utils/asyncHandler.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";
import { sendSuccess } from "../../../utils/sendSuccess.js";

// ==========================================
// COMMON HELPERS
// ==========================================

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

const validateAdmin = (adminId) => {
  return adminId && mongoose.isValidObjectId(adminId);
};

const validateWeightedScoring = (scoring) => {
  if (scoring?.method !== "weighted") {
    return null;
  }

  const speedWeight = Number(scoring.speedWeight);
  const accuracyWeight = Number(scoring.accuracyWeight);

  if (
    !Number.isFinite(speedWeight) ||
    !Number.isFinite(accuracyWeight) ||
    Math.abs(speedWeight + accuracyWeight - 100) > 0.001
  ) {
    return "Speed weight and accuracy weight must total 100 for weighted scoring.";
  }

  return null;
};

const getDefaultScoring = (scoring = {}) => ({
  method: scoring.method ?? "standard",
  wordLength: scoring.wordLength ?? 5,
  minimumWpm: scoring.minimumWpm ?? 0,
  minimumAccuracy: scoring.minimumAccuracy ?? 0,
  errorPenalty: scoring.errorPenalty ?? 0,
  speedWeight: scoring.speedWeight ?? 50,
  accuracyWeight: scoring.accuracyWeight ?? 50,
});

// ==========================================
// CREATE EXAM
// POST /exams
// ==========================================

export const createExam = asyncHandler(async (req, res) => {
  const adminId = req.session?.admin?.userId;

  if (!validateAdmin(adminId)) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  const payload = req.validatedBody;

  const existingExam = await TypingExam.exists({
    slug: payload.slug,
  });

  if (existingExam) {
    return res.status(409).json({
      success: false,
      message: "An exam with this slug already exists.",
      errors: [
        {
          field: "slug",
          message: "This slug is already in use.",
        },
      ],
    });
  }

  const scoring = getDefaultScoring(payload.scoring);

  const scoringError = validateWeightedScoring(scoring);

  if (scoringError) {
    return res.status(400).json({
      success: false,
      message: "Invalid scoring configuration.",
      errors: [
        {
          field: "scoring",
          message: scoringError,
        },
      ],
    });
  }

  const exam = await TypingExam.create({
    ...payload,
    language: payload.language ?? "english",
    maximumMarks: payload.maximumMarks ?? 100,
    passingPercentage: payload.passingPercentage ?? 40,
    scoring,
    createdBy: adminId,
  });

  return res.status(201).json({
    success: true,
    message: "Typing exam created successfully.",
    data: {
      exam,
    },
  });
});

// ==========================================
// GET ALL EXAMS
// GET /exams
// ==========================================

export const getExams = asyncHandler(async (req, res) => {
  const { page, limit, search, status, language, sort } = req.validatedQuery;

  const { skip } = getPagination(req.validatedQuery);

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (language) {
    filter.language = language;
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      {
        title: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        slug: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  const sortOrder = sort === "asc" ? 1 : -1;

  const [exams, total] = await Promise.all([
    TypingExam.find(filter)
      .select(EXAM_SELECT_FIELDS)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({
        createdAt: sortOrder,
        _id: sortOrder,
      })
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

// ==========================================
// GET EXAM BY ID
// GET /exams/:examId
// ==========================================

export const getExamById = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;

  const exam = await TypingExam.findById(examId)
    .select(EXAM_SELECT_FIELDS)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  const [
    totalPassages,
    publishedPassages,
    draftPassages,
    archivedPassages,
    totalAttempts,
    inProgressAttempts,
    submittedAttempts,
    evaluatedAttempts,
    expiredAttempts,
  ] = await Promise.all([
    TypingPassage.countDocuments({ examId }),

    TypingPassage.countDocuments({
      examId,
      status: "published",
    }),

    TypingPassage.countDocuments({
      examId,
      status: "draft",
    }),

    TypingPassage.countDocuments({
      examId,
      status: "archived",
    }),

    TypingAttempt.countDocuments({ examId }),

    TypingAttempt.countDocuments({
      examId,
      status: "in_progress",
    }),

    TypingAttempt.countDocuments({
      examId,
      status: "submitted",
    }),

    TypingAttempt.countDocuments({
      examId,
      status: "evaluated",
    }),

    TypingAttempt.countDocuments({
      examId,
      status: "expired",
    }),
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
        submitted: submittedAttempts,
        evaluated: evaluatedAttempts,
        expired: expiredAttempts,
      },
    },
  });
});

// ==========================================
// UPDATE EXAM
// PATCH /exams/:examId
// ==========================================

export const updateExam = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;
  const adminId = req.session?.admin?.userId;
  const payload = req.validatedBody;

  // Validate admin.
  if (!validateAdmin(adminId)) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  // Find existing exam.
  const exam = await TypingExam.findById(examId);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  // Prevent duplicate slug.
  if (payload.slug && payload.slug !== exam.slug) {
    const slugExists = await TypingExam.exists({
      slug: payload.slug,
      _id: { $ne: examId },
    });

    if (slugExists) {
      return res.status(409).json({
        success: false,
        message: "An exam with this slug already exists.",
        errors: [
          {
            field: "slug",
            message: "This slug is already in use.",
          },
        ],
      });
    }
  }

  // Check existing attempts.
  const hasAttempts = await TypingAttempt.exists({
    examId,
  });

  // Protect historical exam configuration.
  const restrictedFields = [
    "durationSeconds",
    "targetWpm",
    "maximumMarks",
    "passingPercentage",
    "scoring",
    "language",
  ];

  if (hasAttempts) {
    const modifiedRestrictedFields = restrictedFields.filter((field) =>
      Object.prototype.hasOwnProperty.call(payload, field),
    );

    if (modifiedRestrictedFields.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Exam configuration cannot be changed after attempts have been created.",

        errors: modifiedRestrictedFields.map((field) => ({
          field,
          message: "This field is locked because exam attempts already exist.",
        })),
      });
    }
  }

  // Prepare updates.
  const updates = { ...payload };

  // Merge nested scoring configuration.
  if (payload.scoring) {
    const existingScoring =
      exam.scoring?.toObject?.() ??
      exam.scoring?.toJSON?.() ??
      exam.scoring ??
      {};

    const mergedScoring = {
      ...existingScoring,
      ...payload.scoring,
    };

    const scoringError = validateWeightedScoring(mergedScoring);

    if (scoringError) {
      return res.status(400).json({
        success: false,
        message: "Invalid scoring configuration.",
        errors: [
          {
            field: "scoring",
            message: scoringError,
          },
        ],
      });
    }

    updates.scoring = mergedScoring;
  }

  // Apply updates.
  for (const [key, value] of Object.entries(updates)) {
    exam.set(key, value);
  }

  exam.updatedBy = adminId;

  await exam.save();

  await exam.populate([
    {
      path: "createdBy",
      select: "name email",
    },
    {
      path: "updatedBy",
      select: "name email",
    },
  ]);

  return sendSuccess(res, "Typing exam updated successfully.", {
    exam,
  });
});

// ==========================================
// UPDATE EXAM STATUS
// PATCH /exams/:examId/status
// ==========================================

export const updateExamStatus = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;
  const { status } = req.validatedBody;
  const adminId = req.session?.admin?.userId;

  // 1. Validate admin.
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  // 2. Find exam.
  const exam = await TypingExam.findById(examId);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  // 3. Avoid unnecessary updates.
  if (exam.status === status) {
    return sendSuccess(res, "Exam already has the requested status.", { exam });
  }

  // 4. Publishing requires at least one passage.
  if (status === "published") {
    const passageCount = await TypingPassage.countDocuments({
      examId,
      status: { $in: ["draft", "published"] },
    });

    if (passageCount === 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot publish an exam without passages.",
        errors: [
          {
            field: "status",
            message: "Create at least one passage before publishing the exam.",
          },
        ],
      });
    }
  }

  // 5. Prevent archiving while attempts are active.
  if (status === "archived") {
    const activeAttemptExists = await TypingAttempt.exists({
      examId,
      status: "in_progress",
    });

    if (activeAttemptExists) {
      return res.status(409).json({
        success: false,
        message: "Cannot archive an exam while attempts are in progress.",
      });
    }
  }

  // 6. Update exam status.
  exam.status = status;
  exam.updatedBy = adminId;

  await exam.save();

  // 7. Populate audit information.
  await exam.populate([
    {
      path: "createdBy",
      select: "name email",
    },
    {
      path: "updatedBy",
      select: "name email",
    },
  ]);

  // 8. Return response.
  return sendSuccess(res, "Exam status updated successfully.", { exam });
});

// ==========================================
// DELETE EXAM
// DELETE /exams/:examId
// ==========================================

export const deleteExam = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;
  const adminId = req.session?.admin?.userId;

  // 1. Validate admin.
  if (!validateAdmin(adminId)) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  // 2. Find exam.
  const exam = await TypingExam.findById(examId);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  // 3. Protect historical attempts.
  const attemptExists = await TypingAttempt.exists({
    examId,
  });

  if (attemptExists) {
    return res.status(409).json({
      success: false,
      message:
        "Cannot delete an exam with existing attempts. Archive it instead.",
    });
  }

  // 4. Delete associated passages.
  const passageResult = await TypingPassage.deleteMany({
    examId,
  });

  const deletedPassages = passageResult.deletedCount ?? 0;

  // 5. Delete exam.
  await exam.deleteOne();

  // 6. Return success.
  return sendSuccess(
    res,
    "Exam and associated passages deleted successfully.",
    {
      examId,
      deletedPassages,
    },
  );
});

// ==========================================
// PASSAGE CRUD
// ==========================================

// POST /exams/:examId/passages
export const createPassage = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;
  const adminId = req.session?.admin?.userId;
  const payload = req.validatedBody;

  // 1. Validate admin identity.
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  // 2. Find associated exam.
  const exam = await TypingExam.findById(examId)
    .select("_id title language status")
    .lean();

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  // 3. Prevent modifications to archived exams.
  if (exam.status === "archived") {
    return res.status(409).json({
      success: false,
      message: "Cannot add passages to an archived exam.",
    });
  }

  // 4. Ensure passage language matches exam language.
  if (payload.language.toLowerCase() !== exam.language.toLowerCase()) {
    return res.status(400).json({
      success: false,
      message: "Passage language must match the exam language.",
      errors: [
        {
          field: "language",
          message: `This exam requires passages in '${exam.language}'.`,
        },
      ],
    });
  }

  // 5. Create passage.
  const passage = await TypingPassage.create({
    ...payload,
    examId,
    createdBy: adminId,
  });

  // 6. Return populated result.
  await passage.populate([
    {
      path: "createdBy",
      select: "name email",
    },
  ]);

  return sendSuccess(res, "Passage created successfully.", { passage }, 201);
});

// GET /exams/:examId/passages
export const getPassages = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;

  const { page, limit, search, language, difficulty, status, sort } =
    req.validatedQuery;

  const { skip } = getPagination(req.validatedQuery);

  // 1. Fetch exam and its scoring configuration.
  const exam = await TypingExam.findById(examId)
    .select(
      "title slug language durationSeconds targetWpm maximumMarks passingPercentage scoring",
    )
    .lean();

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  // 2. Build filters.
  const filter = {
    examId,
  };

  if (language) {
    filter.language = language;
  }

  if (difficulty) {
    filter.difficulty = difficulty;
  }

  if (status) {
    filter.status = status;
  }

  // 3. Safe search.
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const searchRegex = new RegExp(escapedSearch, "i");

    filter.$or = [{ title: searchRegex }, { content: searchRegex }];
  }

  // 4. Sorting.
  const sortOrder = sort === "asc" ? 1 : -1;

  // 5. Execute queries concurrently.
  const [passages, total] = await Promise.all([
    TypingPassage.find(filter)
      .select(
        "examId title language content wordCount difficulty status createdBy updatedBy createdAt updatedAt",
      )
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({
        createdAt: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    TypingPassage.countDocuments(filter),
  ]);

  // 6. Return response.
  return sendSuccess(res, "Passages fetched successfully.", {
    exam,
    passages,
    pagination: getPaginationMeta(page, limit, total),
  });
});

// GET /exams/:examId/passages/:passageId
export const getPassageById = asyncHandler(async (req, res) => {
  const { examId, passageId } = req.validatedParams;

  // 1. Fetch exam and scoring configuration.
  const exam = await TypingExam.findById(examId)
    .select(
      "title slug language durationSeconds targetWpm maximumMarks passingPercentage scoring",
    )
    .lean();

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  // 2. Find passage belonging to the requested exam.
  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId,
  })
    .select(
      "examId title language content wordCount difficulty status createdBy updatedBy createdAt updatedAt",
    )
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .lean();

  // 3. Handle missing passage.
  if (!passage) {
    return res.status(404).json({
      success: false,
      message: "Passage not found for the specified exam.",
    });
  }

  // 4. Return response.
  return sendSuccess(res, "Passage fetched successfully.", {
    exam,
    passage,
  });
});

// PATCH /exams/:examId/passages/:passageId
export const updatePassage = asyncHandler(async (req, res) => {
  const { examId, passageId } = req.validatedParams;
  const adminId = req.session?.admin?.userId;
  const payload = req.validatedBody;

  // 1. Verify admin.
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  // 2. Find exam.
  const exam = await TypingExam.findById(examId)
    .select("_id language status")
    .lean();

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  // 3. Prevent modification of archived exams.
  if (exam.status === "archived") {
    return res.status(409).json({
      success: false,
      message: "Cannot update passages of an archived exam.",
    });
  }

  // 4. Find passage belonging to this exam.
  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId,
  });

  if (!passage) {
    return res.status(404).json({
      success: false,
      message: "Passage not found for the specified exam.",
    });
  }

  // 5. Validate passage language.
  if (
    payload.language &&
    payload.language.toLowerCase() !== exam.language.toLowerCase()
  ) {
    return res.status(400).json({
      success: false,
      message: "Passage language must match the exam language.",
      errors: [
        {
          field: "language",
          message: `This exam requires passages in '${exam.language}'.`,
        },
      ],
    });
  }

  // 6. Check whether passage has historical attempts.
  const attemptExists = await TypingAttempt.exists({
    passageId,
  });

  // 7. Protect historical reference text.
  if (attemptExists && Object.hasOwn(payload, "content")) {
    return res.status(409).json({
      success: false,
      message:
        "Cannot modify passage content because it is used in existing attempts.",
      errors: [
        {
          field: "content",
          message: "Historical passage content must remain unchanged.",
        },
      ],
    });
  }

  // 8. Apply validated updates.
  passage.set(payload);

  passage.updatedBy = adminId;

  // 9. Save to trigger Mongoose validation hooks and wordCount calculation.
  await passage.save();

  // 10. Populate audit information.
  await passage.populate([
    {
      path: "createdBy",
      select: "name email",
    },
    {
      path: "updatedBy",
      select: "name email",
    },
  ]);

  return sendSuccess(res, "Passage updated successfully.", {
    passage,
  });
});

// PATCH /exams/:examId/passages/:passageId/status
export const updatePassageStatus = asyncHandler(async (req, res) => {
  const { examId, passageId } = req.validatedParams;
  const { status } = req.validatedBody;
  const adminId = req.session?.admin?.userId;

  // 1. Verify admin.
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  // 2. Find exam.
  const exam = await TypingExam.findById(examId).select("_id status").lean();

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  // 3. Prevent passage management in archived exams.
  if (exam.status === "archived") {
    return res.status(409).json({
      success: false,
      message: "Cannot change passage status of an archived exam.",
    });
  }

  // 4. Find passage.
  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId,
  });

  if (!passage) {
    return res.status(404).json({
      success: false,
      message: "Passage not found for the specified exam.",
    });
  }

  // 5. Avoid unnecessary updates.
  if (passage.status === status) {
    return sendSuccess(res, "Passage already has the requested status.", {
      passage,
    });
  }

  // 6. Update passage.
  passage.status = status;
  passage.updatedBy = adminId;

  await passage.save();

  // 7. Populate audit information.
  await passage.populate([
    {
      path: "createdBy",
      select: "name email",
    },
    {
      path: "updatedBy",
      select: "name email",
    },
  ]);

  return sendSuccess(res, "Passage status updated successfully.", {
    passage,
  });
});

// DELETE /exams/:examId/passages/:passageId
export const deletePassage = asyncHandler(async (req, res) => {
  const adminId = req.session?.admin?.userId;

  if (!validateAdmin(adminId)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Admin access required.",
    });
  }

  const { examId, passageId } = req.validatedParams;

  const exam = await TypingExam.findById(examId).select("_id");

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing examination not found.",
    });
  }

  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId,
  });

  if (!passage) {
    return res.status(404).json({
      success: false,
      message: "Passage not found for this examination.",
    });
  }

  await passage.deleteOne();

  return sendSuccess(res, "Passage deleted successfully.", {
    examId,
    passageId,
  });
});

// ==========================================
// DASHBOARD
// ==========================================

// GET /dashboard
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
    submittedAttempts,
    evaluatedAttempts,
    expiredAttempts,
  ] = await Promise.all([
    TypingExam.countDocuments(),
    TypingExam.countDocuments({ status: "published" }),
    TypingExam.countDocuments({ status: "draft" }),
    TypingExam.countDocuments({ status: "archived" }),

    TypingPassage.countDocuments(),
    TypingPassage.countDocuments({ status: "published" }),

    TypingAttempt.countDocuments(),
    TypingAttempt.countDocuments({ status: "in_progress" }),
    TypingAttempt.countDocuments({ status: "submitted" }),
    TypingAttempt.countDocuments({ status: "evaluated" }),
    TypingAttempt.countDocuments({ status: "expired" }),
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
      submitted: submittedAttempts,
      evaluated: evaluatedAttempts,
      expired: expiredAttempts,
    },
  });
});
