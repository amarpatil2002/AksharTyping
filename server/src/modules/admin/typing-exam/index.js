import { Router } from "express";
import typingExamRoutes from "./exam/adminTypingExam.routes.js";
import passageRoutes from "./passage/adminTypingPassage.routes.js";

const router = Router();

router.use("/typing-exam", typingExamRoutes);
router.use("/passage", passageRoutes);

export default router;
