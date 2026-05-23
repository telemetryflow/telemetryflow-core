/**
 * Email Service Unit Tests
 *
 * Tests for email service with template integration
 */

import { Test, TestingModule } from "@nestjs/testing";
import { EmailService, SecurityAlertType } from "../email.service";

describe("EmailService", () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendLoginNotification", () => {
    it("should send login notification with device info", async () => {
      const email = "test@telemetryflow.id";
      const deviceInfo = {
        browser: "Chrome",
        os: "macOS",
        location: "San Francisco, CA",
        ipAddress: "192.168.1.1",
      };

      await expect(
        service.sendLoginNotification(email, deviceInfo),
      ).resolves.not.toThrow();
    });

    it("should handle missing optional fields", async () => {
      const email = "test@telemetryflow.id";
      const deviceInfo = {
        browser: "Firefox",
        os: "Windows",
      };

      await expect(
        service.sendLoginNotification(email, deviceInfo),
      ).resolves.not.toThrow();
    });
  });

  describe("sendPasswordChangeConfirmation", () => {
    it("should send password change confirmation", async () => {
      const email = "test@telemetryflow.id";

      await expect(
        service.sendPasswordChangeConfirmation(email),
      ).resolves.not.toThrow();
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send password reset email with token", async () => {
      const email = "test@telemetryflow.id";
      const resetToken = "test-reset-token-123";

      await expect(
        service.sendPasswordResetEmail(email, resetToken),
      ).resolves.not.toThrow();
    });
  });

  describe("sendVerificationEmail", () => {
    it("should send verification email with token", async () => {
      const email = "test@telemetryflow.id";
      const verificationToken = "test-verify-token-456";

      await expect(
        service.sendVerificationEmail(email, verificationToken),
      ).resolves.not.toThrow();
    });
  });

  describe("sendSecurityAlert", () => {
    it("should send security alert with details", async () => {
      const email = "test@telemetryflow.id";
      const alertType = SecurityAlertType.SUSPICIOUS_ACTIVITY;
      const details = {
        reason: "Impossible travel detected",
        location: "Unknown location",
      };

      await expect(
        service.sendSecurityAlert(email, alertType, details),
      ).resolves.not.toThrow();
    });

    it("should send security alert without details", async () => {
      const email = "test@telemetryflow.id";
      const alertType = SecurityAlertType.ACCOUNT_LOCKED;

      await expect(
        service.sendSecurityAlert(email, alertType),
      ).resolves.not.toThrow();
    });
  });

  describe("sendMFAConfirmation", () => {
    it("should send MFA enabled confirmation", async () => {
      const email = "test@telemetryflow.id";

      await expect(
        service.sendMFAConfirmation(email, true),
      ).resolves.not.toThrow();
    });

    it("should send MFA disabled confirmation", async () => {
      const email = "test@telemetryflow.id";

      await expect(
        service.sendMFAConfirmation(email, false),
      ).resolves.not.toThrow();
    });
  });

  describe("sendAccountLockoutNotification", () => {
    it("should send account lockout notification with date", async () => {
      const email = "test@telemetryflow.id";
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      await expect(
        service.sendAccountLockoutNotification(email, lockedUntil),
      ).resolves.not.toThrow();
    });

    it("should send account lockout notification without date", async () => {
      const email = "test@telemetryflow.id";

      await expect(
        service.sendAccountLockoutNotification(email),
      ).resolves.not.toThrow();
    });
  });

  describe("sendPasswordReminder", () => {
    it("should send password reminder", async () => {
      const email = "test@telemetryflow.id";
      const reminder = "My favorite pet's name";

      await expect(
        service.sendPasswordReminder(email, reminder),
      ).resolves.not.toThrow();
    });
  });

  describe("sendWithRetry", () => {
    it("should retry on failure", async () => {
      const message = {
        to: "test@telemetryflow.id",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
        text: "Test Text",
      };

      // This should not throw even if SMTP is not configured
      // because the service logs to console when disabled
      await expect(service.sendWithRetry(message, 1)).resolves.not.toThrow();
    });
  });
});
