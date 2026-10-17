import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const verifyEmailConnection = async () => {
  await transporter.verify();
  console.log("Email SMTP connection verified");
};

export const sendOtpEmail = async ({ to, otp, name }) => {
  const sender = process.env.EMAIL_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: sender,
    to,
    subject: "Verify your Akshar AI email",
    text: `Hello ${name},

Your Akshar AI verification code is ${otp}.

This code expires in 5 minutes. Do not share it with anyone.

If you did not request this code, you can ignore this email.

Akshar AI Team`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#172033">
        <h2>Welcome to Akshar AI</h2>
        <p>Hello ${escapeHtml(name)},</p>
        <p>Use this code to verify your email address:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p>
        <p>This code expires in <strong>5 minutes</strong>.</p>
        <p>Do not share this code with anyone.</p>
        <p>If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  });
};

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}
