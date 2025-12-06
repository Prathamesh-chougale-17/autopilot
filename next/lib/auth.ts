import { betterAuth } from "better-auth";
import { admin, emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import client from "@/lib/mongodb";
import { env } from "@/env";
import { sendEmail } from "@/lib/email/mailer";
import { emailTemplates } from "@/lib/email/templates";

const db = client.db(env.MONGODB_DB_NAME);

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      accessType: "offline", // Always get refresh token
      prompt: "select_account consent", // Always ask to select account
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin", "super-admin"],
      impersonationSessionDuration: 3600, // 1 hour
      defaultBanReason: "Violated terms of service",
      bannedUserMessage:
        "Your account has been suspended. Please contact support.",
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // In development, log to console for easy testing
        if (env.NODE_ENV === "development") {
          console.log(`[Email OTP] Sending ${type} OTP to ${email}: ${otp}`);
        }

        // Generate email content based on type
        let subject: string;
        let html: string;

        switch (type) {
          case "sign-in":
            subject = "🔐 Sign In to Game Aggregator";
            html = emailTemplates.signInOTP(otp, 5);
            break;
          case "email-verification":
            subject = "✉️ Verify Your Email - Game Aggregator";
            html = emailTemplates.emailVerification(otp, 5);
            break;
          case "forget-password":
            subject = "🔑 Reset Your Password - Game Aggregator";
            html = emailTemplates.passwordReset(otp, 5);
            break;
          default:
            subject = "Verification Code - Game Aggregator";
            html = emailTemplates.signInOTP(otp, 5);
        }

        // Send email using nodemailer
        try {
          await sendEmail({
            to: email,
            subject,
            html,
          });
          console.log(`✅ ${type} OTP sent to ${email}`);
        } catch (error) {
          console.error(`❌ Failed to send ${type} OTP to ${email}:`, error);
          throw error;
        }
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      sendVerificationOnSignUp: true,
      allowedAttempts: 3,
    }),
    nextCookies(), // Must be last plugin
  ],
});

export type Session = typeof auth.$Infer.Session;
