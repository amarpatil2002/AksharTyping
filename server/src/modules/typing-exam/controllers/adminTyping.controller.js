import TypingExam from '../models/typingExam.model.js';
import TypingExamVersion from '../models/typingExamVersion.model.js';
import TypingPassage from '../models/typingPassage.model.js';
import EvaluationPolicy from '../models/evaluationPolicy.model.js';

const passageStats = (text) => ({
  wordCount: text.trim() ? text.trim().split(/\s+/u).length : 0,
  characterCount: Array.from(text).length
});

export async function createExam(req, res) {
  const exam = await TypingExam.create(req.body);
  return res.status(201).json({ success: true, data: exam });
}

export async function updateExam(req, res) {
  const exam = await TypingExam.findByIdAndUpdate(
    req.params.examId, { $set: req.body },
    { new: true, runValidators: true }
  ).lean();

  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
  return res.json({ success: true, data: exam });
}

export async function getExams(req, res) {
  const { page = 1, limit = 20, status, examType, language, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (examType) filter.examType = examType;
  if (language) filter.language = language;
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { examCode: { $regex: search, $options: 'i' } }
  ];

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    TypingExam.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    TypingExam.countDocuments(filter)
  ]);

  return res.json({
    success: true,
    data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  });
}

export async function createExamVersion(req, res) {
  const exam = await TypingExam.findById(req.body.examId).select('_id').lean();
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

  const version = await TypingExamVersion.create(req.body);
  return res.status(201).json({ success: true, data: version });
}

export async function createPassage(req, res) {
  const version = await TypingExamVersion.findOne({
    _id: req.body.examVersionId,
    examId: req.body.examId
  }).select('_id').lean();

  if (!version) {
    return res.status(404).json({
      success: false,
      message: 'Exam version does not belong to this exam.'
    });
  }

  const passage = await TypingPassage.create({
    ...req.body,
    ...passageStats(req.body.content)
  });

  return res.status(201).json({ success: true, data: passage });
}

export async function createPolicy(req, res) {
  const version = await TypingExamVersion.findById(
    req.body.examVersionId
  ).select('_id').lean();

  if (!version) {
    return res.status(404).json({ success: false, message: 'Exam version not found.' });
  }

  const policy = await EvaluationPolicy.create(req.body);
  return res.status(201).json({ success: true, data: policy });
}
