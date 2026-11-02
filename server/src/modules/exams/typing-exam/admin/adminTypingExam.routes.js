import { Router } from "express";

import { requireAdminSession } from "../../../../middleware/requireAdminSession.js";
import { validateRequest } from "../../../../middleware/validateRequest.js";

import {
  createExamSchema,
  updateExamSchema,
  updateExamStatusSchema,
  createPassageSchema,
  updatePassageSchema,
  updatePassageStatusSchema,
  objectIdSchema,
  passageParamsSchema,
  examQuerySchema,
  passageQuerySchema,
} from "./AdmintypingExam.validation.js";

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
  getTypingDashboard,
} from "./adminTypingExam.controller.js";

const router = Router();

// ============================================================
// ADMIN AUTHENTICATION
// ============================================================

// All routes require an authenticated admin session.
router.use(requireAdminSession);

router.get("/dashboard", getTypingDashboard);

// Create exam.
router.post("/", validateRequest(createExamSchema), createExam);

// Get all exams.
router.get("/", validateRequest(examQuerySchema, "query"), getExams);

// Get exam by ID.
router.get("/:examId", validateRequest(objectIdSchema, "params"), getExamById);

// Update exam details.
router.patch(
  "/:examId",
  validateRequest(objectIdSchema, "params"),
  validateRequest(updateExamSchema),
  updateExam,
);

// Update exam status.
router.patch(
  "/:examId/status",
  validateRequest(objectIdSchema, "params"),
  validateRequest(updateExamStatusSchema),
  updateExamStatus,
);

// Delete exam.
router.delete(
  "/:examId",
  validateRequest(objectIdSchema, "params"),
  deleteExam,
);

// ============================================================
// PASSAGE ROUTES
// ============================================================

// Create passage under an exam.
router.post(
  "/:examId/passages",
  validateRequest(objectIdSchema, "params"),
  validateRequest(createPassageSchema),
  createPassage,
);

// Get all passages belonging to an exam.
router.get(
  "/:examId/passages",
  validateRequest(objectIdSchema, "params"),
  validateRequest(passageQuerySchema, "query"),
  getPassages,
);

// Get a specific passage.
router.get(
  "/:examId/passages/:passageId",
  validateRequest(passageParamsSchema, "params"),
  getPassageById,
);

// Update passage details.
router.patch(
  "/:examId/passages/:passageId",
  validateRequest(passageParamsSchema, "params"),
  validateRequest(updatePassageSchema),
  updatePassage,
);

// Update passage status.
router.patch(
  "/:examId/passages/:passageId/status",
  validateRequest(passageParamsSchema, "params"),
  validateRequest(updatePassageStatusSchema),
  updatePassageStatus,
);

// Delete passage.
router.delete(
  "/:examId/passages/:passageId",
  validateRequest(passageParamsSchema, "params"),
  deletePassage,
);

export default router;
