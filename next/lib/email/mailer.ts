import nodemailer from "nodemailer";
import { env } from "@/env";

// Create reusable transporter
export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

// Verify connection configuration
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log("✅ Email server connection verified");
    return true;
  } catch (error) {
    console.error("❌ Email server connection failed:", error);
    return false;
  }
}

// Send email function
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    });

    console.log(`✅ Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error };
  }
}
