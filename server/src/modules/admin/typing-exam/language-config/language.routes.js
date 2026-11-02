import express from "express";

import {
  createLanguage,
  getLanguages,
  getLanguageById,
  updateLanguage,
  updateLanguageStatus,
} from "./language.controller.js";

import {
  createLanguageSchema,
  updateLanguageSchema,
  updateLanguageStatusSchema,
  languageIdParamsSchema,
  languageQuerySchema,
  validateLanguageRequest,
} from "./language.validation.js";

const router = express.Router();

// Create language
router.post(
  "/",
  validateLanguageRequest({
    body: createLanguageSchema,
  }),
  createLanguage,
);

// Get all languages
router.get(
  "/",
  validateLanguageRequest({
    query: languageQuerySchema,
  }),
  getLanguages,
);

// Get language by ID
router.get(
  "/:languageId",
  validateLanguageRequest({
    params: languageIdParamsSchema,
  }),
  getLanguageById,
);

// Update language
router.patch(
  "/:languageId",
  validateLanguageRequest({
    params: languageIdParamsSchema,
    body: updateLanguageSchema,
  }),
  updateLanguage,
);

// Activate / deactivate language
router.patch(
  "/:languageId/status",
  validateLanguageRequest({
    params: languageIdParamsSchema,
    body: updateLanguageStatusSchema,
  }),
  updateLanguageStatus,
);

export default router;
