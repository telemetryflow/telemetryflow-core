/**
 * Email Templates Unit Tests
 *
 * Tests for email template rendering
 */

import {
  loginNotificationTemplate,
  passwordChangeTemplate,
  passwordResetTemplate,
  emailVerificationTemplate,
  mfaConfirmationTemplate,
  securityAlertTemplate,
  SecurityAlertType,
  accountLockoutTemplate,
  passwordReminderTemplate,
} from "../index";

describe("Email Templates", () => {
  describe("loginNotificationTemplate", () => {
    it("should render login notification with all details", () => {
      const data = {
        browser: "Chrome",
        os: "macOS",
        location: "San Francisco, CA",
        ipAddress: "192.168.1.1",
        timestamp: new Date("2024-01-01T12:00:00Z"),
      };

      const { html, text } = loginNotificationTemplate(data);

      expect(html).toContain("New Login Detected");
      expect(html).toContain("Chrome");
      expect(html).toContain("macOS");
      expect(html).toContain("San Francisco, CA");
      expect(html).toContain("192.168.1.1");

      expect(text).toContain("New Login Detected");
      expect(text).toContain("Chrome on macOS");
      expect(text).toContain("San Francisco, CA");
    });

    it("should handle missing optional fields", () => {
      const data = {
        browser: "Firefox",
        os: "Windows",
      };

      const { html, text } = loginNotificationTemplate(data);

      expect(html).toContain("Firefox");
      expect(html).toContain("Windows");
      expect(html).toContain("Unknown");

      expect(text).toContain("Firefox on Windows");
      expect(text).toContain("Unknown");
    });
  });

  describe("passwordChangeTemplate", () => {
    it("should render password change confirmation", () => {
      const data = {
        timestamp: new Date("2024-01-01T12:00:00Z"),
      };

      const { html, text } = passwordChangeTemplate(data);

      expect(html).toContain("Password Changed Successfully");
      expect(html).toContain("secured with your new password");

      expect(text).toContain("Password Changed Successfully");
      expect(text).toContain("secured with your new password");
    });

    it("should work without timestamp", () => {
      const { html, text } = passwordChangeTemplate();

      expect(html).toContain("Password Changed Successfully");
      expect(text).toContain("Password Changed Successfully");
    });
  });

  describe("passwordResetTemplate", () => {
    it("should render password reset with token", () => {
      const data = {
        resetToken: "test-token-123",
        expiryHours: 2,
      };

      const { html, text } = passwordResetTemplate(data);

      expect(html).toContain("Password Reset Request");
      expect(html).toContain("test-token-123");
      expect(html).toContain("2 hours");

      expect(text).toContain("Password Reset Request");
      expect(text).toContain("test-token-123");
      expect(text).toContain("2 hours");
    });

    it("should use default expiry of 1 hour", () => {
      const data = {
        resetToken: "test-token-456",
      };

      const { html, text } = passwordResetTemplate(data);

      expect(html).toContain("1 hour");
      expect(text).toContain("1 hour");
    });
  });

  describe("emailVerificationTemplate", () => {
    it("should render email verification with token", () => {
      const data = {
        verificationToken: "verify-token-789",
        expiryHours: 48,
      };

      const { html, text } = emailVerificationTemplate(data);

      expect(html).toContain("Welcome to TelemetryFlow");
      expect(html).toContain("verify-token-789");
      expect(html).toContain("48 hours");

      expect(text).toContain("Welcome to TelemetryFlow");
      expect(text).toContain("verify-token-789");
      expect(text).toContain("48 hours");
    });
  });

  describe("mfaConfirmationTemplate", () => {
    it("should render MFA enabled confirmation", () => {
      const data = {
        enabled: true,
        timestamp: new Date("2024-01-01T12:00:00Z"),
      };

      const { html, text } = mfaConfirmationTemplate(data);

      expect(html).toContain("Multi-Factor Authentication Enabled");
      expect(html).toContain("more secure");
      expect(html).toContain("backup codes");

      expect(text).toContain("Multi-Factor Authentication Enabled");
      expect(text).toContain("more secure");
    });

    it("should render MFA disabled confirmation", () => {
      const data = {
        enabled: false,
        timestamp: new Date("2024-01-01T12:00:00Z"),
      };

      const { html, text } = mfaConfirmationTemplate(data);

      expect(html).toContain("Multi-Factor Authentication Disabled");
      expect(html).toContain("password only");

      expect(text).toContain("Multi-Factor Authentication Disabled");
      expect(text).toContain("password only");
    });
  });

  describe("securityAlertTemplate", () => {
    it("should render security alert with details", () => {
      const data = {
        alertType: SecurityAlertType.SUSPICIOUS_ACTIVITY,
        details: {
          reason: "Impossible travel detected",
          location: "Unknown location",
        },
        timestamp: new Date("2024-01-01T12:00:00Z"),
      };

      const { html, text } = securityAlertTemplate(data);

      expect(html).toContain("Security Alert");
      expect(html).toContain("Suspicious Activity Detected");
      expect(html).toContain("Impossible travel detected");

      expect(text).toContain("Security Alert");
      expect(text).toContain("Suspicious Activity Detected");
    });

    it("should render alert without details", () => {
      const data = {
        alertType: SecurityAlertType.ACCOUNT_LOCKED,
        timestamp: new Date("2024-01-01T12:00:00Z"),
      };

      const { html, text } = securityAlertTemplate(data);

      expect(html).toContain("Account Locked");
      expect(text).toContain("Account Locked");
    });
  });

  describe("accountLockoutTemplate", () => {
    it("should render account lockout with details", () => {
      const lockedUntil = new Date("2024-01-01T13:00:00Z");
      const data = {
        lockedUntil,
        reason: "multiple failed login attempts",
        failedAttempts: 5,
      };

      const { html, text } = accountLockoutTemplate(data);

      expect(html).toContain("Account Locked");
      expect(html).toContain("multiple failed login attempts");
      expect(html).toContain("5");

      expect(text).toContain("Account Locked");
      expect(text).toContain("multiple failed login attempts");
    });

    it("should work without data", () => {
      const { html, text } = accountLockoutTemplate();

      expect(html).toContain("Account Locked");
      expect(text).toContain("Account Locked");
    });
  });

  describe("passwordReminderTemplate", () => {
    it("should render password reminder", () => {
      const data = {
        reminder: "My favorite pet's name",
      };

      const { html, text } = passwordReminderTemplate(data);

      expect(html).toContain("Password Reminder");
      expect(html).toContain("My favorite pet's name");

      expect(text).toContain("Password Reminder");
      expect(text).toContain("My favorite pet's name");
    });
  });

  describe("Template consistency", () => {
    it("all templates should return both html and text", () => {
      const templates = [
        loginNotificationTemplate({
          browser: "Chrome",
          os: "macOS",
        }),
        passwordChangeTemplate(),
        passwordResetTemplate({ resetToken: "token" }),
        emailVerificationTemplate({ verificationToken: "token" }),
        mfaConfirmationTemplate({ enabled: true }),
        securityAlertTemplate({
          alertType: SecurityAlertType.LOGIN_NEW_DEVICE,
        }),
        accountLockoutTemplate(),
        passwordReminderTemplate({ reminder: "hint" }),
      ];

      templates.forEach((template) => {
        expect(template).toHaveProperty("html");
        expect(template).toHaveProperty("text");
        expect(typeof template.html).toBe("string");
        expect(typeof template.text).toBe("string");
        expect(template.html.length).toBeGreaterThan(0);
        expect(template.text.length).toBeGreaterThan(0);
      });
    });

    it("all HTML templates should include TelemetryFlow branding", () => {
      const templates = [
        loginNotificationTemplate({
          browser: "Chrome",
          os: "macOS",
        }),
        passwordChangeTemplate(),
        passwordResetTemplate({ resetToken: "token" }),
        emailVerificationTemplate({ verificationToken: "token" }),
        mfaConfirmationTemplate({ enabled: true }),
        securityAlertTemplate({
          alertType: SecurityAlertType.LOGIN_NEW_DEVICE,
        }),
        accountLockoutTemplate(),
        passwordReminderTemplate({ reminder: "hint" }),
      ];

      templates.forEach((template) => {
        expect(template.html).toContain("TelemetryFlow");
      });
    });
  });
});
