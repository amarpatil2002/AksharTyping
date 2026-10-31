import { Router } from "express";

import {
  getPublishedExams,
  getPublishedExamById,
  getExamPassages,
  startAttempt,
  getAttempts,
  getAttemptById,
  updateAttemptProgress,
  submitAttempt,
} from "./TypingExam.controller.js";

import {
  examParamsSchema,
  examQuerySchema,
  passageQuerySchema,
  attemptParamsSchema,
  attemptQuerySchema,
  updateAttemptProgressSchema,
  submitAttemptSchema,
} from "./typingExam.validation.js";

import { verifyToken } from "../../../middleware/verifyToken.js";
import { validateRequest } from "../../../middleware/validateRequest.js";

const router = Router();

// Authenticate using access token.
router.use(verifyToken);

// Published exams
router.get("/", validateRequest(examQuerySchema, "query"), getPublishedExams);

router.get(
  "/:examId",
  validateRequest(examParamsSchema, "params"),
  getPublishedExamById,
);

router.get(
  "/:examId/passages",
  validateRequest(examParamsSchema, "params"),
  validateRequest(passageQuerySchema, "query"),
  getExamPassages,
);

// Typing attempts
router.post(
  "/:examId/passages/:passageId/start",
  validateRequest(examParamsSchema, "params"),
  startAttempt,
);

router.get(
  "/attempts",
  validateRequest(attemptQuerySchema, "query"),
  getAttempts,
);

router.get(
  "/attempts/:attemptId",
  validateRequest(attemptParamsSchema, "params"),
  getAttemptById,
);

router.patch(
  "/attempts/:attemptId/progress",
  validateRequest(attemptParamsSchema, "params"),
  validateRequest(updateAttemptProgressSchema),
  updateAttemptProgress,
);

router.post(
  "/attempts/:attemptId/submit",
  validateRequest(attemptParamsSchema, "params"),
  validateRequest(submitAttemptSchema),
  submitAttempt,
);

export default router;
