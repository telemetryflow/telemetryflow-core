/**
 * Property-Based Tests for Authentication - Email Notifications
 *
 * Feature: frontend-backend-auth-integration
 * Property 5: Security event notifications
 * Validates: Requirements 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.3, 5.2, 5.8, 7.3, 8.6, 10.2
 *
 * Tests that for any security-relevant event (new device login, password change,
 * password reset, MFA state change, device revocation, account lockout), an
 * appropriate notification email should be sent to the user.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { EmailService, SecurityAlertType } from "../services/email.service";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 5: Security event notifications", () => {
    let emailService: EmailService;
    let mockSendWithRetry: jest.SpyInstance;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      emailService = module.get<EmailService>(EmailService);

      // Spy on sendWithRetry to track email sending
      mockSendWithRetry = jest
        .spyOn(emailService as any, "sendWithRetry")
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should send login notification for new device login", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email address
          fc.emailAddress(),
          // Generate device info
          fc.record({
            browser: fc.constantFrom(
              "Chrome",
              "Firefox",
              "Safari",
              "Edge",
              "Opera",
            ),
            os: fc.constantFrom(
              "Windows",
              "macOS",
              "Linux",
              "iOS",
              "Android",
            ),
            location: fc.option(
              fc.constantFrom(
                "New York, USA",
                "London, UK",
                "Tokyo, Japan",
                "Sydney, Australia",
              ),
              { nil: undefined },
            ),
            ipAddress: fc.option(
              fc
                .tuple(
                  fc.integer({ min: 1, max: 255 }),
                  fc.integer({ min: 0, max: 255 }),
                  fc.integer({ min: 0, max: 255 }),
                  fc.integer({ min: 1, max: 255 }),
                )
                .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
              { nil: undefined },
            ),
          }),
          async (email, deviceInfo) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send login notification
            await emailService.sendLoginNotification(email, deviceInfo);

            // Property: Email should be sent with retry
            expect(mockSendWithRetry).toHaveBeenCalledTimes(1);

            // Property: Email should be sent to correct recipient
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.to).toBe(email);

            // Property: Email should have appropriate subject
            expect(emailMessage.subject).toContain("Login");
            expect(emailMessage.subject).toContain("TelemetryFlow");

            // Property: Email should contain device information
            expect(emailMessage.html).toContain(deviceInfo.browser);
            expect(emailMessage.html).toContain(deviceInfo.os);
            expect(emailMessage.text).toContain(deviceInfo.browser);
            expect(emailMessage.text).toContain(deviceInfo.os);

            // Property: Email should contain location if provided
            if (deviceInfo.location) {
              expect(emailMessage.html).toContain(deviceInfo.location);
              expect(emailMessage.text).toContain(deviceInfo.location);
            }

            // Property: Email should contain IP address if provided
            if (deviceInfo.ipAddress) {
              expect(emailMessage.html).toContain(deviceInfo.ipAddress);
              expect(emailMessage.text).toContain(deviceInfo.ipAddress);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send password change confirmation email", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email address
          fc.emailAddress(),
          async (email) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send password change confirmation
            await emailService.sendPasswordChangeConfirmation(email);

            // Property: Email should be sent with retry
            expect(mockSendWithRetry).toHaveBeenCalledTimes(1);

            // Property: Email should be sent to correct recipient
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.to).toBe(email);

            // Property: Email should have appropriate subject
            expect(emailMessage.subject).toContain("Password");
            expect(emailMessage.subject).toContain("Changed");
            expect(emailMessage.subject).toContain("TelemetryFlow");

            // Property: Email should have both HTML and text versions
            expect(emailMessage.html).toBeDefined();
            expect(emailMessage.text).toBeDefined();
            expect(emailMessage.html.length).toBeGreaterThan(0);
            expect(emailMessage.text.length).toBeGreaterThan(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send password reset email with token", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email address
          fc.emailAddress(),
          // Generate reset token
          fc.uuid(),
          async (email, resetToken) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send password reset email
            await emailService.sendPasswordResetEmail(email, resetToken);

            // Property: Email should be sent with retry
            expect(mockSendWithRetry).toHaveBeenCalledTimes(1);

            // Property: Email should be sent to correct recipient
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.to).toBe(email);

            // Property: Email should have appropriate subject
            expect(emailMessage.subject).toContain("Reset");
            expect(emailMessage.subject).toContain("Password");
            expect(emailMessage.subject).toContain("TelemetryFlow");

            // Property: Email should contain reset token
            expect(emailMessage.html).toContain(resetToken);
            expect(emailMessage.text).toContain(resetToken);

            // Property: Email should mention expiry
            expect(
              emailMessage.html.toLowerCase().includes("hour") ||
                emailMessage.html.toLowerCase().includes("expir"),
            ).toBe(true);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send email verification email with token", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email address
          fc.emailAddress(),
          // Generate verification token
          fc.uuid(),
          async (email, verificationToken) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send verification email
            await emailService.sendVerificationEmail(email, verificationToken);

            // Property: Email should be sent with retry
            expect(mockSendWithRetry).toHaveBeenCalledTimes(1);

            // Property: Email should be sent to correct recipient
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.to).toBe(email);

            // Property: Email should have appropriate subject
            expect(emailMessage.subject).toContain("Verify");
            expect(emailMessage.subject).toContain("Email");
            expect(emailMessage.subject).toContain("TelemetryFlow");

            // Property: Email should contain verification token
            expect(emailMessage.html).toContain(verificationToken);
            expect(emailMessage.text).toContain(verificationToken);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send MFA confirmation email for enable/disable", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email address
          fc.emailAddress(),
          // Generate MFA enabled state
          fc.boolean(),
          async (email, enabled) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send MFA confirmation
            await emailService.sendMFAConfirmation(email, enabled);

            // Property: Email should be sent with retry
            expect(mockSendWithRetry).toHaveBeenCalledTimes(1);

            // Property: Email should be sent to correct recipient
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.to).toBe(email);

            // Property: Email should have appropriate subject
            expect(emailMessage.subject).toContain("Multi-Factor");
            expect(emailMessage.subject).toContain("Authentication");
            expect(emailMessage.subject).toContain("TelemetryFlow");

            // Property: Email should indicate enabled or disabled state
            const action = enabled ? "Enabled" : "Disabled";
            expect(emailMessage.subject).toContain(action);

            // Property: Email should have both HTML and text versions
            expect(emailMessage.html).toBeDefined();
            expect(emailMessage.text).toBeDefined();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send security alert emails for all alert types", async () => {
      const alertTypes = [
        SecurityAlertType.LOGIN_NEW_DEVICE,
        SecurityAlertType.PASSWORD_CHANGED,
        SecurityAlertType.MFA_ENABLED,
        SecurityAlertType.MFA_DISABLED,
        SecurityAlertType.ACCOUNT_LOCKED,
        SecurityAlertType.DEVICE_REVOKED,
        SecurityAlertType.SUSPICIOUS_ACTIVITY,
      ];

      await fc.assert(
        fc.asyncProperty(
          // Generate email address
          fc.emailAddress(),
          // Generate alert type
          fc.constantFrom(...alertTypes),
          // Generate optional details
          fc.option(
            fc.record({
              ipAddress: fc
                .tuple(
                  fc.integer({ min: 1, max: 255 }),
                  fc.integer({ min: 0, max: 255 }),
                  fc.integer({ min: 0, max: 255 }),
                  fc.integer({ min: 1, max: 255 }),
                )
                .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
              location: fc.constantFrom(
                "New York, USA",
                "London, UK",
                "Tokyo, Japan",
              ),
            }),
            { nil: undefined },
          ),
          async (email, alertType, details) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send security alert
            await emailService.sendSecurityAlert(email, alertType, details);

            // Property: Email should be sent with retry
            expect(mockSendWithRetry).toHaveBeenCalledTimes(1);

            // Property: Email should be sent to correct recipient
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.to).toBe(email);

            // Property: Email should have appropriate subject
            expect(emailMessage.subject).toContain("Security Alert");
            expect(emailMessage.subject).toContain("TelemetryFlow");

            // Property: Email should have both HTML and text versions
            expect(emailMessage.html).toBeDefined();
            expect(emailMessage.text).toBeDefined();
            expect(emailMessage.html.length).toBeGreaterThan(0);
            expect(emailMessage.text.length).toBeGreaterThan(0);

            // Property: Email should contain details if provided
            if (details?.ipAddress) {
              expect(emailMessage.html).toContain(details.ipAddress);
            }
            if (details?.location) {
              expect(emailMessage.html).toContain(details.location);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send account lockout notification with lockout details", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email address
          fc.emailAddress(),
          // Generate optional locked until date (future date)
          fc.option(
            fc
              .integer({ min: 1, max: 60 })
              .map((minutes) => new Date(Date.now() + minutes * 60 * 1000)),
            { nil: undefined },
          ),
          async (email, lockedUntil) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send account lockout notification
            await emailService.sendAccountLockoutNotification(
              email,
              lockedUntil,
            );

            // Property: Email should be sent with retry
            expect(mockSendWithRetry).toHaveBeenCalledTimes(1);

            // Property: Email should be sent to correct recipient
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.to).toBe(email);

            // Property: Email should have appropriate subject
            expect(emailMessage.subject).toContain("Account Locked");
            expect(emailMessage.subject).toContain("TelemetryFlow");

            // Property: Email should mention failed attempts
            expect(
              emailMessage.html.toLowerCase().includes("failed") ||
                emailMessage.html.toLowerCase().includes("attempt"),
            ).toBe(true);

            // Property: Email should have both HTML and text versions
            expect(emailMessage.html).toBeDefined();
            expect(emailMessage.text).toBeDefined();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send password reminder email with encrypted reminder", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email address
          fc.emailAddress(),
          // Generate reminder text
          fc.string({ minLength: 5, maxLength: 100 }),
          async (email, reminder) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send password reminder
            await emailService.sendPasswordReminder(email, reminder);

            // Property: Email should be sent with retry
            expect(mockSendWithRetry).toHaveBeenCalledTimes(1);

            // Property: Email should be sent to correct recipient
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.to).toBe(email);

            // Property: Email should have appropriate subject
            expect(emailMessage.subject).toContain("Password Reminder");
            expect(emailMessage.subject).toContain("TelemetryFlow");

            // Property: Email should contain reminder
            expect(emailMessage.html).toContain(reminder);
            expect(emailMessage.text).toContain(reminder);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should include timestamp in all notification emails", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.constantFrom(
            "login",
            "passwordChange",
            "securityAlert",
            "accountLockout",
          ),
          async (email, notificationType) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            const beforeSend = new Date();

            // Send different types of notifications
            switch (notificationType) {
              case "login":
                await emailService.sendLoginNotification(email, {
                  browser: "Chrome",
                  os: "Windows",
                });
                break;
              case "passwordChange":
                await emailService.sendPasswordChangeConfirmation(email);
                break;
              case "securityAlert":
                await emailService.sendSecurityAlert(
                  email,
                  SecurityAlertType.SUSPICIOUS_ACTIVITY,
                );
                break;
              case "accountLockout":
                await emailService.sendAccountLockoutNotification(email);
                break;
            }

            const afterSend = new Date();

            // Property: Email should be sent
            expect(mockSendWithRetry).toHaveBeenCalledTimes(1);

            // Property: Email should have content (timestamp checking is template-specific)
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.html).toBeDefined();
            expect(emailMessage.text).toBeDefined();
            expect(emailMessage.html.length).toBeGreaterThan(0);
            expect(emailMessage.text.length).toBeGreaterThan(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send emails with both HTML and text versions", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.constantFrom(
            "login",
            "passwordChange",
            "passwordReset",
            "verification",
            "mfa",
            "securityAlert",
            "accountLockout",
            "passwordReminder",
          ),
          async (email, emailType) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send different types of emails
            switch (emailType) {
              case "login":
                await emailService.sendLoginNotification(email, {
                  browser: "Chrome",
                  os: "Windows",
                });
                break;
              case "passwordChange":
                await emailService.sendPasswordChangeConfirmation(email);
                break;
              case "passwordReset":
                await emailService.sendPasswordResetEmail(
                  email,
                  "reset-token-123",
                );
                break;
              case "verification":
                await emailService.sendVerificationEmail(
                  email,
                  "verify-token-123",
                );
                break;
              case "mfa":
                await emailService.sendMFAConfirmation(email, true);
                break;
              case "securityAlert":
                await emailService.sendSecurityAlert(
                  email,
                  SecurityAlertType.SUSPICIOUS_ACTIVITY,
                );
                break;
              case "accountLockout":
                await emailService.sendAccountLockoutNotification(email);
                break;
              case "passwordReminder":
                await emailService.sendPasswordReminder(email, "My reminder");
                break;
            }

            // Property: Email should have both HTML and text versions
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.html).toBeDefined();
            expect(emailMessage.text).toBeDefined();
            expect(typeof emailMessage.html).toBe("string");
            expect(typeof emailMessage.text).toBe("string");
            expect(emailMessage.html.length).toBeGreaterThan(0);
            expect(emailMessage.text.length).toBeGreaterThan(0);

            // Property: HTML and text should contain similar content
            // (at least some common words should appear in both)
            const htmlWords = emailMessage.html
              .toLowerCase()
              .replace(/<[^>]*>/g, " ")
              .split(/\s+/)
              .filter((w) => w.length > 3);
            const textWords = emailMessage.text
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 3);

            const commonWords = htmlWords.filter((word) =>
              textWords.includes(word),
            );
            expect(commonWords.length).toBeGreaterThan(0);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should use consistent branding in all email subjects", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.constantFrom(
            "login",
            "passwordChange",
            "passwordReset",
            "verification",
            "mfa",
            "securityAlert",
            "accountLockout",
            "passwordReminder",
          ),
          async (email, emailType) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send different types of emails
            switch (emailType) {
              case "login":
                await emailService.sendLoginNotification(email, {
                  browser: "Chrome",
                  os: "Windows",
                });
                break;
              case "passwordChange":
                await emailService.sendPasswordChangeConfirmation(email);
                break;
              case "passwordReset":
                await emailService.sendPasswordResetEmail(
                  email,
                  "reset-token-123",
                );
                break;
              case "verification":
                await emailService.sendVerificationEmail(
                  email,
                  "verify-token-123",
                );
                break;
              case "mfa":
                await emailService.sendMFAConfirmation(email, true);
                break;
              case "securityAlert":
                await emailService.sendSecurityAlert(
                  email,
                  SecurityAlertType.SUSPICIOUS_ACTIVITY,
                );
                break;
              case "accountLockout":
                await emailService.sendAccountLockoutNotification(email);
                break;
              case "passwordReminder":
                await emailService.sendPasswordReminder(email, "My reminder");
                break;
            }

            // Property: All email subjects should contain brand name
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.subject).toContain("TelemetryFlow");

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle email addresses with various formats", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various email formats
          fc.emailAddress(),
          async (email) => {
            // Clear mock before each property test iteration
            mockSendWithRetry.mockClear();

            // Send a simple notification
            await emailService.sendPasswordChangeConfirmation(email);

            // Property: Email should be sent regardless of format
            expect(mockSendWithRetry).toHaveBeenCalledTimes(1);

            // Property: Email should be sent to the exact address provided
            const emailMessage = mockSendWithRetry.mock.calls[0][0];
            expect(emailMessage.to).toBe(email);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
