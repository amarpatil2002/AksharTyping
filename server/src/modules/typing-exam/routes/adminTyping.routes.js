const express = require("express");

const {
  createExam,
  getPolicies,
  getExams,
  createPassage,
  getPassages,
  updateExamStatus,
  updatePassageStatus,
} = require("../controllers/adminTyping.controller");

const {
  validateCreateExam,
} = require("../validators/exam.validator");

const {
  validateCreatePassage,
} = require("../validators/passage.validator");

const router = express.Router();

router.get("/policies", getPolicies);

router.post(
  "/exams",
  validateCreateExam,
  createExam
);

router.get(
  "/exams",
  getExams
);

router.patch(
  "/exams/:examId/status",
  updateExamStatus
);

router.post(
  "/passages",
  validateCreatePassage,
  createPassage
);

router.get(
  "/passages",
  getPassages
);

router.patch(
  "/passages/:passageId/status",
  updatePassageStatus
);

module.exports = router;
