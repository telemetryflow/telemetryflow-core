import { baseTemplate } from "./base.template";

export interface AdministratorDeactivationData {
  timestamp: Date;
}

export function administratorDeactivationTemplate(
  data: AdministratorDeactivationData,
): { html: string; text: string } {
  const { timestamp } = data;

  const formattedDate = timestamp.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });

  const content = `
    <h2 style="color: #d32f2f; margin-bottom: 20px;">Administrator Account Deactivated</h2>
    
    <p style="margin-bottom: 15px;">
      Your administrator account has been deactivated by a Super Administrator.
    </p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #856404;">
        <strong>⚠️ Important:</strong> You will no longer be able to access your account or perform administrative functions.
      </p>
    </div>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Deactivation Time:</strong> ${formattedDate}</p>
    </div>
    
    <p style="margin-top: 20px;">
      If you believe this action was taken in error or if you have questions, please contact your organization's Super Administrator or support team.
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="color: #666; font-size: 14px; margin: 0;">
        This is an automated security notification. Please do not reply to this email.
      </p>
    </div>
  `;

  const textContent = `
Administrator Account Deactivated

Your administrator account has been deactivated by a Super Administrator.

⚠️ IMPORTANT: You will no longer be able to access your account or perform administrative functions.

Deactivation Details:
- Time: ${formattedDate}

If you believe this action was taken in error or if you have questions, please contact your organization's Super Administrator or support team.

---
This is an automated security notification. Please do not reply to this email.
  `.trim();

  return {
    html: baseTemplate({
      title: "Administrator Account Deactivated",
      preheader: "Your administrator account has been deactivated",
      content,
      footerText:
        "This is an automated security notification. Please do not reply to this email.",
    }),
    text: textContent,
  };
}
