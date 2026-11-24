import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import adminAuthRoutes from "./modules/admin/admin-auth/adminAuth.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import typingExamRoutes from "./modules/typing-exam/routes/adminTyping.routes.js";
import typingAttemptRoutes from "./modules/typing-exam/routes/userTyping.routes.js";

import errorHandler from "./middleware/errorHandler.js";
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

app.use(
  express.json({
    limit: "5mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "5mb",
  }),
);
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", apiLimiter);
app.use("/api/v1/admin", sessionMiddleware);
app.use("/api/v1/typing/admin", sessionMiddleware);

//admin routes
app.use("/api/v1/admin/auth", adminAuthRoutes);

//user routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/typing/admin", typingExamRoutes);
app.use("/api/v1/typing", typingAttemptRoutes);

app.use(errorHandler);

export default app;
