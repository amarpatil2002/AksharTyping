import crypto from "node:crypto";

import { TypingExam } from "../models/TypingExam.model.js";
import { TypingPassage } from "../models/TypingPassage.model.js";
import TypingAttempt from "../models/TypingAttempt.model.js";
import TypingResult from "../models/TypingResult.model.js";

import {
  getTypingPolicy,
  POLICY_VERSION,
} from "../config/typingExamPolicies.config.js";

import { calculateTypingResult } from "../services/typingResultCore.js";

function success(res, statusCode, data = {}, message = "Success") {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function fail(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

function createTextHash(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

/**
 * START TYPING ATTEMPT
 */
export async function startTypingAttempt(req, res) {
  try {
    const { examId, passageId } = req.validatedParams;
    const userId = req.user._id;

    const exam = await TypingExam.findById(examId);

    if (!exam) {
      return fail(res, 404, "Typing exam not found.");
    }

    if (exam.status !== "ACTIVE") {
      return fail(res, 400, "Typing exam is not active.");
    }

    const passage = await TypingPassage.findById(passageId);

    if (!passage) {
      return fail(res, 404, "Typing passage not found.");
    }

    if (String(passage.examId) !== String(exam._id)) {
      return fail(
        res,
        400,
        "The selected passage does not belong to this exam.",
      );
    }

    if (passage.status !== "ACTIVE") {
      return fail(res, 400, "Typing passage is not active.");
    }

    /**
     * Policy is the source of truth for:
     * - duration
     * - exam type
     * - language
     * - formula version
     */
    const policy = getTypingPolicy(exam.policyId);

    if (!policy) {
      return fail(res, 500, "Typing exam policy is not configured correctly.");
    }

    if (
      policy.examType !== exam.examType ||
      policy.language !== exam.language
    ) {
      return fail(
        res,
        500,
        "Typing exam configuration does not match its policy.",
      );
    }

    const durationSeconds = Number(policy.durationSeconds ?? 0);

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return fail(res, 500, "Exam duration is not configured correctly.");
    }

    /**
     * Prevent multiple active attempts for the same
     * user and exam.
     */
    const existingAttempt = await TypingAttempt.findOne({
      userId,
      examId,
      status: {
        $in: ["IN_PROGRESS", "SUBMITTED", "EVALUATING"],
      },
    }).sort({ createdAt: -1 });

    if (existingAttempt) {
      return success(
        res,
        200,
        {
          attempt: existingAttempt,
        },
        "An active typing attempt already exists.",
      );
    }

    const startedAt = new Date();

    const attempt = await TypingAttempt.create({
      userId,
      examId: exam._id,
      passageId: passage._id,

      attemptType: "OFFICIAL",

      language: exam.language,
      examType: exam.examType,

      policyId: policy.id,

      policyVersion: policy.version ?? POLICY_VERSION,

      formulaVersion: policy.formula?.version ?? null,

      originalText: passage.content,

      passageSnapshot: {
        contentHash: createTextHash(passage.content),
        version: passage.__v ?? 0,
        title: passage.title,
      },

      typedText: "",

      timing: {
        startedAt,
        submittedAt: null,
        durationSeconds,
        elapsedSeconds: 0,
      },

      progressVersion: 0,

      status: "IN_PROGRESS",

      evaluation: {
        status: "PENDING",
        attempts: 0,
      },

      submission: {
        idempotencyKey: null,
        submittedTextHash: null,
      },

      resultId: null,
    });

    return success(
      res,
      201,
      {
        attempt,
        exam: {
          id: exam._id,
          title: exam.title,
          examType: exam.examType,
          language: exam.language,
        },
        passage: {
          id: passage._id,
          title: passage.title,
          content: passage.content,
        },
        durationSeconds,
      },
      "Typing attempt started successfully.",
    );
  } catch (error) {
    console.error("startTypingAttempt error:", error);

    return fail(res, 500, "Unable to start typing attempt.");
  }
}

/**
 * SAVE TYPING PROGRESS
 */
export async function updateTypingAttemptProgress(req, res) {
  try {
    const { attemptId } = req.params;

    const { typedText, progressVersion } = req.body;

    const userId = req.user._id;

    const attempt = await TypingAttempt.findOne({
      _id: attemptId,
      userId,
    });

    if (!attempt) {
      return fail(res, 404, "Typing attempt not found.");
    }

    if (attempt.status !== "IN_PROGRESS") {
      return fail(
        res,
        400,
        `Attempt cannot be updated from status ${attempt.status}.`,
      );
    }

    if (progressVersion !== attempt.progressVersion) {
      return fail(res, 409, "Typing progress version is stale.");
    }

    const now = new Date();

    const startedAt = attempt.timing?.startedAt;

    const durationSeconds = Number(attempt.timing?.durationSeconds ?? 0);

    const elapsedSeconds = startedAt
      ? Math.max(0, (now.getTime() - new Date(startedAt).getTime()) / 1000)
      : 0;

    /**
     * Do not allow progress to exceed
     * the configured exam duration.
     */
    if (durationSeconds > 0 && elapsedSeconds >= durationSeconds) {
      return fail(res, 400, "Typing exam duration has expired.");
    }

    attempt.typedText = typedText;

    attempt.progressVersion = progressVersion + 1;

    attempt.timing.elapsedSeconds = Math.min(elapsedSeconds, durationSeconds);

    await attempt.save();

    return success(
      res,
      200,
      {
        attemptId: attempt._id,
        progressVersion: attempt.progressVersion,
        elapsedSeconds: attempt.timing.elapsedSeconds,
      },
      "Typing progress saved successfully.",
    );
  } catch (error) {
    console.error("updateTypingAttemptProgress error:", error);

    return fail(res, 500, "Unable to save typing progress.");
  }
}

/**
 * SUBMIT TYPING ATTEMPT
 */
export async function submitTypingAttempt(req, res) {
  let attemptToUpdate = null;

  try {
    const { attemptId } = req.validatedParams;
    const { typedText, submissionId } = req.validatedBody;

    const userId = req.user?._id ?? req.user?.id;

    if (!userId) {
      return fail(res, 401, "Authentication required.");
    }

    /**
     * ========================================================
     * 1. FIND ATTEMPT
     * ========================================================
     */
    const attempt = await TypingAttempt.findOne({
      _id: attemptId,
      userId,
    });

    if (!attempt) {
      return fail(res, 404, "Typing attempt not found.");
    }

    attemptToUpdate = attempt;

    /**
     * ========================================================
     * 2. IDEMPOTENCY
     * ========================================================
     */
    if (attempt.status === "COMPLETED" && attempt.resultId) {
      const existingResult = await TypingResult.findOne({
        attemptId: attempt._id,
      });

      return success(
        res,
        200,
        {
          attemptId: attempt._id,
          status: attempt.status,
          result: existingResult,
        },
        "Typing attempt was already submitted.",
      );
    }

    if (attempt.status !== "IN_PROGRESS") {
      return fail(
        res,
        400,
        `Attempt cannot be submitted from status ${attempt.status}.`,
      );
    }

    /**
     * ========================================================
     * 3. SERVER-SIDE TIME
     * ========================================================
     */
    const now = new Date();

    const startedAt = attempt.timing?.startedAt;

    const durationSeconds = Number(attempt.timing?.durationSeconds ?? 0);

    if (!startedAt) {
      return fail(res, 500, "Typing attempt start time is missing.");
    }

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return fail(res, 500, "Typing attempt duration is invalid.");
    }

    const actualElapsedSeconds = Math.max(
      1,
      (now.getTime() - new Date(startedAt).getTime()) / 1000,
    );

    const elapsedSeconds = Math.min(actualElapsedSeconds, durationSeconds);

    /**
     * ========================================================
     * 4. VALIDATE REFERENCE TEXT
     * ========================================================
     */
    if (
      typeof attempt.originalText !== "string" ||
      attempt.originalText.length === 0
    ) {
      return fail(
        res,
        500,
        "The reference passage is missing from the attempt.",
      );
    }

    /**
     * ========================================================
     * 5. FREEZE SUBMISSION
     * ========================================================
     */
    attempt.typedText = typedText;
    attempt.status = "SUBMITTED";

    attempt.timing.submittedAt = now;
    attempt.timing.elapsedSeconds = elapsedSeconds;

    attempt.submission = {
      idempotencyKey: submissionId,
      submittedTextHash: createTextHash(typedText),
    };

    attempt.evaluation = {
      status: "RUNNING",
      attempts: Number(attempt.evaluation?.attempts ?? 0) + 1,
      startedAt: attempt.evaluation?.startedAt ?? now,
      completedAt: null,
      errorMessage: null,
    };

    await attempt.save();

    /**
     * ========================================================
     * 6. EXAM-SPECIFIC CALCULATION
     * ========================================================
     *
     * IMPORTANT:
     *
     * Controller does NOT decide:
     *
     * - WPM formula
     * - CPM formula
     * - KDPH formula
     * - error penalty
     * - marks
     * - qualification
     *
     * Those belong to the policy.
     *
     * calculateTypingResult() resolves:
     *
     *   attempt.policyId
     *          ↓
     *   exam policy
     *          ↓
     *   formula.type
     *          ↓
     *   evaluator
     *          ↓
     *   official calculation
     */
    const calculation = calculateTypingResult({
      policyId: attempt.policyId,

      expectedText: attempt.originalText,

      typedText: attempt.typedText,

      elapsedSeconds,
    });

    /**
     * ========================================================
     * 7. VALIDATE CALCULATION
     * ========================================================
     */
    if (!calculation) {
      throw new Error("Typing calculation engine returned no result.");
    }

    if (!calculation.policyId) {
      throw new Error("Typing calculation did not return a policy ID.");
    }

    /**
     * ========================================================
     * 8. CREATE HISTORICAL RESULT
     * ========================================================
     *
     * Store the exact policy/formula versions used.
     *
     * This is important because policies may change later.
     */
    let result;

    try {
      result = await TypingResult.create({
        userId: attempt.userId,

        attemptId: attempt._id,

        examId: attempt.examId,

        passageId: attempt.passageId,

        policyId: calculation.policyId,

        policyVersion: calculation.policyVersion,

        formulaVersion: calculation.formulaVersion,

        engineVersion: calculation.engineVersion,

        examType: calculation.exam.type,

        language: calculation.exam.language,

        elapsedSeconds: calculation.elapsedSeconds,

        /**
         * ----------------------------------------------------
         * CORE RESULT
         * ----------------------------------------------------
         */
        coreResult: calculation.coreResult,

        /**
         * ----------------------------------------------------
         * OFFICIAL RESULT
         * ----------------------------------------------------
         *
         * null when the policy is not officially
         * calculable.
         */
        officialResult: calculation.officialResult ?? null,

        officialCalculationAvailable: calculation.official === true,

        officialCalculationReason:
          calculation.audit?.officialCalculationReason ?? null,

        /**
         * ----------------------------------------------------
         * FINAL SCORE
         * ----------------------------------------------------
         */
        finalScore: calculation.officialResult?.metrics?.finalScore ?? null,

        /**
         * ----------------------------------------------------
         * MARKS
         * ----------------------------------------------------
         */
        marksObtained: calculation.officialResult?.marks?.value ?? null,

        maxMarks: calculation.officialResult?.marks?.maxMarks ?? null,

        /**
         * ----------------------------------------------------
         * QUALIFICATION
         * ----------------------------------------------------
         */
        qualified: calculation.officialResult?.qualification?.qualified ?? null,

        qualificationReason:
          calculation.officialResult?.qualification?.qualified === true
            ? "Qualification threshold satisfied."
            : calculation.officialResult?.qualification?.qualified === false
              ? "Qualification threshold not satisfied."
              : (calculation.audit?.officialCalculationReason ?? null),

        /**
         * ----------------------------------------------------
         * FORMULA SNAPSHOT
         * ----------------------------------------------------
         *
         * Store exactly what was used for this result.
         */
        formulaSnapshot: calculation.audit?.formula ?? {},

        calculation: {
          calculatedAt: calculation.audit?.calculatedAt,

          engineVersion: calculation.engineVersion,

          policyVersion: calculation.policyVersion,

          formulaVersion: calculation.formulaVersion,
        },

        metadata: {
          policyStatus: calculation.audit?.policyStatus,

          evaluator: calculation.audit?.evaluator,
        },
      });
    } catch (error) {
      /**
       * Duplicate result protection.
       */
      if (error?.code === 11000) {
        result = await TypingResult.findOne({
          attemptId: attempt._id,
        });

        if (!result) {
          throw error;
        }
      } else {
        throw error;
      }
    }

    /**
     * ========================================================
     * 9. COMPLETE ATTEMPT
     * ========================================================
     */
    attempt.status = "COMPLETED";

    attempt.resultId = result._id;

    attempt.evaluation = {
      status: "COMPLETED",

      attempts: Number(attempt.evaluation?.attempts ?? 1),

      startedAt: attempt.evaluation?.startedAt ?? now,

      completedAt: new Date(),

      errorMessage: null,
    };

    await attempt.save();

    /**
     * ========================================================
     * 10. RETURN COMPACT FINAL RESULT
     * ========================================================
     *
     * Do NOT return the huge word-by-word comparison
     * from the submit endpoint.
     */
    return success(
      res,
      200,
      {
        attemptId: attempt._id,

        status: attempt.status,

        submittedAt: attempt.timing.submittedAt,

        elapsedSeconds: attempt.timing.elapsedSeconds,

        result: {
          id: result._id,

          policyId: result.policyId,

          policyVersion: result.policyVersion,

          formulaVersion: result.formulaVersion,

          examType: result.examType,

          language: result.language,

          coreResult: {
            word: result.coreResult?.word
              ? {
                  metrics: result.coreResult.word.metrics,
                  mistakeSummary: {
                    correct:
                      result.coreResult.word.comparison?.correct?.length ?? 0,

                    incorrect:
                      result.coreResult.word.comparison?.incorrect?.length ?? 0,

                    missing:
                      result.coreResult.word.comparison?.missing?.length ?? 0,

                    extra:
                      result.coreResult.word.comparison?.extra?.length ?? 0,
                  },
                }
              : null,

            character: result.coreResult?.character
              ? {
                  metrics: result.coreResult.character.metrics,
                  mistakeSummary: {
                    correct:
                      result.coreResult.character.comparison?.correct?.length ??
                      0,

                    incorrect:
                      result.coreResult.character.comparison?.incorrect
                        ?.length ?? 0,

                    missing:
                      result.coreResult.character.comparison?.missing?.length ??
                      0,

                    extra:
                      result.coreResult.character.comparison?.extra?.length ??
                      0,
                  },
                }
              : null,

            hybrid: result.coreResult?.hybrid ?? null,
          },

          officialResult: result.officialResult ?? null,

          finalScore: result.finalScore,

          marksObtained: result.marksObtained,

          maxMarks: result.maxMarks,

          qualified: result.qualified,

          qualificationReason: result.qualificationReason,

          officialCalculationAvailable: result.officialCalculationAvailable,
        },
      },

      "Typing examination submitted and evaluated successfully.",
    );
  } catch (error) {
    console.error("submitTypingAttempt error:", error);

    /**
     * ========================================================
     * EVALUATION FAILURE
     * ========================================================
     */
    try {
      if (attemptToUpdate && attemptToUpdate.status === "SUBMITTED") {
        await TypingAttempt.updateOne(
          {
            _id: attemptToUpdate._id,
            userId: attemptToUpdate.userId,
          },
          {
            $set: {
              status: "EVALUATION_FAILED",

              "evaluation.status": "FAILED",

              "evaluation.completedAt": new Date(),

              "evaluation.errorMessage":
                error instanceof Error
                  ? error.message
                  : "Unable to evaluate typing attempt.",
            },
          },
        );
      }
    } catch (updateError) {
      console.error("Unable to update failed evaluation state:", updateError);
    }

    return fail(res, 500, "Unable to evaluate typing attempt.");
  }
}

/**
 * GET RESULT
 */
export async function getTypingAttemptResult(req, res) {
  try {
    const { attemptId } = req.params;

    const userId = req.user._id;

    const attempt = await TypingAttempt.findOne({
      _id: attemptId,
      userId,
    });

    if (!attempt) {
      return fail(res, 404, "Typing attempt not found.");
    }

    const result = await TypingResult.findOne({
      attemptId: attempt._id,
    });

    if (!result) {
      return fail(res, 404, "Typing result is not available.");
    }

    return success(
      res,
      200,
      {
        attempt,
        result,
      },
      "Typing result fetched successfully.",
    );
  } catch (error) {
    console.error("getTypingAttemptResult error:", error);

    return fail(res, 500, "Unable to fetch typing result.");
  }
}
