import express from "express";

import {
  createExamSchema,
  updateExamSchema,
  examParamsSchema,
  createVersionSchema,
  createPassageSchema,
  passageParamsSchema,
  createPolicySchema,
  getExamsQuerySchema,
} from "../validations/adminTyping.validation.js";

import {
  createExam,
  updateExam,
  getExams,
  createExamVersion,
  createPassage,
  createPolicy,
} from "../controllers/adminTyping.controller.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import { requireAdminSession } from "../../../middleware/requireAdminSession.js";
import asyncHandler from "../../../utils/asyncHandler.js";

const router = express.Router();

router.use(requireAdminSession);

router.post(
  "/exams",
  validateRequest(createExamSchema, "body"),
  asyncHandler(createExam),
);

router.get(
  "/exams",
  validateRequest(getExamsQuerySchema, "query"),
  asyncHandler(getExams),
);

router.patch(
  "/exams/:examId",
  validateRequest(examParamsSchema, "params"),
  validateRequest(updateExamSchema, "body"),
  asyncHandler(updateExam),
);

router.post(
  "/exam-versions",
  validateRequest(createVersionSchema, "body"),
  asyncHandler(createExamVersion),
);

router.post(
  "/passages",
  validateRequest(createPassageSchema, "body"),
  asyncHandler(createPassage),
);

router.post(
  "/evaluation-policies",
  validateRequest(createPolicySchema, "body"),
  asyncHandler(createPolicy),
);

export default router;
