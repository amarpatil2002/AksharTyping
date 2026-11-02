import { Router } from "express";

import { requireAdminSession } from "../../../../middleware/requireAdminSession.js";
import { validateRequest } from "../../../../middleware/validateRequest.js";

import {
  createTypingExamSchema,
  updateTypingExamSchema,
  updateExamStatusSchema,
  createTypingPassageSchema,
  updateTypingPassageSchema,
  updatePassageStatusSchema,
  examIdParamsSchema,
  passageIdParamsSchema,
  examQuerySchema,
  passageQuerySchema,
} from "./typingExam.validation.js";

import {
  createExam,
  getExams,
  getExamById,
  updateExam,
  updateExamStatus,
  deleteExam,
  getExamDashboardStats,
  createTypingPassage,
  getTypingPassages,
  getTypingPassageById,
  updateTypingPassage,
  updatePassageStatus,
  deleteTypingPassage,
} from "./typingExam.controller.js";

const router = Router();

router.use(requireAdminSession);

// ============================================================
// EXAM ROUTES
// ============================================================

router.get("/", validateRequest(examQuerySchema, "query"), getExams);

router.post("/", validateRequest(createTypingExamSchema), createExam);

router.get(
  "/:examId",
  validateRequest(examIdParamsSchema, "params"),
  getExamById,
);

router.patch(
  "/:examId",
  validateRequest(examIdParamsSchema, "params"),
  validateRequest(updateTypingExamSchema),
  updateExam,
);

router.patch(
  "/:examId/status",
  validateRequest(examIdParamsSchema, "params"),
  validateRequest(updateExamStatusSchema),
  updateExamStatus,
);

router.delete(
  "/:examId",
  validateRequest(examIdParamsSchema, "params"),
  deleteExam,
);

// ============================================================
// EXAM DASHBOARD
// ============================================================

router.get(
  "/:examId/dashboard-stats",
  validateRequest(examIdParamsSchema, "params"),
  getExamDashboardStats,
);

// ============================================================
// PASSAGE LIBRARY ROUTES
// ============================================================

router.post(
  "/passages",
  validateRequest(createTypingPassageSchema),
  createTypingPassage,
);

router.get(
  "/passages",
  validateRequest(passageQuerySchema, "query"),
  getTypingPassages,
);

router.get(
  "/passages/:passageId",
  validateRequest(passageIdParamsSchema, "params"),
  getTypingPassageById,
);

router.patch(
  "/passages/:passageId",
  validateRequest(passageIdParamsSchema, "params"),
  validateRequest(updateTypingPassageSchema),
  updateTypingPassage,
);

router.patch(
  "/passages/:passageId/status",
  validateRequest(passageIdParamsSchema, "params"),
  validateRequest(updatePassageStatusSchema),
  updatePassageStatus,
);

router.delete(
  "/passages/:passageId",
  validateRequest(passageIdParamsSchema, "params"),
  deleteTypingPassage,
);

export default router;
