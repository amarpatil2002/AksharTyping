import mongoose from "mongoose";

import { TypingExam } from "../../../models/typing/TypingExam.js";
import { TypingPassage } from "../../../models/typing/TypingPassage.js";
import { TypingAttempt } from "../../../models/typing/TypingAttempt.js";

import { asyncHandler } from "../../../utils/asyncHandler.js";

// ==========================================
// HELPERS
// ==========================================

const sendSuccess = (res, message, data = null, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    ...(data !== null && { data }),
  });
};

const getPagination = (query) => {
  const page = query.page;
  const limit = query.limit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const getPaginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

// ==========================================
// EXAM CRUD
// ==========================================

// POST /exams
export const createExam = asyncHandler(async (req, res) => {
  const adminId = req.session?.admin?.userId;

  if (!adminId || !mongoose.isValidObjectId(adminId)) {
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

  const exam = await TypingExam.create({
    ...payload,
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

// GET /exams
export const getExams = asyncHandler(async (req, res) => {
  const { page, limit, search, status, language, sort } = req.validatedQuery;

  const { skip } = getPagination(req.validatedQuery);

  // Build filters.
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
      { title: { $regex: escapedSearch, $options: "i" } },
      { slug: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const sortOrder = sort === "asc" ? 1 : -1;

  const [exams, total] = await Promise.all([
    TypingExam.find(filter)
      .select(
        "title slug description language durationSeconds targetWpm scoring instructions status createdBy updatedBy createdAt updatedAt",
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

    TypingExam.countDocuments(filter),
  ]);

  return sendSuccess(res, "Typing exams fetched successfully.", {
    exams,
    pagination: getPaginationMeta(page, limit, total),
  });
});

// GET /exams/:examId
export const getExamById = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;

  const exam = await TypingExam.findById(examId)
    .select(
      "title slug description language durationSeconds targetWpm scoring instructions status createdBy updatedBy createdAt updatedAt",
    )
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

// PATCH /exams/:examId
export const updateExam = asyncHandler(async (req, res) => {
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

  // 2. Find existing exam.
  const exam = await TypingExam.findById(examId);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  // 3. Prevent duplicate slug.
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

  // 4. Check whether attempts already exist.
  const hasAttempts = await TypingAttempt.exists({
    examId,
  });

  // 5. Protect historical exam configuration.
  const restrictedFields = [
    "durationSeconds",
    "targetWpm",
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

  // 6. Apply validated updates.
  for (const [key, value] of Object.entries(payload)) {
    exam.set(key, value);
  }

  exam.updatedBy = adminId;

  // 7. Validate and save.
  await exam.save();

  // 8. Populate audit information.
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

  // 9. Return response.
  return sendSuccess(res, "Typing exam updated successfully.", {
    exam,
  });
});

// PATCH /exams/:examId/status
export const updateExamStatus = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;
  const { status } = req.validatedBody;
  const adminId = req.session?.admin?.userId;

  // 1. Verify admin session.
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

  // 3. Avoid unnecessary database updates.
  if (exam.status === status) {
    return sendSuccess(res, "Exam already has the requested status.", {
      exam,
    });
  }

  // 4. Publishing requires at least one published passage.
  if (status === "published") {
    const publishedPassageExists = await TypingPassage.exists({
      examId,
      status: "published",
    });

    if (!publishedPassageExists) {
      return res.status(409).json({
        success: false,
        message: "Cannot publish an exam without published passages.",
        errors: [
          {
            field: "status",
            message: "Publish at least one passage before publishing the exam.",
          },
        ],
      });
    }
  }

  // 5. Optional: prevent archiving while attempts are active.
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

  // 6. Update exam.
  exam.status = status;
  exam.updatedBy = adminId;

  await exam.save();

  // 7. Populate audit fields.
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

  return sendSuccess(res, "Exam status updated successfully.", {
    exam,
  });
});

// DELETE /exams/:examId
export const deleteExam = asyncHandler(async (req, res) => {
  const { examId } = req.validatedParams;
  const adminId = req.session?.admin?.userId;

  // 1. Verify admin session.
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  // 2. Start transaction.
  const session = await mongoose.startSession();

  try {
    let deletedExam = false;
    let deletedPassages = 0;

    await session.withTransaction(async () => {
      // 3. Find exam.
      const exam = await TypingExam.findById(examId).session(session);

      if (!exam) {
        const error = new Error("Typing exam not found.");
        error.statusCode = 404;
        throw error;
      }

      // 4. Protect historical attempts.
      const attemptExists = await TypingAttempt.exists({
        examId,
      }).session(session);

      if (attemptExists) {
        const error = new Error(
          "Cannot delete an exam with existing attempts. Archive it instead.",
        );

        error.statusCode = 409;
        throw error;
      }

      // 5. Delete associated passages.
      const passageResult = await TypingPassage.deleteMany(
        { examId },
        { session },
      );

      deletedPassages = passageResult.deletedCount;

      // 6. Delete exam.
      await exam.deleteOne({ session });

      deletedExam = true;
    });

    if (!deletedExam) {
      return res.status(409).json({
        success: false,
        message: "Exam deletion could not be completed.",
      });
    }

    // 7. Success response.
    return sendSuccess(
      res,
      "Exam and associated passages deleted successfully.",
      {
        examId,
        deletedPassages,
      },
    );
  } finally {
    await session.endSession();
  }
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

  // 1. Verify exam existence.
  const examExists = await TypingExam.exists({
    _id: examId,
  });

  if (!examExists) {
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
    filter.language = language.toLowerCase();
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

  // 5. Execute database queries concurrently.
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
    passages,
    pagination: getPaginationMeta(page, limit, total),
  });
});

// GET /exams/:examId/passages/:passageId
export const getPassageById = asyncHandler(async (req, res) => {
  const { examId, passageId } = req.validatedParams;

  // 1. Find passage belonging to the requested exam.
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

  // 2. Handle missing passage.
  if (!passage) {
    return res.status(404).json({
      success: false,
      message: "Passage not found for the specified exam.",
    });
  }

  // 3. Return response.
  return sendSuccess(res, "Passage fetched successfully.", {
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
  const { examId, passageId } = req.validatedParams;
  const adminId = req.session?.admin?.userId;

  // 1. Verify admin.
  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  // 2. Verify exam.
  const examExists = await TypingExam.exists({
    _id: examId,
  });

  if (!examExists) {
    return res.status(404).json({
      success: false,
      message: "Typing exam not found.",
    });
  }

  // 3. Find passage belonging to exam.
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

  // 4. Protect historical attempts.
  const attemptExists = await TypingAttempt.exists({
    passageId,
  });

  if (attemptExists) {
    return res.status(409).json({
      success: false,
      message:
        "Cannot delete a passage associated with existing attempts. Archive it instead.",
    });
  }

  // 5. Delete passage.
  await passage.deleteOne();

  return sendSuccess(res, "Passage deleted successfully.", {
    passageId,
    examId,
  });
});

// ==========================================
// USER SIDE PANEL
// ==========================================

// GET /attempts
export const getAttempts = asyncHandler(async (req, res) => {
  const { page, limit, examId, userId, status, from, to, sort } =
    req.validatedQuery;

  const { skip } = getPagination(req.validatedQuery);

  const filter = {};

  if (examId) filter.examId = examId;
  if (userId) filter.userId = userId;
  if (status) filter.status = status;

  if (from || to) {
    filter.createdAt = {};

    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  const [attempts, total] = await Promise.all([
    TypingAttempt.find(filter)
      .select("-typedText -passageSnapshot -timeline -configSnapshot")
      .sort({ createdAt: sort === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .populate("examId", "title slug")
      .populate("passageId", "title difficulty")
      .lean(),

    TypingAttempt.countDocuments(filter),
  ]);

  return sendSuccess(res, "Attempts fetched successfully.", {
    attempts,
    pagination: getPaginationMeta(page, limit, total),
  });
});

// GET /attempts/:attemptId
export const getAttemptById = asyncHandler(async (req, res) => {
  const { attemptId } = req.validatedParams;

  const attempt = await TypingAttempt.findById(attemptId)
    .populate("userId", "name email")
    .populate("examId", "title slug")
    .populate("passageId", "title difficulty")
    .lean();

  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: "Typing attempt not found.",
    });
  }

  return sendSuccess(res, "Attempt fetched successfully.", {
    attempt,
  });
});

// PATCH /attempts/:attemptId/evaluate
export const evaluateAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.validatedParams;

  const { marks, maximumMarks, passed } = req.validatedBody;

  // Only submitted attempts can be manually evaluated.
  const attempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attemptId,
      status: "submitted",
    },
    {
      $set: {
        "result.marks": marks,
        "result.maximumMarks": maximumMarks,
        "result.passed": passed,
        "result.evaluatedAt": new Date(),
        status: "evaluated",
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!attempt) {
    const existing = await TypingAttempt.findById(attemptId).select("status");

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Typing attempt not found.",
      });
    }

    return res.status(409).json({
      success: false,
      message: `Cannot evaluate an attempt with status '${existing.status}'.`,
    });
  }

  return sendSuccess(res, "Attempt evaluated successfully.", {
    attempt,
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
