import mongoose from "mongoose";

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export const EmailOtp = mongoose.model("EmailOtp", emailOtpSchema);
