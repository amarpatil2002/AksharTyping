import mongoose from "mongoose";

const authIdentitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["password", "google"],
      required: true,
    },

    // Password identity: use the associated user's ID.
    // Google identity: use Google's stable "sub" value.
    providerUserId: {
      type: String,
      required: true,
      trim: true,
    },

    providerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    // Only used for email/password authentication.
    // Store a bcrypt hash, never the original password.
    passwordHash: {
      type: String,
      select: false,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

authIdentitySchema.index({ provider: 1, providerUserId: 1 }, { unique: true });

authIdentitySchema.index({ userId: 1, provider: 1 });

const AuthIdentity = mongoose.model("AuthIdentity", authIdentitySchema);

export default AuthIdentity;
