import { Router } from 'express';
import {
  createExam, updateExam, getExams,
  createExamVersion, createPassage, createPolicy
} from '../controllers/adminTyping.controller.js';

import {
  createExamSchema, updateExamSchema, examParamsSchema,
  createVersionSchema, createPassageSchema, createPolicySchema
} from '../validations/adminTyping.validation.js';

import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.post('/exams', validate({ body: createExamSchema }), createExam);
router.get('/exams', getExams);
router.patch(
  '/exams/:examId',
  validate({ params: examParamsSchema, body: updateExamSchema }),
  updateExam
);

router.post(
  '/exam-versions',
  validate({ body: createVersionSchema }),
  createExamVersion
);

router.post(
  '/passages',
  validate({ body: createPassageSchema }),
  createPassage
);

router.post(
  '/evaluation-policies',
  validate({ body: createPolicySchema }),
  createPolicy
);

export default router;
