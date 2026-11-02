import express from "express";

import languageRoutes from "./language-config/language.routes.js";
import typingConfigRoutes from "./typing-config/typingConfig.routes.js";
import typingExamRoutes from "./typing/typingExam.routes.js";

const router = express.Router();

router.use("/language-config", languageRoutes);
router.use("/typing-config", typingConfigRoutes);
router.use("/typing-exam", typingExamRoutes);

export default router;
