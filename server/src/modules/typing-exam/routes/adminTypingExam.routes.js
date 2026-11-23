import { Router } from "express";
import {
  createTypingExam,
  getTypingExams,
  getTypingExamById,
  updateTypingExam,
  updateTypingExamStatus,
  deleteTypingExam,
  createTypingPassage,
  getTypingPassages,
  getTypingPassageById,
  updateTypingPassage,
  updateTypingPassageStatus,
  deleteTypingPassage,
} from "../controllers/adminTypingExam.controller.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import {
  createTypingExamSchema,
  updateTypingExamSchema,
  updateExamStatusSchema,
  examIdParamsSchema,
  examQuerySchema,
  createTypingPassageSchema,
  updateTypingPassageSchema,
  updatePassageStatusSchema,
  passageRouteParamsSchema,
  passageQuerySchema,
} from "../validators/typingAdminValidation.js";

const router = Router();

router.post("/exams", validateRequest(createTypingExamSchema), createTypingExam);
router.get("/exams", validateRequest(examQuerySchema, "query"), getTypingExams);
router.get(
  "/exams/:examId",
  validateRequest(examIdParamsSchema, "params"),
  getTypingExamById,
);
router.patch(
  "/exams/:examId",
  validateRequest(examIdParamsSchema, "params"),
  validateRequest(updateTypingExamSchema),
  updateTypingExam,
);
router.patch(
  "/exams/:examId/status",
  validateRequest(examIdParamsSchema, "params"),
  validateRequest(updateExamStatusSchema),
  updateTypingExamStatus,
);
router.delete(
  "/exams/:examId",
  validateRequest(examIdParamsSchema, "params"),
  deleteTypingExam,
);

router.post("/passages", validateRequest(createTypingPassageSchema), createTypingPassage);
router.get(
  "/passages",
  validateRequest(passageQuerySchema, "query"),
  getTypingPassages,
);
router.get(
  "/passages/:passageId",
  validateRequest(passageRouteParamsSchema, "params"),
  getTypingPassageById,
);
router.patch(
  "/passages/:passageId",
  validateRequest(passageRouteParamsSchema, "params"),
  validateRequest(updateTypingPassageSchema),
  updateTypingPassage,
);
router.patch(
  "/passages/:passageId/status",
  validateRequest(passageRouteParamsSchema, "params"),
  validateRequest(updatePassageStatusSchema),
  updateTypingPassageStatus,
);
router.delete(
  "/passages/:passageId",
  validateRequest(passageRouteParamsSchema, "params"),
  deleteTypingPassage,
);

export default router;
