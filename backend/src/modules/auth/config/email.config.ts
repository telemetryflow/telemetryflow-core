/**
 * Email Configuration for Auth Module
 *
 * SMTP configuration for sending authentication-related emails
 */

export interface EmailConfig {
  enabled: boolean;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
  from: {
    address: string;
    name: string;
  };
  replyTo?: string;
  maxRetries: number;
  retryDelay: number;
}

export const getEmailConfig = (): EmailConfig => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  return {
    enabled: process.env.SMTP_ENABLED === "true",
    smtp: {
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "1025", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        smtpUser && smtpPassword
          ? {
              user: smtpUser,
              pass: smtpPassword,
            }
          : undefined,
    },
    from: {
      address: process.env.SMTP_FROM_ADDRESS || "noreply@telemetryflow.id",
      name: process.env.SMTP_FROM_NAME || "TelemetryFlow",
    },
    replyTo: process.env.SMTP_REPLY_TO,
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  };
};
