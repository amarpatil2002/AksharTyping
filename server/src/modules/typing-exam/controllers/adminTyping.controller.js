import TypingExam from "../models/typingExam.model.js";
import TypingExamVersion from "../models/typingExamVersion.model.js";
import TypingPassage from "../models/typingPassage.model.js";
import EvaluationPolicy from "../models/evaluationPolicy.model.js";
import { countGraphemes } from "../utils/text.utils.js";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const passageStats = (text = "") => ({
  wordCount: text.trim() ? text.trim().split(/\s+/u).length : 0,

  characterCount: countGraphemes(text),
});

const getDuplicateField = (error) => {
  if (error?.keyPattern) {
    return Object.keys(error.keyPattern)[0];
  }

  if (error?.keyValue) {
    return Object.keys(error.keyValue)[0];
  }

  return null;
};

const isDuplicateKeyError = (error) => error?.code === 11000;

const duplicateResponse = (res, error) => {
  const field = getDuplicateField(error);

  return res.status(409).json({
    success: false,
    message: field
      ? `A record with this ${field} already exists.`
      : "A record with the same unique value already exists.",
    field,
    value: field ? error?.keyValue?.[field] : undefined,
  });
};

/* -------------------------------------------------------------------------- */
/* Create Exam                                                                */
/* -------------------------------------------------------------------------- */

export async function createExam(req, res, next) {
  try {
    const body = req.validatedBody;

    const existingExam = await TypingExam.exists({
      examCode: body.examCode,
    });

    if (existingExam) {
      return res.status(409).json({
        success: false,
        message: "An exam with this examCode already exists.",
        data: {
          examId: existingExam._id,
          examCode: body.examCode,
        },
      });
    }

    const exam = await TypingExam.create(body);

    return res.status(201).json({
      success: true,
      message: "Exam created successfully.",
      data: exam,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return duplicateResponse(res, error);
    }

    return next(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Update Exam                                                                */
/* -------------------------------------------------------------------------- */

export async function updateExam(req, res, next) {
  try {
    const { examId } = req.validatedParams;
    const body = req.validatedBody;

    /*
     * If examCode is being changed, make sure another exam
     * does not already use it.
     */
    if (body.examCode) {
      const duplicate = await TypingExam.exists({
        examCode: body.examCode,
        _id: { $ne: examId },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Another exam already uses this examCode.",
          field: "examCode",
          value: body.examCode,
        });
      }
    }

    const exam = await TypingExam.findByIdAndUpdate(
      examId,
      { $set: body },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    return res.json({
      success: true,
      message: "Exam updated successfully.",
      data: exam,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return duplicateResponse(res, error);
    }

    return next(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Get Exams                                                                  */
/* -------------------------------------------------------------------------- */

export async function getExams(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      examType,
      language,
      search,
    } = req.validatedQuery ?? req.query;

    /*
     * req.query is already validated by middleware if a query schema
     * is attached to this route.
     */
    const currentPage = Math.max(Number(page) || 1, 1);
    const pageLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (examType) {
      filter.examType = examType;
    }

    if (language) {
      filter.language = language;
    }

    if (search?.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { title: searchRegex },
        { examCode: searchRegex },
        { postName: searchRegex },
        { authority: searchRegex },
      ];
    }

    const skip = (currentPage - 1) * pageLimit;

    const [items, total] = await Promise.all([
      TypingExam.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      TypingExam.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: currentPage,
          limit: pageLimit,
          total,
          pages: Math.ceil(total / pageLimit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Create Exam Version                                                        */
/* -------------------------------------------------------------------------- */

export async function createExamVersion(req, res, next) {
  try {
    const body = req.validatedBody;

    const exam = await TypingExam.exists({
      _id: body.examId,
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    const existingVersion = await TypingExamVersion.exists({
      examId: body.examId,
      version: body.version,
    });

    if (existingVersion) {
      return res.status(409).json({
        success: false,
        message: "This exam version already exists.",
        field: "version",
        value: body.version,
      });
    }

    const version = await TypingExamVersion.create(body);

    return res.status(201).json({
      success: true,
      message: "Exam version created successfully.",
      data: version,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return duplicateResponse(res, error);
    }

    return next(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Create Passage                                                             */
/* -------------------------------------------------------------------------- */

export async function createPassage(req, res, next) {
  try {
    const body = req.validatedBody;

    /*
     * Verify that the version exists and belongs to the
     * specified exam.
     */
    const version = await TypingExamVersion.findOne({
      _id: body.examVersionId,
      examId: body.examId,
    })
      .select("_id examId")
      .lean();

    if (!version) {
      return res.status(404).json({
        success: false,
        message: "Exam version does not belong to this exam.",
      });
    }

    /*
     * Never trust wordCount/characterCount supplied by the client.
     * They are calculated from the actual passage content.
     */
    const stats = passageStats(body.content);

    const passage = await TypingPassage.create({
      ...body,
      ...stats,
    });

    return res.status(201).json({
      success: true,
      message: "Typing passage created successfully.",
      data: passage,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return duplicateResponse(res, error);
    }

    return next(error);
  }
}

/* -------------------------------------------------------------------------- */
/* Create Evaluation Policy                                                   */
/* -------------------------------------------------------------------------- */

export async function createPolicy(req, res, next) {
  try {
    const body = req.validatedBody;

    const version = await TypingExamVersion.findById(body.examVersionId)
      .select("_id examId")
      .lean();

    if (!version) {
      return res.status(404).json({
        success: false,
        message: "Exam version not found.",
      });
    }

    /*
     * Your EvaluationPolicy has a unique combination of
     * examVersionId + version.
     */
    const existingPolicy = await EvaluationPolicy.exists({
      examVersionId: body.examVersionId,
      version: body.version,
    });

    if (existingPolicy) {
      return res.status(409).json({
        success: false,
        message:
          "An evaluation policy with this version already exists for this exam version.",
        field: "version",
        value: body.version,
      });
    }

    const { errors, ...policyFields } = body;
    const policy = await EvaluationPolicy.create({
      ...policyFields,
      errorRules: errors,
    });

    const policyData = policy.toObject();
    delete policyData.errorRules;
    policyData.errors = errors;

    return res.status(201).json({
      success: true,
      message: "Evaluation policy created successfully.",
      data: policyData,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return duplicateResponse(res, error);
    }

    return next(error);
  }
}
