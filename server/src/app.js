import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";

import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing. Add it to your .env file.");
}

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be set to a long random secret (at least 32 characters).");
}

const isProduction = process.env.NODE_ENV === "production";
const maxAgeDays = Number(process.env.SESSION_MAX_AGE_DAYS || 7);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));

app.use(
  session({
    name: "akshar.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: "sessions",
      ttl: maxAgeDays * 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    },
  })
);

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use(errorHandler);

export default app;
