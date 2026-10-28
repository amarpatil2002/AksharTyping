import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../.env");
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error("Failed to load .env:", envResult.error.message);
} else {
  console.log(".env loaded:", envPath);
  console.log("MONGODB_URI exists:", Boolean(process.env.MONGODB_URI));
}

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AuthIdentity from "../models/AuthIdentity.js";
import { connectDatabase } from "../config/database.js";

dotenv.config();

async function seedAdmin() {
  try {
    await connectDatabase();

    const email = process.env.ADMIN_USERNAME?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "ADMIN_USERNAME and ADMIN_PASSWORD must be configured in .env",
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const existingIdentity = await AuthIdentity.findOne({
        userId: existingUser._id,
        provider: "password",
      });

      if (existingIdentity) {
        console.log("Admin account already exists. No changes made.");
        return;
      }

      throw new Error(
        "User exists without a password identity. Manual resolution is required.",
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: "Admin",
      email,
      role: "admin",
    });

    try {
      await AuthIdentity.create({
        userId: user._id,
        provider: "password",
        providerUserId: email,
        providerEmail: email,
        passwordHash,
      });
    } catch (error) {
      // Avoid leaving an orphaned user if identity creation fails.
      await User.deleteOne({ _id: user._id });
      throw error;
    }

    console.log(`Admin account created successfully: ${email}`);
  } catch (error) {
    console.error("Admin seed failed:", error.message);
    process.exitCode = 1;
  }
}

seedAdmin();
