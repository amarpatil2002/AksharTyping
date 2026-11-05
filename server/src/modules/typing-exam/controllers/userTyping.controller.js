import TypingExam from '../models/typingExam.model.js';
import TypingExamVersion from '../models/typingExamVersion.model.js';
import TypingPassage from '../models/typingPassage.model.js';
import TypingAttempt from '../models/typingAttempt.model.js';
import TypingEvaluation from '../models/typingEvaluation.model.js';
import ExamEvaluation from '../models/examEvaluation.model.js';

import { calculateCommonTypingResult } from '../services/commonTypingEvaluation.service.js';
import { evaluateExamPolicy } from '../services/examEvaluation.service.js';
import { EXAM_EVALUATOR_REGISTRY } from '../exam-utilities/examRegistry.js';

export async function getExams(req, res) {
  const exams = await TypingExam.find({ status: 'ACTIVE' })
    .select('title slug examCode authority postName examType language description')
    .sort({ title: 1 }).lean();

  return res.json({ success: true, data: exams });
}

export async function getExam(req, res) {
  const exam = await TypingExam.findOne({
    _id: req.params.examId,
    status: 'ACTIVE'
  }).lean();

  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
  return res.json({ success: true, data: exam });
}

export async function getPassage(req, res) {
  const passage = await TypingPassage.findOne({
    _id: req.params.passageId,
    status: 'ACTIVE'
  }).select('title language content wordCount characterCount difficulty examId examVersionId').lean();

  if (!passage) return res.status(404).json({ success: false, message: 'Passage not found.' });
  return res.json({ success: true, data: passage });
}

export async function startAttempt(req, res) {
  const { examId, examVersionId, passageId, language } = req.body;

  const passage = await TypingPassage.findOne({
    _id: passageId,
    examId,
    examVersionId,
    status: 'ACTIVE'
  }).select('_id').lean();

  if (!passage) {
    return res.status(404).json({ success: false, message: 'Active passage not found.' });
  }

  const attempt = await TypingAttempt.create({
    attemptId: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    candidateId: req.user._id ?? req.user.id,
    examId,
    examVersionId,
    passageId,
    language,
    startedAt: new Date(),
    status: 'STARTED'
  });

  return res.status(201).json({
    success: true,
    data: {
      attemptId: attempt.attemptId,
      startedAt: attempt.startedAt,
      examId,
      examVersionId,
      passageId,
      language
    }
  });
}

export async function submitAttempt(req, res) {
  const candidateId = req.user._id ?? req.user.id;

  const attempt = await TypingAttempt.findOne({
    attemptId: req.params.attemptId,
    candidateId
  });

  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found.' });
  if (attempt.status !== 'STARTED') {
    return res.status(409).json({ success: false, message: 'Attempt is already submitted/evaluated.' });
  }

  const passage = await TypingPassage.findById(attempt.passageId)
    .select('content').lean();

  const policy = await EvaluationPolicy.findOne({
    examVersionId: attempt.examVersionId,
    active: true
  }).sort({ version: -1 }).lean();

  if (!passage || !policy) {
    return res.status(409).json({
      success: false,
      message: 'Passage or evaluation policy is not configured.'
    });
  }

  const submittedAt = new Date();
  const durationSeconds = Math.max(
    0,
    Math.floor((submittedAt - attempt.startedAt) / 1000)
  );

  const common = calculateCommonTypingResult({
    expectedText: passage.content,
    typedText: req.body.typedText,
    durationSeconds,
    normalization: policy.normalization
  });

  const evaluator = EXAM_EVALUATOR_REGISTRY[policy.evaluator];
  let examResult;

  if (evaluator?.evaluate) {
    examResult = evaluator.evaluate({
      ...common,
      ...policy
    });
  } else {
    examResult = evaluateExamPolicy({
      commonResult: common,
      policy
    });
  }

  attempt.typedText = req.body.typedText;
  attempt.submittedAt = submittedAt;
  attempt.durationSeconds = durationSeconds;
  attempt.status = 'EVALUATED';
  await attempt.save();

  await TypingEvaluation.findOneAndUpdate(
    { attemptId: attempt._id },
    { $set: { attemptId: attempt._id, ...common } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await ExamEvaluation.findOneAndUpdate(
    { attemptId: attempt._id },
    {
      $set: {
        attemptId: attempt._id,
        examVersionId: attempt.examVersionId,
        policyId: policy._id,
        calculation: examResult,
        result: examResult.qualified ? 'PASS' : 'FAIL'
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json({
    success: true,
    data: {
      attemptId: attempt.attemptId,
      common,
      exam: examResult
    }
  });
}
