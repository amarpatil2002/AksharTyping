import express from "express";

import {
  examIdParamsSchema,
  examVersionParamsSchema,
  passageParamsSchema,
  startAttemptSchema,
  attemptParamsSchema,
  submitAttemptSchema,
} from "../validations/userTyping.validation.js";

import {
  getExams,
  getExam,
  getExamVersions,
  getExamPassages,
  getPassage,
  startAttempt,
  getAttemptResult,
  submitAttempt,
} from "../controllers/userTyping.controller.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import { verifyToken } from "../../../middleware/verifyToken.js";
import asyncHandler from "../../../utils/asyncHandler.js";
import { apiLimiter } from "../../../middleware/rateLimiters.js";

const router = express.Router();

router.use(apiLimiter);

router.get("/exams", asyncHandler(getExams));

router.get(
  "/exams/:examId",
  verifyToken,
  validateRequest(examIdParamsSchema, "params"),
  asyncHandler(getExam),
);

router.get(
  "/exams/:examId/versions",
  verifyToken,
  validateRequest(examIdParamsSchema, "params"),
  asyncHandler(getExamVersions),
);

router.get(
  "/exam-versions/:examVersionId/passages",
  verifyToken,
  validateRequest(examVersionParamsSchema, "params"),
  asyncHandler(getExamPassages),
);

router.get(
  "/passages/:passageId",
  verifyToken,
  validateRequest(passageParamsSchema, "params"),
  asyncHandler(getPassage),
);

router.post(
  "/attempts",
  verifyToken,
  validateRequest(startAttemptSchema, "body"),
  asyncHandler(startAttempt),
);

router.get(
  "/attempts/:attemptId",
  verifyToken,
  validateRequest(attemptParamsSchema, "params"),
  asyncHandler(getAttemptResult),
);

router.post(
  "/attempts/:attemptId/submit",
  verifyToken,
  validateRequest(submitAttemptSchema, "body"),
  asyncHandler(submitAttempt),
);

export default router;
