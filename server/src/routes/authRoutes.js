import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  login,
  logout,
  me,
  requestRegisterOtp,
  verifyRegisterOtp,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register/request-otp", registerLimiter, requestRegisterOtp);
router.post("/register/verify-otp", verifyOtpLimiter, verifyRegisterOtp);

router.post("/login", loginLimiter, login);
router.post("/logout", logout);

router.get("/me", verifyToken, me);

export default router;
