import { env } from "@/env";

// Base email template wrapper
function emailWrapper(content: string, preheader?: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  ${preheader ? `<meta name="description" content="${preheader}">` : ""}
  <title>Game Aggregator</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0a0a0a;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 40px 0 20px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .content {
      background-color: #18181b;
      border-radius: 12px;
      padding: 40px;
      margin: 20px 0;
    }
    .otp-code {
      font-size: 42px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 8px;
      padding: 30px;
      margin: 30px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: #ffffff;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #71717a;
      font-size: 14px;
    }
    .warning {
      background-color: #27272a;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 16px;
      color: #ffffff;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #a1a1aa;
      margin: 12px 0;
    }
    .highlight {
      color: #ffffff;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎮 Game Aggregator</div>
    </div>
    ${content}
    <div class="footer">
      <p>This email was sent from Game Aggregator</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>&copy; ${new Date().getFullYear()} Game Aggregator. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// OTP Sign-In Email
export function signInOTPTemplate(otp: string, expiresInMinutes: number = 5) {
  const content = `
    <div class="content">
      <h1>🔐 Sign In to Your Account</h1>
      <p>Hello!</p>
      <p>You requested a one-time password to sign in to your Game Aggregator account.</p>
      <p class="highlight">Your verification code is:</p>
      <div class="otp-code">${otp}</div>
      <div class="warning">
        <p><strong>⏰ This code expires in ${expiresInMinutes} minutes.</strong></p>
        <p>For security reasons, do not share this code with anyone.</p>
      </div>
      <p>If you didn't request this code, you can safely ignore this email.</p>
    </div>
  `;

  return emailWrapper(content, `Your sign-in code: ${otp}`);
}

// Email Verification Email
export function emailVerificationTemplate(otp: string, expiresInMinutes: number = 5) {
  const content = `
    <div class="content">
      <h1>✉️ Verify Your Email Address</h1>
      <p>Welcome to Game Aggregator!</p>
      <p>To complete your registration and start playing, please verify your email address.</p>
      <p class="highlight">Your verification code is:</p>
      <div class="otp-code">${otp}</div>
      <div class="warning">
        <p><strong>⏰ This code expires in ${expiresInMinutes} minutes.</strong></p>
        <p>Enter this code in the verification page to activate your account.</p>
      </div>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;

  return emailWrapper(content, `Verify your email: ${otp}`);
}

// Password Reset Email
export function passwordResetTemplate(otp: string, expiresInMinutes: number = 5) {
  const content = `
    <div class="content">
      <h1>🔑 Reset Your Password</h1>
      <p>Hello!</p>
      <p>You requested to reset your password for your Game Aggregator account.</p>
      <p class="highlight">Your password reset code is:</p>
      <div class="otp-code">${otp}</div>
      <div class="warning">
        <p><strong>⏰ This code expires in ${expiresInMinutes} minutes.</strong></p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
      <p>After entering this code, you'll be able to set a new password for your account.</p>
    </div>
  `;

  return emailWrapper(content, `Reset your password: ${otp}`);
}

// Welcome Email (after successful signup)
export function welcomeEmailTemplate(name: string) {
  const content = `
    <div class="content">
      <h1>🎉 Welcome to Game Aggregator!</h1>
      <p>Hi ${name},</p>
      <p>Thank you for joining Game Aggregator! We're excited to have you as part of our gaming community.</p>
      <p class="highlight">Here's what you can do now:</p>
      <ul style="color: #a1a1aa; line-height: 1.8;">
        <li>Play <strong>Rock Paper Scissors</strong> and test your luck</li>
        <li>Challenge the <strong>Quick Draw Showdown</strong> with Algorand staking</li>
        <li>Manage your profile in the dashboard</li>
        <li>Compete with other players</li>
      </ul>
      <div style="text-align: center;">
        <a href="${env.BETTER_AUTH_URL}/dashboard" class="button">Go to Dashboard</a>
      </div>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Happy gaming! 🎮</p>
    </div>
  `;

  return emailWrapper(content, "Welcome to Game Aggregator!");
}

// Account Security Alert
export function securityAlertTemplate(action: string, ipAddress?: string, userAgent?: string) {
  const content = `
    <div class="content">
      <h1>🛡️ Security Alert</h1>
      <p>We detected a security-related action on your Game Aggregator account:</p>
      <div class="warning">
        <p><strong>Action:</strong> ${action}</p>
        ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ""}
        ${userAgent ? `<p><strong>Device:</strong> ${userAgent}</p>` : ""}
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p>If this was you, no action is needed. If you don't recognize this activity, please:</p>
      <ol style="color: #a1a1aa; line-height: 1.8;">
        <li>Change your password immediately</li>
        <li>Review your recent account activity</li>
        <li>Contact our support team</li>
      </ol>
      <div style="text-align: center;">
        <a href="${env.BETTER_AUTH_URL}/dashboard" class="button">Review Account</a>
      </div>
    </div>
  `;

  return emailWrapper(content, `Security alert: ${action}`);
}

// Export all templates
export const emailTemplates = {
  signInOTP: signInOTPTemplate,
  emailVerification: emailVerificationTemplate,
  passwordReset: passwordResetTemplate,
  welcome: welcomeEmailTemplate,
  securityAlert: securityAlertTemplate,
};
