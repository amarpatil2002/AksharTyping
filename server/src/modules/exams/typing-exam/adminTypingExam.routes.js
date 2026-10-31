import { Router } from "express";

import { requireAdminSession } from "../../../middleware/requireAdminSession.js";
import { validateRequest } from "../../../middleware/validateRequest.js";

import {
  createExamSchema,
  updateExamSchema,
  updateExamStatusSchema,
  createPassageSchema,
  updatePassageSchema,
  updatePassageStatusSchema,
  objectIdSchema,
  passageParamsSchema,
  attemptParamsSchema,
  examQuerySchema,
  passageQuerySchema,
  attemptQuerySchema,
  evaluateAttemptSchema,
} from "../../exams/typing-exam/typingExam.validation.js";

import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  updateExamStatus,
  deleteExam,
  createPassage,
  getPassages,
  getPassageById,
  updatePassage,
  updatePassageStatus,
  deletePassage,
  getAttempts,
  getAttemptById,
  evaluateAttempt,
  getTypingDashboard,
} from "./adminTypingExam.controller.js";

const router = Router();

// All endpoints in this router require admin authentication.
router.use(requireAdminSession);

// ==========================================
// DASHBOARD
// ==========================================

router.get("/dashboard", getTypingDashboard);

// ==========================================
// EXAM ROUTES
// ==========================================

router.post("/", validateRequest(createExamSchema), createExam);

router.get("/", validateRequest(examQuerySchema, "query"), getExams);

router.get("/:examId", validateRequest(objectIdSchema, "params"), getExamById);

router.patch(
  "/:examId",
  validateRequest(objectIdSchema, "params"),
  validateRequest(updateExamSchema),
  updateExam,
);

router.patch(
  "/:examId/status",
  validateRequest(objectIdSchema, "params"),
  validateRequest(updateExamStatusSchema),
  updateExamStatus,
);

router.delete(
  "/:examId",
  validateRequest(objectIdSchema, "params"),
  deleteExam,
);

// ==========================================
// PASSAGE ROUTES
// ==========================================

router.post(
  "/:examId/passages",
  validateRequest(objectIdSchema, "params"),
  validateRequest(createPassageSchema),
  createPassage,
);

router.get(
  "/:examId/passages",
  validateRequest(objectIdSchema, "params"),
  validateRequest(passageQuerySchema, "query"),
  getPassages,
);

router.get(
  "/:examId/passages/:passageId",
  validateRequest(passageParamsSchema, "params"),
  getPassageById,
);

router.patch(
  "/:examId/passages/:passageId",
  validateRequest(passageParamsSchema, "params"),
  validateRequest(updatePassageSchema),
  updatePassage,
);

router.patch(
  "/:examId/passages/:passageId/status",
  validateRequest(passageParamsSchema, "params"),
  validateRequest(updatePassageStatusSchema),
  updatePassageStatus,
);

router.delete(
  "/:examId/passages/:passageId",
  validateRequest(passageParamsSchema, "params"),
  deletePassage,
);

export default router;
