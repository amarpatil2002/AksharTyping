import { Router } from "express";

// Replace this import with the actual user authentication middleware path/name
// used in your project. It must set req.user._id (or req.userId).
import { verifyToken } from "../../middleware/verifyToken.js";

import {
  getAvailableTypingExams,
  getAvailableTypingExamById,
  getAvailablePassages,
  startTypingAttempt,
  saveTypingProgress,
  submitTypingAttempt,
  getMyTypingAttempts,
  getMyTypingAttemptResult,
} from "./userTypingExam.controller.js";

const router = Router();

router.use(verifyToken);

// Candidate exam discovery
router.get("/exams", getAvailableTypingExams);
router.get("/exams/:examId", getAvailableTypingExamById);
router.get("/exams/:examId/passages", getAvailablePassages);

// Candidate attempt lifecycle
router.post("/exams/:examId/attempts", startTypingAttempt);
router.patch("/attempts/:attemptId/progress", saveTypingProgress);
router.post("/attempts/:attemptId/submit", submitTypingAttempt);

// Candidate history and result
router.get("/attempts", getMyTypingAttempts);
router.get("/attempts/:attemptId/result", getMyTypingAttemptResult);

export default router;
