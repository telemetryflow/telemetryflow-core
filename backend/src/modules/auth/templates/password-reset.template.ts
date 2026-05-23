/**
 * Password Reset Email Template
 */

import { baseTemplate } from "./base.template";

export interface PasswordResetData {
  firstName?: string;
  lastName?: string;
  resetToken: string;
  expiryHours?: number;
}

export const passwordResetTemplate = (
  data: PasswordResetData,
): { html: string; text: string } => {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${data.resetToken}`;
  const expiryHours = data.expiryHours || 1;

  const greeting = data.firstName
    ? `Hi ${data.firstName}${data.lastName ? " " + data.lastName : ""},`
    : "";

  const content = `
    <h2>Password Reset Request</h2>
    ${greeting ? `<p>${greeting}</p>` : ""}
    <p>We received a request to reset your password for your TelemetryFlow account.</p>
    
    <p>Click the button below to reset your password:</p>
    
    <a href="${resetUrl}" class="button">Reset Password</a>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
    
    <div class="alert-box">
      <p><strong>Important:</strong> This link will expire in ${expiryHours} hour${expiryHours > 1 ? "s" : ""}. If you need a new link, please request another password reset.</p>
    </div>
    
    <div class="divider"></div>
    
    <p><strong>Didn't request this?</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  `;

  const html = baseTemplate({
    title: "Reset Your Password - TelemetryFlow",
    preheader: "Reset your TelemetryFlow password",
    content,
  });

  const text = `
Password Reset Request
${greeting ? `\n${greeting}\n` : ""}
We received a request to reset your password for your TelemetryFlow account.

Click the link below to reset your password:
${resetUrl}

Important: This link will expire in ${expiryHours} hour${expiryHours > 1 ? "s" : ""}. If you need a new link, please request another password reset.

Didn't request this? If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

This is an automated message from TelemetryFlow. Please do not reply to this email.
  `.trim();

  return { html, text };
};
