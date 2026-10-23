import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";

const app = express();

// Security middleware
app.use(helmet());

// Frontend connection
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Request middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Akshar AI API is running",
  });
});

// API routes will be registered here
app.use("/api/auth", authRoutes);
app.use("/api/profile", userRoutes);

export default app;
