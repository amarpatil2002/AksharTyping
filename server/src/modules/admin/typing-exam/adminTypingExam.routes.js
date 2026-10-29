import { Router } from "express";
import { verifyToken } from "../../../middleware/verifyToken.js";

import {
  createTypingExam,
  listTypingExams,
  getTypingExamById,
  updateTypingExam,
  publishTypingExam,
  archiveTypingExam,
  createTypingExamConfig,
  listTypingExamConfigs,
  getTypingExamConfigById,
  updateTypingExamConfig,
  archiveTypingExamConfig,
  getTypingExamAnalytics,
  deleteTypingExam,
} from "../../exams/typing-exam/TypingExam.controller.js";

import {
  validate,
  idParamSchema,
  configIdParamSchema,
  createTypingExamSchema,
  updateTypingExamSchema,
  listTypingExamsQuerySchema,
  createTypingExamConfigSchema,
  updateTypingExamConfigSchema,
  typingExamAnalyticsQuerySchema,
} from "../../exams/typing-exam/typingExam.validation.js";

import { requireAdminSession } from "../../../middleware/requireAdminSession.js";

const router = Router();

router.use(requireAdminSession);

/* =====================================================
   EXAM CONFIGURATION ROUTES
===================================================== */

// Create configuration
router.post(
  "/configs",
  validate(createTypingExamConfigSchema),
  createTypingExamConfig,
);

// List configurations
router.get("/configs", listTypingExamConfigs);

// Get configuration by ID
router.get(
  "/configs/:configId",
  validate(configIdParamSchema, "params"),
  getTypingExamConfigById,
);

// Update configuration
router.patch(
  "/configs/:configId",
  validate(configIdParamSchema, "params"),
  validate(updateTypingExamConfigSchema),
  updateTypingExamConfig,
);

// Archive configuration
router.post(
  "/configs/:configId/archive",
  validate(configIdParamSchema, "params"),
  archiveTypingExamConfig,
);

/* =====================================================
   TYPING EXAM ROUTES
===================================================== */

// Create exam
router.post("/", validate(createTypingExamSchema), createTypingExam);

// List exams with filters and pagination
router.get("/", validate(listTypingExamsQuerySchema, "query"), listTypingExams);

// Get exam by ID
router.get("/:id", validate(idParamSchema, "params"), getTypingExamById);

// Update draft exam
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateTypingExamSchema),
  updateTypingExam,
);

// Publish exam
router.post(
  "/:id/publish",
  validate(idParamSchema, "params"),
  publishTypingExam,
);

// Archive exam
router.post(
  "/:id/archive",
  validate(idParamSchema, "params"),
  archiveTypingExam,
);

router.delete(
  "/:id/delete",
  validate(idParamSchema, "params"),
  deleteTypingExam,
);

/* =====================================================
   ANALYTICS ROUTES
===================================================== */

// Get exam analytics
router.get(
  "/:id/analytics",
  validate(idParamSchema, "params"),
  validate(typingExamAnalyticsQuerySchema, "query"),
  getTypingExamAnalytics,
);

export default router;
