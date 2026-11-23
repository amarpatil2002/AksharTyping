import dns from "node:dns/promises";
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

async function getTransporter() {
  if (!EMAIL_HOST || !EMAIL_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    throw new Error("Email SMTP environment variables are missing.");
  }

  if (!transporter) {
    const address = await dns.resolve4(EMAIL_HOST);

    if (!address?.length) {
      throw new Error(`Unable to resolve SMTP host: ${EMAIL_HOST}`);
    }

    transporter = nodemailer.createTransport({
      host: address[0],
      port: Number(EMAIL_PORT),
      secure: EMAIL_SECURE === "true",

      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },

      tls: {
        servername: EMAIL_HOST,
      },

      pool: true,
      maxConnections: 3,
      maxMessages: 100,

      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  return transporter;
}
