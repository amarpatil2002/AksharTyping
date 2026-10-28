import mongoose from "mongoose";
import TypingExam from "../../../models/typing/TypingExam.js";
import TypingExamConfig from "../../../models/typing/TypingExamConfig.js";
import TypingAttempt from "../../../models/typing/TypingAttempt.js";
import TypingResult from "../../../models/typing/TypingResult.js";

/* =========================================================
   SHARED HELPERS
========================================================= */

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const getUserId = (req) =>
  req.user?.id ?? req.user?._id ?? req.userId ?? req.session?.userId ?? null;

const isValidId = (id) => mongoose.isValidObjectId(id);

const fail = (res, status, message, details) =>
  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });

const success = (res, message, data, status = 200) =>
  res.status(status).json({
    success: true,
    message,
    data,
  });

const plain = (document) =>
  document?.toObject ? document.toObject() : document;

const parsePagination = (query, defaultLimit = 10) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit),
  );

  return { page, limit };
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object ?? {}, key);

const setPresentFields = (document, source, fields) => {
  for (const field of fields) {
    if (hasOwn(source, field)) {
      document.set(field, source[field]);
    }
  }
};

const requireUserId = (req, res) => {
  const userId = getUserId(req);

  if (!userId || !isValidId(userId)) {
    fail(res, 401, "Authenticated user ID is missing or invalid");
    return null;
  }

  return userId;
};

/**
 * Create a plain, stable copy of a reusable configuration.
 * Database bookkeeping fields are deliberately excluded.
 */
const getConfigSnapshot = (config) => ({
  name: config.name,
  description: config.description,
  language: config.language,
  durationSeconds: config.durationSeconds,
  targetWpm: config.targetWpm,
  examMetadata: config.examMetadata,
  passageSettings: config.passageSettings,
  instructions: config.instructions,
  evaluationRules: config.evaluationRules,
  examInterface: config.examInterface,
  analyticsSettings: config.analyticsSettings,
  examWorkflow: config.examWorkflow,
  version: config.version,
});

/* =========================================================
   CONFIGURATION CONTROLLERS
========================================================= */

/**
 * POST /configs
 *
 * Route middleware must restrict this endpoint to authorized admins.
 */

export const createTypingExamConfig = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  // Whitelist client-editable fields.
  // Never accept system-managed fields from req.body.
  const {
    name,
    description,
    language,
    durationSeconds,
    targetWpm,
    instructions,
    examMetadata,
    passageSettings,
    evaluationRules,
    examInterface,
    analyticsSettings,
    examWorkflow,
  } = req.body;

  const configData = {
    name,
    description,
    language,
    durationSeconds,
    targetWpm,
    instructions,
    examMetadata,
    passageSettings,
    evaluationRules,
    examInterface,
    analyticsSettings,
    examWorkflow,

    // Server-managed fields
    version: 1,
    status: "active",
    createdBy: userId,
    updatedBy: userId,
  };

  // Remove undefined fields so Mongoose defaults can apply.
  for (const key of Object.keys(configData)) {
    if (configData[key] === undefined) {
      delete configData[key];
    }
  }

  const config = await TypingExamConfig.create(configData);

  return success(
    res,
    "Typing exam configuration created successfully",
    config,
    201,
  );
});

/**
 * GET /configs
 *
 * Access policy is enforced by the route.
 * Optional filters: status, language, state, courtName,
 * examCategory, search, page, limit.
 */
export const getTypingExamConfigById = asyncHandler(async (req, res) => {
  const id = req.params.configId;

  const config = await TypingExamConfig.findById(id).lean();

  if (!config) {
    return fail(res, "Typing exam configuration not found", 404);
  }

  return success(
    res,
    "Typing exam configuration retrieved successfully",
    config,
  );
});

export const listTypingExamConfigs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, language, search } = req.query;

  const filter = {};

  if (status) filter.status = status;
  if (language) filter.language = language;

  if (search?.trim()) {
    filter.name = {
      $regex: escapeRegex(search.trim()),
      $options: "i",
    };
  }

  const currentPage = Number(page);
  const pageSize = Number(limit);
  const skip = (currentPage - 1) * pageSize;

  const [items, total] = await Promise.all([
    TypingExamConfig.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),

    TypingExamConfig.countDocuments(filter),
  ]);

  return success(res, "Typing exam configurations retrieved successfully", {
    items,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

/**
 * PATCH /configs/:configId
 *
 * Configuration updates increment the version.
 * Published exams and existing attempts retain their snapshots.
 */

export const updateTypingExamConfig = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.configId;

  if (!isValidId(id)) {
    return fail(res, "Invalid configuration ID", 400);
  }

  const allowedFields = [
    "name",
    "description",
    "language",
    "durationSeconds",
    "targetWpm",
    "instructions",
    "examMetadata",
    "passageSettings",
    "evaluationRules",
    "examInterface",
    "analyticsSettings",
    "examWorkflow",
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (hasOwn(req.body, field)) {
      updateData[field] = req.body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return fail(res, "No valid fields provided for update", 400);
  }

  const config = await TypingExamConfig.findById(id);

  if (!config) {
    return fail(res, "Typing exam configuration not found", 404);
  }

  if (config.status === "archived") {
    return fail(res, "Archived configurations cannot be updated", 409);
  }

  for (const [field, value] of Object.entries(updateData)) {
    config.set(field, value);
  }

  config.version = (config.version || 1) + 1;
  config.updatedBy = userId;

  await config.save();

  return success(res, "Typing exam configuration updated successfully", config);
});

/**
 * POST /configs/:configId/archive
 */
export const archiveTypingExamConfig = asyncHandler(async (req, res) => {
  const { configId } = req.params;
  const userId = requireUserId(req, res);
  if (!userId) return;

  if (!isValidId(configId)) {
    return fail(res, 400, "Invalid configuration ID");
  }

  const config = await TypingExamConfig.findById(configId);

  if (!config) {
    return fail(res, 404, "Configuration not found");
  }

  if (config.status === "archived") {
    return fail(res, 409, "Configuration is already archived");
  }

  config.status = "archived";
  config.updatedBy = userId;

  await config.save();

  return success(res, "Configuration archived successfully", config);
});

/* =========================================================
   TYPING EXAM CONTROLLERS
========================================================= */

/**
 * POST /
 *
 * Creates a draft from an active configuration.
 * Expected body:
 * {
 *   "title": "English Typing Practice",
 *   "description": "Optional description",
 *   "passageText": "Passage text...",
 *   "configId": "MongoDB ObjectId"
 * }
 */

export const createTypingExam = asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const { title, passageText, configId } = req.body;

  if (!isValidId(configId)) {
    return fail(res, 400, "Invalid configuration ID");
  }

  if (typeof title !== "string" || !title.trim()) {
    return fail(res, 400, "Exam title is required");
  }

  if (typeof passageText !== "string" || !passageText.trim()) {
    return fail(res, 400, "Exam passage is required");
  }

  const config = await TypingExamConfig.findOne({
    _id: configId,
    status: "active",
  }).lean();

  if (!config) {
    return fail(res, 404, "Active configuration not found");
  }

  const exam = await TypingExam.create({
    title: title.trim(),
    passageText,
    config: config._id,
    configVersion: config.version,
    configSnapshot: getConfigSnapshot(config),
    status: "draft",
    createdBy: userId,
    updatedBy: userId,
  });

  return success(res, "Typing exam draft created successfully", exam, 201);
});

/**
 * GET /
 *
 * Optional query parameters:
 * page, limit, status, configId, language, state,
 * courtName, examCategory, search
 */
export const listTypingExams = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.configId) {
    if (!isValidId(req.query.configId)) {
      return fail(res, 400, "Invalid configuration ID");
    }

    filter.config = req.query.configId;
  }

  if (req.query.language) {
    filter["configSnapshot.language"] = req.query.language;
  }

  if (req.query.state) {
    filter["configSnapshot.examMetadata.state"] = req.query.state;
  }

  if (req.query.courtName?.trim()) {
    filter["configSnapshot.examMetadata.courtName"] = {
      $regex: escapeRegex(req.query.courtName.trim()),
      $options: "i",
    };
  }

  if (req.query.examCategory) {
    filter["configSnapshot.examMetadata.examCategory"] = req.query.examCategory;
  }

  if (req.query.search?.trim()) {
    filter.title = {
      $regex: escapeRegex(req.query.search.trim()),
      $options: "i",
    };
  }

  const [items, total] = await Promise.all([
    TypingExam.find(filter)
      .select("-passageText")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    TypingExam.countDocuments(filter),
  ]);

  return success(res, "Typing exams retrieved successfully", {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /:id
 *
 * Returns one exam.
 * Access permissions are handled by route middleware.
 */

export const getTypingExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return fail(res, 400, "Invalid exam ID");
  }

  const exam = await TypingExam.findById(id).lean();

  if (!exam) {
    return fail(res, 404, "Typing exam not found");
  }

  return success(res, "Typing exam retrieved successfully", exam);
});

/**
 * PATCH /:id
 *
 * Drafts only.
 *
 * Optional body fields:
 * title, description, passageText, configId
 *
 * Supplying configId explicitly refreshes the draft's configuration
 * version and snapshot from the selected active configuration.
 */
export const updateTypingExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = requireUserId(req, res);
  if (!userId) return;

  if (!isValidId(id)) {
    return fail(res, 400, "Invalid exam ID");
  }

  const allowedFields = ["title", "passageText", "configId"];

  if (!allowedFields.some((field) => hasOwn(req.body, field))) {
    return fail(res, 400, "No valid fields provided for update");
  }

  if (
    hasOwn(req.body, "title") &&
    (typeof req.body.title !== "string" || !req.body.title.trim())
  ) {
    return fail(res, 400, "Exam title cannot be empty");
  }

  if (
    hasOwn(req.body, "passageText") &&
    (typeof req.body.passageText !== "string" || !req.body.passageText.trim())
  ) {
    return fail(res, 400, "Exam passage cannot be empty");
  }

  let config;

  if (hasOwn(req.body, "configId")) {
    if (!isValidId(req.body.configId)) {
      return fail(res, 400, "Invalid configuration ID");
    }

    config = await TypingExamConfig.findOne({
      _id: req.body.configId,
      status: "active",
    });

    if (!config) {
      return fail(res, 404, "Active configuration not found");
    }
  }

  const exam = await TypingExam.findById(id);

  if (!exam) {
    return fail(res, 404, "Typing exam not found");
  }

  if (exam.status !== "draft") {
    return fail(res, 409, "Only draft exams can be updated");
  }

  if (hasOwn(req.body, "title")) {
    exam.title = req.body.title.trim();
  }

  if (hasOwn(req.body, "passageText")) {
    exam.passageText = req.body.passageText;
  }

  if (config) {
    exam.config = config._id;
    exam.configVersion = config.version;
    exam.configSnapshot = getConfigSnapshot(config);
  }

  exam.updatedBy = userId;

  await exam.save();

  return success(res, "Typing exam updated successfully", exam);
});

/**
 * POST /:id/publish
 *
 * Publishes a draft only if its saved configuration version
 * still matches the current active configuration.
 */
export const publishTypingExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = requireUserId(req, res);
  if (!userId) return;

  if (!isValidId(id)) {
    return fail(res, 400, "Invalid exam ID");
  }

  const exam = await TypingExam.findOne({
    _id: id,
    status: "draft",
  });

  if (!exam) {
    const exists = await TypingExam.exists({ _id: id });

    if (!exists) {
      return fail(res, 404, "Typing exam not found");
    }

    return fail(res, 409, "Only draft exams can be published");
  }

  if (typeof exam.passageText !== "string" || !exam.passageText.trim()) {
    return fail(res, 400, "Exam passage is required");
  }

  const config = await TypingExamConfig.findOne({
    _id: exam.config,
    status: "active",
  }).lean();

  if (!config) {
    return fail(
      res,
      409,
      "The associated configuration is unavailable or archived",
    );
  }

  if (Number(config.version) !== Number(exam.configVersion)) {
    return fail(
      res,
      409,
      "Configuration has changed. Update the draft before publishing.",
    );
  }

  const passageSettings = config.passageSettings ?? {};

  if (
    passageSettings.allowParagraphs === false &&
    /\n\s*\n/u.test(exam.passageText.trim())
  ) {
    return fail(res, 400, "Passage cannot contain multiple paragraphs");
  }

  if (
    passageSettings.allowNumbers === false &&
    /\p{N}/u.test(exam.passageText)
  ) {
    return fail(res, 400, "Passage cannot contain numbers");
  }

  if (
    passageSettings.allowPunctuation === false &&
    /[^\p{L}\p{M}\p{N}\s]/u.test(exam.passageText)
  ) {
    return fail(res, 400, "Passage cannot contain punctuation");
  }

  exam.configSnapshot = getConfigSnapshot(config);
  exam.configVersion = config.version;
  exam.status = "published";
  exam.publishedAt = new Date();
  exam.updatedBy = userId;

  await exam.save();

  return success(res, "Typing exam published successfully", exam);
});

/**
 * POST /:id/archive
 *
 * Archiving prevents new attempts when the attempt-start endpoint
 * requires status === "published". Existing attempts retain snapshots.
 */
export const archiveTypingExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = requireUserId(req, res);
  if (!userId) return;

  if (!isValidId(id)) {
    return fail(res, 400, "Invalid exam ID");
  }

  const exam = await TypingExam.findById(id);

  if (!exam) {
    return fail(res, 404, "Typing exam not found");
  }

  if (exam.status === "archived") {
    return fail(res, 409, "Typing exam is already archived");
  }

  exam.status = "archived";
  exam.archivedAt = new Date();
  exam.updatedBy = userId;

  await exam.save();

  return success(res, "Typing exam archived successfully", exam);
});

export const deleteTypingExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = requireUserId(req, res);
  if (!userId) return;

  if (!isValidId(id)) {
    return fail(res, 400, "Invalid exam ID");
  }

  const exam = await TypingExam.findById(id);

  if (!exam) {
    return fail(res, 404, "Typing exam not found");
  }

  if (exam.status === "published") {
    return fail(
      res,
      409,
      "Published exams cannot be permanently deleted. Archive the exam instead.",
    );
  }

  const hasAttempts = await TypingAttempt.exists({
    exam: exam._id,
  });

  if (hasAttempts) {
    return fail(
      res,
      409,
      "This exam has typing attempts and cannot be permanently deleted.",
    );
  }

  await TypingExam.deleteOne({ _id: exam._id });

  return success(res, "Typing exam deleted successfully", {
    id: exam._id,
  });
});
/* =========================================================
   TYPING ATTEMPTS, SCORING AND SUBMISSION
========================================================= */

const countWords = (value = "") =>
  String(value).trim().split(/\s+/u).filter(Boolean).length;

const countCharacters = (value = "") => String(value).length;

const roundTo = (value, places = 2) => {
  const factor = 10 ** places;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const getElapsedSeconds = (startedAt, endedAt = new Date()) =>
  Math.max(
    0,
    Math.floor(
      (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
    ),
  );

const normalizeText = (value, rules = {}) => {
  let result = String(value ?? "").replace(/\r\n?/gu, "\n");

  if (rules.ignoreCase) {
    result = result.toLocaleLowerCase("en-IN");
  }

  if (rules.ignoreRepeatedSpaces) {
    result = result.replace(/[ \t]+/gu, " ");
  }

  return result;
};

/**
 * Character-level comparison using a Levenshtein distance matrix.
 * This provides insertion, deletion and substitution counts.
 *
 * For long passages, consider a tested optimized implementation
 * or a configurable evaluation worker.
 */
const compareTexts = (reference, typed) => {
  const a = Array.from(reference);
  const b = Array.from(typed);

  const rows = a.length + 1;
  const cols = b.length + 1;

  const dp = Array.from({ length: rows }, () => new Uint32Array(cols));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  let i = a.length;
  let j = b.length;
  let insertions = 0;
  let deletions = 0;
  let substitutions = 0;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      a[i - 1] === b[j - 1] &&
      dp[i][j] === dp[i - 1][j - 1]
    ) {
      i -= 1;
      j -= 1;
      continue;
    }

    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      substitutions += 1;
      i -= 1;
      j -= 1;
      continue;
    }

    if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      insertions += 1;
      j -= 1;
      continue;
    }

    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      deletions += 1;
      i -= 1;
      continue;
    }

    // Defensive fallback.
    if (i > 0) {
      deletions += 1;
      i -= 1;
    } else if (j > 0) {
      insertions += 1;
      j -= 1;
    }
  }

  return {
    referenceCharacters: a.length,
    typedCharacters: b.length,
    correctCharacters: Math.max(0, a.length - deletions - substitutions),
    insertions,
    deletions,
    substitutions,
    totalErrors: insertions + deletions + substitutions,
    editDistance: dp[a.length][b.length],
  };
};

const calculateTypingResult = ({
  passageText,
  typedText,
  startedAt,
  submittedAt,
  evaluationRules = {},
}) => {
  const rules = evaluationRules;

  const reference = normalizeText(passageText, rules);
  const typed = normalizeText(typedText, rules);

  const comparison = compareTexts(reference, typed);

  const elapsedSeconds = Math.max(1, getElapsedSeconds(startedAt, submittedAt));

  const elapsedMinutes = elapsedSeconds / 60;
  const wordLength = Math.max(1, Number(rules.wordLength) || 5);

  const referenceWords = countWords(reference);
  const typedWords = countWords(typed);

  const grossWpm = roundTo(typedWords / elapsedMinutes);
  const netWpm = roundTo(
    Math.max(0, grossWpm - comparison.totalErrors / elapsedMinutes),
  );

  const selectedWpm = rules.wpmMethod === "net" ? netWpm : grossWpm;

  const accuracyDenominator =
    rules.accuracyMethod === "typedCharacters"
      ? Math.max(1, comparison.typedCharacters)
      : Math.max(1, comparison.referenceCharacters);

  const accuracy = roundTo(
    (comparison.correctCharacters / accuracyDenominator) * 100,
  );

  const correctWords = Math.max(
    0,
    Math.floor(
      comparison.correctCharacters / wordLength -
        comparison.insertions / wordLength,
    ),
  );

  const maximumMarks = Math.max(0, Number(rules.maximumMarks) || 100);

  const errorPenalty = Math.max(0, Number(rules.errorPenaltyPerError) || 0);

  const marks = roundTo(
    Math.max(0, maximumMarks - comparison.totalErrors * errorPenalty),
  );

  const hasMinimumWpm =
    rules.minimumWpm == null || selectedWpm >= Number(rules.minimumWpm);

  const hasMinimumAccuracy =
    rules.minimumAccuracy == null || accuracy >= Number(rules.minimumAccuracy);

  const hasMaximumErrors =
    rules.maximumErrors == null ||
    comparison.totalErrors <= Number(rules.maximumErrors);

  const errorPercentage =
    comparison.referenceCharacters > 0
      ? (comparison.totalErrors / comparison.referenceCharacters) * 100
      : comparison.totalErrors > 0
        ? 100
        : 0;

  const hasMaximumErrorPercentage =
    rules.maximumErrorPercentage == null ||
    errorPercentage <= Number(rules.maximumErrorPercentage);

  const hasMinimumCorrectWords =
    rules.minimumCorrectWords == null ||
    correctWords >= Number(rules.minimumCorrectWords);

  const hasMinimumCorrectCharacters =
    rules.minimumCorrectCharacters == null ||
    comparison.correctCharacters >= Number(rules.minimumCorrectCharacters);

  const hasPassingMarks =
    rules.passingMarks == null || marks >= Number(rules.passingMarks);

  const checks = [
    hasMinimumWpm,
    hasMinimumAccuracy,
    hasMaximumErrors,
    hasMaximumErrorPercentage,
    hasMinimumCorrectWords,
    hasMinimumCorrectCharacters,
    hasPassingMarks,
  ];

  const mode = rules.passingMode === "any" ? "any" : "all";

  const passed =
    rules.qualificationOnly === true ||
    (mode === "any" ? checks.some(Boolean) : checks.every(Boolean));

  return {
    elapsedSeconds,
    referenceWords,
    typedWords,
    grossWpm,
    netWpm,
    wpm: selectedWpm,
    accuracy,
    correctWords,
    correctCharacters: comparison.correctCharacters,
    referenceCharacters: comparison.referenceCharacters,
    typedCharacters: comparison.typedCharacters,
    insertions: comparison.insertions,
    deletions: comparison.deletions,
    substitutions: comparison.substitutions,
    totalErrors: comparison.totalErrors,
    errorPercentage: roundTo(errorPercentage),
    marks,
    passed,
    evaluation: {
      minimumWpm: hasMinimumWpm,
      minimumAccuracy: hasMinimumAccuracy,
      maximumErrors: hasMaximumErrors,
      maximumErrorPercentage: hasMaximumErrorPercentage,
      minimumCorrectWords: hasMinimumCorrectWords,
      minimumCorrectCharacters: hasMinimumCorrectCharacters,
      passingMarks: hasPassingMarks,
    },
  };
};

/**
 * POST /:id/attempts
 *
 * Starts a candidate attempt.
 * Requires an authenticated user and a published exam.
 */

export const startTypingAttempt = asyncHandler(async (req, res) => {
  const candidateId = requireUserId(req, res);
  if (!candidateId) return;

  const { examId } = req.body;

  if (!isValidId(examId)) {
    return fail(res, 400, "Invalid exam ID");
  }

  const exam = await TypingExam.findOne({
    _id: examId,
    status: "published",
  }).lean();

  if (!exam) {
    const exists = await TypingExam.exists({ _id: examId });

    if (!exists) {
      return fail(res, 404, "Typing exam not found");
    }

    return fail(res, 409, "This exam is not available for typing");
  }

  const config = exam.configSnapshot;

  if (!config) {
    return fail(res, 409, "Published exam configuration snapshot is missing");
  }

  const durationSeconds = Number(config.durationSeconds);

  if (
    !exam.config ||
    !config.name?.trim() ||
    !config.language ||
    !Number.isInteger(config.version) ||
    config.version < 1 ||
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 10 ||
    durationSeconds > 7200 ||
    typeof exam.passageText !== "string" ||
    !exam.passageText.trim()
  ) {
    return fail(res, 409, "Published exam configuration is incomplete");
  }

  if (exam.configVersion !== config.version) {
    return fail(
      res,
      409,
      "Published exam configuration version is inconsistent",
    );
  }

  const startedAt = new Date();

  // Cancel any previous active attempts for this candidate and exam.
  await TypingAttempt.updateMany(
    {
      candidate: candidateId,
      exam: exam._id,
      status: "in_progress",
    },
    {
      $set: {
        status: "cancelled",
        lastActivityAt: startedAt,
      },
    },
  );

  const deadlineAt = new Date(startedAt.getTime() + durationSeconds * 1000);

  const examSnapshot = {
    config: exam.config,
    configVersion: config.version,
    name: config.name,
    description: config.description ?? "",

    language: config.language,
    passageText: exam.passageText,
    durationSeconds,
    targetWpm: config.targetWpm ?? 40,

    instructions: config.instructions ?? [],
    examMetadata: config.examMetadata ?? {},
    passageSettings: config.passageSettings ?? {},
    evaluationRules: config.evaluationRules ?? {},
    examInterface: config.examInterface ?? {},
    analyticsSettings: config.analyticsSettings ?? {},
    examWorkflow: config.examWorkflow,
  };

  const attempt = await TypingAttempt.create({
    candidate: candidateId,
    exam: exam._id,
    examSnapshot,
    status: "in_progress",
    startedAt,
    deadlineAt,
    lastActivityAt: startedAt,
    typedText: "",
    timeline: [],
  });

  return success(
    res,
    "Typing attempt started successfully",
    {
      attemptId: attempt._id,
      examId: attempt.exam,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      serverTime: startedAt,
      durationSeconds,
      passage: {
        language: attempt.examSnapshot.language,
        text: attempt.examSnapshot.passageText,
      },
      instructions: attempt.examSnapshot.instructions,
      examInterface: attempt.examSnapshot.examInterface,
      analyticsSettings: attempt.examSnapshot.analyticsSettings,
      configVersion: attempt.examSnapshot.configVersion,
    },
    201,
  );
});

/**
 * PATCH /attempts/:attemptId/timeline
 *
 * Saves autosave text and optional timeline samples.
 * The validation schema should cap text length and timeline size.
 */

export const saveTypingAttemptTimeline = asyncHandler(async (req, res) => {
  const candidateId = requireUserId(req, res);
  if (!candidateId) return;

  const { attemptId } = req.params;

  if (!isValidId(attemptId)) {
    return fail(res, 400, "Invalid attempt ID");
  }

  const { typedText, metrics } = req.body;

  // Validate fields accepted by this endpoint.
  if (
    typedText !== undefined &&
    (typeof typedText !== "string" || typedText.length > 100000)
  ) {
    return fail(res, 400, "Invalid typed text");
  }

  if (
    metrics !== undefined &&
    (!Array.isArray(metrics) ||
      metrics.length > 1200 ||
      metrics.some(
        (metric) =>
          !metric ||
          !Number.isInteger(metric.elapsedSeconds) ||
          metric.elapsedSeconds < 0,
      ))
  ) {
    return fail(res, 400, "Invalid timeline metrics");
  }

  const now = new Date();

  // Fetch only an attempt owned by the authenticated candidate.
  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    candidate: candidateId,
  });

  if (!attempt) {
    return fail(res, 404, "Attempt not found");
  }

  if (attempt.status !== "in_progress") {
    return fail(res, 409, "Attempt is no longer in progress");
  }

  // The deadline is authoritative and must be enforced server-side.
  if (!attempt.deadlineAt || now >= attempt.deadlineAt) {
    await TypingAttempt.updateOne(
      {
        _id: attempt._id,
        candidate: candidateId,
        status: "in_progress",
        $or: [
          { deadlineAt: null },
          { deadlineAt: { $exists: false } },
          { deadlineAt: { $lte: now } },
        ],
      },
      {
        $set: { status: "expired" },
      },
    );

    return fail(res, 409, "Attempt time has expired");
  }

  const analyticsSettings = attempt.examSnapshot?.analyticsSettings ?? {};

  // Build an update containing only explicitly supplied fields.
  const update = {
    $set: {
      lastActivityAt: now,
      lastSavedAt: now,
    },
  };

  if (typedText !== undefined) {
    update.$set.typedText = typedText;
  }

  if (
    Array.isArray(metrics) &&
    metrics.length > 0 &&
    analyticsSettings.storeKeystrokeTimeline !== false
  ) {
    // Remove duplicate elapsed-second entries within this request.
    const metricsBySecond = new Map();

    for (const metric of metrics) {
      metricsBySecond.set(metric.elapsedSeconds, metric);
    }

    const incomingMetrics = [...metricsBySecond.values()].sort(
      (a, b) => a.elapsedSeconds - b.elapsedSeconds,
    );

    const existingTimeline = Array.isArray(attempt.timeline)
      ? attempt.timeline
      : [];

    const lastElapsedSecond =
      existingTimeline.length > 0
        ? Math.max(...existingTimeline.map((metric) => metric.elapsedSeconds))
        : -1;

    // Ignore metrics already saved by an earlier autosave.
    const newMetrics = incomingMetrics.filter(
      (metric) => metric.elapsedSeconds > lastElapsedSecond,
    );

    if (newMetrics.length > 0) {
      update.$push = {
        timeline: {
          $each: newMetrics,
          $slice: -5000,
        },
      };
    }
  }

  // Conditional update prevents saving if submission, cancellation,
  // expiration, or another lifecycle transition has already occurred.
  const updatedAttempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      candidate: candidateId,
      status: "in_progress",
      deadlineAt: { $gt: now },
      __v: attempt.__v,
    },
    {
      ...update,
      $inc: { __v: 1 },
    },
    {
      new: true,
      runValidators: true,
      projection: {
        _id: 1,
        lastSavedAt: 1,
        deadlineAt: 1,
        status: 1,
      },
    },
  ).lean();

  if (!updatedAttempt) {
    const latestAttempt = await TypingAttempt.findOne({
      _id: attemptId,
      candidate: candidateId,
    })
      .select("status deadlineAt")
      .lean();

    if (!latestAttempt) {
      return fail(res, 404, "Attempt not found");
    }

    if (latestAttempt.status !== "in_progress") {
      return fail(res, 409, "Attempt is no longer in progress");
    }

    if (!latestAttempt.deadlineAt || new Date() >= latestAttempt.deadlineAt) {
      return fail(res, 409, "Attempt time has expired");
    }

    return fail(
      res,
      409,
      "Attempt changed during autosave. Retry with the latest state.",
    );
  }

  return success(res, "Attempt autosaved successfully", {
    attemptId: updatedAttempt._id,
    lastSavedAt: updatedAttempt.lastSavedAt,
    deadlineAt: updatedAttempt.deadlineAt,
  });
});

/**
 * POST /attempts/:attemptId/submit
 *
 * The server computes the result; it never accepts client-supplied
 * WPM, accuracy, error counts, marks or pass/fail values.
 */

const MAX_TYPED_TEXT_LENGTH = 50_000;
const MAX_SUBMISSION_ID_LENGTH = 128;

const buildTrustedExamDetails = (snapshot) => ({
  title: snapshot.title,
  language: snapshot.language,
  configVersion: snapshot.configVersion,
  durationSeconds: snapshot.durationSeconds,
  targetWpm: snapshot.targetWpm ?? null,
  evaluationRules: snapshot.evaluationRules,
});

const isSameSubmission = (attempt, submissionId) =>
  attempt.status === "evaluated" && attempt.submissionId === submissionId;

// Uses your existing helpers/constants:
// requireUserId, isValidId, fail, success,
// MAX_TYPED_TEXT_LENGTH, MAX_SUBMISSION_ID_LENGTH.

const calculateTypingMetrics = ({
  referenceText,
  typedText,
  elapsedSeconds,
  evaluationRules = {},
}) => {
  const wordLength = Math.max(1, Number(evaluationRules.wordLength) || 5);

  const ignoreCase = evaluationRules.ignoreCase === true;
  const countPunctuation = evaluationRules.countPunctuation !== false;

  const normalizeChar = (char) =>
    ignoreCase ? char.toLocaleLowerCase() : char;

  const shouldCount = (char) =>
    countPunctuation || !/[^\p{L}\p{N}\s]/u.test(char);

  const reference = Array.from(referenceText);
  const typed = Array.from(typedText);

  let correctCharacters = 0;
  let incorrectCharacters = 0;
  let missedCharacters = 0;
  let extraCharacters = 0;

  const maxLength = Math.max(reference.length, typed.length);

  for (let i = 0; i < maxLength; i += 1) {
    const expected = reference[i];
    const actual = typed[i];

    if (expected === undefined) {
      if (shouldCount(actual)) extraCharacters += 1;
      continue;
    }

    if (!shouldCount(expected)) continue;

    if (actual === undefined) {
      missedCharacters += 1;
      continue;
    }

    if (!shouldCount(actual)) {
      incorrectCharacters += 1;
      continue;
    }

    if (normalizeChar(expected) === normalizeChar(actual)) {
      correctCharacters += 1;
    } else {
      incorrectCharacters += 1;
    }
  }

  const totalTypedCharacters =
    correctCharacters + incorrectCharacters + extraCharacters;

  const totalErrors = incorrectCharacters + missedCharacters + extraCharacters;

  const accuracy =
    totalTypedCharacters > 0
      ? Number(((correctCharacters / totalTypedCharacters) * 100).toFixed(2))
      : 0;

  const minutes = elapsedSeconds / 60;

  const grossWpm =
    minutes > 0
      ? Number((totalTypedCharacters / wordLength / minutes).toFixed(2))
      : 0;

  const netWpm =
    minutes > 0
      ? Number(
          (
            Math.max(0, totalTypedCharacters - totalErrors) /
            wordLength /
            minutes
          ).toFixed(2),
        )
      : 0;

  return {
    elapsedSeconds,
    totalTypedCharacters,
    correctCharacters,
    incorrectCharacters,
    missedCharacters,
    extraCharacters,
    totalErrors,
    accuracy,
    grossWpm,
    netWpm,
  };
};

const evaluateQualification = ({ metrics, evaluationRules = {} }) => {
  const reasons = [];

  const minimumWpm = Number(evaluationRules.minimumWpm ?? 0);
  const minimumAccuracy = Number(evaluationRules.minimumAccuracy ?? 0);
  const minimumCorrectCharacters = Number(
    evaluationRules.minimumCorrectCharacters ?? 0,
  );
  const minimumCorrectWords = Number(evaluationRules.minimumCorrectWords ?? 0);

  const passedWpm = metrics.netWpm >= minimumWpm;
  const passedAccuracy = metrics.accuracy >= minimumAccuracy;
  const passedCharacters =
    metrics.correctCharacters >= minimumCorrectCharacters;

  // Count contiguous runs of non-whitespace characters as words.
  const correctWords =
    metrics.correctCharacters > 0 ? metrics.correctCharacters : 0;

  // Exact correct-word evaluation requires word-level comparison.
  // Do not claim a word-level pass when only character metrics exist.
  const checks = [];

  if (minimumWpm > 0) {
    checks.push(passedWpm);
    if (!passedWpm) reasons.push("Minimum typing speed not achieved");
  }

  if (minimumAccuracy > 0) {
    checks.push(passedAccuracy);
    if (!passedAccuracy) reasons.push("Minimum accuracy not achieved");
  }

  if (minimumCorrectCharacters > 0) {
    checks.push(passedCharacters);
    if (!passedCharacters) {
      reasons.push("Minimum correct character count not achieved");
    }
  }

  if (minimumCorrectWords > 0) {
    const passedWords = correctWords >= minimumCorrectWords;
    checks.push(passedWords);
    if (!passedWords) reasons.push("Minimum correct word count not achieved");
  }

  const passed =
    checks.length === 0
      ? true
      : evaluationRules.passingMode === "any"
        ? checks.some(Boolean)
        : checks.every(Boolean);

  return {
    passed,
    minimumWpm,
    minimumAccuracy,
    minimumCorrectCharacters,
    minimumCorrectWords,
    reasons,
  };
};

const validateSpeedGraph = (speedGraph, durationSeconds) => {
  if (speedGraph === undefined) return [];

  if (!Array.isArray(speedGraph) || speedGraph.length > 1440) {
    throw new Error("Invalid speed graph");
  }

  let previousElapsed = -1;

  return speedGraph.map((point) => {
    if (
      !point ||
      !Number.isInteger(point.elapsedSeconds) ||
      point.elapsedSeconds < 0 ||
      point.elapsedSeconds > durationSeconds ||
      point.elapsedSeconds <= previousElapsed ||
      typeof point.wpm !== "number" ||
      !Number.isFinite(point.wpm) ||
      point.wpm < 0 ||
      point.wpm > 1000
    ) {
      throw new Error("Invalid speed graph points");
    }

    previousElapsed = point.elapsedSeconds;

    return {
      elapsedSeconds: point.elapsedSeconds,
      wpm: point.wpm,
    };
  });
};

export const submitTypingAttempt = asyncHandler(async (req, res) => {
  const candidateId = requireUserId(req, res);
  if (!candidateId) return;

  const { attemptId } = req.params;
  const { typedText, submissionId, speedGraph = [] } = req.body;

  if (!isValidId(attemptId)) {
    return fail(res, 400, "Invalid attempt ID");
  }

  if (
    typeof typedText !== "string" ||
    typedText.length > MAX_TYPED_TEXT_LENGTH
  ) {
    return fail(res, 400, "Invalid typed text");
  }

  if (
    typeof submissionId !== "string" ||
    !submissionId.trim() ||
    submissionId.length > MAX_SUBMISSION_ID_LENGTH
  ) {
    return fail(res, 400, "Invalid submission ID");
  }

  const normalizedSubmissionId = submissionId.trim();

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    candidate: candidateId,
  });

  if (!attempt) {
    return fail(res, 404, "Typing attempt not found");
  }

  // A completed request may be retried using the same submission ID.
  if (["submitted", "evaluated"].includes(attempt.status)) {
    if (attempt.submissionId !== normalizedSubmissionId) {
      return fail(res, 409, "This attempt has already been submitted");
    }

    const existingResult = attempt.result
      ? await TypingResult.findById(attempt.result).lean()
      : null;

    if (existingResult) {
      return success(res, "Typing attempt already submitted", {
        attemptId: attempt._id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        result: existingResult,
      });
    }

    return fail(
      res,
      409,
      "Submission is being processed. Please retry shortly.",
    );
  }

  if (attempt.status !== "in_progress") {
    return fail(res, 409, "This attempt is no longer in progress");
  }

  const now = new Date();

  if (!attempt.deadlineAt || now >= new Date(attempt.deadlineAt)) {
    await TypingAttempt.updateOne(
      {
        _id: attempt._id,
        candidate: candidateId,
        status: "in_progress",
        deadlineAt: { $lte: now },
      },
      {
        $set: {
          status: "expired",
          lastActivityAt: now,
        },
      },
    );

    return fail(res, 409, "Attempt time has expired");
  }

  const snapshot = attempt.examSnapshot;

  if (
    !snapshot ||
    !snapshot.config ||
    !snapshot.name ||
    !snapshot.passageText ||
    !snapshot.evaluationRules ||
    !Number.isInteger(snapshot.durationSeconds)
  ) {
    return fail(res, 409, "Attempt exam snapshot is incomplete");
  }

  let graph;

  try {
    graph = validateSpeedGraph(speedGraph, snapshot.durationSeconds);
  } catch {
    return fail(res, 400, "Invalid speed graph points");
  }

  // Use server timestamps rather than trusting client-reported duration.
  const elapsedSeconds = Math.max(
    1,
    Math.min(
      snapshot.durationSeconds,
      Math.ceil((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000),
    ),
  );

  const metrics = calculateTypingMetrics({
    referenceText: snapshot.passageText,
    typedText,
    elapsedSeconds,
    evaluationRules: snapshot.evaluationRules,
  });

  const qualification = evaluateQualification({
    metrics,
    evaluationRules: snapshot.evaluationRules,
  });

  const report = {
    summary: {
      grossWpm: metrics.grossWpm,
      netWpm: metrics.netWpm,
      accuracy: metrics.accuracy,
      totalTypedCharacters: metrics.totalTypedCharacters,
      correctCharacters: metrics.correctCharacters,
      incorrectCharacters: metrics.incorrectCharacters,
      missedCharacters: metrics.missedCharacters,
      extraCharacters: metrics.extraCharacters,
      totalErrors: metrics.totalErrors,
      durationSeconds: elapsedSeconds,
    },
    outcome: {
      passed: qualification.passed,
      reasons: qualification.reasons,
    },
    evaluationStrategy: snapshot.evaluationRules.strategy,
    qualification,
    graph: {
      speedTimeline: graph,
    },
    examDetails: {
      name: snapshot.name,
      language: snapshot.language,
      configVersion: snapshot.configVersion,
      durationSeconds: snapshot.durationSeconds,
      targetWpm: snapshot.targetWpm,
    },
    evaluatedAt: now,
    reportVersion: 1,
  };

  // Claim the attempt atomically. A competing request cannot claim it.
  const claimedAttempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      candidate: candidateId,
      status: "in_progress",
      deadlineAt: { $gt: now },
    },
    {
      $set: {
        status: "submitted",
        typedText,
        submissionId: normalizedSubmissionId,
        submittedAt: now,
        lastActivityAt: now,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!claimedAttempt) {
    const latest = await TypingAttempt.findOne({
      _id: attempt._id,
      candidate: candidateId,
    }).lean();

    if (
      latest &&
      ["submitted", "evaluated"].includes(latest.status) &&
      latest.submissionId === normalizedSubmissionId &&
      latest.result
    ) {
      const savedResult = await TypingResult.findById(latest.result).lean();

      if (savedResult) {
        return success(res, "Typing attempt already submitted", {
          attemptId: latest._id,
          status: latest.status,
          submittedAt: latest.submittedAt,
          result: savedResult,
        });
      }
    }

    return fail(
      res,
      409,
      "Attempt was submitted or expired by another request",
    );
  }

  // The result model should enforce a unique index on { attempt: 1 }.
  // This prevents multiple reports from being created for one attempt.
  let savedResult;

  try {
    savedResult = await TypingResult.create({
      attempt: claimedAttempt._id,
      candidate: candidateId,
      exam: claimedAttempt.exam,
      report,
      status: "finalized",
    });
  } catch (error) {
    // Recover if a retry raced with result creation.
    if (error?.code !== 11000) throw error;

    savedResult = await TypingResult.findOne({
      attempt: claimedAttempt._id,
    });
  }

  if (!savedResult) {
    return fail(
      res,
      500,
      "Submission was accepted but the result could not be retrieved",
    );
  }

  const finalizedAttempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: claimedAttempt._id,
      candidate: candidateId,
      status: "submitted",
      submissionId: normalizedSubmissionId,
    },
    {
      $set: {
        result: savedResult._id,
        status: "evaluated",
        evaluatedAt: now,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!finalizedAttempt) {
    return fail(res, 500, "Result was saved but attempt finalization failed");
  }

  return success(
    res,
    "Typing attempt submitted successfully",
    {
      attemptId: finalizedAttempt._id,
      examId: finalizedAttempt.exam,
      status: finalizedAttempt.status,
      submissionId: finalizedAttempt.submissionId,
      submittedAt: finalizedAttempt.submittedAt,
      evaluatedAt: finalizedAttempt.evaluatedAt,
      resultId: savedResult._id,
      result: savedResult,
    },
    200,
  );
});

/**
 * GET /attempts/:attemptId/result
 *
 * A candidate can only retrieve their own result.
 */

export const getTypingAttemptResult = asyncHandler(async (req, res) => {
  const candidateId = requireUserId(req, res);
  if (!candidateId) return;

  const { attemptId } = req.params;

  if (!isValidId(attemptId)) {
    return fail(res, 400, "Invalid attempt ID");
  }

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    candidate: candidateId,
  })
    .select(
      "exam examSnapshot.config examSnapshot.name examSnapshot.language examSnapshot.targetWpm examSnapshot.durationSeconds status startedAt deadlineAt submittedAt evaluatedAt result createdAt updatedAt",
    )
    .lean();

  if (!attempt) {
    return fail(res, 404, "Attempt not found");
  }

  if (!attempt.result) {
    return fail(res, 409, "Attempt result is not available yet");
  }

  const resultDoc = await TypingResult.findOne({
    _id: attempt.result,
    attempt: attempt._id,
    candidate: candidateId,
  }).lean();

  if (!resultDoc) {
    return fail(res, 404, "Typing result not found");
  }

  const report = resultDoc.report;

  if (!report?.summary) {
    return fail(res, 409, "Typing result report is incomplete");
  }

  const summary = report.summary;
  const qualification = report.qualification ?? {};
  const examDetails = report.examDetails ?? {};
  const speedTimeline = report.graph?.speedTimeline ?? [];

  const safeNumber = (value) =>
    Number.isFinite(Number(value)) ? Number(value) : 0;

  const correct = safeNumber(summary.correctCharacters);
  const incorrect = safeNumber(summary.incorrectCharacters);
  const missed = safeNumber(summary.missedCharacters);
  const extra = safeNumber(summary.extraCharacters);
  const grossWpm = safeNumber(summary.grossWpm);
  const netWpm = safeNumber(summary.netWpm);
  const accuracy = safeNumber(summary.accuracy);
  const targetWpm = safeNumber(
    examDetails.targetWpm ?? attempt.examSnapshot?.targetWpm,
  );

  const graphPoints = speedTimeline
    .map((point) => ({
      elapsedSeconds: safeNumber(point.elapsedSeconds),
      wpm: safeNumber(point.wpm),
    }))
    .sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);

  const observedSpeeds = graphPoints.map((point) => point.wpm);

  const highestObservedWpm =
    observedSpeeds.length > 0 ? Math.max(...observedSpeeds) : null;

  const lowestObservedWpm =
    observedSpeeds.length > 0 ? Math.min(...observedSpeeds) : null;

  const averageObservedWpm =
    observedSpeeds.length > 0
      ? Number(
          (
            observedSpeeds.reduce((sum, value) => sum + value, 0) /
            observedSpeeds.length
          ).toFixed(2),
        )
      : null;

  const minimumWpm = safeNumber(qualification.minimumWpm);
  const minimumAccuracy = safeNumber(qualification.minimumAccuracy);

  const graphs = [
    {
      id: "speed-over-time",
      title: "Typing Speed Over Time",
      type: "line",
      xAxis: "elapsedSeconds",
      yAxis: "wpm",
      unit: "WPM",
      available: graphPoints.length > 0,
      data: graphPoints,
    },
    {
      id: "character-distribution",
      title: "Character Accuracy Distribution",
      type: "doughnut",
      unit: "characters",
      available: correct + incorrect + missed + extra > 0,
      data: [
        { label: "Correct", value: correct },
        { label: "Incorrect", value: incorrect },
        { label: "Missed", value: missed },
        { label: "Extra", value: extra },
      ],
    },
    {
      id: "speed-comparison",
      title: "Typing Speed Comparison",
      type: "bar",
      unit: "WPM",
      available: true,
      data: [
        { label: "Gross WPM", value: grossWpm },
        { label: "Net WPM", value: netWpm },
        { label: "Target WPM", value: targetWpm },
        { label: "Minimum WPM", value: minimumWpm },
      ],
    },
    {
      id: "error-analysis",
      title: "Error Analysis",
      type: "bar",
      unit: "characters",
      available: true,
      data: [
        { label: "Incorrect", value: incorrect },
        { label: "Missed", value: missed },
        { label: "Extra", value: extra },
      ],
    },
    {
      id: "qualification-comparison",
      title: "Qualification Thresholds",
      type: "bar",
      available: true,
      data: [
        {
          label: "Actual Net WPM",
          value: netWpm,
          required: minimumWpm,
          passed: netWpm >= minimumWpm,
        },
        {
          label: "Actual Accuracy",
          value: accuracy,
          required: minimumAccuracy,
          passed: accuracy >= minimumAccuracy,
        },
      ],
    },
  ];

  return success(res, "Typing attempt result retrieved successfully", {
    attempt: {
      id: attempt._id,
      examId: attempt.exam,
      configId: attempt.examSnapshot?.config,
      examName: attempt.examSnapshot?.name,
      language: attempt.examSnapshot?.language,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      submittedAt: attempt.submittedAt,
      evaluatedAt: attempt.evaluatedAt,
    },

    result: {
      id: resultDoc._id,
      status: resultDoc.status,
      summary,
      outcome: report.outcome,
      qualification,
      examDetails,
      reportVersion: report.reportVersion,
      evaluatedAt: report.evaluatedAt,
    },

    statistics: {
      grossWpm,
      netWpm,
      accuracy,
      totalErrors: safeNumber(summary.totalErrors),
      correctCharacters: correct,
      incorrectCharacters: incorrect,
      missedCharacters: missed,
      extraCharacters: extra,
      highestObservedWpm,
      lowestObservedWpm,
      averageObservedWpm,
      graphPointCount: graphPoints.length,
    },

    graphs,
  });
});

/* =========================================================
   EXAM ANALYTICS
========================================================= */

/**
 * GET /:id/analytics
 *
 * Optional query parameters:
 * from, to
 *
 * Route middleware must restrict this endpoint to authorized
 * exam-management users.
 */

export const getTypingExamAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { from, to } = req.query;

  if (!isValidId(id)) {
    return fail(res, 400, "Invalid exam ID");
  }
  c;

  // Accept YYYY-MM-DD or a valid ISO timestamp.
  const parseDate = (value, fieldName) => {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Invalid ${fieldName} date`);
    }

    const dateOnly = /^\d{4}-\d{2}-\d{2}$/u.test(value);
    let date;

    if (dateOnly) {
      const [year, month, day] = value.split("-").map(Number);

      date = new Date(Date.UTC(year, month - 1, day));

      if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
      ) {
        throw new Error(`Invalid ${fieldName} date`);
      }

      return { date, dateOnly: true };
    }

    date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ${fieldName} date`);
    }

    return { date, dateOnly: false };
  };

  let fromDate;
  let toDate;

  try {
    if (from !== undefined) {
      fromDate = parseDate(from, "from").date;
    }

    if (to !== undefined) {
      const parsed = parseDate(to, "to");
      toDate = parsed.date;

      // A date-only "to" value includes the whole UTC calendar day.
      if (parsed.dateOnly) {
        toDate = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }
  } catch (error) {
    return fail(res, 400, error.message);
  }

  if (fromDate && toDate && fromDate >= toDate) {
    return fail(res, 400, "The to date must be after the from date");
  }

  const exam = await TypingExam.findById(id)
    .select(
      "_id title status config configVersion configSnapshot createdAt publishedAt",
    )
    .lean();

  if (!exam) {
    return fail(res, 404, "Exam not found");
  }

  const attemptMatch = {
    exam: exam._id,
  };

  if (fromDate || toDate) {
    attemptMatch.createdAt = {};

    if (fromDate) {
      attemptMatch.createdAt.$gte = fromDate;
    }

    if (toDate) {
      attemptMatch.createdAt.$lt = toDate;
    }
  }

  const [aggregate] = await TypingAttempt.aggregate([
    { $match: attemptMatch },

    {
      $lookup: {
        from: TypingResult.collection.name,
        let: {
          resultId: "$result",
          attemptId: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$resultId"] },
                  { $eq: ["$attempt", "$$attemptId"] },
                  { $eq: ["$exam", exam._id] },
                  { $eq: ["$status", "finalized"] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              "report.summary.grossWpm": 1,
              "report.summary.netWpm": 1,
              "report.summary.accuracy": 1,
              "report.summary.totalErrors": 1,
              "report.qualification.passed": 1,
              "report.outcome.passed": 1,
            },
          },
        ],
        as: "resultDocument",
      },
    },

    {
      $set: {
        resultDocument: { $first: "$resultDocument" },
        isCompleted: {
          $in: ["$status", ["submitted", "evaluated"]],
        },
        isEvaluated: {
          $and: [
            { $eq: ["$status", "evaluated"] },
            { $gt: [{ $size: "$resultDocument" }, 0] },
          ],
        },
      },
    },

    {
      $set: {
        passed: {
          $ifNull: [
            "$resultDocument.report.qualification.passed",
            "$resultDocument.report.outcome.passed",
          ],
        },
        grossWpm: "$resultDocument.report.summary.grossWpm",
        netWpm: "$resultDocument.report.summary.netWpm",
        accuracy: "$resultDocument.report.summary.accuracy",
        totalErrors: "$resultDocument.report.summary.totalErrors",
      },
    },

    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalAttempts: { $sum: 1 },
              completedAttempts: {
                $sum: { $cond: ["$isCompleted", 1, 0] },
              },
              evaluatedAttempts: {
                $sum: { $cond: ["$isEvaluated", 1, 0] },
              },
              passedAttempts: {
                $sum: {
                  $cond: [
                    {
                      $and: ["$isEvaluated", { $eq: ["$passed", true] }],
                    },
                    1,
                    0,
                  ],
                },
              },
              failedAttempts: {
                $sum: {
                  $cond: [
                    {
                      $and: ["$isEvaluated", { $eq: ["$passed", false] }],
                    },
                    1,
                    0,
                  ],
                },
              },
              inProgressAttempts: {
                $sum: {
                  $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0],
                },
              },
              expiredAttempts: {
                $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] },
              },
              cancelledAttempts: {
                $sum: {
                  $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
                },
              },
              submittedWithoutResult: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$status", "submitted"] },
                        { $eq: [{ $size: "$resultDocument" }, 0] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],

        performance: [
          { $match: { isEvaluated: true } },
          {
            $group: {
              _id: null,
              averageGrossWpm: { $avg: "$grossWpm" },
              averageNetWpm: { $avg: "$netWpm" },
              averageAccuracy: { $avg: "$accuracy" },
              averageErrors: { $avg: "$totalErrors" },
              highestGrossWpm: { $max: "$grossWpm" },
              highestNetWpm: { $max: "$netWpm" },
              highestAccuracy: { $max: "$accuracy" },
              lowestNetWpm: { $min: "$netWpm" },
            },
          },
        ],

        statusBreakdown: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const totals = aggregate?.totals?.[0] ?? {};
  const performance = aggregate?.performance?.[0] ?? {};

  const round = (value) =>
    Number.isFinite(value) ? Number(value.toFixed(2)) : 0;

  const totalAttempts = totals.totalAttempts ?? 0;
  const completedAttempts = totals.completedAttempts ?? 0;
  const evaluatedAttempts = totals.evaluatedAttempts ?? 0;
  const passedAttempts = totals.passedAttempts ?? 0;

  const attemptsByStatus = Object.fromEntries(
    (aggregate?.statusBreakdown ?? []).map(({ _id, count }) => [_id, count]),
  );

  return success(res, "Typing exam analytics retrieved successfully", {
    exam: {
      id: exam._id,
      title: exam.title,
      status: exam.status,
      language: exam.configSnapshot?.language ?? null,
      configVersion: exam.configVersion ?? exam.configSnapshot?.version ?? null,
      publishedAt: exam.publishedAt ?? null,
    },

    filters: {
      from: from ?? null,
      to: to ?? null,
      dateBasis: "attempt.createdAt",
      timezone: "UTC",
    },

    counts: {
      totalAttempts,
      completedAttempts,
      evaluatedAttempts,
      passedAttempts,
      failedAttempts: totals.failedAttempts ?? 0,
      inProgressAttempts: totals.inProgressAttempts ?? 0,
      expiredAttempts: totals.expiredAttempts ?? 0,
      cancelledAttempts: totals.cancelledAttempts ?? 0,
      submittedWithoutResult: totals.submittedWithoutResult ?? 0,
    },

    rates: {
      completionPercentage: totalAttempts
        ? round((completedAttempts / totalAttempts) * 100)
        : 0,

      passPercentage: evaluatedAttempts
        ? round((passedAttempts / evaluatedAttempts) * 100)
        : 0,
    },

    performance: {
      evaluatedAttempts,
      averageGrossWpm: round(performance.averageGrossWpm),
      averageNetWpm: round(performance.averageNetWpm),
      averageAccuracy: round(performance.averageAccuracy),
      averageErrors: round(performance.averageErrors),
      highestGrossWpm: round(performance.highestGrossWpm),
      highestNetWpm: round(performance.highestNetWpm),
      lowestNetWpm: round(performance.lowestNetWpm),
      highestAccuracy: round(performance.highestAccuracy),
    },

    attemptsByStatus,
  });
});
