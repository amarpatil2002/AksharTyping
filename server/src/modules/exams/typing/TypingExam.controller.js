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
const getConfigSnapshot = (config) => {
  const source = plain(config);

  return {
    name: source.name,
    description: source.description ?? "",
    language: source.language,
    durationSeconds: source.durationSeconds,
    targetWpm: source.targetWpm ?? 0,
    instructions: source.instructions ?? [],
    examMetadata: source.examMetadata ?? {},
    passageSettings: source.passageSettings ?? {},
    evaluationRules: source.evaluationRules ?? {},
    examInterface: source.examInterface ?? {},
    analyticsSettings: source.analyticsSettings ?? {},
    version: source.version ?? 1,
  };
};

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

  const { id } = req.params;

  if (!isValidId(id)) {
    return fail(res, 400, "Invalid exam ID");
  }

  const exam = await TypingExam.findOne({
    _id: id,
    status: "published",
  }).lean();

  if (!exam) {
    return fail(res, 404, "Published exam not found");
  }

  const now = new Date();
  const snapshot = getExamSnapshot(exam);

  const attempt = await TypingAttempt.create({
    candidate: candidateId,
    exam: exam._id,
    examSnapshot: {
      ...snapshot,
      title: exam.title,
      passageText: exam.passageText,
      configVersion: exam.configVersion,
    },
    status: "in_progress",
    startedAt: now,
    expiresAt: new Date(
      now.getTime() + Number(snapshot.durationSeconds) * 1000,
    ),
    typedText: "",
    timeline: [],
  });

  return success(
    res,
    "Typing attempt started successfully",
    {
      attemptId: attempt._id,
      exam: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        language: snapshot.language,
        passageText: exam.passageText,
        durationSeconds: snapshot.durationSeconds,
        targetWpm: snapshot.targetWpm,
        instructions: snapshot.instructions,
        examInterface: snapshot.examInterface,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
      },
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

  const now = new Date();

  if (attempt.expiresAt && now >= attempt.expiresAt) {
    return fail(res, 409, "Attempt time has expired. Submit the attempt.");
  }

  if (typeof req.body.typedText === "string") {
    attempt.typedText = req.body.typedText;
  }

  if (Array.isArray(req.body.timeline) && req.body.timeline.length > 0) {
    const settings = attempt.examSnapshot?.analyticsSettings ?? {};

    if (settings.storeKeystrokeTimeline !== false) {
      const existing = Array.isArray(attempt.timeline) ? attempt.timeline : [];

      const incoming = req.body.timeline;

      // Keep a bounded timeline to avoid unbounded document growth.
      attempt.timeline = [...existing, ...incoming].slice(-5000);
    }
  }

  attempt.lastSavedAt = now;
  await attempt.save();

  return success(res, "Attempt autosaved successfully", {
    attemptId: attempt._id,
    lastSavedAt: attempt.lastSavedAt,
  });
});

/**
 * POST /attempts/:attemptId/submit
 *
 * The server computes the result; it never accepts client-supplied
 * WPM, accuracy, error counts, marks or pass/fail values.
 */
export const submitTypingAttempt = asyncHandler(async (req, res) => {
  const candidateId = requireUserId(req, res);
  if (!candidateId) return;

  const { attemptId } = req.params;

  if (!isValidId(attemptId)) {
    return fail(res, 400, "Invalid attempt ID");
  }

  const attempt = await TypingAttempt.findOne({
    _id: attemptId,
    candidate: candidateId,
  });

  if (!attempt) {
    return fail(res, 404, "Attempt not found");
  }

  if (attempt.status === "submitted" || attempt.status === "evaluated") {
    return success(res, "Attempt was already submitted", attempt.result);
  }

  if (attempt.status !== "in_progress") {
    return fail(res, 409, "Attempt cannot be submitted in its current state");
  }

  const submittedAt = new Date();

  // A submitted body may contain final autosaved text.
  if (typeof req.body.typedText === "string") {
    attempt.typedText = req.body.typedText;
  }

  const snapshot = attempt.examSnapshot ?? {};

  if (!snapshot.passageText) {
    return fail(res, 500, "Attempt snapshot is missing its reference passage");
  }

  const durationSeconds = Number(snapshot.durationSeconds);

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return fail(res, 500, "Attempt snapshot contains an invalid duration");
  }

  const timedOut = attempt.expiresAt && submittedAt >= attempt.expiresAt;

  const evaluationTime = timedOut ? new Date(attempt.expiresAt) : submittedAt;

  const rules = snapshot.evaluationRules ?? {};

  const result = calculateTypingResult({
    passageText: snapshot.passageText,
    typedText: attempt.typedText ?? "",
    startedAt: attempt.startedAt,
    submittedAt: evaluationTime,
    evaluationRules: rules,
  });

  attempt.submittedAt = submittedAt;
  attempt.status = "evaluated";
  attempt.result = {
    ...result,
    timedOut: Boolean(timedOut),
    targetWpm: snapshot.targetWpm ?? null,
    evaluationStrategy: rules.strategy ?? "gross_net_wpm",
    evaluatedAt: submittedAt,
  };

  await attempt.save();

  return success(
    res,
    "Typing attempt submitted and evaluated successfully",
    attempt.result,
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
