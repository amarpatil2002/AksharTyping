import { Router } from "express";

import {
  getPublishedExams,
  getPublishedExamById,
  getExamPassages,
  startAttempt,
  getAttempts,
  updateAttemptProgress,
  submitAttempt,
  getAttemptResult,
} from "./TypingExam.controller.js";

import {
  examParamsSchema,
  startAttemptParamsSchema,
  examQuerySchema,
  passageQuerySchema,
  attemptParamsSchema,
  attemptQuerySchema,
  updateAttemptProgressSchema,
  submitAttemptSchema,
  examPassageParamsSchema,
} from "./typingExam.validation.js";

import { verifyToken } from "../../../middleware/verifyToken.js";
import { validateRequest } from "../../../middleware/validateRequest.js";

const router = Router();

// Authenticate all user typing routes.
router.use(verifyToken);

// ============================================
// Published exams
// ============================================

// GET /api/v1/typing
router.get("/", validateRequest(examQuerySchema, "query"), getPublishedExams);

// GET /api/v1/typing/:examId
router.get(
  "/:examId",
  validateRequest(examParamsSchema, "params"),
  getPublishedExamById,
);

// GET /api/v1/typing/:examId/passages
router.get(
  "/:examId/passages",
  validateRequest(examParamsSchema, "params"),
  validateRequest(passageQuerySchema, "query"),
  getExamPassages,
);

// ============================================
// Typing attempts
// ============================================

// POST /api/v1/typing/:examId/passages/:passageId/start
router.post(
  "/:examId/passages/:passageId/start",
  validateRequest(startAttemptParamsSchema, "params"),
  startAttempt,
);

// GET /api/v1/typing/attempts
router.get(
  "/attempts/history",
  validateRequest(attemptQuerySchema, "query"),
  getAttempts,
);

// PATCH /api/v1/typing/attempts/:attemptId/progress
router.patch(
  "/attempts/:attemptId/progress",
  validateRequest(attemptParamsSchema, "params"),
  validateRequest(updateAttemptProgressSchema, "body"),
  updateAttemptProgress,
);

// POST /api/v1/typing/attempts/:attemptId/submit
router.post(
  "/attempts/:attemptId/submit",
  validateRequest(attemptParamsSchema, "params"),
  validateRequest(submitAttemptSchema, "body"),
  submitAttempt,
);

// GET /api/v1/typing/attempts/:attemptId/result
router.get(
  "/attempts/:attemptId/result",
  validateRequest(attemptParamsSchema, "params"),
  getAttemptResult,
);

export default router;
