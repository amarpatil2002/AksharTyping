import mongoose from "mongoose";
import TypingExam from "../../../models/typing/TypingExam.js";
import TypingExamConfig from "../../../models/typing/TypingExamConfig.js";
import TypingAttempt from "../../../models/typing/TypingAttempt.js";

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

/**
 * Create the immutable exam settings copied into a candidate attempt.
 */
const getExamSnapshot = (exam) => {
  const config = plain(exam.configSnapshot) ?? {};

  return {
    title: exam.title,
    passageText: exam.passageText,
    language: config.language ?? "en",
    durationSeconds: config.durationSeconds,
    targetWpm: config.targetWpm ?? 0,
    instructions: config.instructions ?? [],
    examMetadata: config.examMetadata ?? {},
    passageSettings: config.passageSettings ?? {},
    evaluationRules: config.evaluationRules ?? {},
    examInterface: config.examInterface ?? {},
    analyticsSettings: config.analyticsSettings ?? {},
    configVersion: exam.configVersion,
  };
};

const configEditableFields = [
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
];

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
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 10 ||
    durationSeconds > 7200
  ) {
    return fail(res, 409, "Invalid exam duration configuration");
  }

  if (!config.language || !config.version || !exam.passageText?.trim()) {
    return fail(res, 409, "Published exam configuration is incomplete");
  }

  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + durationSeconds * 1000);

  const examSnapshot = {
    title: exam.title,
    language: config.language,
    passageText: exam.passageText,
    durationSeconds,
    targetWpm: config.targetWpm ?? 0,
    instructions: config.instructions ?? [],
    examMetadata: config.examMetadata ?? {},
    passageSettings: config.passageSettings ?? {},
    evaluationRules: config.evaluationRules ?? {},
    examInterface: config.examInterface ?? {},
    analyticsSettings: config.analyticsSettings ?? {},
    examWorkflow: config.examWorkflow,
    configVersion: config.version,
  };

  // Do not delete previous attempts here.
  // Preserve history and handle unfinished attempts through
  // an explicit cancellation or abandonment policy.

  const attempt = await TypingAttempt.create({
    candidate: candidateId,
    exam: exam._id,
    examSnapshot,
    status: "in_progress",
    lastActivityAt: startedAt,
    startedAt,
    deadlineAt,
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
      durationSeconds,
      exam: attempt.examSnapshot,
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

export const submitTypingAttempt = asyncHandler(async (req, res) => {
  const candidateId = requireUserId(req, res);
  if (!candidateId) return;

  const { attemptId } = req.params;
  const { typedText, submissionId, result: submittedResult } = req.body;

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

  if (
    !submittedResult ||
    typeof submittedResult !== "object" ||
    Array.isArray(submittedResult)
  ) {
    return fail(res, 400, "A valid typing result is required");
  }

  const normalizedSubmissionId = submissionId.trim();

  // Load only an attempt owned by this candidate.
  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    candidate: candidateId,
  });

  if (!attempt) {
    return fail(res, 404, "Typing attempt not found");
  }

  // Idempotency: retrying the same completed submission returns
  // the saved result instead of creating a second submission.
  if (attempt.status === "evaluated") {
    if (isSameSubmission(attempt, normalizedSubmissionId)) {
      return success(res, "Typing attempt already submitted", {
        attemptId: attempt._id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        evaluatedAt: attempt.evaluatedAt,
        result: attempt.result,
      });
    }

    return fail(res, 409, "This attempt has already been submitted");
  }

  if (attempt.status !== "in_progress") {
    return fail(res, 409, "This attempt is no longer in progress");
  }

  const now = new Date();

  if (
    !attempt.deadlineAt ||
    now.getTime() >= new Date(attempt.deadlineAt).getTime()
  ) {
    // Persist expiration only if this request still owns the
    // in-progress transition. A concurrent submission may win.
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

    const latest = await TypingAttempt.findOne({
      _id: attempt._id,
      candidate: candidateId,
    }).lean();

    if (
      latest?.status === "evaluated" &&
      latest.submissionId === normalizedSubmissionId
    ) {
      return success(res, "Typing attempt already submitted", {
        attemptId: latest._id,
        status: latest.status,
        submittedAt: latest.submittedAt,
        evaluatedAt: latest.evaluatedAt,
        result: latest.result,
      });
    }

    return fail(res, 409, "Attempt time has expired");
  }

  const snapshot = attempt.examSnapshot;

  if (
    !snapshot ||
    !snapshot.title ||
    !snapshot.language ||
    !snapshot.evaluationRules ||
    !Number.isInteger(snapshot.durationSeconds)
  ) {
    return fail(res, 409, "Attempt exam snapshot is incomplete");
  }

  // The server owns exam metadata and evaluation timestamp.
  // The frontend supplies the calculated performance metrics.
  const resultToSave = {
    ...submittedResult,
    examDetails: buildTrustedExamDetails(snapshot),
    evaluatedAt: now,
  };

  // Atomic transition: only one concurrent request can change
  // this attempt from in_progress to evaluated.
  const savedAttempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      candidate: candidateId,
      status: "in_progress",
      deadlineAt: { $gt: now },
    },
    {
      $set: {
        typedText,
        submissionId: normalizedSubmissionId,
        result: resultToSave,
        status: "evaluated",
        submittedAt: now,
        evaluatedAt: now,
        lastActivityAt: now,
      },
    },
    {
      new: true,
      runValidators: true,
      context: "query",
    },
  );

  if (!savedAttempt) {
    // Another request may have submitted or expired the attempt.
    const latest = await TypingAttempt.findOne({
      _id: attempt._id,
      candidate: candidateId,
    }).lean();

    if (
      latest?.status === "evaluated" &&
      latest.submissionId === normalizedSubmissionId
    ) {
      return success(res, "Typing attempt already submitted", {
        attemptId: latest._id,
        status: latest.status,
        submittedAt: latest.submittedAt,
        evaluatedAt: latest.evaluatedAt,
        result: latest.result,
      });
    }

    if (latest?.status === "evaluated") {
      return fail(res, 409, "This attempt has already been submitted");
    }

    if (latest?.status === "expired") {
      return fail(res, 409, "Attempt time has expired");
    }

    return fail(
      res,
      409,
      "Attempt could not be submitted. Please retry if time remains.",
    );
  }

  return success(
    res,
    "Typing attempt submitted successfully",
    {
      attemptId: savedAttempt._id,
      examId: savedAttempt.exam,
      status: savedAttempt.status,
      submissionId: savedAttempt.submissionId,
      submittedAt: savedAttempt.submittedAt,
      evaluatedAt: savedAttempt.evaluatedAt,
      result: savedAttempt.result,
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
      "exam examSnapshot.title examSnapshot.language status startedAt submittedAt expiresAt result createdAt updatedAt",
    )
    .lean();

  if (!attempt) {
    return fail(res, 404, "Attempt not found");
  }

  if (!attempt.result) {
    return fail(res, 409, "Attempt result is not available yet");
  }

  return success(res, "Typing attempt result retrieved successfully", {
    attemptId: attempt._id,
    exam: attempt.exam,
    title: attempt.examSnapshot?.title,
    language: attempt.examSnapshot?.language,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    result: attempt.result,
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

  if (!isValidId(id)) {
    return fail(res, 400, "Invalid exam ID");
  }

  const exam = await TypingExam.findById(id)
    .select("_id title status configSnapshot createdAt publishedAt")
    .lean();

  if (!exam) {
    return fail(res, 404, "Exam not found");
  }

  const filter = { exam: exam._id };

  if (req.query.from || req.query.to) {
    filter.createdAt = {};

    if (req.query.from) {
      const from = new Date(req.query.from);

      if (Number.isNaN(from.getTime())) {
        return fail(res, 400, "Invalid from date");
      }

      filter.createdAt.$gte = from;
    }

    if (req.query.to) {
      const to = new Date(req.query.to);

      if (Number.isNaN(to.getTime())) {
        return fail(res, 400, "Invalid to date");
      }

      if (filter.createdAt.$gte && to < filter.createdAt.$gte) {
        return fail(res, 400, "The to date must be on or after from");
      }

      // Use an exclusive upper boundary at the beginning of the
      // following day when the input is a date-only value.
      if (/^\d{4}-\d{2}-\d{2}$/u.test(req.query.to)) {
        to.setUTCDate(to.getUTCDate() + 1);
      }

      filter.createdAt.$lt = to;
    }
  }

  const attempts = await TypingAttempt.find(filter)
    .select("status result startedAt submittedAt createdAt")
    .lean();

  const totalAttempts = attempts.length;

  const completedAttempts = attempts.filter((attempt) =>
    ["submitted", "evaluated"].includes(attempt.status),
  );

  const evaluatedAttempts = attempts.filter(
    (attempt) => attempt.result != null,
  );

  const passedAttempts = evaluatedAttempts.filter(
    (attempt) => attempt.result.passed === true,
  );

  const average = (values) => {
    const valid = values.map(Number).filter(Number.isFinite);

    if (!valid.length) return 0;

    return roundTo(valid.reduce((sum, value) => sum + value, 0) / valid.length);
  };

  const results = evaluatedAttempts.map((attempt) => attempt.result);

  const wpmValues = results.map((result) => result.wpm);
  const accuracyValues = results.map((result) => result.accuracy);
  const errorValues = results.map((result) => result.totalErrors);
  const markValues = results.map((result) => result.marks);

  const statusCounts = attempts.reduce((counts, attempt) => {
    const status = attempt.status || "unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});

  const analytics = {
    exam: {
      id: exam._id,
      title: exam.title,
      status: exam.status,
      language: exam.configSnapshot?.language ?? null,
      configVersion: exam.configSnapshot?.version ?? null,
    },

    filters: {
      from: req.query.from ?? null,
      to: req.query.to ?? null,
    },

    counts: {
      totalAttempts,
      completedAttempts: completedAttempts.length,
      evaluatedAttempts: evaluatedAttempts.length,
      passedAttempts: passedAttempts.length,
      failedAttempts: evaluatedAttempts.length - passedAttempts.length,
      inProgressAttempts: statusCounts.in_progress || 0,
    },

    rates: {
      completionPercentage: totalAttempts
        ? roundTo((completedAttempts.length / totalAttempts) * 100)
        : 0,

      passPercentage: evaluatedAttempts.length
        ? roundTo((passedAttempts.length / evaluatedAttempts.length) * 100)
        : 0,
    },

    performance: {
      averageWpm: average(wpmValues),
      averageAccuracy: average(accuracyValues),
      averageErrors: average(errorValues),
      averageMarks: average(markValues),
      highestWpm: wpmValues.length ? Math.max(...wpmValues) : 0,
      highestAccuracy: accuracyValues.length ? Math.max(...accuracyValues) : 0,
    },

    attemptsByStatus: statusCounts,
  };

  return success(
    res,
    "Typing exam analytics retrieved successfully",
    analytics,
  );
});
