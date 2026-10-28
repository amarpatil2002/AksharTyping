import bcrypt from "bcryptjs";
import User from "../../../models/User.js";
import AuthIdentity from "../../../models/AuthIdentity.js";

const SESSION_COOKIE_NAME = "akshar.admin.sid";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

const invalidCredentials = {
  success: false,
  message: "Invalid email or password.",
};

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    if (!req.session) return resolve();

    req.session.destroy((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
}

function serializeAdmin(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function invalidateSession(req, res) {
  try {
    await destroySession(req);
  } finally {
    clearSessionCookie(res);
  }
}

export async function loginAdmin(req, res) {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password ||
      password.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid email and password are required.",
      });
    }

    // Credentials live in AuthIdentity, not User.
    const identity = await AuthIdentity.findOne({
      provider: "password",
      providerEmail: email,
    }).select("+passwordHash userId provider providerEmail");

    // The user record is loaded separately from the credential record.
    const user = identity
      ? await User.findById(identity.userId).select("name email role")
      : null;

    // Return the same error for an unknown email, invalid password,
    // missing linked user, or a non-admin account.
    const passwordHash = identity?.passwordHash;

    let passwordMatches = false;

    if (typeof passwordHash === "string" && passwordHash.length > 0) {
      passwordMatches = await bcrypt.compare(password, passwordHash);
    }

    if (!identity || !user || user.role !== "admin" || !passwordMatches) {
      return res.status(401).json(invalidCredentials);
    }

    // Rotate the session identifier after successful authentication.
    await regenerateSession(req);

    req.session.admin = {
      userId: user._id.toString(),
      role: "admin",
    };

    await saveSession(req);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        admin: serializeAdmin(user),
      },
    });
  } catch (error) {
    console.error("Admin login failed:", error.message);

    // Do not leave a partially authenticated session after a failure.
    try {
      await invalidateSession(req, res);
    } catch (sessionError) {
      console.error("Admin session cleanup failed:", sessionError.message);
    }

    return res.status(500).json({
      success: false,
      message: "Unable to complete login.",
    });
  }
}

export async function getAdminSession(req, res) {
  try {
    const sessionAdmin = req.session?.admin;

    if (!sessionAdmin?.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Recheck the account and role on each session restoration.
    const user = await User.findById(sessionAdmin.userId).select(
      "name email role",
    );

    if (!user || user.role !== "admin") {
      await invalidateSession(req, res);

      return res.status(401).json({
        success: false,
        message: "Admin session is no longer valid.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        admin: serializeAdmin(user),
      },
    });
  } catch (error) {
    console.error("Admin session lookup failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin session.",
    });
  }
}

export async function logoutAdmin(req, res) {
  try {
    await destroySession(req);
    clearSessionCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Admin logout failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to complete logout.",
    });
  }
}
