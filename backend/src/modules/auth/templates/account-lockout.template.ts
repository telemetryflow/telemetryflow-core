/**
 * Account Lockout Notification Email Template
 */

import { baseTemplate } from "./base.template";

export interface AccountLockoutData {
  firstName?: string;
  lastName?: string;
  lockedUntil?: Date;
  reason?: string;
  failedAttempts?: number;
}

export const accountLockoutTemplate = (
  data?: AccountLockoutData,
): { html: string; text: string } => {
  const lockDuration = data?.lockedUntil
    ? `until ${data.lockedUntil.toLocaleString()}`
    : "temporarily";

  const reason = data?.reason || "multiple failed login attempts";
  const failedAttempts = data?.failedAttempts || 5;

  const greeting = data?.firstName
    ? `Hi ${data.firstName}${data.lastName ? " " + data.lastName : ""},`
    : "";

  const content = `
    <h2>Account Locked</h2>
    ${greeting ? `<p>${greeting}</p>` : ""}

    <div class="danger-box">
      <p><strong>Your account has been locked ${lockDuration}.</strong></p>
      <p><strong>Reason:</strong> ${reason}</p>
      ${data?.failedAttempts ? `<p><strong>Failed Attempts:</strong> ${failedAttempts}</p>` : ""}
    </div>
    
    <p>For your security, we've temporarily locked your account to prevent unauthorized access.</p>
    
    <div class="info-box">
      <p><strong>What happens next?</strong></p>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>Your account will be automatically unlocked ${data?.lockedUntil ? `at ${data.lockedUntil.toLocaleString()}` : "after 30 minutes"}</li>
        <li>You can then try logging in again</li>
        <li>Make sure you're using the correct password</li>
      </ul>
    </div>
    
    <div class="divider"></div>
    
    <p><strong>Forgot your password?</strong></p>
    <p>If you can't remember your password, you can reset it using the "Forgot Password" link on the login page.</p>
    
    <div class="danger-box">
      <p><strong>Didn't try to log in?</strong> If you did not attempt to access your account, someone may be trying to gain unauthorized access. Please contact our support team immediately.</p>
    </div>
    
    <p><strong>Security recommendations:</strong></p>
    <ul>
      <li>Use a strong, unique password</li>
      <li>Enable multi-factor authentication</li>
      <li>Never share your password with anyone</li>
      <li>Be cautious of phishing attempts</li>
    </ul>
  `;

  const html = baseTemplate({
    title: "Account Locked - TelemetryFlow",
    preheader: "Your account has been temporarily locked",
    content,
  });

  const text = `
Account Locked
${greeting ? `\n${greeting}\n` : ""}
Your account has been locked ${lockDuration}.
Reason: ${reason}
${data?.failedAttempts ? `Failed Attempts: ${failedAttempts}` : ""}

For your security, we've temporarily locked your account to prevent unauthorized access.

What happens next?
- Your account will be automatically unlocked ${data?.lockedUntil ? `at ${data.lockedUntil.toLocaleString()}` : "after 30 minutes"}
- You can then try logging in again
- Make sure you're using the correct password

Forgot your password?
If you can't remember your password, you can reset it using the "Forgot Password" link on the login page.

Didn't try to log in? If you did not attempt to access your account, someone may be trying to gain unauthorized access. Please contact our support team immediately.

Security recommendations:
- Use a strong, unique password
- Enable multi-factor authentication
- Never share your password with anyone
- Be cautious of phishing attempts

This is an automated message from TelemetryFlow. Please do not reply to this email.
  `.trim();

  return { html, text };
};
