import { DataSource } from "typeorm";
import { BaseSeed } from "@/database/shared/BaseSeed";
import { v4 as uuidv4 } from "uuid";

/**
 * Notification Module Seeds
 *
 * Creates system email templates for the notification module.
 * These templates are used by the EmailService for sending
 * transactional emails across the platform.
 */

export class NotificationTemplatesSeed extends BaseSeed {
  name = "NotificationTemplatesSeed";
  moduleName = "notification";
  order = 1;

  private dataSource!: DataSource;

  async run(dataSource: DataSource): Promise<void> {
    this.dataSource = dataSource;
    console.log("📧 Seeding notification templates...");

    // Check if notification_templates table exists
    const tableExists = await this.dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'notification_templates'
      )
    `);

    if (!tableExists[0].exists) {
      console.log(
        "  ℹ️ Notification templates table does not exist yet. Run migrations first.",
      );
      return;
    }

    const templates = [
      {
        id: uuidv4(),
        name: "registration-verification",
        type: "email",
        subject: "Verify your {{appName}} account",
        body: `<h1>Welcome to {{appName}}</h1>
<p>Hi {{firstName}},</p>
<p>Thank you for registering. Please verify your email address by clicking the link below:</p>
<p><a href="{{verificationLink}}">Verify Email Address</a></p>
<p>This link will expire in {{expirationHours}} hours.</p>
<p>If you did not create an account, please ignore this email.</p>
<p>Best regards,<br>The {{appName}} Team</p>`,
        variables: JSON.stringify([
          "firstName",
          "verificationLink",
          "expirationHours",
          "appName",
        ]),
        is_system: true,
        enabled: true,
      },
      {
        id: uuidv4(),
        name: "welcome",
        type: "email",
        subject: "Welcome to {{appName}}!",
        body: `<h1>Welcome to {{appName}}!</h1>
<p>Hi {{firstName}},</p>
<p>Your account has been verified successfully. You can now log in and start using {{appName}}.</p>
<p><a href="{{loginLink}}">Log In to Your Account</a></p>
<p>Here are some things you can do to get started:</p>
<ul>
  <li>Set up your first monitoring dashboard</li>
  <li>Configure notification channels</li>
  <li>Add your infrastructure endpoints</li>
</ul>
<p>Best regards,<br>The {{appName}} Team</p>`,
        variables: JSON.stringify([
          "firstName",
          "loginLink",
          "appName",
        ]),
        is_system: true,
        enabled: true,
      },
      {
        id: uuidv4(),
        name: "password-reset",
        type: "email",
        subject: "Reset your {{appName}} password",
        body: `<h1>Password Reset Request</h1>
<p>Hi {{firstName}},</p>
<p>We received a request to reset your password. Click the link below to set a new password:</p>
<p><a href="{{resetLink}}">Reset Password</a></p>
<p>This link will expire in {{expirationMinutes}} minutes.</p>
<p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
<p>Best regards,<br>The {{appName}} Team</p>`,
        variables: JSON.stringify([
          "firstName",
          "resetLink",
          "expirationMinutes",
          "appName",
        ]),
        is_system: true,
        enabled: true,
      },
      {
        id: uuidv4(),
        name: "password-changed",
        type: "email",
        subject: "Your {{appName}} password has been changed",
        body: `<h1>Password Changed</h1>
<p>Hi {{firstName}},</p>
<p>Your password was successfully changed on {{changedAt}}.</p>
<p><strong>Details:</strong></p>
<ul>
  <li>IP Address: {{ipAddress}}</li>
  {{#if browserInfo}}<li>Browser: {{browserInfo}}</li>{{/if}}
</ul>
<p>If you did not make this change, please reset your password immediately and contact support.</p>
<p>Best regards,<br>The {{appName}} Team</p>`,
        variables: JSON.stringify([
          "firstName",
          "changedAt",
          "ipAddress",
          "browserInfo",
          "appName",
        ]),
        is_system: true,
        enabled: true,
      },
      {
        id: uuidv4(),
        name: "security-alert",
        type: "email",
        subject: "Security alert for your {{appName}} account",
        body: `<h1>Security Alert</h1>
<p>Hi {{firstName}},</p>
<p>We detected a security event on your account:</p>
<p><strong>Reason:</strong> {{reason}}</p>
<p><strong>Action Required:</strong> {{actionRequired}}</p>
{{#if supportLink}}
<p>If you need assistance, please contact our <a href="{{supportLink}}">support team</a>.</p>
{{/if}}
<p>Best regards,<br>The {{appName}} Team</p>`,
        variables: JSON.stringify([
          "firstName",
          "reason",
          "actionRequired",
          "supportLink",
          "appName",
        ]),
        is_system: true,
        enabled: true,
      },
      {
        id: uuidv4(),
        name: "alert-notification",
        type: "email",
        subject: "[{{severity}}] {{alertName}} - {{appName}}",
        body: `<h1>Alert: {{alertName}}</h1>
<p>An alert has been triggered in your {{appName}} environment.</p>
<p><strong>Severity:</strong> {{severity}}</p>
<p><strong>Description:</strong> {{description}}</p>
<p><strong>Current Value:</strong> {{currentValue}}</p>
<p><strong>Threshold:</strong> {{threshold}}</p>
<p><strong>Triggered At:</strong> {{triggeredAt}}</p>
{{#if dashboardLink}}
<p><a href="{{dashboardLink}}">View Dashboard</a></p>
{{/if}}
<p>Best regards,<br>The {{appName}} Team</p>`,
        variables: JSON.stringify([
          "alertName",
          "severity",
          "description",
          "currentValue",
          "threshold",
          "triggeredAt",
          "dashboardLink",
          "appName",
        ]),
        is_system: true,
        enabled: true,
      },
    ];

    for (const template of templates) {
      const exists = await this.dataSource.query(
        `SELECT id FROM notification_templates WHERE name = $1 AND is_system = true`,
        [template.name],
      );

      if (exists.length > 0) {
        console.log(
          `  ⏭️ System template "${template.name}" already exists`,
        );
        continue;
      }

      await this.dataSource.query(
        `INSERT INTO notification_templates (
          id, name, type, subject, body, variables, is_system, enabled,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          template.id,
          template.name,
          template.type,
          template.subject,
          template.body,
          template.variables,
          template.is_system,
          template.enabled,
        ],
      );

      console.log(`  ✅ Created system template: ${template.name}`);
    }

    console.log("📧 Notification templates seeding completed!");
  }
}

export const NotificationSeeds = [NotificationTemplatesSeed];

export async function runNotificationSeeds(
  dataSource: DataSource,
): Promise<void> {
  console.log("\n========================================");
  console.log("📧 Running Notification Module Seeds");
  console.log("========================================\n");

  for (const SeedClass of NotificationSeeds) {
    const seed = new SeedClass();
    await seed.run(dataSource);
  }

  console.log("\n========================================");
  console.log("✅ Notification Module Seeds Complete");
  console.log("========================================\n");
}
