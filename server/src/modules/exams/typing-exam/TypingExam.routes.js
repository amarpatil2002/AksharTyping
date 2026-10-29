import { Router } from "express";
import { verifyToken } from "../../../middleware/verifyToken.js";

import {
  startTypingAttempt,
  saveTypingAttemptTimeline,
  submitTypingAttempt,
  getTypingAttemptResult,
} from "./TypingExam.controller.js";

import {
  validate,
  attemptIdParamSchema,
  startTypingAttemptSchema,
  submitTypingAttemptSchema,
  saveTypingAttemptTimelineSchema,
} from "./typingExam.validation.js";

const router = Router();

/* =====================================================
   TYPING ATTEMPT ROUTES
===================================================== */

// Start attempt
router.post(
  "/attempts/start",
  verifyToken,
  validate(startTypingAttemptSchema),
  startTypingAttempt,
);

// Save periodic typing metrics
router.post(
  "/attempts/:attemptId/timeline",
  verifyToken,
  validate(attemptIdParamSchema, "params"),
  validate(saveTypingAttemptTimelineSchema),
  saveTypingAttemptTimeline,
);

// Submit attempt
router.post(
  "/attempts/:attemptId/submit",
  verifyToken,
  validate(attemptIdParamSchema, "params"),
  validate(submitTypingAttemptSchema),
  submitTypingAttempt,
);

// Get attempt result
router.get(
  "/attempts/:attemptId/result",
  verifyToken,
  validate(attemptIdParamSchema, "params"),
  getTypingAttemptResult,
);

export default router;
