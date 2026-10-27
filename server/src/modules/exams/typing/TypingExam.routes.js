import { Router } from "express";
import { verifyToken } from "../../../middleware///verifyToken.js";

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
  startTypingAttempt,
  saveTypingAttemptTimeline,
  submitTypingAttempt,
  getTypingAttemptResult,
  getTypingExamAnalytics,
  deleteTypingExam,
} from "./TypingExam.controller.js";

import {
  validate,
  idParamSchema,
  configIdParamSchema,
  attemptIdParamSchema,
  createTypingExamSchema,
  updateTypingExamSchema,
  listTypingExamsQuerySchema,
  createTypingExamConfigSchema,
  updateTypingExamConfigSchema,
  startTypingAttemptSchema,
  submitTypingAttemptSchema,
  saveTypingAttemptTimelineSchema,
  typingExamAnalyticsQuerySchema,
} from "./typingExam.validation.js";

const router = Router();

/* =====================================================
   EXAM CONFIGURATION ROUTES
===================================================== */

// Create configuration
router.post(
  "/configs",
  verifyToken,
  validate(createTypingExamConfigSchema),
  createTypingExamConfig,
);

// List configurations
router.get("/configs", verifyToken, listTypingExamConfigs);

// Get configuration by ID
router.get(
  "/configs/:configId",
  verifyToken,
  validate(configIdParamSchema, "params"),
  getTypingExamConfigById,
);

// Update configuration
router.patch(
  "/configs/:configId",
  verifyToken,
  validate(configIdParamSchema, "params"),
  validate(updateTypingExamConfigSchema),
  updateTypingExamConfig,
);

// Archive configuration
router.post(
  "/configs/:configId/archive",
  verifyToken,
  validate(configIdParamSchema, "params"),
  archiveTypingExamConfig,
);

/* =====================================================
   TYPING EXAM ROUTES
===================================================== */

// Create exam
router.post(
  "/",
  verifyToken,
  validate(createTypingExamSchema),
  createTypingExam,
);

// List exams with filters and pagination
router.get(
  "/",
  verifyToken,
  validate(listTypingExamsQuerySchema, "query"),
  listTypingExams,
);

// Get exam by ID
router.get(
  "/:id",
  verifyToken,
  validate(idParamSchema, "params"),
  getTypingExamById,
);

// Update draft exam
router.patch(
  "/:id",
  verifyToken,
  validate(idParamSchema, "params"),
  validate(updateTypingExamSchema),
  updateTypingExam,
);

// Publish exam
router.post(
  "/:id/publish",
  verifyToken,
  validate(idParamSchema, "params"),
  publishTypingExam,
);

// Archive exam
router.post(
  "/:id/archive",
  verifyToken,
  validate(idParamSchema, "params"),
  archiveTypingExam,
);

router.delete(
  "/:id/delete",
  verifyToken,
  validate(idParamSchema, "params"),
  deleteTypingExam,
);

/* =====================================================
   TYPING ATTEMPT ROUTES
===================================================== */

// Start attempt
router.post(
  "/attempts/start",
  verifyToken,
  validate(startTypingAttemptSchema),
  startTypingAttempt,
);

// Save periodic typing metrics
router.post(
  "/attempts/:attemptId/timeline",
  verifyToken,
  validate(attemptIdParamSchema, "params"),
  validate(saveTypingAttemptTimelineSchema),
  saveTypingAttemptTimeline,
);

// Submit attempt
router.post(
  "/attempts/:attemptId/submit",
  verifyToken,
  validate(attemptIdParamSchema, "params"),
  validate(submitTypingAttemptSchema),
  submitTypingAttempt,
);

// Get attempt result
router.get(
  "/attempts/:attemptId/result",
  verifyToken,
  validate(attemptIdParamSchema, "params"),
  getTypingAttemptResult,
);

/* =====================================================
   ANALYTICS ROUTES
===================================================== */

// Get exam analytics
router.get(
  "/:id/analytics",
  verifyToken,
  validate(idParamSchema, "params"),
  validate(typingExamAnalyticsQuerySchema, "query"),
  getTypingExamAnalytics,
);

export default router;
