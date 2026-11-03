import { Router } from "express";

import requireAdminSession from "../../../../middleware/requireAdminSession.js";
import validateRequest from "../../../../middleware/validateRequest.js";

import {
  createTypingExamSchema,
  updateTypingExamSchema,
  updateExamStatusSchema,
  examIdParamsSchema,
  examQuerySchema,
} from "../adminTyping.validation.js";

import {
  createTypingExam,
  getTypingExams,
  getTypingExamById,
  updateTypingExam,
  updateTypingExamStatus,
  deleteTypingExam,
} from "./adminTypingExam.controller.js";

const router = Router();

router.use(requireAdminSession);

router.post(
  "/",
  validateRequest(createTypingExamSchema, "body"),
  createTypingExam,
);

router.get("/", validateRequest(examQuerySchema, "query"), getTypingExams);

router.get(
  "/:examId",
  validateRequest(examIdParamsSchema, "params"),
  getTypingExamById,
);

router.patch(
  "/:examId/status",
  validateRequest(examIdParamsSchema, "params"),
  validateRequest(updateExamStatusSchema, "body"),
  updateTypingExamStatus,
);

router.patch(
  "/:examId",
  validateRequest(examIdParamsSchema, "params"),
  validateRequest(updateTypingExamSchema, "body"),
  updateTypingExam,
);

router.delete(
  "/:examId",
  validateRequest(examIdParamsSchema, "params"),
  deleteTypingExam,
);

export default router;
