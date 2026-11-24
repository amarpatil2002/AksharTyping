const express = require("express");

const {
  startExam,
  submitExam,
  getResult,
} = require("../controllers/userTyping.controller");

const {
  validateStartExam,
  validateSubmitAttempt,
} = require("../validators/attempt.validator");

const {
  validateResultId,
} = require("../validators/result.validator");

const router = express.Router();

router.post(
  "/exams/:examCode/start",
  validateStartExam,
  startExam
);

router.post(
  "/attempts/:attemptId/submit",
  validateSubmitAttempt,
  submitExam
);

router.get(
  "/results/:resultId",
  validateResultId,
  getResult
);

module.exports = router;
