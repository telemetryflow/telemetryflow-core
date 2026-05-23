/**
 * Password Change Confirmation Email Template
 */

import { baseTemplate } from "./base.template";

export interface PasswordChangeData {
  firstName?: string;
  lastName?: string;
  timestamp?: Date;
}

export const passwordChangeTemplate = (
  data?: PasswordChangeData,
): { html: string; text: string } => {
  const timestamp = data?.timestamp
    ? data.timestamp.toLocaleString()
    : new Date().toLocaleString();

  const greeting = data?.firstName
    ? `Hi ${data.firstName}${data.lastName ? " " + data.lastName : ""},`
    : "";

  const content = `
    <h2>Password Changed Successfully</h2>
    ${greeting ? `<p>${greeting}</p>` : ""}

    <div class="success-box">
      <p>Your password has been changed successfully at ${timestamp}.</p>
    </div>
    
    <p>Your account is now secured with your new password. All existing sessions on other devices have been terminated for your security.</p>
    
    <div class="danger-box">
      <p><strong>Did you make this change?</strong> If you did not change your password, your account may be compromised. Please contact our support team immediately.</p>
    </div>
    
    <p>Security tips:</p>
    <ul>
      <li>Never share your password with anyone</li>
      <li>Use a unique password for TelemetryFlow</li>
      <li>Enable multi-factor authentication for added security</li>
      <li>Regularly review your active sessions and devices</li>
    </ul>
  `;

  const html = baseTemplate({
    title: "Password Changed - TelemetryFlow",
    preheader: "Your password has been changed successfully",
    content,
  });

  const text = `
Password Changed Successfully
${greeting ? `\n${greeting}\n` : ""}
Your password has been changed successfully at ${timestamp}.

Your account is now secured with your new password. All existing sessions on other devices have been terminated for your security.

Did you make this change? If you did not change your password, your account may be compromised. Please contact our support team immediately.

Security tips:
- Never share your password with anyone
- Use a unique password for TelemetryFlow
- Enable multi-factor authentication for added security
- Regularly review your active sessions and devices

This is an automated message from TelemetryFlow. Please do not reply to this email.
  `.trim();

  return { html, text };
};
