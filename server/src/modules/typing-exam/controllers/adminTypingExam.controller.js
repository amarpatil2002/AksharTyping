import mongoose from "mongoose";
import { TypingExam } from "../models/TypingExam.model.js";
import { TypingPassage } from "../models/TypingPassage.model.js";
import { getTypingPolicy } from "../config/typingExamPolicies.config.js";

function countWords(text) {
  const normalized = String(text ?? "")
    .normalize("NFC")
    .trim();
  return normalized ? normalized.split(/\s+/u).length : 0;
}

function countCharacters(text) {
  return Array.from(String(text ?? "").normalize("NFC")).length;
}

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

/* ---------------- EXAM ---------------- */

export async function createTypingExam(req, res) {
  try {
    const body = req.body;

    const policy = getTypingPolicy(body.policyId);

    if (!policy) {
      return res.status(400).json({
        success: false,
        message: `Unknown typing policy: ${body.policyId}`,
      });
    }

    const exam = await TypingExam.create({
      ...body,
      policyVersion: policy.version ?? "2.0.0",
      formulaVersion: policy.formula?.version ?? null,
      isOfficial: policy.status === "VERIFIED",
    });

    return res.status(201).json({
      success: true,
      message: "Typing exam created successfully.",
      data: exam,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getTypingExams(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      language,
      authority,
      examType,
      search,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (language) filter.language = language;
    if (authority) filter.authority = authority;
    if (examType) filter.examType = examType;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { postName: { $regex: search, $options: "i" } },
        { examCode: { $regex: search, $options: "i" } },
      ];
    }

    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));

    const [items, total] = await Promise.all([
      TypingExam.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),

      TypingExam.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getTypingExamById(req, res) {
  try {
    const { examId } = req.params;

    if (!isObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid examId.",
      });
    }

    const exam = await TypingExam.findById(examId).lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Typing exam not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateTypingExam(req, res) {
  try {
    const { examId } = req.params;

    if (!isObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid examId.",
      });
    }

    if (req.body.policyId) {
      const policy = getTypingPolicy(req.body.policyId);

      if (!policy) {
        return res.status(400).json({
          success: false,
          message: `Unknown typing policy: ${req.body.policyId}`,
        });
      }

      req.body.policyVersion = policy.version ?? "2.0.0";
      req.body.formulaVersion = policy.formula?.version ?? null;
      req.body.isOfficial = policy.status === "VERIFIED";
    }

    const exam = await TypingExam.findByIdAndUpdate(
      examId,
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Typing exam not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Typing exam updated successfully.",
      data: exam,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateTypingExamStatus(req, res) {
  try {
    const { examId } = req.params;
    const { status } = req.body;

    if (!isObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid examId.",
      });
    }

    const exam = await TypingExam.findByIdAndUpdate(
      examId,
      { $set: { status } },
      { new: true, runValidators: true },
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Typing exam not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam status updated successfully.",
      data: exam,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deleteTypingExam(req, res) {
  try {
    const { examId } = req.params;

    if (!isObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid examId.",
      });
    }

    const exam = await TypingExam.findByIdAndDelete(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Typing exam not found.",
      });
    }

    await TypingPassage.deleteMany({ examId });

    return res.status(200).json({
      success: true,
      message: "Typing exam and its passages deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/* ---------------- PASSAGE ---------------- */

export async function createTypingPassage(req, res) {
  try {
    const { examId, title, language, content, difficulty, status, metadata } =
      req.body;

    if (!isObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid examId.",
      });
    }

    const exam = await TypingExam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Parent typing exam not found.",
      });
    }

    if (exam.language !== language) {
      return res.status(400).json({
        success: false,
        message: "Passage language must match the exam language.",
      });
    }

    const passage = await TypingPassage.create({
      examId,
      title,
      language,
      content,
      wordCount: countWords(content),
      characterCount: countCharacters(content),
      difficulty,
      status,
      metadata,
    });

    return res.status(201).json({
      success: true,
      message: "Typing passage created successfully.",
      data: passage,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getTypingPassages(req, res) {
  try {
    const {
      examId,
      page = 1,
      limit = 20,
      status,
      language,
      difficulty,
    } = req.query;

    const filter = {};

    if (examId) {
      if (!isObjectId(examId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid examId.",
        });
      }
      filter.examId = examId;
    }

    if (status) filter.status = status;
    if (language) filter.language = language;
    if (difficulty) filter.difficulty = difficulty;

    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));

    const [items, total] = await Promise.all([
      TypingPassage.find(filter)
        .populate("examId", "title slug authority postName language")
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),

      TypingPassage.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getTypingPassageById(req, res) {
  try {
    const { passageId } = req.params;

    if (!isObjectId(passageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid passageId.",
      });
    }

    const passage = await TypingPassage.findById(passageId)
      .populate("examId", "title slug authority postName language")
      .lean();

    if (!passage) {
      return res.status(404).json({
        success: false,
        message: "Typing passage not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: passage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateTypingPassage(req, res) {
  try {
    const { passageId } = req.params;

    if (!isObjectId(passageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid passageId.",
      });
    }

    const passage = await TypingPassage.findById(passageId);

    if (!passage) {
      return res.status(404).json({
        success: false,
        message: "Typing passage not found.",
      });
    }

    if (req.body.examId) {
      if (!isObjectId(req.body.examId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid examId.",
        });
      }

      const exam = await TypingExam.findById(req.body.examId);

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Parent typing exam not found.",
        });
      }

      if (req.body.language && req.body.language !== exam.language) {
        return res.status(400).json({
          success: false,
          message: "Passage language must match the exam language.",
        });
      }
    }

    if (req.body.language) {
      const exam = await TypingExam.findById(req.body.examId || passage.examId);

      if (exam && req.body.language !== exam.language) {
        return res.status(400).json({
          success: false,
          message: "Passage language must match the exam language.",
        });
      }
    }

    if (req.body.content !== undefined) {
      req.body.wordCount = countWords(req.body.content);
      req.body.characterCount = countCharacters(req.body.content);
    }

    const updated = await TypingPassage.findByIdAndUpdate(
      passageId,
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Typing passage updated successfully.",
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateTypingPassageStatus(req, res) {
  try {
    const { passageId } = req.params;
    const { status } = req.body;

    if (!isObjectId(passageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid passageId.",
      });
    }

    const passage = await TypingPassage.findByIdAndUpdate(
      passageId,
      { $set: { status } },
      { new: true, runValidators: true },
    );

    if (!passage) {
      return res.status(404).json({
        success: false,
        message: "Typing passage not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Passage status updated successfully.",
      data: passage,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deleteTypingPassage(req, res) {
  try {
    const { passageId } = req.params;

    if (!isObjectId(passageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid passageId.",
      });
    }

    const passage = await TypingPassage.findByIdAndDelete(passageId);

    if (!passage) {
      return res.status(404).json({
        success: false,
        message: "Typing passage not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Typing passage deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
