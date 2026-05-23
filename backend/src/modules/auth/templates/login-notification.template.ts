/**
 * Login Notification Email Template
 */

import { baseTemplate } from "./base.template";

export interface LoginNotificationData {
  firstName?: string;
  lastName?: string;
  browser: string;
  os: string;
  location?: string;
  ipAddress?: string;
  timestamp?: Date;
}

export const loginNotificationTemplate = (
  data: LoginNotificationData,
): { html: string; text: string } => {
  const timestamp = data.timestamp
    ? data.timestamp.toLocaleString()
    : new Date().toLocaleString();

  const greeting = data.firstName
    ? `Hi ${data.firstName}${data.lastName ? " " + data.lastName : ""},`
    : "";

  const content = `
    <h2>New Login Detected</h2>
    ${greeting ? `<p>${greeting}</p>` : ""}
    <p>We detected a new login to your TelemetryFlow account.</p>
    
    <div class="info-box">
      <p><strong>Login Details:</strong></p>
    </div>
    
    <ul>
      <li><strong>Device:</strong> ${data.browser} on ${data.os}</li>
      <li><strong>Location:</strong> ${data.location || "Unknown"}</li>
      ${data.ipAddress ? `<li><strong>IP Address:</strong> ${data.ipAddress}</li>` : ""}
      <li><strong>Time:</strong> ${timestamp}</li>
    </ul>
    
    <div class="alert-box">
      <p><strong>Was this you?</strong> If you did not perform this login, please secure your account immediately by changing your password and reviewing your active sessions.</p>
    </div>
    
    <p>For your security, we recommend:</p>
    <ul>
      <li>Enabling multi-factor authentication</li>
      <li>Using a strong, unique password</li>
      <li>Regularly reviewing your active devices and sessions</li>
    </ul>
  `;

  const html = baseTemplate({
    title: "New Login Detected - TelemetryFlow",
    preheader: "A new login was detected on your account",
    content,
  });

  const text = `
New Login Detected
${greeting ? `\n${greeting}\n` : ""}
We detected a new login to your TelemetryFlow account.

Login Details:
- Device: ${data.browser} on ${data.os}
- Location: ${data.location || "Unknown"}
${data.ipAddress ? `- IP Address: ${data.ipAddress}` : ""}
- Time: ${timestamp}

Was this you? If you did not perform this login, please secure your account immediately by changing your password and reviewing your active sessions.

For your security, we recommend:
- Enabling multi-factor authentication
- Using a strong, unique password
- Regularly reviewing your active devices and sessions

This is an automated message from TelemetryFlow. Please do not reply to this email.
  `.trim();

  return { html, text };
};
