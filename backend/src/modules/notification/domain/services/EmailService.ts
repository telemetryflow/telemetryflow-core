import { Injectable, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";
import {
  IEmailProvider,
  EMAIL_PROVIDER,
  EmailResult,
} from "../../infrastructure/providers/IEmailProvider";

/**
 * Email Template Types
 */
export enum EmailTemplateType {
  REGISTRATION_VERIFICATION = "registration-verification",
  WELCOME = "welcome",
  PASSWORD_RESET = "password-reset",
  PASSWORD_CHANGED = "password-changed",
  NEW_LOGIN_LOCATION = "new-login-location",
  SECURITY_ALERT = "security-alert",
  EMAIL_OTP = "email-otp",
  ALERT_NOTIFICATION = "alert-notification",
  UPTIME_DOWN = "uptime-down",
  UPTIME_UP = "uptime-up",
  REPORT_SUMMARY = "report-summary",
  SUBSCRIPTION_ACTIVATED = "subscription-activated",
  SUBSCRIPTION_EXPIRING = "subscription-expiring",
  SUBSCRIPTION_EXPIRED = "subscription-expired",
  REPORT_DAILY = "report-daily",
  REPORT_WEEKLY = "report-weekly",
  REPORT_MONTHLY = "report-monthly",
  UPTIME_REPORT = "uptime-report",
}

/**
 * Template Variables Interfaces
 */
export interface RegistrationVerificationVariables {
  firstName: string;
  lastName: string;
  verificationLink: string;
  expirationHours: number;
}

export interface WelcomeVariables {
  firstName: string;
  lastName: string;
  loginLink: string;
}

export interface PasswordResetVariables {
  firstName: string;
  lastName: string;
  resetLink: string;
  expirationMinutes: number;
}

export interface PasswordChangedVariables {
  firstName: string;
  lastName: string;
  changedAt: string;
  ipAddress: string;
  browserInfo?: string;
}

export interface NewLoginLocationVariables {
  firstName: string;
  lastName: string;
  deviceInfo: string;
  location: string;
  time: string;
  ipAddress: string;
}

export interface SecurityAlertVariables {
  firstName: string;
  lastName: string;
  reason: string;
  actionRequired: string;
  supportLink?: string;
}

export interface EmailOTPVariables {
  firstName: string;
  lastName: string;
  otpCode: string;
  expirationMinutes: number;
}

export interface UptimeDownVariables {
  monitorName: string;
  monitorUrl: string;
  statusCode: string;
  responseTime: string;
  region: string;
  downSince: string;
  errorMessage?: string;
  monitorLink: string;
}

export interface UptimeUpVariables {
  monitorName: string;
  monitorUrl: string;
  statusCode: string;
  responseTime: string;
  region: string;
  recoveredAt: string;
  downtimeDuration: string;
  monitorLink: string;
}

export interface ReportSummaryVariables {
  reportTitle: string;
  firstName: string;
  lastName: string;
  periodLabel: string;
  periodRange: string;
  uptimePercentage: string;
  incidentCount: string;
  avgResponseTime: string;
  alertCount: string;
  logsIngested: string;
  activeMonitors: string;
  hasIncidents: boolean;
  incidentSummary?: string;
  incidents?: Array<{ title: string; date: string; duration: string }>;
  reportLink: string;
}

export interface SubscriptionActivatedVariables {
  firstName: string;
  lastName: string;
  planName: string;
  billingPeriod: string;
  amount: string;
  nextBillingDate: string;
  featuresIncluded: string;
  dashboardLink: string;
}

export interface SubscriptionExpiringVariables {
  firstName: string;
  lastName: string;
  planName: string;
  expirationDate: string;
  daysRemaining: string;
  renewLink: string;
}

export interface SubscriptionExpiredVariables {
  firstName: string;
  lastName: string;
  planName: string;
  expiredDate: string;
  reactivateLink: string;
}

export interface AlertNotificationVariables {
  alertTitle: string;
  alertRuleName: string;
  description: string;
  severity: string;
  severityColor: string;
  severityClass: string;
  severityBgLight: string;
  statusLabel: string;
  isResolved: boolean;
  currentValue: string;
  threshold: string;
  startsAt: string;
  endsAt?: string;
  fingerprint: string;
  hasLabels: boolean;
  labelsFormatted?: string;
  alertLink: string;
  appName: string;
  logoUrl: string;
}

// --- Report Daily ---
export interface DailyMetricItem {
  label: string;
  value: string;
  changePercent: string;
  changeDirection: "up" | "down" | "flat";
}

export interface ResponseTimeDistribution {
  label: string;
  count: string;
  percentage: number;
  color: string;
}

export interface TopAlertItem {
  ruleName: string;
  severity: string;
  severityColor: string;
  count: string;
  lastFired: string;
}

export interface ReportDailyVariables {
  reportTitle: string;
  firstName: string;
  lastName: string;
  periodRange: string;
  generatedAt: string;
  uptimePercentage: number;
  uptimePercentageDisplay: string;
  uptimeStrokeColor: string;
  monitorsUp: string;
  monitorsDown: string;
  monitorsDegraded: string;
  monitorsTotal: string;
  metrics: DailyMetricItem[];
  responseTimeDistribution: ResponseTimeDistribution[];
  hasAlerts: boolean;
  topAlerts: TopAlertItem[];
  reportLink: string;
}

// --- Report Weekly ---
export interface WeeklyDayBar {
  dayLabel: string;
  date: string;
  uptimePercent: number;
  barHeightPx: number;
  barColor: string;
  incidentCount: string;
}

export interface WeeklyComparisonMetric {
  label: string;
  thisWeek: string;
  lastWeek: string;
  changePercent: string;
  changeDirection: "up" | "down" | "flat";
  isPositiveChange: boolean;
}

export interface WeeklyIncidentDay {
  dayLabel: string;
  count: number;
  barWidthPercent: number;
}

export interface ServicePerformanceRow {
  serviceName: string;
  uptime: string;
  uptimePercent: number;
  uptimeBarWidth: number;
  avgResponseTime: string;
  avgResponseTimeMs: number;
  responseTimeBarWidth: number;
  responseTimeColor: string;
}

export interface ReportWeeklyVariables {
  reportTitle: string;
  firstName: string;
  lastName: string;
  periodRange: string;
  generatedAt: string;
  weeklyBars: WeeklyDayBar[];
  comparisonMetrics: WeeklyComparisonMetric[];
  hasIncidents: boolean;
  incidentTimeline: WeeklyIncidentDay[];
  performanceSummary: ServicePerformanceRow[];
  reportLink: string;
}

// --- Report Monthly ---
export interface MonthlyWeekBar {
  weekLabel: string;
  dateRange: string;
  uptimePercent: number;
  barWidthPercent: number;
  barColor: string;
}

export interface MonthlyComparisonRow {
  metric: string;
  currentMonth: string;
  previousMonth: string;
  changePercent: string;
  changeDirection: "up" | "down" | "flat";
  changeColor: string;
}

export interface TopIncidentItem {
  rank: string;
  title: string;
  severity: string;
  severityColor: string;
  duration: string;
  affectedServices: string;
  date: string;
}

export interface ReportMonthlyVariables {
  reportTitle: string;
  firstName: string;
  lastName: string;
  periodRange: string;
  generatedAt: string;
  uptimePercentage: number;
  uptimePercentageDisplay: string;
  uptimeStrokeColor: string;
  slaTarget: string;
  slaActual: string;
  slaCompliant: boolean;
  slaBarWidthPercent: number;
  slaBarColor: string;
  weeklyTrend: MonthlyWeekBar[];
  monthlyComparison: MonthlyComparisonRow[];
  hasIncidents: boolean;
  topIncidents: TopIncidentItem[];
  reportLink: string;
}

// --- Uptime Report ---
export interface EndpointStatusRow {
  name: string;
  url: string;
  status: "UP" | "DOWN" | "DEGRADED" | "PAUSED";
  statusColor: string;
  statusBgColor: string;
  uptimePercent: string;
  uptimeBarWidth: number;
  uptimeBarColor: string;
  responseTime: string;
  region: string;
  hasSSLWarning: boolean;
  sslDaysRemaining?: string;
}

export interface RegionSummary {
  region: string;
  monitorsCount: string;
  avgUptime: string;
  avgResponseTime: string;
}

export interface SSLWarningItem {
  monitorName: string;
  url: string;
  daysUntilExpiry: string;
  expiryDate: string;
  urgencyColor: string;
}

export interface NeedsAttentionItem {
  name: string;
  url: string;
  status: string;
  statusColor: string;
  uptimePercent: string;
  consecutiveDownCount: string;
  lastCheckAt: string;
}

export interface UptimeReportVariables {
  reportTitle: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  periodRange: string;
  generatedAt: string;
  overallUptime: number;
  overallUptimeDisplay: string;
  overallUptimeColor: string;
  totalEndpoints: string;
  endpointsUp: string;
  endpointsDown: string;
  endpointsDegraded: string;
  endpoints: EndpointStatusRow[];
  hasMultipleRegions: boolean;
  regions: RegionSummary[];
  hasSSLWarnings: boolean;
  sslWarnings: SSLWarningItem[];
  hasNeedsAttention: boolean;
  needsAttention: NeedsAttentionItem[];
  reportLink: string;
}

export type TemplateVariables =
  | RegistrationVerificationVariables
  | WelcomeVariables
  | PasswordResetVariables
  | PasswordChangedVariables
  | NewLoginLocationVariables
  | SecurityAlertVariables
  | EmailOTPVariables
  | AlertNotificationVariables
  | UptimeDownVariables
  | UptimeUpVariables
  | ReportSummaryVariables
  | SubscriptionActivatedVariables
  | SubscriptionExpiringVariables
  | SubscriptionExpiredVariables
  | ReportDailyVariables
  | ReportWeeklyVariables
  | ReportMonthlyVariables
  | UptimeReportVariables;

/**
 * Email Service
 * Handles email template rendering and sending
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();
  private readonly templateDir: string;
  private readonly appName: string;
  private readonly appUrl: string;

  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
    private readonly configService: ConfigService,
  ) {
    this.templateDir = path.join(__dirname, "../../infrastructure/templates");
    this.appName =
      this.configService.get<string>("APP_NAME") || "TelemetryFlow";
    this.appUrl =
      this.configService.get<string>("APP_URL") || "http://localhost:5173";
  }

  async onModuleInit() {
    await this.loadTemplates();
    this.registerHelpers();
  }

  private async loadTemplates(): Promise<void> {
    const templateFiles = [
      "registration-verification",
      "welcome",
      "password-reset",
      "password-changed",
      "new-login-location",
      "security-alert",
      "email-otp",
      "alert-notification",
      "uptime-down",
      "uptime-up",
      "report-summary",
      "subscription-activated",
      "subscription-expiring",
      "subscription-expired",
      "report-daily",
      "report-weekly",
      "report-monthly",
      "uptime-report",
    ];

    for (const templateName of templateFiles) {
      const templatePath = path.join(this.templateDir, `${templateName}.hbs`);
      try {
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, "utf-8");
          this.templates.set(templateName, Handlebars.compile(templateContent));
          this.logger.log(`Loaded email template: ${templateName}`);
        } else {
          this.logger.warn(`Email template not found: ${templatePath}`);
        }
      } catch (error) {
        this.logger.error(`Failed to load template ${templateName}: ${error}`);
      }
    }
  }

  private registerHelpers(): void {
    // Register common Handlebars helpers
    Handlebars.registerHelper("currentYear", () => new Date().getFullYear());
    Handlebars.registerHelper("appName", () => this.appName);
    Handlebars.registerHelper("appUrl", () => this.appUrl);
    Handlebars.registerHelper("formatDate", (date: Date | string) =>
      new Date(date).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );

    // Report & uptime template helpers
    Handlebars.registerHelper("gaugeStrokeDasharray", (percentage: number) => {
      const circumference = 282.74;
      const filled = (percentage / 100) * circumference;
      return `${filled.toFixed(1)} ${(circumference - filled).toFixed(1)}`;
    });

    Handlebars.registerHelper("subtract", (a: number, b: number) => a - b);

    Handlebars.registerHelper("trendArrow", (direction: string) => {
      switch (direction) {
        case "up":
          return "\u2191";
        case "down":
          return "\u2193";
        default:
          return "\u2192";
      }
    });

    Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
    Handlebars.registerHelper("gt", (a: number, b: number) => a > b);
    Handlebars.registerHelper("inc", (value: number) => value + 1);
    Handlebars.registerHelper("clampWidth", (value: number) =>
      Math.min(100, Math.max(0, value)),
    );

    // Uptime mini bars helper — renders check history using UPTIME_COLORS
    // Matches MonitorDetailPanel.vue: display:flex; gap:2px; flex:1; border-radius:2px
    // Compact (default): 20 segments inline  |  Wide: 50 segments width:100%
    // Colors: green=#22c55e  red=#ef4444  gray=#9ca3af  orange=#f59e0b
    // Usage: {{{uptimeMiniBars percentage status=status}}}  — compact
    //        {{{uptimeMiniBars percentage wide=true}}}      — wide
    //        {{{uptimeMiniBars checksArray wide=true}}}     — array of status strings
    Handlebars.registerHelper(
      "uptimeMiniBars",
      function (this: unknown, ...args: unknown[]) {
        const options = args[args.length - 1] as {
          hash?: Record<string, unknown>;
        };
        const hash = options?.hash || {};
        const wide = hash.wide === true || hash.wide === "true";
        const firstArg = args[0];

        // UPTIME_COLORS (same as frontend)
        const GREEN = "#22c55e";
        const RED = "#ef4444";
        const GRAY = "#9ca3af";
        const ORANGE = "#f59e0b";

        const barCount = wide ? 50 : 20;
        let colors: string[];

        if (Array.isArray(firstArg)) {
          // Array mode: each element is a status string
          colors = (firstArg as string[]).map((s) => {
            const st = String(s).toLowerCase();
            if (st === "down" || st === "failure") return RED;
            if (
              st === "degraded" ||
              st === "timeout" ||
              st === "error" ||
              st === "pending"
            )
              return ORANGE;
            if (st === "unknown" || st === "paused" || st === "maintenance")
              return GRAY;
            return GREEN;
          });
          while (colors.length < barCount) colors.push(GRAY);
          if (colors.length > barCount)
            colors = colors.slice(colors.length - barCount);
        } else {
          // Percentage mode: scatter non-green segments evenly across the bar
          const percentage = (firstArg as number) || 0;
          const status = hash.status as string | boolean | undefined;
          const statusStr = String(status || "").toLowerCase();
          const isPaused =
            status === true ||
            statusStr === "true" ||
            statusStr === "paused" ||
            statusStr === "unknown";
          const isDegraded =
            statusStr === "degraded" ||
            statusStr === "timeout" ||
            statusStr === "error" ||
            statusStr === "pending";

          const pct = Math.max(0, Math.min(100, percentage));
          const greenCount = Math.round((pct / 100) * barCount);
          const failCount = barCount - greenCount;
          const failColor = isPaused ? GRAY : isDegraded ? ORANGE : RED;

          colors = new Array(barCount).fill(GREEN);
          if (failCount > 0 && failCount < barCount) {
            const step = barCount / failCount;
            for (let j = 0; j < failCount; j++) {
              colors[
                Math.min(barCount - 1, Math.floor(step * j + step * 0.6))
              ] = failColor;
            }
          } else if (failCount >= barCount) {
            colors.fill(failColor);
          }
        }

        if (wide) {
          // Wide: flexbox layout — matches MonitorDetailPanel.vue
          // Uses margin instead of gap for Outlook desktop compatibility
          const barHeight = 24;
          let bars = "";
          for (const color of colors) {
            bars += `<div style="flex:1;min-width:2px;height:${barHeight}px;background:${color};border-radius:2px;margin:0 1px"></div>`;
          }
          return new Handlebars.SafeString(
            `<div style="display:flex;width:100%">${bars}</div>`,
          );
        } else {
          // Compact: inline-table for email compatibility
          let cells = "";
          for (const color of colors) {
            cells += `<td style="width:4px;height:16px;background:${color};border-radius:1px">&nbsp;</td>`;
          }
          return new Handlebars.SafeString(
            `<table role="presentation" cellpadding="0" cellspacing="1" border="0" style="display:inline-table;vertical-align:middle"><tr>${cells}</tr></table>`,
          );
        }
      },
    );
  }

  /**
   * Render an email template with variables
   */
  private renderTemplate(
    templateType: EmailTemplateType,
    variables: TemplateVariables,
  ): string {
    const template = this.templates.get(templateType);
    if (!template) {
      throw new Error(`Email template not found: ${templateType}`);
    }

    const year = new Date().getFullYear();
    return template({
      ...variables,
      appName: this.appName,
      appUrl: this.appUrl,
      logoUrl: (variables as unknown as Record<string, unknown>)["logoUrl"] ?? `${this.appUrl}/tfo-logo-dark`,
      year,
      currentYear: year,
    });
  }

  /**
   * Render the alert-notification.hbs template and return { html, subject }.
   * Used by NotificationSender when sending via per-channel custom SMTP.
   */
  renderAlertNotificationHtml(notification: {
    alertInstanceId: string;
    alertRuleId: string;
    alertRuleName: string;
    severity: string;
    status: "firing" | "resolved";
    title: string;
    description: string;
    currentValue: number;
    threshold: number;
    labels: Record<string, string>;
    startsAt: Date;
    endsAt?: Date;
    fingerprint: string;
  }): { html: string; subject: string } {
    const severityMap: Record<
      string,
      { color: string; bgLight: string; cssClass: string }
    > = {
      critical: { color: "#dc2626", bgLight: "#fef2f2", cssClass: "critical" },
      warning: { color: "#d97706", bgLight: "#fffbeb", cssClass: "warning" },
      info: { color: "#0d9488", bgLight: "#f0fdfa", cssClass: "info" },
    };
    const sev =
      severityMap[notification.severity.toLowerCase()] || severityMap.info;
    const isResolved = notification.status === "resolved";
    const labelEntries = Object.entries(notification.labels);

    const variables: AlertNotificationVariables = {
      alertTitle: notification.title,
      alertRuleName: notification.alertRuleName,
      description: notification.description,
      severity: notification.severity.toUpperCase(),
      severityColor: sev.color,
      severityClass: sev.cssClass,
      severityBgLight: sev.bgLight,
      statusLabel: isResolved ? "RESOLVED" : "FIRING",
      isResolved,
      currentValue: notification.currentValue.toString(),
      threshold: notification.threshold.toString(),
      startsAt: notification.startsAt.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      endsAt: notification.endsAt
        ? notification.endsAt.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : undefined,
      fingerprint: notification.fingerprint,
      hasLabels: labelEntries.length > 0,
      labelsFormatted: labelEntries.map(([k, v]) => `${k}="${v}"`).join(", "),
      alertLink: `${this.appUrl}/alerts/${notification.alertInstanceId}`,
      appName: this.appName,
      logoUrl: `${this.appUrl}/tfo-logo-dark.png`,
    };

    const subject = isResolved
      ? `[${this.appName}] Resolved: ${notification.alertRuleName}`
      : `[${this.appName}] ${notification.severity.toUpperCase()}: ${notification.alertRuleName}`;

    const html = this.renderTemplate(
      EmailTemplateType.ALERT_NOTIFICATION,
      variables,
    );
    return { html, subject };
  }

  /**
   * Get subject line for a template type
   */
  private getSubject(
    templateType: EmailTemplateType,
    _variables?: TemplateVariables,
  ): string {
    const subjects: Record<EmailTemplateType, string> = {
      [EmailTemplateType.REGISTRATION_VERIFICATION]: `Verify your ${this.appName} account`,
      [EmailTemplateType.WELCOME]: `Welcome to ${this.appName}!`,
      [EmailTemplateType.PASSWORD_RESET]: `Reset your ${this.appName} password`,
      [EmailTemplateType.PASSWORD_CHANGED]: `Your ${this.appName} password has been changed`,
      [EmailTemplateType.NEW_LOGIN_LOCATION]: `New login to your ${this.appName} account`,
      [EmailTemplateType.SECURITY_ALERT]: `Security alert for your ${this.appName} account`,
      [EmailTemplateType.EMAIL_OTP]: `Your ${this.appName} verification code`,
      [EmailTemplateType.ALERT_NOTIFICATION]: `[${this.appName}] Alert Notification`,
      [EmailTemplateType.UPTIME_DOWN]: `[${this.appName}] Monitor DOWN`,
      [EmailTemplateType.UPTIME_UP]: `[${this.appName}] Monitor Recovered`,
      [EmailTemplateType.REPORT_SUMMARY]: `[${this.appName}] Report Summary`,
      [EmailTemplateType.SUBSCRIPTION_ACTIVATED]: `Your ${this.appName} subscription is active`,
      [EmailTemplateType.SUBSCRIPTION_EXPIRING]: `Your ${this.appName} subscription is expiring soon`,
      [EmailTemplateType.SUBSCRIPTION_EXPIRED]: `Your ${this.appName} subscription has expired`,
      [EmailTemplateType.REPORT_DAILY]: `[${this.appName}] Daily Observability Report`,
      [EmailTemplateType.REPORT_WEEKLY]: `[${this.appName}] Weekly Observability Report`,
      [EmailTemplateType.REPORT_MONTHLY]: `[${this.appName}] Monthly Executive Report`,
      [EmailTemplateType.UPTIME_REPORT]: `[${this.appName}] Organization Uptime Report`,
    };

    return subjects[templateType] || `${this.appName} Notification`;
  }

  /**
   * Send a templated email
   */
  async sendTemplateEmail(
    to: string,
    templateType: EmailTemplateType,
    variables: TemplateVariables,
  ): Promise<EmailResult> {
    try {
      const html = this.renderTemplate(templateType, variables);
      const subject = this.getSubject(templateType, variables);

      return await this.emailProvider.send({
        to,
        subject,
        html,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to send ${templateType} email to ${to}: ${errorMessage}`,
      );
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send registration verification email
   */
  async sendVerificationEmail(
    to: string,
    firstName: string,
    lastName: string,
    verificationToken: string,
  ): Promise<EmailResult> {
    const verificationLink = `${this.appUrl}/verify-email?token=${verificationToken}`;

    return this.sendTemplateEmail(
      to,
      EmailTemplateType.REGISTRATION_VERIFICATION,
      {
        firstName,
        lastName,
        verificationLink,
        expirationHours: 24,
      },
    );
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(
    to: string,
    firstName: string,
    lastName: string,
  ): Promise<EmailResult> {
    return this.sendTemplateEmail(to, EmailTemplateType.WELCOME, {
      firstName,
      lastName,
      loginLink: `${this.appUrl}/login`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    lastName: string,
    resetToken: string,
  ): Promise<EmailResult> {
    const resetLink = `${this.appUrl}/reset-password?token=${resetToken}`;

    return this.sendTemplateEmail(to, EmailTemplateType.PASSWORD_RESET, {
      firstName,
      lastName,
      resetLink,
      expirationMinutes: 60,
    });
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(
    to: string,
    firstName: string,
    lastName: string,
    ipAddress: string,
    browserInfo?: string,
  ): Promise<EmailResult> {
    return this.sendTemplateEmail(to, EmailTemplateType.PASSWORD_CHANGED, {
      firstName,
      lastName,
      changedAt: new Date().toISOString(),
      ipAddress,
      browserInfo,
    });
  }

  /**
   * Send new login location alert
   */
  async sendNewLoginLocationEmail(
    to: string,
    firstName: string,
    lastName: string,
    deviceInfo: string,
    location: string,
    ipAddress: string,
  ): Promise<EmailResult> {
    return this.sendTemplateEmail(to, EmailTemplateType.NEW_LOGIN_LOCATION, {
      firstName,
      lastName,
      deviceInfo,
      location,
      time: new Date().toISOString(),
      ipAddress,
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlertEmail(
    to: string,
    firstName: string,
    lastName: string,
    reason: string,
    actionRequired: string,
  ): Promise<EmailResult> {
    return this.sendTemplateEmail(to, EmailTemplateType.SECURITY_ALERT, {
      firstName,
      lastName,
      reason,
      actionRequired,
      supportLink: `${this.appUrl}/support`,
    });
  }

  /**
   * Send email OTP code
   */
  async sendEmailOTP(
    to: string,
    firstName: string,
    lastName: string,
    otpCode: string,
  ): Promise<EmailResult> {
    return this.sendTemplateEmail(to, EmailTemplateType.EMAIL_OTP, {
      firstName,
      lastName,
      otpCode,
      expirationMinutes: 10,
    });
  }

  /**
   * Send uptime monitor DOWN notification
   */
  async sendUptimeDownEmail(
    to: string | string[],
    monitor: {
      monitorId: string;
      monitorName: string;
      monitorUrl: string;
      statusCode: number;
      responseTime: number;
      region: string;
      downSince: Date;
      errorMessage?: string;
    },
  ): Promise<EmailResult> {
    const variables: UptimeDownVariables = {
      monitorName: monitor.monitorName,
      monitorUrl: monitor.monitorUrl,
      statusCode: monitor.statusCode.toString(),
      responseTime: `${monitor.responseTime}ms`,
      region: monitor.region,
      downSince: monitor.downSince.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      errorMessage: monitor.errorMessage,
      monitorLink: `${this.appUrl}/uptime/${monitor.monitorId}`,
    };

    const subject = `[${this.appName}] DOWN: ${monitor.monitorName}`;
    return this.sendToRecipients(
      to,
      subject,
      EmailTemplateType.UPTIME_DOWN,
      variables,
    );
  }

  /**
   * Send uptime monitor UP (recovered) notification
   */
  async sendUptimeUpEmail(
    to: string | string[],
    monitor: {
      monitorId: string;
      monitorName: string;
      monitorUrl: string;
      statusCode: number;
      responseTime: number;
      region: string;
      recoveredAt: Date;
      downtimeDuration: string;
    },
  ): Promise<EmailResult> {
    const variables: UptimeUpVariables = {
      monitorName: monitor.monitorName,
      monitorUrl: monitor.monitorUrl,
      statusCode: monitor.statusCode.toString(),
      responseTime: `${monitor.responseTime}ms`,
      region: monitor.region,
      recoveredAt: monitor.recoveredAt.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      downtimeDuration: monitor.downtimeDuration,
      monitorLink: `${this.appUrl}/uptime/${monitor.monitorId}`,
    };

    const subject = `[${this.appName}] RECOVERED: ${monitor.monitorName}`;
    return this.sendToRecipients(
      to,
      subject,
      EmailTemplateType.UPTIME_UP,
      variables,
    );
  }

  /**
   * Send report summary email (daily/weekly/monthly)
   */
  async sendReportSummaryEmail(
    to: string,
    firstName: string,
    lastName: string,
    report: {
      reportId: string;
      reportTitle: string;
      periodLabel: string;
      periodRange: string;
      uptimePercentage: string;
      incidentCount: number;
      avgResponseTime: string;
      alertCount: number;
      logsIngested: string;
      activeMonitors: number;
      incidentSummary?: string;
    },
  ): Promise<EmailResult> {
    const variables: ReportSummaryVariables = {
      reportTitle: report.reportTitle,
      firstName,
      lastName,
      periodLabel: report.periodLabel,
      periodRange: report.periodRange,
      uptimePercentage: report.uptimePercentage,
      incidentCount: report.incidentCount.toString(),
      avgResponseTime: report.avgResponseTime,
      alertCount: report.alertCount.toString(),
      logsIngested: report.logsIngested,
      activeMonitors: report.activeMonitors.toString(),
      hasIncidents: !!report.incidentSummary,
      incidentSummary: report.incidentSummary,
      reportLink: `${this.appUrl}/reports/${report.reportId}`,
    };

    const subject = `[${this.appName}] ${report.reportTitle} — ${report.periodRange}`;
    return this.sendTemplateEmailWithSubject(
      to,
      subject,
      EmailTemplateType.REPORT_SUMMARY,
      variables,
    );
  }

  /**
   * Send subscription activated email
   */
  async sendSubscriptionActivatedEmail(
    to: string,
    firstName: string,
    lastName: string,
    subscription: {
      planName: string;
      billingPeriod: string;
      amount: string;
      nextBillingDate: string;
      featuresIncluded: string;
    },
  ): Promise<EmailResult> {
    return this.sendTemplateEmailWithSubject(
      to,
      `Your ${this.appName} subscription is active — ${subscription.planName}`,
      EmailTemplateType.SUBSCRIPTION_ACTIVATED,
      {
        firstName,
        lastName,
        ...subscription,
        dashboardLink: `${this.appUrl}/dashboard`,
      },
    );
  }

  /**
   * Send subscription expiring soon email
   */
  async sendSubscriptionExpiringEmail(
    to: string,
    firstName: string,
    lastName: string,
    subscription: {
      planName: string;
      expirationDate: string;
      daysRemaining: number;
    },
  ): Promise<EmailResult> {
    return this.sendTemplateEmailWithSubject(
      to,
      `[${this.appName}] Your ${subscription.planName} plan expires in ${subscription.daysRemaining} days`,
      EmailTemplateType.SUBSCRIPTION_EXPIRING,
      {
        firstName,
        lastName,
        planName: subscription.planName,
        expirationDate: subscription.expirationDate,
        daysRemaining: subscription.daysRemaining.toString(),
        renewLink: `${this.appUrl}/settings/subscription`,
      },
    );
  }

  /**
   * Send subscription expired email
   */
  async sendSubscriptionExpiredEmail(
    to: string,
    firstName: string,
    lastName: string,
    subscription: {
      planName: string;
      expiredDate: string;
    },
  ): Promise<EmailResult> {
    return this.sendTemplateEmailWithSubject(
      to,
      `Your ${this.appName} ${subscription.planName} plan has expired`,
      EmailTemplateType.SUBSCRIPTION_EXPIRED,
      {
        firstName,
        lastName,
        planName: subscription.planName,
        expiredDate: subscription.expiredDate,
        reactivateLink: `${this.appUrl}/settings/subscription`,
      },
    );
  }

  /**
   * Send alert notification email
   */
  async sendAlertNotificationEmail(
    to: string | string[],
    notification: {
      alertInstanceId: string;
      alertRuleId: string;
      alertRuleName: string;
      severity: string;
      status: "firing" | "resolved";
      title: string;
      description: string;
      currentValue: number;
      threshold: number;
      labels: Record<string, string>;
      startsAt: Date;
      endsAt?: Date;
      fingerprint: string;
    },
  ): Promise<EmailResult> {
    const severityMap: Record<
      string,
      { color: string; bgLight: string; cssClass: string }
    > = {
      critical: { color: "#dc2626", bgLight: "#fef2f2", cssClass: "critical" },
      warning: { color: "#d97706", bgLight: "#fffbeb", cssClass: "warning" },
      info: { color: "#0d9488", bgLight: "#f0fdfa", cssClass: "info" },
    };

    const sev =
      severityMap[notification.severity.toLowerCase()] || severityMap.info;
    const isResolved = notification.status === "resolved";
    const labelEntries = Object.entries(notification.labels);

    const variables: AlertNotificationVariables = {
      alertTitle: notification.title,
      alertRuleName: notification.alertRuleName,
      description: notification.description,
      severity: notification.severity.toUpperCase(),
      severityColor: sev.color,
      severityClass: sev.cssClass,
      severityBgLight: sev.bgLight,
      statusLabel: isResolved ? "RESOLVED" : "FIRING",
      isResolved,
      currentValue: notification.currentValue.toString(),
      threshold: notification.threshold.toString(),
      startsAt: notification.startsAt.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      endsAt: notification.endsAt
        ? notification.endsAt.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : undefined,
      fingerprint: notification.fingerprint,
      hasLabels: labelEntries.length > 0,
      labelsFormatted: labelEntries.map(([k, v]) => `${k}="${v}"`).join(", "),
      alertLink: `${this.appUrl}/alerts/${notification.alertInstanceId}`,
      appName: this.appName,
      logoUrl: `${this.appUrl}/tfo-logo-dark.png`,
    };

    const subject = isResolved
      ? `[${this.appName}] Resolved: ${notification.alertRuleName}`
      : `[${this.appName}] ${notification.severity.toUpperCase()}: ${notification.alertRuleName}`;

    const recipients = Array.isArray(to) ? to : [to];
    let lastResult: EmailResult = { success: false, error: "No recipients" };

    for (const recipient of recipients) {
      try {
        const html = this.renderTemplate(
          EmailTemplateType.ALERT_NOTIFICATION,
          variables,
        );
        lastResult = await this.emailProvider.send({
          to: recipient,
          subject,
          html,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error(
          `Failed to send alert email to ${recipient}: ${errorMessage}`,
        );
        lastResult = { success: false, error: errorMessage };
      }
    }

    return lastResult;
  }

  /**
   * Send daily observability report email
   */
  async sendDailyReportEmail(
    to: string,
    firstName: string,
    lastName: string,
    report: {
      reportId: string;
      periodRange: string;
      uptimePercentage: number;
      monitorsUp: number;
      monitorsDown: number;
      monitorsDegraded: number;
      monitorsTotal: number;
      metrics: DailyMetricItem[];
      responseTimeDistribution: ResponseTimeDistribution[];
      topAlerts: TopAlertItem[];
    },
  ): Promise<EmailResult> {
    const uptimeColor =
      report.uptimePercentage >= 99
        ? "#16a34a"
        : report.uptimePercentage >= 95
          ? "#d97706"
          : "#dc2626";

    const variables: ReportDailyVariables = {
      reportTitle: "Daily Observability Report",
      firstName,
      lastName,
      periodRange: report.periodRange,
      generatedAt: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      uptimePercentage: report.uptimePercentage,
      uptimePercentageDisplay: `${report.uptimePercentage.toFixed(2)}%`,
      uptimeStrokeColor: uptimeColor,
      monitorsUp: report.monitorsUp.toString(),
      monitorsDown: report.monitorsDown.toString(),
      monitorsDegraded: report.monitorsDegraded.toString(),
      monitorsTotal: report.monitorsTotal.toString(),
      metrics: report.metrics,
      responseTimeDistribution: report.responseTimeDistribution,
      hasAlerts: report.topAlerts.length > 0,
      topAlerts: report.topAlerts,
      reportLink: `${this.appUrl}/reports/${report.reportId}`,
    };

    const subject = `[${this.appName}] Daily Report — ${report.periodRange}`;
    return this.sendTemplateEmailWithSubject(
      to,
      subject,
      EmailTemplateType.REPORT_DAILY,
      variables,
    );
  }

  /**
   * Send weekly observability report email
   */
  async sendWeeklyReportEmail(
    to: string,
    firstName: string,
    lastName: string,
    report: {
      reportId: string;
      periodRange: string;
      weeklyBars: Array<{
        dayLabel: string;
        date: string;
        uptimePercent: number;
        incidentCount: number;
      }>;
      comparisonMetrics: WeeklyComparisonMetric[];
      incidentTimeline: Array<{ dayLabel: string; count: number }>;
      performanceSummary: Array<{
        serviceName: string;
        uptime: string;
        uptimePercent: number;
        avgResponseTime: string;
        avgResponseTimeMs: number;
      }>;
    },
  ): Promise<EmailResult> {
    const weeklyBars: WeeklyDayBar[] = report.weeklyBars.map((bar) => ({
      ...bar,
      barHeightPx: Math.round(bar.uptimePercent * 0.8),
      barColor:
        bar.uptimePercent >= 99
          ? "#16a34a"
          : bar.uptimePercent >= 95
            ? "#d97706"
            : "#dc2626",
      incidentCount: bar.incidentCount.toString(),
    }));

    const maxIncidents = Math.max(
      ...report.incidentTimeline.map((d) => d.count),
      1,
    );
    const incidentTimeline: WeeklyIncidentDay[] = report.incidentTimeline.map(
      (d) => ({
        ...d,
        barWidthPercent: Math.round((d.count / maxIncidents) * 100),
      }),
    );

    const performanceSummary: ServicePerformanceRow[] =
      report.performanceSummary.map((s) => ({
        serviceName: s.serviceName,
        uptime: s.uptime,
        uptimePercent: s.uptimePercent,
        uptimeBarWidth: Math.round(s.uptimePercent),
        avgResponseTime: s.avgResponseTime,
        avgResponseTimeMs: s.avgResponseTimeMs,
        responseTimeBarWidth: Math.min(
          100,
          Math.round(s.avgResponseTimeMs / 10),
        ),
        responseTimeColor:
          s.avgResponseTimeMs < 200
            ? "#16a34a"
            : s.avgResponseTimeMs < 500
              ? "#d97706"
              : "#dc2626",
      }));

    const variables: ReportWeeklyVariables = {
      reportTitle: "Weekly Observability Report",
      firstName,
      lastName,
      periodRange: report.periodRange,
      generatedAt: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      weeklyBars,
      comparisonMetrics: report.comparisonMetrics,
      hasIncidents: report.incidentTimeline.some((d) => d.count > 0),
      incidentTimeline,
      performanceSummary,
      reportLink: `${this.appUrl}/reports/${report.reportId}`,
    };

    const subject = `[${this.appName}] Weekly Report — ${report.periodRange}`;
    return this.sendTemplateEmailWithSubject(
      to,
      subject,
      EmailTemplateType.REPORT_WEEKLY,
      variables,
    );
  }

  /**
   * Send monthly executive report email
   */
  async sendMonthlyReportEmail(
    to: string,
    firstName: string,
    lastName: string,
    report: {
      reportId: string;
      periodRange: string;
      uptimePercentage: number;
      slaTarget: number;
      weeklyTrend: Array<{
        weekLabel: string;
        dateRange: string;
        uptimePercent: number;
      }>;
      monthlyComparison: Array<{
        metric: string;
        currentMonth: string;
        previousMonth: string;
        changePercent: string;
        changeDirection: "up" | "down" | "flat";
        isPositiveChange: boolean;
      }>;
      topIncidents: Array<{
        title: string;
        severity: string;
        duration: string;
        affectedServices: string;
        date: string;
      }>;
    },
  ): Promise<EmailResult> {
    const uptimeColor =
      report.uptimePercentage >= 99
        ? "#16a34a"
        : report.uptimePercentage >= 95
          ? "#d97706"
          : "#dc2626";

    const slaCompliant = report.uptimePercentage >= report.slaTarget;
    const maxUptimeInTrend = Math.max(
      ...report.weeklyTrend.map((w) => w.uptimePercent),
      1,
    );

    const weeklyTrend: MonthlyWeekBar[] = report.weeklyTrend.map((w) => ({
      ...w,
      barWidthPercent: Math.round((w.uptimePercent / maxUptimeInTrend) * 100),
      barColor:
        w.uptimePercent >= 99
          ? "#16a34a"
          : w.uptimePercent >= 95
            ? "#d97706"
            : "#dc2626",
    }));

    const monthlyComparison: MonthlyComparisonRow[] =
      report.monthlyComparison.map((m) => ({
        metric: m.metric,
        currentMonth: m.currentMonth,
        previousMonth: m.previousMonth,
        changePercent: m.changePercent,
        changeDirection: m.changeDirection,
        changeColor: m.isPositiveChange ? "#16a34a" : "#dc2626",
      }));

    const topIncidents: TopIncidentItem[] = report.topIncidents.map(
      (inc, idx) => ({
        rank: (idx + 1).toString(),
        title: inc.title,
        severity: inc.severity,
        severityColor:
          inc.severity === "CRITICAL"
            ? "#dc2626"
            : inc.severity === "WARNING"
              ? "#d97706"
              : "#3b82f6",
        duration: inc.duration,
        affectedServices: inc.affectedServices,
        date: inc.date,
      }),
    );

    const variables: ReportMonthlyVariables = {
      reportTitle: "Monthly Executive Report",
      firstName,
      lastName,
      periodRange: report.periodRange,
      generatedAt: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      uptimePercentage: report.uptimePercentage,
      uptimePercentageDisplay: `${report.uptimePercentage.toFixed(2)}%`,
      uptimeStrokeColor: uptimeColor,
      slaTarget: `${report.slaTarget.toFixed(2)}%`,
      slaActual: `${report.uptimePercentage.toFixed(2)}%`,
      slaCompliant,
      slaBarWidthPercent: Math.min(
        100,
        Math.round((report.uptimePercentage / report.slaTarget) * 100),
      ),
      slaBarColor: slaCompliant ? "#16a34a" : "#dc2626",
      weeklyTrend,
      monthlyComparison,
      hasIncidents: topIncidents.length > 0,
      topIncidents,
      reportLink: `${this.appUrl}/reports/${report.reportId}`,
    };

    const subject = `[${this.appName}] Monthly Executive Report — ${report.periodRange}`;
    return this.sendTemplateEmailWithSubject(
      to,
      subject,
      EmailTemplateType.REPORT_MONTHLY,
      variables,
    );
  }

  /**
   * Send organization uptime report email
   */
  async sendUptimeReportEmail(
    to: string | string[],
    firstName: string,
    lastName: string,
    report: {
      organizationName: string;
      periodRange: string;
      overallUptime: number;
      endpoints: Array<{
        name: string;
        url: string;
        status: "UP" | "DOWN" | "DEGRADED" | "PAUSED";
        uptimePercent: number;
        responseTime: number;
        region: string;
        sslDaysRemaining?: number;
      }>;
      regions: Array<{
        region: string;
        monitorsCount: number;
        avgUptime: number;
        avgResponseTime: number;
      }>;
      needsAttention: Array<{
        name: string;
        url: string;
        status: string;
        uptimePercent: number;
        consecutiveDownCount: number;
        lastCheckAt: string;
      }>;
    },
  ): Promise<EmailResult> {
    const statusColorMap: Record<
      string,
      { color: string; bgColor: string; barColor: string }
    > = {
      UP: { color: "#16a34a", bgColor: "#f0fdf4", barColor: "#16a34a" },
      DOWN: { color: "#dc2626", bgColor: "#fef2f2", barColor: "#dc2626" },
      DEGRADED: { color: "#d97706", bgColor: "#fffbeb", barColor: "#d97706" },
      PAUSED: { color: "#64748b", bgColor: "#f1f5f9", barColor: "#94a3b8" },
    };

    const overallColor =
      report.overallUptime >= 99
        ? "#16a34a"
        : report.overallUptime >= 95
          ? "#d97706"
          : "#dc2626";

    const endpoints: EndpointStatusRow[] = report.endpoints.map((ep) => {
      const colors = statusColorMap[ep.status] || statusColorMap.PAUSED;
      return {
        name: ep.name,
        url: ep.url,
        status: ep.status,
        statusColor: colors.color,
        statusBgColor: colors.bgColor,
        uptimePercent: `${ep.uptimePercent.toFixed(2)}%`,
        uptimeBarWidth: Math.round(ep.uptimePercent),
        uptimeBarColor: colors.barColor,
        responseTime: `${ep.responseTime}ms`,
        region: ep.region,
        hasSSLWarning:
          ep.sslDaysRemaining !== undefined && ep.sslDaysRemaining <= 30,
        sslDaysRemaining: ep.sslDaysRemaining?.toString(),
      };
    });

    const sslWarnings: SSLWarningItem[] = report.endpoints
      .filter(
        (ep) => ep.sslDaysRemaining !== undefined && ep.sslDaysRemaining <= 30,
      )
      .map((ep) => ({
        monitorName: ep.name,
        url: ep.url,
        daysUntilExpiry: ep.sslDaysRemaining!.toString(),
        expiryDate: "",
        urgencyColor: ep.sslDaysRemaining! <= 7 ? "#dc2626" : "#d97706",
      }));

    const needsAttention: NeedsAttentionItem[] = report.needsAttention.map(
      (item) => {
        const colors = statusColorMap[item.status] || statusColorMap.PAUSED;
        return {
          name: item.name,
          url: item.url,
          status: item.status,
          statusColor: colors.color,
          uptimePercent: `${item.uptimePercent.toFixed(2)}%`,
          consecutiveDownCount: item.consecutiveDownCount.toString(),
          lastCheckAt: item.lastCheckAt,
        };
      },
    );

    const variables: UptimeReportVariables = {
      reportTitle: `${report.organizationName} — Uptime Report`,
      firstName,
      lastName,
      organizationName: report.organizationName,
      periodRange: report.periodRange,
      generatedAt: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      overallUptime: report.overallUptime,
      overallUptimeDisplay: `${report.overallUptime.toFixed(2)}%`,
      overallUptimeColor: overallColor,
      totalEndpoints: report.endpoints.length.toString(),
      endpointsUp: report.endpoints
        .filter((e) => e.status === "UP")
        .length.toString(),
      endpointsDown: report.endpoints
        .filter((e) => e.status === "DOWN")
        .length.toString(),
      endpointsDegraded: report.endpoints
        .filter((e) => e.status === "DEGRADED")
        .length.toString(),
      endpoints,
      hasMultipleRegions: report.regions.length > 1,
      regions: report.regions.map((r) => ({
        region: r.region,
        monitorsCount: r.monitorsCount.toString(),
        avgUptime: `${r.avgUptime.toFixed(2)}%`,
        avgResponseTime: `${r.avgResponseTime}ms`,
      })),
      hasSSLWarnings: sslWarnings.length > 0,
      sslWarnings,
      hasNeedsAttention: needsAttention.length > 0,
      needsAttention,
      reportLink: `${this.appUrl}/uptime`,
    };

    const subject = `[${this.appName}] Uptime Report: ${report.organizationName} — ${report.periodRange}`;
    return this.sendToRecipients(
      to,
      subject,
      EmailTemplateType.UPTIME_REPORT,
      variables,
    );
  }

  /**
   * Send a templated email with a custom subject line
   */
  private async sendTemplateEmailWithSubject(
    to: string,
    subject: string,
    templateType: EmailTemplateType,
    variables: TemplateVariables,
  ): Promise<EmailResult> {
    try {
      const html = this.renderTemplate(templateType, variables);
      return await this.emailProvider.send({ to, subject, html });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to send ${templateType} email to ${to}: ${errorMessage}`,
      );
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send a templated email to multiple recipients
   */
  private async sendToRecipients(
    to: string | string[],
    subject: string,
    templateType: EmailTemplateType,
    variables: TemplateVariables,
  ): Promise<EmailResult> {
    const recipients = Array.isArray(to) ? to : [to];
    let lastResult: EmailResult = { success: false, error: "No recipients" };

    for (const recipient of recipients) {
      lastResult = await this.sendTemplateEmailWithSubject(
        recipient,
        subject,
        templateType,
        variables,
      );
    }

    return lastResult;
  }

  /**
   * Verify email provider connection
   */
  async verifyConnection(): Promise<boolean> {
    return this.emailProvider.verify();
  }
}
