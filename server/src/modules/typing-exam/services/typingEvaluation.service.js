import TypingEvaluation from "../models/typingEvaluation.model.js";
import ExamEvaluation from "../models/examEvaluation.model.js";
import { calculateCommonTypingResult } from "./commonTypingEvaluation.service.js";
import { evaluateExamPolicy } from "./examEvaluation.service.js";

export async function evaluateAttempt({
  attempt,
  expectedText,
  policy,
  session,
}) {
  if (typeof expectedText !== "string")
    throw new TypeError("expectedText is required for evaluation");
  const durationSeconds =
    attempt.durationSeconds ??
    (new Date(attempt.submittedAt).getTime() -
      new Date(attempt.startedAt).getTime()) /
      1000;
  const commonResult = calculateCommonTypingResult({
    expectedText,
    typedText: attempt.typedText,
    durationSeconds,
    normalization: policy?.normalization ?? "NFC",
    rounding: policy?.rounding,
  });
  const commonDoc = await TypingEvaluation.findOneAndUpdate(
    { attemptId: attempt._id },
    commonResult,
    { upsert: true, new: true, setDefaultsOnInsert: true, session },
  );
  if (!policy) return { commonEvaluation: commonDoc, examEvaluation: null };
  const finalResult = evaluateExamPolicy({ commonResult, policy });
  const examDoc = await ExamEvaluation.findOneAndUpdate(
    { attemptId: attempt._id },
    {
      ...finalResult,
      examVersionId: attempt.examVersionId,
      policyId: policy._id,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, session },
  );
  await attempt.updateOne({ $set: { status: "EVALUATED" } }, { session });
  return { commonEvaluation: commonDoc, examEvaluation: examDoc };
}
