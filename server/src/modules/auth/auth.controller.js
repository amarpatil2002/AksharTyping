import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt, randomBytes, createHash } from "node:crypto";

import User from "../../models/User.js";
import OtpChallenge from "../../models/OtpChallenge.js";
import AuthIdentity from "../../models/AuthIdentity.js";
import RefreshToken from "../../models/RefreshToken.js";

import { normalizeEmail } from "./auth.validation.js";
import { sendOtpEmail } from "../../service/email/SendEmailOtp.js";
import EmailVerification from "../../models/Emailverification.js";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export async function requestOtp(req, res, next) {
  try {
    const email = normalizeEmail(req.validatedBody.email);
    const purpose = req.validatedBody.purpose || "verify_email";

    const respond = () =>
      res.status(202).json({
        success: true,
        message: "If the email is eligible, a verification code will be sent.",
        data: {
          expiresIn: OTP_EXPIRY_MS / 1000,
          resendAfter: OTP_RESEND_COOLDOWN_MS / 1000,
        },
      });

    // Only allow supported OTP purposes.
    if (!["verify_email", "password_reset"].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP purpose.",
      });
    }

    const user = await User.findOne({ email });

    // Signup verification: explicitly reject already registered emails.
    if (purpose === "verify_email" && user?.emailVerified) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    // Password reset: keep responses generic to prevent email enumeration.
    if (purpose === "password_reset") {
      if (!user || !user.emailVerified || user.status !== "active") {
        return respond();
      }

      const passwordIdentity = await AuthIdentity.exists({
        userId: user._id,
        provider: "password",
      });

      if (!passwordIdentity) {
        return respond();
      }
    }

    const now = new Date();
    const cooldownStart = new Date(now.getTime() - OTP_RESEND_COOLDOWN_MS);

    const recentChallenge = await OtpChallenge.exists({
      email,
      purpose,
      createdAt: { $gt: cooldownStart },
    });

    if (recentChallenge) {
      return respond();
    }

    const otp = String(randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(otp, 12);

    await OtpChallenge.updateMany(
      {
        email,
        purpose,
        consumedAt: null,
      },
      {
        $set: { consumedAt: now },
      },
    );

    await OtpChallenge.create({
      email,
      purpose,
      codeHash,
      expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
      attempts: 0,
      consumedAt: null,
    });

    try {
      await sendOtpEmail({
        email,
        otp,
        purpose,
      });
    } catch (error) {
      await OtpChallenge.updateMany(
        {
          email,
          purpose,
          consumedAt: null,
        },
        {
          $set: { consumedAt: new Date() },
        },
      );

      throw error;
    }

    return respond();
  } catch (error) {
    next(error);
  }
}

const OTP_MAX_ATTEMPTS = 5;
const VERIFICATION_TTL_MS = 10 * 60 * 1000;

export async function verifyOtp(req, res, next) {
  try {
    const email = normalizeEmail(req.validatedBody.email);
    const { otp } = req.validatedBody;
    const purpose = req.validatedBody.purpose || "verify_email";

    if (!["verify_email", "password_reset"].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP purpose.",
      });
    }

    const challenge = await OtpChallenge.findOne({
      email,
      purpose,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .select("+codeHash");

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      challenge.consumedAt = new Date();
      await challenge.save();

      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please request a new code.",
      });
    }

    const isMatch = await bcrypt.compare(otp, challenge.codeHash);

    if (!isMatch) {
      challenge.attempts += 1;

      if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
        challenge.consumedAt = new Date();
      }

      await challenge.save();

      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    // Consume the OTP so it cannot be reused.
    challenge.consumedAt = new Date();

    if (purpose === "verify_email") {
      await challenge.save();

      await EmailVerification.findOneAndUpdate(
        { email },
        {
          $set: {
            verifiedAt: new Date(),
            expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        },
      );

      return res.status(200).json({
        success: true,
        message: "Email verified successfully. You can now register.",
        data: {
          email,
          purpose,
          expiresIn: VERIFICATION_TTL_MS / 1000,
        },
      });
    }

    // Password reset: store a hashed, short-lived token on this challenge.
    const resetToken = randomBytes(32).toString("hex");

    challenge.resetTokenHash = createHash("sha256")
      .update(resetToken)
      .digest("hex");

    challenge.resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await challenge.save();

    return res.status(200).json({
      success: true,
      message: "Verification successful. You can now reset your password.",
      data: {
        email,
        purpose,
        resetToken,
        expiresIn: 600,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  try {
    const { name, password } = req.validatedBody;
    const email = normalizeEmail(req.validatedBody.email);

    // 1. Require successful, unexpired email verification.
    const verification = await EmailVerification.findOne({
      email,
      expiresAt: { $gt: new Date() },
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email before registering.",
      });
    }

    // 2. Check whether a user already exists.
    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    // 3. Check whether a password identity already exists.
    const existingIdentity = await AuthIdentity.findOne({
      provider: "password",
      providerUserId: email,
    }).lean();

    if (existingIdentity) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    // 4. Hash the password.
    const passwordHash = await bcrypt.hash(password, 12);

    // 5. Create the user.
    const user = await User.create({
      name: name.trim(),
      email,
      emailVerified: true,
      role: "user", // Ensure this matches your User schema.
      status: "active",
    });

    // 6. Create the password identity.
    try {
      await AuthIdentity.create({
        userId: user._id,
        provider: "password",
        providerUserId: email,
        providerEmail: email,
        passwordHash,
      });
    } catch (error) {
      // Roll back the user if identity creation fails.
      await User.deleteOne({ _id: user._id });
      throw error;
    }

    // 7. Consume the email verification record.
    await EmailVerification.deleteOne({
      _id: verification._id,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please log in.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      // Do not expose raw database errors or index details.
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    return next(error);
  }
}

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_TTL_MS =
  process.env.REFRESH_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/auth",
  maxAge: REFRESH_TOKEN_TTL_MS,
};

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.validatedBody.email);
    const { password } = req.validatedBody;

    const identity = await AuthIdentity.findOne({
      provider: "password",
      providerUserId: email,
    }).select("+passwordHash");

    if (!identity?.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      identity.passwordHash,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = await User.findById(identity.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;

    if (!accessSecret) {
      throw new Error("JWT_ACCESS_SECRET is not configured.");
    }

    // Create a short-lived access JWT.
    const accessToken = jwt.sign({ role: user.role }, accessSecret, {
      subject: user._id.toString(),
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: "akshar-ai",
      audience: "akshar-ai-api",
    });

    // Generate a cryptographically random refresh token.
    const refreshToken = randomBytes(64).toString("hex");
    const refreshTokenHash = hashToken(refreshToken);

    // Store only the hash of the refresh token.
    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    user.lastLoginAt = new Date();
    await user.save();

    // Send the raw refresh token only as an HttpOnly cookie.
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: 900,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

const COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken";

function clearRefreshCookie(res) {
  const { maxAge, ...options } = refreshCookieOptions;
  res.clearCookie(COOKIE_NAME, options);
}

function createAccessToken(user) {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured.");
  }

  return jwt.sign({ role: user.role }, secret, {
    subject: user._id.toString(),
    expiresIn: ACCESS_TOKEN_TTL,
    issuer: "akshar-ai",
    audience: "akshar-ai-api",
  });
}

export async function refreshToken(req, res, next) {
  try {
    const rawRefreshToken =
      req.cookies?.[process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken"];

    if (
      typeof rawRefreshToken !== "string" ||
      !/^[a-f0-9]{128}$/i.test(rawRefreshToken)
    ) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Refresh token missing or invalid. Please log in again.",
      });
    }

    const tokenHash = hashToken(rawRefreshToken);
    const now = new Date();

    // Atomically revoke the existing token.
    // Only one concurrent request can successfully rotate it.
    const oldToken = await RefreshToken.findOneAndUpdate(
      {
        tokenHash,
        revokedAt: null,
        expiresAt: { $gt: now },
      },
      {
        $set: { revokedAt: now },
      },
      {
        new: false,
      },
    );

    if (!oldToken) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Refresh token expired or invalid. Please log in again.",
      });
    }

    const user = await User.findById(oldToken.userId);

    if (!user || user.status !== "active" || !user.emailVerified) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Account is unavailable. Please log in again.",
      });
    }

    // Create the replacement refresh token.
    const newRefreshToken = randomBytes(64).toString("hex");

    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      revokedAt: null,
    });

    const accessToken = createAccessToken(user);

    // Replace the old cookie with the new refresh token.
    res.cookie(COOKIE_NAME, newRefreshToken, refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: 900,
      },
    });
  } catch (error) {
    next(error);
  }
}

export const logout = async (req, res, next) => {
  try {
    const cookieName = process.env.REFRESH_TOKEN_COOKIE_NAME || "refreshToken";

    const rawToken = req.cookies?.[cookieName];

    if (rawToken) {
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");

      await RefreshToken.updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    }

    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/v1/auth",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export async function resetPassword(req, res, next) {
  try {
    const { resetToken, newPassword } = req.validatedBody;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    const tokenHash = createHash("sha256").update(resetToken).digest("hex");

    const now = new Date();

    // Find a verified, unused password-reset authorization.
    const challenge = await OtpChallenge.findOne({
      purpose: "password_reset",
      consumedAt: { $ne: null },
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { $gt: now },
    }).select("+resetTokenHash");

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password-reset token.",
      });
    }

    // Find the existing user.
    const user = await User.findOne({
      email: challenge.email,
      emailVerified: true,
      status: "active",
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Unable to reset password for this account.",
      });
    }

    // Hash the new password using the same algorithm as registration.
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update the existing password identity.
    const identity = await AuthIdentity.findOneAndUpdate(
      {
        userId: user._id,
        provider: "password",
      },
      {
        $set: { passwordHash },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    console.log(identity);

    if (!identity) {
      return res.status(400).json({
        success: false,
        message: "Password login is not configured for this account.",
      });
    }

    // Consume the reset authorization so it cannot be reused.
    const consumedChallenge = await OtpChallenge.findOneAndUpdate(
      {
        _id: challenge._id,
        purpose: "password_reset",
        consumedAt: { $ne: null },
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: { $gt: new Date() },
      },
      {
        $set: {
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        },
      },
      { new: true },
    );

    if (!consumedChallenge) {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired or already been used.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {}
