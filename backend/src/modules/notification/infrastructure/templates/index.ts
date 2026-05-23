/**
 * Email Templates Index
 *
 * This module exports template paths and utilities for email templates.
 * Templates are Handlebars (.hbs) files that are compiled at runtime.
 *
 * Available templates:
 * - registration-verification.hbs - Email verification during registration
 * - welcome.hbs - Welcome email after verification
 * - password-reset.hbs - Password reset link
 * - password-changed.hbs - Password change confirmation
 * - new-login-location.hbs - New device/location login alert
 * - security-alert.hbs - Security alerts and warnings
 * - email-otp.hbs - One-time password for email verification
 * - alert-notification.hbs - Alert firing/resolved notification
 * - uptime-down.hbs - Monitor down notification
 * - uptime-up.hbs - Monitor recovery notification
 * - report-summary.hbs - Generic report summary
 * - report-daily.hbs - Daily observability report with SVG gauge + bar charts
 * - report-weekly.hbs - Weekly report with 7-day trend chart
 * - report-monthly.hbs - Monthly executive report with SLA meter
 * - uptime-report.hbs - Organization uptime status report
 * - subscription-activated.hbs - Subscription activation confirmation
 * - subscription-expiring.hbs - Subscription expiry warning
 * - subscription-expired.hbs - Subscription expired notice
 */

import { join } from "path";

/**
 * Base path for email templates
 */
export const TEMPLATES_DIR = __dirname;

/**
 * Template file names mapped by type
 */
export const TEMPLATE_FILES = {
  REGISTRATION_VERIFICATION: "registration-verification.hbs",
  WELCOME: "welcome.hbs",
  PASSWORD_RESET: "password-reset.hbs",
  PASSWORD_CHANGED: "password-changed.hbs",
  NEW_LOGIN_LOCATION: "new-login-location.hbs",
  SECURITY_ALERT: "security-alert.hbs",
  EMAIL_OTP: "email-otp.hbs",
  ALERT_NOTIFICATION: "alert-notification.hbs",
  UPTIME_DOWN: "uptime-down.hbs",
  UPTIME_UP: "uptime-up.hbs",
  REPORT_SUMMARY: "report-summary.hbs",
  SUBSCRIPTION_ACTIVATED: "subscription-activated.hbs",
  SUBSCRIPTION_EXPIRING: "subscription-expiring.hbs",
  SUBSCRIPTION_EXPIRED: "subscription-expired.hbs",
  REPORT_DAILY: "report-daily.hbs",
  REPORT_WEEKLY: "report-weekly.hbs",
  REPORT_MONTHLY: "report-monthly.hbs",
  UPTIME_REPORT: "uptime-report.hbs",
} as const;

/**
 * Get the full path to a template file
 */
export function getTemplatePath(
  templateName: keyof typeof TEMPLATE_FILES,
): string {
  return join(TEMPLATES_DIR, TEMPLATE_FILES[templateName]);
}
