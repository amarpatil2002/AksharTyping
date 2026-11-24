const TypingExam = require("../models/TypingExam");
const TypingPassage = require("../models/TypingPassage");
const {
  getTypingRule,
  getAllTypingRules,
  POLICY_VERSION,
} = require("../rules/typing.rules");

async function createExam(req, res) {
  try {
    const { name, code, policyId, description } = req.body;
    const rule = getTypingRule(policyId);

    const normalizedCode = code.trim().toUpperCase();

    const exists = await TypingExam.findOne({ code: normalizedCode });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Exam code already exists.",
      });
    }

    const exam = await TypingExam.create({
      name: name.trim(),
      code: normalizedCode,
      policyId: rule.id,
      policyVersion: POLICY_VERSION,
      language: rule.language,
      examType: rule.examType,
      durationSeconds: rule.durationSeconds,
      description: description || "",
      status: "DRAFT",
    });

    return res.status(201).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create exam.",
      error: error.message,
    });
  }
}

async function getPolicies(req, res) {
  return res.json({
    success: true,
    data: getAllTypingRules(),
  });
}

async function getExams(req, res) {
  try {
    const exams = await TypingExam.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: exams });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch exams.",
    });
  }
}

async function createPassage(req, res) {
  try {
    const { examId, title, text } = req.body;

    const exam = await TypingExam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    const rule = getTypingRule(exam.policyId);

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    if (
      rule.passage.requiredWords &&
      wordCount !== rule.passage.requiredWords
    ) {
      return res.status(400).json({
        success: false,
        message: `Passage must contain exactly ${rule.passage.requiredWords} words.`,
        expectedWords: rule.passage.requiredWords,
        actualWords: wordCount,
      });
    }

    const passage = await TypingPassage.create({
      examId,
      title: title.trim(),
      text: text.trim(),
      language: exam.language,
      wordCount,
      status: "DRAFT",
    });

    return res.status(201).json({
      success: true,
      data: passage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create passage.",
      error: error.message,
    });
  }
}

async function getPassages(req, res) {
  try {
    const filter = {};
    if (req.query.examId) filter.examId = req.query.examId;

    const passages = await TypingPassage.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: passages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch passages.",
    });
  }
}

async function updateExamStatus(req, res) {
  try {
    const allowed = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"];

    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam status.",
      });
    }

    const exam = await TypingExam.findByIdAndUpdate(
      req.params.examId,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    return res.json({
      success: true,
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update exam status.",
    });
  }
}

async function updatePassageStatus(req, res) {
  try {
    const allowed = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"];

    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid passage status.",
      });
    }

    const passage = await TypingPassage.findByIdAndUpdate(
      req.params.passageId,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!passage) {
      return res.status(404).json({
        success: false,
        message: "Passage not found.",
      });
    }

    return res.json({
      success: true,
      data: passage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update passage status.",
    });
  }
}

module.exports = {
  createExam,
  getPolicies,
  getExams,
  createPassage,
  getPassages,
  updateExamStatus,
  updatePassageStatus,
};
