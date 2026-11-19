import TypingExam from "../models/typingExam.model.js";
import TypingExamVersion from "../models/typingExamVersion.model.js";
import TypingPassage from "../models/typingPassage.model.js";
import TypingAttempt from "../models/typingAttempt.model.js";
import TypingEvaluation from "../models/typingEvaluation.model.js";
import ExamEvaluation from "../models/examEvaluation.model.js";
import EvaluationPolicy from "../models/evaluationPolicy.model.js";
import { randomUUID } from "node:crypto";

import { calculateCommonTypingResult } from "../services/commonTypingEvaluation.service.js";
import { evaluateExamPolicy } from "../services/examEvaluation.service.js";
import { EXAM_EVALUATOR_REGISTRY } from "../exam-utilities/examRegistry.js";

export async function getExams(req, res) {
  const exams = await TypingExam.find({ status: "ACTIVE" })
    .select(
      "title slug examCode authority postName examType language description",
    )
    .sort({ title: 1 })
    .lean();

  return res.json({ success: true, data: exams });
}

export async function getExam(req, res) {
  const exam = await TypingExam.findOne({
    _id: req.params.examId,
    status: "ACTIVE",
  }).lean();

  if (!exam)
    return res.status(404).json({ success: false, message: "Exam not found." });
  return res.json({ success: true, data: exam });
}

export async function getExamVersions(req, res) {
  const { examId } = req.validatedParams ?? req.params;
  const exam = await TypingExam.exists({ _id: examId, status: "ACTIVE" });
  if (!exam) {
    return res.status(404).json({ success: false, message: "Exam not found." });
  }

  const now = new Date();
  const versions = await TypingExamVersion.find({
    examId,
    status: "ACTIVE",
    effectiveFrom: { $lte: now },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }],
  })
    .select("version recruitmentCycle effectiveFrom effectiveTo")
    .sort({ effectiveFrom: -1, version: -1 })
    .lean();
  return res.json({ success: true, data: versions });
}

export async function getExamPassages(req, res) {
  const { examVersionId } = req.validatedParams ?? req.params;
  const now = new Date();
  const version = await TypingExamVersion.findOne({
    _id: examVersionId,
    status: "ACTIVE",
    effectiveFrom: { $lte: now },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }],
  })
    .select("_id examId")
    .lean();
  if (!version) {
    return res.status(404).json({ success: false, message: "Exam version not found." });
  }

  const exam = await TypingExam.exists({ _id: version.examId, status: "ACTIVE" });
  if (!exam) {
    return res.status(404).json({ success: false, message: "Exam version not found." });
  }

  const passages = await TypingPassage.find({
    examId: version.examId,
    examVersionId,
    status: "ACTIVE",
  })
    .select("title language content wordCount characterCount difficulty")
    .sort({ createdAt: 1 })
    .lean();
  return res.json({ success: true, data: passages });
}

export async function getPassage(req, res) {
  const passage = await TypingPassage.findOne({
    _id: req.params.passageId,
    status: "ACTIVE",
  })
    .select(
      "title language content wordCount characterCount difficulty examId examVersionId",
    )
    .lean();

  if (!passage)
    return res
      .status(404)
      .json({ success: false, message: "Passage not found." });

  const [exam, version] = await Promise.all([
    TypingExam.exists({ _id: passage.examId, status: "ACTIVE" }),
    TypingExamVersion.exists({
      _id: passage.examVersionId,
      examId: passage.examId,
      status: "ACTIVE",
      effectiveFrom: { $lte: new Date() },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: new Date() } }],
    }),
  ]);
  if (!exam || !version) {
    return res.status(404).json({ success: false, message: "Passage not found." });
  }
  return res.json({ success: true, data: passage });
}

export async function startAttempt(req, res) {
  const { examId, examVersionId, passageId, language } =
    req.validatedBody ?? req.body;

  const [exam, version] = await Promise.all([
    TypingExam.findOne({ _id: examId, status: "ACTIVE" }).select("_id").lean(),
    TypingExamVersion.findOne({
      _id: examVersionId,
      examId,
      status: "ACTIVE",
      effectiveFrom: { $lte: new Date() },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: new Date() } }],
    }).select("_id").lean(),
  ]);

  if (!exam || !version) {
    return res.status(404).json({
      success: false,
      message: "Active exam and exam version are required to start an attempt.",
    });
  }

  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId,
    examVersionId,
    status: "ACTIVE",
  })
    .select("_id language")
    .lean();

  if (!passage) {
    return res
      .status(404)
      .json({ success: false, message: "Active passage not found." });
  }

  if (passage.language !== language) {
    return res.status(400).json({
      success: false,
      message: "Attempt language must match the selected passage language.",
    });
  }

  const policy = await EvaluationPolicy.findOne({
    examVersionId,
    isActive: true,
  })
    .sort({ version: -1 })
    .select("_id duration")
    .lean();

  if (!policy) {
    return res.status(409).json({
      success: false,
      message: "Evaluation policy is not configured for this exam version.",
    });
  }

  const attempt = await TypingAttempt.create({
    attemptId: `ATT-${randomUUID()}`,
    candidateId: req.user._id ?? req.user.id,
    examId,
    examVersionId,
    passageId,
    policyId: policy._id,
    language,
    startedAt: new Date(),
    status: "STARTED",
  });

  return res.status(201).json({
    success: true,
    data: {
      attemptId: attempt.attemptId,
      startedAt: attempt.startedAt,
      examId,
      examVersionId,
      passageId,
      language,
      durationSeconds: policy.duration.seconds,
    },
  });
}

export async function getAttemptResult(req, res) {
  const candidateId = req.user?._id ?? req.user?.id;
  const { attemptId } = req.validatedParams ?? req.params;
  const attempt = await TypingAttempt.findOne({ attemptId, candidateId })
    .select("attemptId status startedAt submittedAt durationSeconds examId examVersionId passageId")
    .lean();

  if (!attempt) {
    return res.status(404).json({ success: false, message: "Attempt not found." });
  }

  const [common, exam] = await Promise.all([
    TypingEvaluation.findOne({ attemptId: attempt._id }).lean(),
    ExamEvaluation.findOne({ attemptId: attempt._id }).lean(),
  ]);

  return res.json({
    success: true,
    data: { attempt, common, exam },
  });
}

export async function submitAttempt(req, res, next) {
  try {
    const candidateId = req.user?._id ?? req.user?.id;

    if (!candidateId) {
      return res.status(401).json({
        success: false,
        message: "Candidate authentication is required.",
      });
    }

    const { attemptId } = req.validatedParams ?? req.params;
    const { typedText, progressVersion } = req.validatedBody ?? req.body;

    /* ---------------------------------------------------------------------- */
    /* 1. Load attempt                                                       */
    /* ---------------------------------------------------------------------- */

    const attempt = await TypingAttempt.findOne({
      attemptId,
      candidateId,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    const retryingSubmission = attempt.status === "SUBMITTED";

    if (attempt.status === "EVALUATED") {
      const [common, exam] = await Promise.all([
        TypingEvaluation.findOne({ attemptId: attempt._id }).lean(),
        ExamEvaluation.findOne({ attemptId: attempt._id }).lean(),
      ]);
      return res.json({
        success: true,
        message: "Typing attempt evaluated successfully.",
        data: {
          attemptId: attempt.attemptId,
          attempt: {
            id: attempt._id,
            status: attempt.status,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            durationSeconds: attempt.durationSeconds,
          },
          common,
          exam,
        },
      });
    }

    if (attempt.status !== "STARTED" && !retryingSubmission) {
      return res.status(409).json({
        success: false,
        message: "Attempt is already submitted/evaluated.",
      });
    }

    if (retryingSubmission && attempt.typedText !== typedText) {
      return res.status(409).json({
        success: false,
        message: "This attempt is already submitted with different typing data.",
      });
    }

    /* ---------------------------------------------------------------------- */
    /* 2. Load passage                                                       */
    /* ---------------------------------------------------------------------- */

    const passage = await TypingPassage.findOne({
      _id: attempt.passageId,
      examId: attempt.examId,
      examVersionId: attempt.examVersionId,
      status: "ACTIVE",
    })
      .select("content language")
      .lean();

    if (!passage) {
      return res.status(409).json({
        success: false,
        message: "Typing passage is not configured for this attempt.",
      });
    }

    /* ---------------------------------------------------------------------- */
    /* 3. Load active evaluation policy                                     */
    /* ---------------------------------------------------------------------- */

    const policy = attempt.policyId
      ? await EvaluationPolicy.findById(attempt.policyId).lean()
      : await EvaluationPolicy.findOne({
          examVersionId: attempt.examVersionId,
          isActive: true,
        })
          .sort({ version: -1 })
          .lean();

    if (!policy) {
      return res.status(409).json({
        success: false,
        message: "Evaluation policy is not configured for this exam version.",
      });
    }

    if (!policy.evaluator) {
      return res.status(409).json({
        success: false,
        message: "Evaluation policy does not define an evaluator.",
      });
    }

    const evaluator = EXAM_EVALUATOR_REGISTRY[policy.evaluator];
    if (!evaluator || typeof evaluator.evaluate !== "function") {
      return res.status(409).json({
        success: false,
        message: `No evaluator is registered for policy evaluator "${policy.evaluator}".`,
      });
    }

    // `errors` is retained as a read fallback for policy documents created
    // before the schema field was renamed to avoid Mongoose's reserved path.
    const errorRules = policy.errorRules ?? policy.errors;

    if (
      !Number.isSafeInteger(policy.duration?.seconds) ||
      policy.duration.seconds <= 0
    ) {
      return res.status(409).json({
        success: false,
        message: "Evaluation policy has an invalid duration configuration.",
      });
    }

    if (
      ["FULL_HALF", "POLICY_DEFINED"].includes(errorRules?.method) ||
      ["GROUPED_ERRORS", "POLICY_DEFINED"].includes(policy.penalty?.method) ||
      policy.speed?.grossMethod === "POLICY_DEFINED" ||
      policy.speed?.netMethod === "POLICY_DEFINED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This evaluation policy uses a formula that is not supported by the configured exam evaluator.",
      });
    }

    if (
      evaluator.family === "RRB" &&
      (errorRules?.method !== "WORD_BASED" ||
        policy.penalty?.method !== "NONE" ||
        policy.scoring?.maximumMarks != null ||
        errorRules?.allowedPercentage != null)
    ) {
      return res.status(409).json({
        success: false,
        message:
          "RRB policies use word mistakes and the registered RRB deduction formula; character scoring and separate marks penalties are not supported.",
      });
    }

    /* ---------------------------------------------------------------------- */
    /* 5. Calculate duration on server                                       */
    /* ---------------------------------------------------------------------- */

    const startedAt = new Date(attempt.startedAt);

    if (Number.isNaN(startedAt.getTime())) {
      return res.status(409).json({
        success: false,
        message: "Attempt start time is invalid.",
      });
    }

    const submittedAt = retryingSubmission
      ? new Date(attempt.submittedAt)
      : new Date();
    const elapsedMilliseconds = submittedAt.getTime() - startedAt.getTime();

    if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds < 0) {
      return res.status(409).json({
        success: false,
        message: "Attempt timestamps are invalid.",
      });
    }

    const durationSeconds = retryingSubmission
      ? attempt.durationSeconds
      : Math.max(1, Math.floor(elapsedMilliseconds / 1000));

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return res.status(409).json({
        success: false,
        message: "Attempt duration is invalid.",
      });
    }

    if (!retryingSubmission && durationSeconds > policy.duration.seconds) {
      await TypingAttempt.updateOne(
        { _id: attempt._id, status: "STARTED" },
        { $set: { status: "EXPIRED" } },
      );
      return res.status(409).json({
        success: false,
        message: "The allowed typing duration has expired.",
      });
    }

    if (!retryingSubmission) {
      const claim = await TypingAttempt.updateOne(
        { _id: attempt._id, status: "STARTED" },
        {
          $set: {
            typedText,
            submittedAt,
            durationSeconds,
            status: "SUBMITTED",
            ...(progressVersion !== undefined ? { progressVersion } : {}),
          },
        },
      );

      if (claim.modifiedCount !== 1) {
        return res.status(409).json({
          success: false,
          message: "Attempt submission is already being processed.",
        });
      }
    }

    /* ---------------------------------------------------------------------- */
    /* 6. Calculate common typing result                                    */
    /* ---------------------------------------------------------------------- */

    const common = calculateCommonTypingResult({
      expectedText: passage.content,
      typedText,
      durationSeconds,
      normalization: policy.normalization ?? "NFC",
      rounding: policy.rounding ?? {
        method: "ROUND",
        decimalPlaces: 2,
      },
    });

    /* ---------------------------------------------------------------------- */
    /* 7. Run exam-specific evaluator                                       */
    /* ---------------------------------------------------------------------- */

    let examResult;

    /*
     * The common engine is responsible for:
     *
     * - word counting
     * - character counting
     * - alignment
     * - mistake detection
     * - WPM / CPM / KDPH
     * - accuracy
     *
     * The exam evaluator is responsible for:
     *
     * - exam-specific formula
     * - penalties
     * - marks
     * - qualification
     * - final result
     */

    const language =
      attempt.language ?? passage.language ?? policy.language ?? "english";
    const evaluatorConfig = policy.evaluatorConfig ?? {};
    const rrbDefaults = {
      RRB_NTPC_CBTST: {
        minimumWpm: language === "hindi" ? 25 : 30,
        useIgnorableMistakes: false,
        ignorableMistakePercentage: 0,
      },
      RRB_LEGACY_25_30: {
        minimumWpm: language === "hindi" ? 25 : 30,
        useIgnorableMistakes: true,
        ignorableMistakePercentage: 5,
      },
      RRB_40_35_NO_IGNORABLE: {
        minimumWpm: language === "hindi" ? 35 : 40,
        useIgnorableMistakes: false,
        ignorableMistakePercentage: 0,
      },
    }[policy.evaluator];

    if (policy.evaluator === "HIGH_COURT_MULTI_LANGUAGE") {
      return res.status(409).json({
        success: false,
        message:
          "Multi-language evaluations require separate language attempts and are not supported by this single-passage attempt endpoint.",
      });
    }

    const mistakes =
      errorRules?.method === "CHARACTER_BASED" ||
      errorRules?.method === "STROKE_BASED"
        ? Number(common.errorMetrics?.characterErrors ?? 0)
        : Number(common.errorMetrics?.wordErrors ?? common.errorMetrics?.total ?? 0);
    if (evaluator.family === "RRB") {
      examResult = evaluator.evaluate({
      totalWords: Number(common.words?.typed ?? 0),
      finalMistakes: mistakes,
      durationSeconds: Number(common.duration?.seconds ?? durationSeconds),
      language,
      minimumWpm: Number(
        evaluatorConfig.minimumWpm ??
          policy.qualification?.minimumSpeed ??
          rrbDefaults?.minimumWpm ??
          0,
      ),

      useIgnorableMistakes:
        evaluatorConfig.useIgnorableMistakes ??
        rrbDefaults?.useIgnorableMistakes,

      ignorableMistakePercentage: Number(
        evaluatorConfig.ignorableMistakePercentage ??
          rrbDefaults?.ignorableMistakePercentage ??
          0,
      ),

      deductionWordsPerMistake: Number(
        evaluatorConfig.deductionWordsPerMistake ?? 10,
      ),

      rounding: policy.rounding ?? {
        method: "ROUND",
        decimalPlaces: 2,
      },
      });
    } else if (evaluator.family === "RSSB") {
      if (policy.penalty?.method !== "NONE" || policy.scoring?.maximumMarks != null) {
        return res.status(409).json({
          success: false,
          message: "RSSB LDC marks are calculated from correct words; configure scoring only through evaluatorConfig.",
        });
      }
      examResult = evaluator.evaluate({
        correctWords: Number(common.words?.correct ?? 0),
        durationSeconds: Number(common.duration?.seconds ?? durationSeconds),
        language,
        maximumMarks: Number(evaluatorConfig.maximumMarks ?? 25),
        minimumMarks: Number(evaluatorConfig.minimumMarks ?? 9),
        correctWordMark: evaluatorConfig.correctWordMark,
        rounding: policy.rounding ?? { method: "ROUND", decimalPlaces: 2 },
      });
    } else if (evaluator.family === "MPSC") {
      if (policy.penalty?.method !== "NONE" || policy.scoring?.maximumMarks != null) {
        return res.status(409).json({
          success: false,
          message: "MPSC typing-certificate practice uses a WPM threshold and does not award exam marks.",
        });
      }
      examResult = evaluator.evaluate({
        correctWords: Number(common.words?.correct ?? 0),
        durationSeconds: Number(common.duration?.seconds ?? durationSeconds),
        language,
        minimumWpm: evaluatorConfig.minimumWpm,
        rounding: policy.rounding ?? { method: "ROUND", decimalPlaces: 2 },
      });
    } else {
      examResult = evaluateExamPolicy({ commonResult: common, policy });
    }

    /* ---------------------------------------------------------------------- */
    /* 8. Validate evaluator result                                          */
    /* ---------------------------------------------------------------------- */

    if (!examResult || typeof examResult !== "object") {
      return res.status(500).json({
        success: false,
        message: `Evaluator "${policy.evaluator}" returned an invalid evaluation result.`,
      });
    }

    // Evaluators expose family-specific metrics. Persist them through the
    // same response contract so an otherwise successful evaluation is never
    // stored as INCOMPLETE merely because it used a legacy evaluator.
    if (examResult.calculation === undefined) {
      const achievedSpeed = Number(
        examResult.achievedWpm ?? examResult.grossWpm ?? examResult.correctWpm ?? 0,
      );
      const effectiveMistakes = Number(
        examResult.effectiveMistakes ?? examResult.finalMistakes ?? examResult.mistakes ?? 0,
      );
      const minimumSpeed = Number(
        policy.qualification?.minimumSpeed ?? examResult.requiredWpm ?? 0,
      );
      const speedQualified = examResult.speedQualified ?? achievedSpeed >= minimumSpeed;
      const errorQualified =
        examResult.errorQualified ??
        (policy.qualification?.maximumErrors == null ||
          effectiveMistakes <= policy.qualification.maximumErrors);
      const qualified = Boolean(examResult.qualified);
      examResult = {
        ...examResult,
        calculation: {
          formula: policy.evaluator,
          grossSpeed: Number(
            examResult.grossWpm ??
              (Number(examResult.totalWords ?? 0) * 60) / durationSeconds ??
              achievedSpeed,
          ),
          netSpeed: Number(examResult.achievedWpm ?? examResult.correctWpm ?? achievedSpeed),
          effectiveMistakes,
          penalty: Number(examResult.penalty ?? 0),
        },
        score: {
          ...(examResult.score ?? {}),
          ...(examResult.marks != null ? { marks: examResult.marks } : {}),
          ...(examResult.maximumMarks != null
            ? { maximumMarks: examResult.maximumMarks }
            : {}),
          ...(examResult.percentage != null
            ? { percentage: examResult.percentage }
            : {}),
        },
        qualification: {
          minimumSpeed,
          achievedSpeed,
          speedQualified,
          errorQualified,
          overallQualified: qualified,
        },
        result: qualified ? "PASS" : "FAIL",
        engineVersion: "1.0.0",
      };
    }

    /* ---------------------------------------------------------------------- */
    /* 9. Persist submitted attempt                                          */
    /* ---------------------------------------------------------------------- */

    attempt.typedText = typedText;
    attempt.submittedAt = submittedAt;
    attempt.durationSeconds = durationSeconds;

    /* ---------------------------------------------------------------------- */
    /* 10. Save common evaluation                                           */
    /* ---------------------------------------------------------------------- */

    const commonEvaluation = await TypingEvaluation.findOneAndUpdate(
      {
        attemptId: attempt._id,
      },
      {
        $set: {
          attemptId: attempt._id,
          ...common,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    /* ---------------------------------------------------------------------- */
    /* 11. Save exam-specific evaluation                                    */
    /* ---------------------------------------------------------------------- */

    /*
     * examResult is expected to already contain the structure:
     *
     * {
     *   calculation: {...},
     *   score: {...},
     *   qualification: {...},
     *   result: "PASS",
     *   engineVersion: "1.0.0"
     * }
     */

    const examEvaluation = await ExamEvaluation.findOneAndUpdate(
      {
        attemptId: attempt._id,
      },
      {
        $set: {
          attemptId: attempt._id,
          examVersionId: attempt.examVersionId,
          policyId: policy._id,

          calculation: examResult.calculation ?? {},
          score: examResult.score ?? {},
          qualification: examResult.qualification ?? {},

          result: examResult.result ?? "INCOMPLETE",
          resultScope: examResult.resultScope ?? "EXAM_RESULT",

          engineVersion: examResult.engineVersion ?? "1.0.0",
          practiceOnly: examResult.practiceOnly === true,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    /* ---------------------------------------------------------------------- */
    /* 12. Mark attempt evaluated                                            */
    /* ---------------------------------------------------------------------- */

    const evaluated = await TypingAttempt.updateOne(
      { _id: attempt._id, status: "SUBMITTED" },
      { $set: { status: "EVALUATED" } },
    );
    if (evaluated.matchedCount !== 1) {
      const currentStatus = await TypingAttempt.findById(attempt._id)
        .select("status")
        .lean();
      if (currentStatus?.status !== "EVALUATED") {
        return res.status(409).json({
          success: false,
          message: "Attempt evaluation could not be finalized.",
        });
      }
    }
    attempt.status = "EVALUATED";

    /* ---------------------------------------------------------------------- */
    /* 13. Return result                                                     */
    /* ---------------------------------------------------------------------- */

    return res.status(200).json({
      success: true,
      message: "Typing attempt evaluated successfully.",

      data: {
        attemptId: attempt.attemptId,

        attempt: {
          id: attempt._id,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          durationSeconds: attempt.durationSeconds,
        },

        common: commonEvaluation,

        exam: examEvaluation,
      },
    });
  } catch (error) {
    if (error.statusCode === 413) {
      await TypingAttempt.updateOne(
        { attemptId: req.params.attemptId, status: "SUBMITTED" },
        { $set: { status: "INVALID" } },
      );
    }
    return next(error);
  }
}
