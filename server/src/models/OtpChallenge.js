import mongoose from "mongoose";

const otpChallengeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    purpose: {
      type: String,
      enum: ["verify_email", "password_reset"],
      required: true,
    },

    // Store the hashed OTP, never the six-digit code itself.
    codeHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    consumedAt: {
      type: Date,
      default: null,
    },
    resetTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  },
);

// Find the latest challenge for an email and purpose.
otpChallengeSchema.index({
  email: 1,
  purpose: 1,
  createdAt: -1,
});

// Automatically clean up expired challenge documents.
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpChallenge = mongoose.model("OtpChallenge", otpChallengeSchema);

export default OtpChallenge;
