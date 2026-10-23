import nodemailer from "nodemailer";

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
} = process.env;

let transporter;

function getTransporter() {
  if (!EMAIL_HOST || !EMAIL_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    throw new Error("Email SMTP environment variables are missing.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: EMAIL_SECURE === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

const templates = {
  verify_email: {
    subject: "Verify your email - Akshar AI",
    heading: "Complete your registration",
    description:
      "Use this code to verify your email and create your Akshar AI account.",
  },
  password_reset: {
    subject: "Reset your Akshar AI password",
    heading: "Reset your password",
    description: "Use this code to verify your password reset request.",
  },
  change_password: {
    subject: "Change your Akshar AI password",
    heading: "Change your password",
    description: "Use this code to verify your password change request.",
  },
};

export async function sendOtpEmail({ email, otp, purpose }) {
  if (
    typeof email !== "string" ||
    typeof otp !== "string" ||
    !/^\d{6}$/.test(otp)
  ) {
    throw new Error("A valid email and six-digit OTP are required.");
  }

  const template = templates[purpose];

  if (!template) {
    throw new Error("Unsupported OTP email purpose.");
  }

  const mailer = getTransporter();

  try {
    const info = await mailer.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: template.subject,
      text: [
        template.heading,
        "",
        template.description,
        "",
        `Your verification code is: ${otp}`,
        "",
        "This code expires in 5 minutes.",
        "Never share this code with anyone.",
        "If you did not request this code, ignore this email.",
        "",
        "Akshar AI",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1f2937">
          <h2>${template.heading}</h2>
          <p>${template.description}</p>
          <div style="padding:20px;background:#f3f4f6;border-radius:8px;text-align:center">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</span>
          </div>
          <p>This code expires in <strong>5 minutes</strong>.</p>
          <p>Never share this code with anyone.</p>
          <p style="color:#6b7280;font-size:12px">
            If you did not request this code, ignore this email.
          </p>
          <p>— Akshar AI</p>
        </div>
      `,
    });

    return { messageId: info.messageId };
  } catch (error) {
    // Do not log the OTP or SMTP credentials.
    console.error("OTP email delivery failed:", error.message);
    throw new Error("Unable to send the verification email.");
  }
}
