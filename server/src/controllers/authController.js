import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import jwt from "jsonwebtoken";

import { User } from "../models/User.js";
import { EmailOtp } from "../models/EmailOtp.js";
import { sendOtpEmail } from "../utils/email.js";
import { RefreshToken } from "../models/RefreshToken.js";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

const verifySchema = z.object({
  email: z.string().trim().email().max(254),
  otp: z.string().regex(/^\d{6}$/),
});

const normalizeEmail = (email) => email.trim().toLowerCase();

const hashOtp = (otp) => {
  if (!process.env.OTP_SECRET) {
    throw new Error("OTP_SECRET is missing from .env");
  }

  return crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(otp)
    .digest("hex");
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const isValidOtp = (submittedOtp, storedHash) => {
  if (!/^[a-f0-9]{64}$/i.test(storedHash || "")) {
    return false;
  }

  const submittedHash = Buffer.from(hashOtp(submittedOtp), "hex");
  const savedHash = Buffer.from(storedHash, "hex");

  return crypto.timingSafeEqual(submittedHash, savedHash);
};

/**
 * POST /api/auth/register/request-otp
 */
export const requestRegisterOtp = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid name, email, and password.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { name, password } = parsed.data;
    const email = normalizeEmail(parsed.data.email);

    let user = await User.findOne({ email });

    if (user?.emailVerified) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    const existingOtp = await EmailOtp.findOne({ email });

    if (
      existingOtp?.lastSentAt &&
      Date.now() - existingOtp.lastSentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP.",
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const now = new Date();

    if (!user) {
      const passwordHash = await bcrypt.hash(password, 12);

      user = await User.create({
        name,
        email,
        password: passwordHash,
        authProvider: "local",
        emailVerified: false,
      });
    } else {
      // Allow an unverified account to restart registration.
      user.name = name;
      user.password = await bcrypt.hash(password, 12);
      user.authProvider = "local";
      await user.save();
    }

    await EmailOtp.findOneAndUpdate(
      { email },
      {
        email,
        otpHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        attempts: 0,
        lastSentAt: now,
      },
      { upsert: true, new: true, runValidators: true },
    );

    try {
      await sendOtpEmail({ to: email, otp, name });
    } catch (emailError) {
      await EmailOtp.deleteOne({ email });

      console.error("OTP email delivery failed:", emailError.message);

      return res.status(503).json({
        success: false,
        message: "Unable to send the verification email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
      expiresIn: OTP_EXPIRY_MS / 1000,
      resendAfter: RESEND_COOLDOWN_MS / 1000,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already being registered. Please try again.",
      });
    }

    next(error);
  }
};

/**
 * POST /api/auth/register/verify-otp
 */
export const verifyRegisterOtp = async (req, res, next) => {
  try {
    const parsed = verifySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email and six-digit OTP.",
      });
    }

    const email = normalizeEmail(parsed.data.email);
    const { otp } = parsed.data;

    const [user, otpRecord] = await Promise.all([
      User.findOne({ email }),
      EmailOtp.findOne({ email }),
    ]);

    if (!user || user.emailVerified || !otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Registration request not found or already verified.",
      });
    }

    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      await EmailOtp.deleteOne({ _id: otpRecord._id });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new code.",
      });
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await EmailOtp.deleteOne({ _id: otpRecord._id });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    if (!isValidOtp(otp, otpRecord.otpHash)) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
        remainingAttempts: MAX_OTP_ATTEMPTS - otpRecord.attempts,
      });
    }

    user.emailVerified = true;
    await user.save();

    await EmailOtp.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// Keep this aligned with REFRESH_TOKEN_EXPIRES_IN=7d.
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: REFRESH_MAX_AGE_MS,
};

const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createAccessToken = (user) =>
  jwt.sign({ typ: "access" }, process.env.ACCESS_TOKEN_SECRET, {
    subject: user._id.toString(),
    expiresIn: ACCESS_EXPIRES_IN,
  });

const createRefreshToken = (user) =>
  jwt.sign(
    {
      typ: "refresh",
      jti: crypto.randomUUID(),
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      subject: user._id.toString(),
      expiresIn: REFRESH_EXPIRES_IN,
    },
  );

const getRefreshExpiry = () => new Date(Date.now() + REFRESH_MAX_AGE_MS);

const saveRefreshToken = async (userId, token) => {
  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt: getRefreshExpiry(),
  });
};

const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
});

export const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email and password.",
      });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      throw new Error("Token secrets are not configured.");
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    await saveRefreshToken(user._id, refreshToken);

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      tokenType: "Bearer",
      expiresIn: ACCESS_EXPIRES_IN,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in right now.",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const payload = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET,
        );

        if (
          typeof payload !== "string" &&
          payload.typ === "refresh" &&
          payload.sub
        ) {
          await RefreshToken.updateOne(
            {
              user: payload.sub,
              tokenHash: hashToken(refreshToken),
              revokedAt: null,
            },
            {
              $set: { revokedAt: new Date() },
            },
          );
        }
      } catch {
        // Invalid or expired token: still clear the cookie.
      }
    }

    res.clearCookie("refreshToken", clearRefreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    res.clearCookie("refreshToken", clearRefreshCookieOptions);

    return res.status(500).json({
      success: false,
      message: "Unable to log out right now.",
    });
  }
};

export const me = async (req, res) => {
  return res.json({ success: true, data: "Fetched data successfully" });
};
