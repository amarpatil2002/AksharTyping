import bcrypt from "bcryptjs";
import User from "../models/User.js";

function toPublicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({
        message: "Name must be between 2 and 80 characters.",
      });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        message: "Password must be between 8 and 128 characters.",
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail }).select(
      "_id",
    );

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Never store the user's plain-text password.
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: "student",
    });

    return res.status(201).json({
      message: "Registration successful. You can now log in.",
      user: toPublicUser(user),
    });
  } catch (error) {
    // The unique index can reject simultaneous duplicate registrations.
    if (error && error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select(
      "+passwordHash",
    );

    // Use the same message for unknown email and incorrect password.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Regenerate the session after login to mitigate session fixation.
    req.session.regenerate((regenerateError) => {
      if (regenerateError) return next(regenerateError);

      req.session.userId = String(user._id);

      req.session.save((saveError) => {
        if (saveError) return next(saveError);

        return res.status(200).json({
          user: toPublicUser(user),
        });
      });
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({
        message: "Your session is no longer valid.",
      });
    }

    return res.status(200).json({
      user: toPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("akshar.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logged out successfully.",
    });
  });
}
