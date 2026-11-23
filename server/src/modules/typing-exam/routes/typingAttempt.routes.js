import express from "express";

import {
  startTypingAttempt,
  updateTypingAttemptProgress,
  submitTypingAttempt,
  getTypingAttemptResult,
} from "../controllers/typingAttempt.controller.js";

import { validateRequest } from "../../../middleware/validateRequest.js";
import { verifyToken } from "../../../middleware/verifyToken.js";

import {
  startTypingAttemptSchema,
  typingAttemptIdParamsSchema,
  updateTypingAttemptProgressSchema,
  submitTypingAttemptSchema,
} from "../validators/typingAttemptValidation.js";

const router = express.Router();

router.post(
  "/exams/:examId/passages/:passageId/start",
  verifyToken,
  validateRequest(startTypingAttemptSchema, "params"),
  startTypingAttempt,
);

router.patch(
  "/attempts/:attemptId/progress",
  verifyToken,
  validateRequest(typingAttemptIdParamsSchema, "params"),
  validateRequest(updateTypingAttemptProgressSchema),
  updateTypingAttemptProgress,
);

router.post(
  "/attempts/:attemptId/submit",
  verifyToken,
  validateRequest(typingAttemptIdParamsSchema, "params"),
  validateRequest(submitTypingAttemptSchema),
  submitTypingAttempt,
);

router.get(
  "/attempts/:attemptId/result",
  verifyToken,
  validateRequest(typingAttemptIdParamsSchema, "params"),
  getTypingAttemptResult,
);

export default router;
