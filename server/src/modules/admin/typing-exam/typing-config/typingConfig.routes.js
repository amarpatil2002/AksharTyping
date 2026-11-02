import express from "express";

import {
  createWordConfig,
  getWordConfigs,
  getWordConfigById,
  updateWordConfig,
  updateWordConfigStatus,
  deleteWordConfig,
  createCharacterConfig,
  getCharacterConfigs,
  getCharacterConfigById,
  updateCharacterConfig,
  updateCharacterConfigStatus,
  deleteCharacterConfig,
  createEvaluationPolicy,
  getEvaluationPolicies,
  getEvaluationPolicyById,
  updateEvaluationPolicy,
  updateEvaluationPolicyStatus,
  deleteEvaluationPolicy,
} from "./typingConfig.controller.js";

import {
  createWordConfigSchema,
  updateWordConfigSchema,
  updateWordConfigStatusSchema,
  createCharacterConfigSchema,
  updateCharacterConfigSchema,
  updateCharacterConfigStatusSchema,
  createEvaluationPolicySchema,
  updateEvaluationPolicySchema,
  updateEvaluationPolicyStatusSchema,
} from "./typingConfig.validation.js";
import { validateRequest } from "../../../../middleware/validateRequest.js";

const router = express.Router();

// ============================================================
// WORD CONFIG
// ============================================================

router.post("/word", validateRequest(createWordConfigSchema), createWordConfig);
router.get("/word", getWordConfigs);
router.get("/word/:configId", getWordConfigById);
router.patch(
  "/word/:configId",
  validateRequest(updateWordConfigSchema),
  updateWordConfig,
);
router.patch(
  "/word/:configId/status",
  validateRequest(updateWordConfigStatusSchema),
  updateWordConfigStatus,
);
router.delete("/word/:configId", deleteWordConfig);

// ============================================================
// CHARACTER CONFIG
// ============================================================

router.post(
  "/character",
  validateRequest(createCharacterConfigSchema),
  createCharacterConfig,
);
router.get("/character", getCharacterConfigs);
router.get("/character/:configId", getCharacterConfigById);
router.patch(
  "/character/:configId",
  validateRequest(updateCharacterConfigSchema),
  updateCharacterConfig,
);
router.patch(
  "/character/:configId/status",
  validateRequest(updateCharacterConfigStatusSchema),
  updateCharacterConfigStatus,
);
router.delete("/character/:configId", deleteCharacterConfig);

// ============================================================
// EVALUATION POLICY
// ============================================================

router.post(
  "/evaluation",
  validateRequest(createEvaluationPolicySchema),
  createEvaluationPolicy,
);
router.get("/evaluation", getEvaluationPolicies);
router.get("/evaluation/:policyId", getEvaluationPolicyById);
router.patch(
  "/evaluation/:policyId",
  validateRequest(updateEvaluationPolicySchema),
  updateEvaluationPolicy,
);
router.patch(
  "/evaluation/:policyId/status",
  validateRequest(updateEvaluationPolicyStatusSchema),
  updateEvaluationPolicyStatus,
);
router.delete("/evaluation/:policyId", deleteEvaluationPolicy);

export default router;
