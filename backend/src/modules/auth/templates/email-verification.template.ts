/**
 * Email Verification Template
 */

import { baseTemplate } from "./base.template";

export interface EmailVerificationData {
  firstName?: string;
  lastName?: string;
  verificationToken: string;
  expiryHours?: number;
}

export const emailVerificationTemplate = (
  data: EmailVerificationData,
): { html: string; text: string } => {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verify-email?token=${data.verificationToken}`;
  const expiryHours = data.expiryHours || 24;

  const greeting = data.firstName
    ? `Hi ${data.firstName}${data.lastName ? " " + data.lastName : ""},`
    : "";

  const content = `
    <h2>Welcome to TelemetryFlow!</h2>
    ${greeting ? `<p>${greeting}</p>` : ""}
    <p>Thank you for signing up. We're excited to have you on board!</p>
    
    <p>To get started, please verify your email address by clicking the button below:</p>
    
    <a href="${verifyUrl}" class="button">Verify Email Address</a>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
    
    <div class="info-box">
      <p><strong>Note:</strong> This verification link will expire in ${expiryHours} hours. If the link expires, you can request a new verification email from the login page.</p>
    </div>
    
    <div class="divider"></div>
    
    <p><strong>What's next?</strong></p>
    <ul>
      <li>Complete your profile setup</li>
      <li>Explore TelemetryFlow features</li>
      <li>Set up your first monitoring dashboard</li>
    </ul>
    
    <p>If you didn't create an account with TelemetryFlow, you can safely ignore this email.</p>
  `;

  const html = baseTemplate({
    title: "Verify Your Email - TelemetryFlow",
    preheader: "Welcome to TelemetryFlow! Please verify your email address",
    content,
  });

  const text = `
Welcome to TelemetryFlow!
${greeting ? `\n${greeting}\n` : ""}
Thank you for signing up. We're excited to have you on board!

To get started, please verify your email address by clicking the link below:
${verifyUrl}

Note: This verification link will expire in ${expiryHours} hours. If the link expires, you can request a new verification email from the login page.

What's next?
- Complete your profile setup
- Explore TelemetryFlow features
- Set up your first monitoring dashboard

If you didn't create an account with TelemetryFlow, you can safely ignore this email.

This is an automated message from TelemetryFlow. Please do not reply to this email.
  `.trim();

  return { html, text };
};
