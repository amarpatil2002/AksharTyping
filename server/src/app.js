import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
// import studentRoutes from "./modules/student/student.routes.js";
// import adminRoutes from "./modules/admin/admin.routes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiters.js";

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

app.use("/api/v1/auth", authRoutes);

app.use((_req, res) =>
  res.status(404).json({
    success: false,
    message: "Route not found.",
  }),
);

app.use(errorHandler);

export default app;
