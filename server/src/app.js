import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import adminAuthRoutes from "./modules/admin/admin-auth/adminAuth.routes.js";
import adminTypingExamRoutes from "./modules/exams/typing-exam/adminTypingExam.routes.js";

import authRoutes from "./modules/auth/auth.routes.js";
import typingExamRoutes from "./modules/exams/typing-exam/TypingExam.routes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiters.js";
import { sessionMiddleware } from "./config/adminSession.js";

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

const adminFrontendUrl = process.env.ADMIN_FRONTEND_URL || frontendUrl;

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing from .env.");
}

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is missing from .env.");
}

const isProduction = process.env.NODE_ENV === "production";

// Only enable this when deployed behind a correctly configured,
// trusted reverse proxy. Adjust the value for your hosting setup.
// app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: [frontendUrl, adminFrontendUrl],
    credentials: true,
  }),
);

app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", apiLimiter);
app.use("/api/v1/admin", sessionMiddleware);

//admin routes
app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use("/api/v1/admin/typing-exam", adminTypingExamRoutes);

//user routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/typing-exam", typingExamRoutes);

app.use((err, req, res, next) => {
  console.error("API Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  // Custom HTTP errors (404, 409, etc.).
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Duplicate key error.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];

    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
      field: field || null,
    });
  }

  // Mongoose validation error.
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Database validation failed.",
      errors: Object.values(err.errors).map((error) => ({
        field: error.path,
        message: error.message,
      })),
    });
  }

  // Invalid MongoDB ObjectId.
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource identifier.",
    });
  }

  // Default server error.
  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

app.use(errorHandler);

export default app;
