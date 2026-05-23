/**
 * Security Alert Email Template
 */

import { baseTemplate } from "./base.template";

export enum SecurityAlertType {
  LOGIN_NEW_DEVICE = "login_new_device",
  PASSWORD_CHANGED = "password_changed",
  MFA_ENABLED = "mfa_enabled",
  MFA_DISABLED = "mfa_disabled",
  ACCOUNT_LOCKED = "account_locked",
  DEVICE_REVOKED = "device_revoked",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
}

export interface SecurityAlertData {
  firstName?: string;
  lastName?: string;
  alertType: SecurityAlertType;
  details?: Record<string, any>;
  timestamp?: Date;
}

const alertConfig = {
  [SecurityAlertType.LOGIN_NEW_DEVICE]: {
    title: "New Device Login Detected",
    severity: "warning",
    description: "A login from a new device was detected on your account.",
  },
  [SecurityAlertType.PASSWORD_CHANGED]: {
    title: "Password Changed",
    severity: "info",
    description: "Your account password has been changed.",
  },
  [SecurityAlertType.MFA_ENABLED]: {
    title: "Multi-Factor Authentication Enabled",
    severity: "success",
    description:
      "Multi-factor authentication has been enabled on your account.",
  },
  [SecurityAlertType.MFA_DISABLED]: {
    title: "Multi-Factor Authentication Disabled",
    severity: "warning",
    description:
      "Multi-factor authentication has been disabled on your account.",
  },
  [SecurityAlertType.ACCOUNT_LOCKED]: {
    title: "Account Locked",
    severity: "danger",
    description:
      "Your account has been locked due to suspicious activity or multiple failed login attempts.",
  },
  [SecurityAlertType.DEVICE_REVOKED]: {
    title: "Device Access Revoked",
    severity: "warning",
    description: "Access from a device has been revoked.",
  },
  [SecurityAlertType.SUSPICIOUS_ACTIVITY]: {
    title: "Suspicious Activity Detected",
    severity: "danger",
    description:
      "We detected suspicious activity on your account that requires your attention.",
  },
};

export const securityAlertTemplate = (
  data: SecurityAlertData,
): { html: string; text: string } => {
  const config = alertConfig[data.alertType];
  const timestamp = data.timestamp
    ? data.timestamp.toLocaleString()
    : new Date().toLocaleString();

  const boxClass =
    config.severity === "danger"
      ? "danger-box"
      : config.severity === "warning"
        ? "alert-box"
        : config.severity === "success"
          ? "success-box"
          : "info-box";

  let detailsHtml = "";
  let detailsText = "";

  if (data.details && Object.keys(data.details).length > 0) {
    detailsHtml = `
      <div class="divider"></div>
      <p><strong>Additional Details:</strong></p>
      <ul>
        ${Object.entries(data.details)
          .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
          .join("")}
      </ul>
    `;

    detailsText = `\n\nAdditional Details:\n${Object.entries(data.details)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n")}`;
  }

  const greeting = data.firstName
    ? `Hi ${data.firstName}${data.lastName ? " " + data.lastName : ""},`
    : "";

  const content = `
    <h2>Security Alert</h2>
    ${greeting ? `<p>${greeting}</p>` : ""}

    <div class="${boxClass}">
      <p><strong>${config.title}</strong></p>
      <p>${config.description}</p>
      <p><strong>Time:</strong> ${timestamp}</p>
    </div>
    
    ${detailsHtml}
    
    <div class="divider"></div>
    
    <p><strong>What should you do?</strong></p>
    <ul>
      <li>Review your recent account activity</li>
      <li>Check your active sessions and devices</li>
      <li>Change your password if you suspect unauthorized access</li>
      <li>Enable multi-factor authentication for added security</li>
      <li>Contact support if you need assistance</li>
    </ul>
    
    <div class="danger-box">
      <p><strong>Was this you?</strong> If you did not perform this action or recognize this activity, please secure your account immediately by changing your password and contacting our support team.</p>
    </div>
  `;

  const html = baseTemplate({
    title: `Security Alert: ${config.title} - TelemetryFlow`,
    preheader: config.description,
    content,
  });

  const text = `
Security Alert: ${config.title}
${greeting ? `\n${greeting}\n` : ""}
${config.description}
Time: ${timestamp}
${detailsText}

What should you do?
- Review your recent account activity
- Check your active sessions and devices
- Change your password if you suspect unauthorized access
- Enable multi-factor authentication for added security
- Contact support if you need assistance

Was this you? If you did not perform this action or recognize this activity, please secure your account immediately by changing your password and contacting our support team.

This is an automated message from TelemetryFlow. Please do not reply to this email.
  `.trim();

  return { html, text };
};
