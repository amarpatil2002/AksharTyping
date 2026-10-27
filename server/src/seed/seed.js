import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env");
    }

    const existingAdmin = await User.findOne({ username });

    if (existingAdmin) {
      console.log("Admin already exists. No changes made.");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: "Admin",
      email: username,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Admin seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
