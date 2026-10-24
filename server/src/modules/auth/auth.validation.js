import { z } from "zod";

// Normalize email
export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

// Email validation
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email cannot exceed 254 characters.")
  .pipe(z.email("Please enter a valid email address."));

export const requestOtpVerificationSchema = z.object({
  email: emailSchema,
});

// Register with email and password
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name cannot exceed 80 characters."),

  email: emailSchema,

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password cannot exceed 128 characters."),
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().regex(/^\d{6}$/, "OTP must contain exactly 6 digits."),
});

// Login with email and password
export const loginSchema = z.object({
  email: emailSchema,

  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password cannot exceed 128 characters."),
});

// Request password reset
export const requestOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  purpose: z.enum(["verify_email", "password_reset"]),
});

// Reset password using OTP
export const resetPasswordSchema = z.object({
  email: emailSchema,

  otp: z.string().regex(/^\d{6}$/, "OTP must contain exactly 6 digits."),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password cannot exceed 128 characters."),
});

// Change password while logged in
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password cannot exceed 128 characters."),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must differ from the current password.",
    path: ["newPassword"],
  });

// Validate email independently
export function isValidEmail(email) {
  return emailSchema.safeParse(email).success;
}
