const TypingExam = require("../models/TypingExam");
const TypingPassage = require("../models/TypingPassage");
const TypingAttempt = require("../models/TypingAttempt");
const TypingResult = require("../models/TypingResult");

const { getTypingRule } = require("../rules/typing.rules");

const {
  calculateTypingResult,
  sha256,
} = require("../services/typingResult.service");

async function startExam(req, res) {
  try {
    const userId = req.user.id;
    const examCode = req.params.examCode.trim().toUpperCase();

    const exam = await TypingExam.findOne({
      code: examCode,
      status: "ACTIVE",
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Active exam not found.",
      });
    }

    const rule = getTypingRule(exam.policyId);

    const passage = await TypingPassage.findOne({
      examId: exam._id,
      language: exam.language,
      status: "ACTIVE",
    });

    if (!passage) {
      return res.status(404).json({
        success: false,
        message: "Active passage not available.",
      });
    }

    const attempt = await TypingAttempt.create({
      userId,
      examId: exam._id,
      passageId: passage._id,
      policyId: rule.id,
      policyVersion: rule.id ? "1.0.0" : "1.0.0",
      originalText: passage.text,
      startedAt: new Date(),
      status: "STARTED",
      evaluation: {
        status: "NOT_STARTED",
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        attemptId: attempt._id,
        exam: {
          id: exam._id,
          code: exam.code,
          name: exam.name,
          language: exam.language,
          examType: exam.examType,
        },
        passage: {
          id: passage._id,
          text: passage.text,
          wordCount: passage.wordCount,
        },
        durationSeconds: rule.durationSeconds,
        policyId: rule.id,
        startedAt: attempt.startedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to start exam.",
      error: error.message,
    });
  }
}

async function submitExam(req, res) {
  try {
    const userId = req.user.id;
    const attemptId = req.params.attemptId;

    const { typedText, submissionId, candidateCategory = "default" } = req.body;

    const attempt = await TypingAttempt.findOne({
      _id: attemptId,
      userId,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    if (attempt.status === "SUBMITTED") {
      const existing = await TypingResult.findOne({
        attemptId: attempt._id,
      });

      return res.json({
        success: true,
        idempotent: true,
        data: existing,
      });
    }

    const rule = getTypingRule(attempt.policyId);

    const startedAt = new Date(attempt.startedAt).getTime();
    const now = Date.now();

    const elapsedSeconds = Math.min(
      Math.max(1, Math.floor((now - startedAt) / 1000)),
      rule.durationSeconds,
    );

    const result = calculateTypingResult({
      policyId: attempt.policyId,
      expectedText: attempt.originalText,
      typedText,
      elapsedSeconds,
      candidateCategory,
    });

    const submittedTextHash = sha256(typedText);

    attempt.typedText = typedText;
    attempt.submittedAt = new Date();
    attempt.status = "SUBMITTED";

    attempt.submission = {
      idempotencyKey: submissionId,
      submittedTextHash,
    };

    attempt.evaluation = {
      status: "COMPLETED",
      completedAt: new Date(),
    };

    await attempt.save();

    const savedResult = await TypingResult.create({
      userId,
      attemptId: attempt._id,
      examId: attempt.examId,
      passageId: attempt.passageId,
      policyId: result.policyId,
      policyVersion: result.policyVersion,
      engineVersion: result.engineVersion,
      examType: result.examType,
      language: result.language,
      elapsedSeconds,
      coreResult: result.coreResult,
      officialResult: result.officialResult,
      officialCalculationAvailable: result.officialCalculationAvailable,
      finalScore: result.finalScore,
      qualified: result.qualified,
    });

    return res.status(200).json({
      success: true,
      message: "Typing exam submitted successfully.",
      data: {
        resultId: savedResult._id,
        attemptId: attempt._id,
        policyId: result.policyId,
        coreResult: result.coreResult,
        officialResult: result.officialResult,
        finalScore: result.finalScore,
        qualified: result.qualified,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await TypingResult.findOne({
        attemptId: req.params.attemptId,
      });

      if (existing) {
        return res.json({
          success: true,
          idempotent: true,
          data: existing,
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit typing exam.",
      error: error.message,
    });
  }
}

async function getResult(req, res) {
  try {
    const result = await TypingResult.findOne({
      _id: req.params.resultId,
      userId: req.user.id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found.",
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch result.",
    });
  }
}

module.exports = {
  startExam,
  submitExam,
  getResult,
};
