import { Router } from 'express';
import {
  getExams, getExam, getPassage,
  startAttempt, submitAttempt
} from '../controllers/userTyping.controller.js';

import {
  examIdParamsSchema, passageParamsSchema,
  startAttemptSchema, attemptParamsSchema,
  submitAttemptSchema
} from '../validations/userTyping.validation.js';

import { validate } from '../middleware/validate.middleware.js';

const router = Router();

router.get('/exams', getExams);

router.get(
  '/exams/:examId',
  validate({ params: examIdParamsSchema }),
  getExam
);

router.get(
  '/passages/:passageId',
  validate({ params: passageParamsSchema }),
  getPassage
);

router.post(
  '/attempts',
  validate({ body: startAttemptSchema }),
  startAttempt
);

router.post(
  '/attempts/:attemptId/submit',
  validate({
    params: attemptParamsSchema,
    body: submitAttemptSchema
  }),
  submitAttempt
);

export default router;
