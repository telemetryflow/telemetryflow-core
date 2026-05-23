/**
 * Password Reminder Email Template
 */

import { baseTemplate } from "./base.template";

export interface PasswordReminderData {
  firstName?: string;
  lastName?: string;
  reminder: string;
}

export const passwordReminderTemplate = (
  data: PasswordReminderData,
): { html: string; text: string } => {
  const greeting = data.firstName
    ? `Hi ${data.firstName}${data.lastName ? " " + data.lastName : ""},`
    : "";

  const content = `
    <h2>Password Reminder</h2>
    ${greeting ? `<p>${greeting}</p>` : ""}

    <p>You requested a reminder for your password hint.</p>
    
    <div class="info-box">
      <p><strong>Your password reminder:</strong></p>
      <p style="font-size: 18px; margin-top: 12px;"><strong>${data.reminder}</strong></p>
    </div>
    
    <div class="divider"></div>
    
    <p><strong>Still can't remember?</strong></p>
    <p>If this reminder doesn't help you remember your password, you can reset it using the "Forgot Password" link on the login page.</p>
    
    <div class="alert-box">
      <p><strong>Security Note:</strong> For your security, we never store your actual password. We can only provide the hint you set up when creating your account.</p>
    </div>
    
    <div class="danger-box">
      <p><strong>Didn't request this?</strong> If you did not request a password reminder, someone may be trying to access your account. Please consider changing your password and enabling multi-factor authentication.</p>
    </div>
  `;

  const html = baseTemplate({
    title: "Password Reminder - TelemetryFlow",
    preheader: "Your password reminder",
    content,
  });

  const text = `
Password Reminder
${greeting ? `\n${greeting}\n` : ""}
You requested a reminder for your password hint.

Your password reminder: ${data.reminder}

Still can't remember?
If this reminder doesn't help you remember your password, you can reset it using the "Forgot Password" link on the login page.

Security Note: For your security, we never store your actual password. We can only provide the hint you set up when creating your account.

Didn't request this? If you did not request a password reminder, someone may be trying to access your account. Please consider changing your password and enabling multi-factor authentication.

This is an automated message from TelemetryFlow. Please do not reply to this email.
  `.trim();

  return { html, text };
};
