import { Router } from "express";

import requireAdminSession from "../../../../middleware/requireAdminSession.js";
import validateRequest from "../../../../middleware/validateRequest.js";

import {
  createTypingPassageSchema,
  updateTypingPassageSchema,
  passageIdParamsSchema,
  passageQuerySchema,
} from "../adminTyping.validation.js";

import {
  createTypingPassage,
  getTypingPassages,
  getTypingPassageById,
  updateTypingPassage,
  publishTypingPassage,
  archiveTypingPassage,
  deleteTypingPassage,
} from "./adminTypingPassage.controller.js";

const router = Router();

router.use(requireAdminSession);

router.post(
  "/",
  validateRequest(createTypingPassageSchema, "body"),
  createTypingPassage,
);

router.get(
  "/",
  validateRequest(passageQuerySchema, "query"),
  getTypingPassages,
);

router.get(
  "/:passageId",
  validateRequest(passageIdParamsSchema, "params"),
  getTypingPassageById,
);

router.patch(
  "/:passageId",
  validateRequest(passageIdParamsSchema, "params"),
  validateRequest(updateTypingPassageSchema, "body"),
  updateTypingPassage,
);

router.post(
  "/:passageId/publish",
  validateRequest(passageIdParamsSchema, "params"),
  publishTypingPassage,
);

router.post(
  "/:passageId/archive",
  validateRequest(passageIdParamsSchema, "params"),
  archiveTypingPassage,
);

router.delete(
  "/:passageId",
  validateRequest(passageIdParamsSchema, "params"),
  deleteTypingPassage,
);

export default router;
