/**
 * Property-Based Tests for Authentication - Email Retry
 *
 * Feature: frontend-backend-auth-integration
 * Property 7: Email retry on failure
 * Validates: Requirements 2.8
 *
 * Tests that for any failed email send attempt, the system should retry
 * up to 3 times and log all failures.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { EmailService, EmailMessage } from "../services/email.service";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 7: Email retry on failure", () => {
    let emailService: EmailService;
    let mockSend: jest.SpyInstance;
    let mockSleep: jest.SpyInstance;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      emailService = module.get<EmailService>(EmailService);

      // Spy on the private send method
      mockSend = jest.spyOn(emailService as any, "send");

      // Mock the sleep method to avoid actual delays in tests
      mockSleep = jest
        .spyOn(emailService as any, "sleep")
        .mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should retry up to 3 times on email send failure", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email message
          fc.record({
            to: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            html: fc.string({ minLength: 10, maxLength: 500 }),
            text: fc.string({ minLength: 10, maxLength: 500 }),
          }),
          // Generate number of failures before success (0-2, since max retries is 3)
          fc.integer({ min: 0, max: 2 }),
          async (message: EmailMessage, failuresBeforeSuccess: number) => {
            // Clear mock before each property test iteration
            mockSend.mockClear();
            mockSleep.mockClear();

            // Configure mock to fail N times then succeed
            let attemptCount = 0;
            mockSend.mockImplementation(async () => {
              attemptCount++;
              if (attemptCount <= failuresBeforeSuccess) {
                throw new Error(`Email send failed (attempt ${attemptCount})`);
              }
              return Promise.resolve();
            });

            // Send email with retry
            await emailService.sendWithRetry(message);

            // Property: Should attempt exactly failuresBeforeSuccess + 1 times
            expect(mockSend).toHaveBeenCalledTimes(failuresBeforeSuccess + 1);

            // Property: All attempts should receive the same message
            for (let i = 0; i < mockSend.mock.calls.length; i++) {
              expect(mockSend.mock.calls[i][0]).toEqual(message);
            }

            // Property: Should sleep between retries (failuresBeforeSuccess times)
            expect(mockSleep).toHaveBeenCalledTimes(failuresBeforeSuccess);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should throw error after max retries exhausted", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email message
          fc.record({
            to: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            html: fc.string({ minLength: 10, maxLength: 500 }),
            text: fc.string({ minLength: 10, maxLength: 500 }),
          }),
          // Generate error message
          fc.string({ minLength: 5, maxLength: 100 }),
          async (message: EmailMessage, errorMessage: string) => {
            // Clear mock before each property test iteration
            mockSend.mockClear();
            mockSleep.mockClear();

            // Configure mock to always fail
            mockSend.mockRejectedValue(new Error(errorMessage));

            // Property: Should throw error after max retries
            await expect(emailService.sendWithRetry(message)).rejects.toThrow(
              errorMessage,
            );

            // Property: Should attempt exactly 3 times (default max retries)
            expect(mockSend).toHaveBeenCalledTimes(3);

            // Property: Should sleep 2 times (between 3 attempts)
            expect(mockSleep).toHaveBeenCalledTimes(2);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should respect custom maxRetries parameter", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email message
          fc.record({
            to: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            html: fc.string({ minLength: 10, maxLength: 500 }),
            text: fc.string({ minLength: 10, maxLength: 500 }),
          }),
          // Generate custom max retries (1-5)
          fc.integer({ min: 1, max: 5 }),
          async (message: EmailMessage, maxRetries: number) => {
            // Clear mock before each property test iteration
            mockSend.mockClear();
            mockSleep.mockClear();

            // Configure mock to always fail
            mockSend.mockRejectedValue(new Error("Email send failed"));

            // Property: Should throw error after custom max retries
            await expect(
              emailService.sendWithRetry(message, maxRetries),
            ).rejects.toThrow();

            // Property: Should attempt exactly maxRetries times
            expect(mockSend).toHaveBeenCalledTimes(maxRetries);

            // Property: Should sleep maxRetries - 1 times
            expect(mockSleep).toHaveBeenCalledTimes(maxRetries - 1);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should succeed on first attempt when no failure occurs", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email message
          fc.record({
            to: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            html: fc.string({ minLength: 10, maxLength: 500 }),
            text: fc.string({ minLength: 10, maxLength: 500 }),
          }),
          async (message: EmailMessage) => {
            // Clear mock before each property test iteration
            mockSend.mockClear();
            mockSleep.mockClear();

            // Configure mock to succeed immediately
            mockSend.mockResolvedValue(undefined);

            // Send email with retry
            await emailService.sendWithRetry(message);

            // Property: Should attempt exactly once when successful
            expect(mockSend).toHaveBeenCalledTimes(1);

            // Property: Should receive the correct message
            expect(mockSend.mock.calls[0][0]).toEqual(message);

            // Property: Should not sleep when successful on first attempt
            expect(mockSleep).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should use exponential backoff delay", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email message
          fc.record({
            to: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            html: fc.string({ minLength: 10, maxLength: 500 }),
            text: fc.string({ minLength: 10, maxLength: 500 }),
          }),
          async (message: EmailMessage) => {
            // Clear mock before each property test iteration
            mockSend.mockClear();
            mockSleep.mockClear();

            // Configure mock to fail twice then succeed
            let attemptCount = 0;
            mockSend.mockImplementation(async () => {
              attemptCount++;
              if (attemptCount <= 2) {
                throw new Error(`Email send failed (attempt ${attemptCount})`);
              }
              return Promise.resolve();
            });

            // Send email with retry
            await emailService.sendWithRetry(message);

            // Property: Should have 3 attempts
            expect(mockSend).toHaveBeenCalledTimes(3);

            // Property: Should sleep 2 times (between attempts)
            expect(mockSleep).toHaveBeenCalledTimes(2);

            // Property: Delays should increase exponentially
            // First retry delay should be 1000ms (1 * retryDelay)
            // Second retry delay should be 2000ms (2 * retryDelay)
            expect(mockSleep.mock.calls[0][0]).toBe(1000);
            expect(mockSleep.mock.calls[1][0]).toBe(2000);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle different error types during retry", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email message
          fc.record({
            to: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            html: fc.string({ minLength: 10, maxLength: 500 }),
            text: fc.string({ minLength: 10, maxLength: 500 }),
          }),
          // Generate different error types
          fc.constantFrom(
            new Error("Network error"),
            new Error("SMTP connection failed"),
            new Error("Authentication failed"),
            new Error("Timeout"),
            new Error("Invalid recipient"),
          ),
          async (message: EmailMessage, error: Error) => {
            // Clear mock before each property test iteration
            mockSend.mockClear();
            mockSleep.mockClear();

            // Configure mock to always fail with specific error
            mockSend.mockRejectedValue(error);

            // Property: Should throw the same error after retries
            await expect(emailService.sendWithRetry(message)).rejects.toThrow(
              error.message,
            );

            // Property: Should attempt exactly 3 times
            expect(mockSend).toHaveBeenCalledTimes(3);

            // Property: Should sleep between retries
            expect(mockSleep).toHaveBeenCalledTimes(2);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should retry for all email notification types", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email address
          fc.emailAddress(),
          // Generate notification type
          fc.constantFrom(
            "login",
            "passwordChange",
            "passwordReset",
            "verification",
            "mfa",
            "accountLockout",
            "passwordReminder",
          ),
          async (email: string, notificationType: string) => {
            // Clear mock before each property test iteration
            mockSend.mockClear();
            mockSleep.mockClear();

            // Configure mock to fail once then succeed
            let attemptCount = 0;
            mockSend.mockImplementation(async () => {
              attemptCount++;
              if (attemptCount === 1) {
                throw new Error("Email send failed");
              }
              return Promise.resolve();
            });

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
              case "accountLockout":
                await emailService.sendAccountLockoutNotification(email);
                break;
              case "passwordReminder":
                await emailService.sendPasswordReminder(email, "My reminder");
                break;
            }

            // Property: Should retry and eventually succeed
            expect(mockSend).toHaveBeenCalledTimes(2);

            // Property: Should sleep once between attempts
            expect(mockSleep).toHaveBeenCalledTimes(1);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain message integrity across retries", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate email message with specific content
          fc.record({
            to: fc.emailAddress(),
            subject: fc.string({ minLength: 5, maxLength: 100 }),
            html: fc.string({ minLength: 10, maxLength: 500 }),
            text: fc.string({ minLength: 10, maxLength: 500 }),
          }),
          async (message: EmailMessage) => {
            // Clear mock before each property test iteration
            mockSend.mockClear();
            mockSleep.mockClear();

            // Configure mock to fail twice then succeed
            let attemptCount = 0;
            mockSend.mockImplementation(async () => {
              attemptCount++;
              if (attemptCount <= 2) {
                throw new Error("Email send failed");
              }
              return Promise.resolve();
            });

            // Send email with retry
            await emailService.sendWithRetry(message);

            // Property: All retry attempts should use identical message
            expect(mockSend).toHaveBeenCalledTimes(3);

            const firstCallMessage = mockSend.mock.calls[0][0];
            const secondCallMessage = mockSend.mock.calls[1][0];
            const thirdCallMessage = mockSend.mock.calls[2][0];

            expect(firstCallMessage).toEqual(message);
            expect(secondCallMessage).toEqual(message);
            expect(thirdCallMessage).toEqual(message);

            // Property: Message content should not be modified
            expect(firstCallMessage.to).toBe(message.to);
            expect(firstCallMessage.subject).toBe(message.subject);
            expect(firstCallMessage.html).toBe(message.html);
            expect(firstCallMessage.text).toBe(message.text);

            // Property: Should sleep between retries
            expect(mockSleep).toHaveBeenCalledTimes(2);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
