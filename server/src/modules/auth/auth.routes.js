import { Router } from "express";

import {
  requestOtp,
  verifyOtp,
  logout,
  requestPasswordReset,
  resetPassword,
  changePassword,
  refreshToken,
  login,
  register,
} from "./auth.controller.js";

import {
  verifyOtpSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  changePasswordSchema,
  registerSchema,
  loginSchema,
  requestOtpVerificationSchema,
} from "./auth.validation.js";

import { validateRequest } from "../../middleware/validateRequest.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { authLimiter } from "../../middleware/rateLimiters.js";

const router = Router();

// OTP registration and login
router.post(
  "/request-otp",
  authLimiter,
  validateRequest(requestOtpVerificationSchema),
  requestOtp,
);

router.post(
  "/verify-otp",
  authLimiter,
  validateRequest(verifyOtpSchema),
  verifyOtp,
);

router.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  register,
);

router.post("/login", authLimiter, validateRequest(loginSchema), login);

router.post("/refresh", authLimiter, refreshToken);

// Logout
router.post("/logout", verifyToken, logout);

// Password reset using email OTP
router.post(
  "/password/forgot",
  authLimiter,
  validateRequest(requestPasswordResetSchema),
  requestPasswordReset,
);

router.post(
  "/password/reset",
  authLimiter,
  validateRequest(resetPasswordSchema),
  resetPassword,
);

// Change password for an authenticated user
router.post(
  "/password/change",
  verifyToken,
  authLimiter,
  validateRequest(changePasswordSchema),
  changePassword,
);

// Google OAuth routes can be added here later.

export default router;
