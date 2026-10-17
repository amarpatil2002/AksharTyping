import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  await mongoose.connect(mongoURI);

  console.log("MongoDB connected successfully");
};
