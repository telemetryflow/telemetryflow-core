/**
 * MFA Confirmation Email Template
 */

import { baseTemplate } from "./base.template";

export interface MFAConfirmationData {
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  timestamp?: Date;
}

export const mfaConfirmationTemplate = (
  data: MFAConfirmationData,
): { html: string; text: string } => {
  const action = data.enabled ? "enabled" : "disabled";
  const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);
  const timestamp = data.timestamp
    ? data.timestamp.toLocaleString()
    : new Date().toLocaleString();

  const greeting = data.firstName
    ? `Hi ${data.firstName}${data.lastName ? " " + data.lastName : ""},`
    : "";

  const content = data.enabled
    ? `
    <h2>Multi-Factor Authentication Enabled</h2>
    ${greeting ? `<p>${greeting}</p>` : ""}

    <div class="success-box">
      <p>Multi-factor authentication has been successfully enabled on your account at ${timestamp}.</p>
    </div>
    
    <p>Your account is now more secure! From now on, you'll need to provide a verification code from your authenticator app when logging in.</p>
    
    <p><strong>Important:</strong> Make sure you've saved your backup codes in a secure location. You'll need them if you lose access to your authenticator app.</p>
    
    <div class="info-box">
      <p><strong>What this means:</strong></p>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>Enhanced security for your account</li>
        <li>Protection against unauthorized access</li>
        <li>Additional verification step during login</li>
      </ul>
    </div>
    
    <div class="danger-box">
      <p><strong>Did you make this change?</strong> If you did not enable MFA, please contact our support team immediately as your account may be compromised.</p>
    </div>
  `
    : `
    <h2>Multi-Factor Authentication Disabled</h2>
    ${greeting ? `<p>${greeting}</p>` : ""}

    <div class="alert-box">
      <p>Multi-factor authentication has been disabled on your account at ${timestamp}.</p>
    </div>
    
    <p>Your account is now protected by password only. We strongly recommend keeping MFA enabled for enhanced security.</p>
    
    <div class="danger-box">
      <p><strong>Did you make this change?</strong> If you did not disable MFA, please contact our support team immediately and re-enable MFA as soon as possible.</p>
    </div>
    
    <p>To re-enable MFA:</p>
    <ul>
      <li>Log in to your account</li>
      <li>Go to Security Settings</li>
      <li>Enable Multi-Factor Authentication</li>
      <li>Scan the QR code with your authenticator app</li>
    </ul>
  `;

  const html = baseTemplate({
    title: `MFA ${actionCapitalized} - TelemetryFlow`,
    preheader: `Multi-factor authentication has been ${action}`,
    content,
  });

  const text = data.enabled
    ? `
Multi-Factor Authentication Enabled
${greeting ? `\n${greeting}\n` : ""}
Multi-factor authentication has been successfully enabled on your account at ${timestamp}.

Your account is now more secure! From now on, you'll need to provide a verification code from your authenticator app when logging in.

Important: Make sure you've saved your backup codes in a secure location. You'll need them if you lose access to your authenticator app.

What this means:
- Enhanced security for your account
- Protection against unauthorized access
- Additional verification step during login

Did you make this change? If you did not enable MFA, please contact our support team immediately as your account may be compromised.

This is an automated message from TelemetryFlow. Please do not reply to this email.
    `.trim()
    : `
Multi-Factor Authentication Disabled
${greeting ? `\n${greeting}\n` : ""}
Multi-factor authentication has been disabled on your account at ${timestamp}.

Your account is now protected by password only. We strongly recommend keeping MFA enabled for enhanced security.

Did you make this change? If you did not disable MFA, please contact our support team immediately and re-enable MFA as soon as possible.

To re-enable MFA:
- Log in to your account
- Go to Security Settings
- Enable Multi-Factor Authentication
- Scan the QR code with your authenticator app

This is an automated message from TelemetryFlow. Please do not reply to this email.
    `.trim();

  return { html, text };
};
