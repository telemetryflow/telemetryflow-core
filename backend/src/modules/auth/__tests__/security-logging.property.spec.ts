/**
 * Property-Based Tests for Authentication - Security Event Logging
 *
 * Feature: frontend-backend-auth-integration
 * Property 35: Security event logging
 * Validates: Requirements 4.8, 6.7, 10.6
 *
 * Tests that for any authentication event (login, password change, MFA verification, etc.),
 * a security log entry should be created with timestamp, IP address, and outcome.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  SecurityLogService,
  SecurityLogData,
} from "../services/security-log.service";
import {
  SecurityLogEntity,
  SecurityEventType,
} from "../infrastructure/persistence/entities/SecurityLog.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 35: Security event logging", () => {
    let service: SecurityLogService;
    let repository: Repository<SecurityLogEntity>;
    let mockCreate: jest.Mock;
    let mockSave: jest.Mock;

    beforeEach(async () => {
      mockCreate = jest.fn();
      mockSave = jest.fn();

      const mockRepository = {
        create: mockCreate,
        save: mockSave,
        find: jest.fn(),
        findOne: jest.fn(),
        count: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SecurityLogService,
          {
            provide: getRepositoryToken(SecurityLogEntity),
            useValue: mockRepository,
          },
        ],
      }).compile();

      service = module.get<SecurityLogService>(SecurityLogService);
      repository = module.get<Repository<SecurityLogEntity>>(
        getRepositoryToken(SecurityLogEntity),
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    // Generator for IP addresses
    const ipAddressArb = fc
      .tuple(
        fc.integer({ min: 1, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 1, max: 255 }),
      )
      .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

    // Generator for user agents
    const userAgentArb = fc.constantFrom(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    );

    // Generator for security event types
    const eventTypeArb = fc.constantFrom(
      SecurityEventType.LOGIN_SUCCESS,
      SecurityEventType.LOGIN_FAILURE,
      SecurityEventType.MFA_SUCCESS,
      SecurityEventType.MFA_FAILURE,
      SecurityEventType.PASSWORD_CHANGE,
      SecurityEventType.PASSWORD_RESET,
      SecurityEventType.ACCOUNT_LOCKOUT,
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityEventType.DEVICE_REVOKED,
      SecurityEventType.SESSION_REVOKED,
      SecurityEventType.EMAIL_VERIFICATION,
      SecurityEventType.REGISTRATION,
      SecurityEventType.LOGOUT,
      SecurityEventType.TOKEN_REFRESH,
      SecurityEventType.PASSWORD_RESET_REQUEST,
      SecurityEventType.PASSWORD_REMINDER_REQUEST,
      SecurityEventType.MFA_ENABLED,
      SecurityEventType.MFA_DISABLED,
    );

    it("should log all authentication events with required fields", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate security log data
          fc.record({
            userId: fc.option(fc.uuid(), { nil: null }),
            eventType: eventTypeArb,
            ipAddress: ipAddressArb,
            userAgent: fc.option(userAgentArb, { nil: null }),
            success: fc.boolean(),
            errorMessage: fc.option(
              fc.string({ minLength: 5, maxLength: 100 }),
              { nil: null },
            ),
            metadata: fc.option(
              fc.record({
                deviceId: fc.uuid(),
                sessionId: fc.uuid(),
                reason: fc.string({ minLength: 5, maxLength: 50 }),
              }),
              { nil: null },
            ),
          }),
          async (logData: SecurityLogData) => {
            // Clear mocks before each iteration
            mockCreate.mockClear();
            mockSave.mockClear();

            // Mock the repository to return a saved entity
            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: logData.userId || null,
              event_type: logData.eventType,
              ip_address: logData.ipAddress,
              user_agent: logData.userAgent || null,
              success: logData.success,
              error_message: logData.errorMessage || null,
              metadata: logData.metadata || null,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log the event
            const beforeLog = new Date();
            const result = await service.logEvent(logData);
            const afterLog = new Date();

            // Property: Log entry should be created
            expect(mockCreate).toHaveBeenCalledTimes(1);
            expect(mockSave).toHaveBeenCalledTimes(1);

            // Property: Log entry should contain all required fields
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.user_id).toBe(logData.userId || null);
            expect(createdEntry.event_type).toBe(logData.eventType);
            expect(createdEntry.ip_address).toBe(logData.ipAddress);
            expect(createdEntry.user_agent).toBe(logData.userAgent || null);
            expect(createdEntry.success).toBe(logData.success);
            expect(createdEntry.error_message).toBe(
              logData.errorMessage || null,
            );
            expect(createdEntry.metadata).toEqual(logData.metadata || null);

            // Property: Result should be the saved entity
            expect(result).toEqual(savedEntity);

            // Property: Timestamp should be set (within reasonable time window)
            expect(result.created_at).toBeDefined();
            expect(result.created_at.getTime()).toBeGreaterThanOrEqual(
              beforeLog.getTime() - 1000,
            );
            expect(result.created_at.getTime()).toBeLessThanOrEqual(
              afterLog.getTime() + 1000,
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should log login success events with correct metadata", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          ipAddressArb,
          userAgentArb,
          fc.option(
            fc.record({
              deviceId: fc.uuid(),
              sessionId: fc.uuid(),
            }),
            { nil: undefined },
          ),
          async (userId, ipAddress, userAgent, metadata) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: SecurityEventType.LOGIN_SUCCESS,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: true,
              error_message: null,
              metadata: metadata || null,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log login success
            await service.logLoginSuccess(
              userId,
              ipAddress,
              userAgent,
              metadata,
            );

            // Property: Event should be logged with LOGIN_SUCCESS type
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.event_type).toBe(
              SecurityEventType.LOGIN_SUCCESS,
            );
            expect(createdEntry.user_id).toBe(userId);
            expect(createdEntry.ip_address).toBe(ipAddress);
            expect(createdEntry.user_agent).toBe(userAgent);
            expect(createdEntry.success).toBe(true);
            expect(createdEntry.error_message).toBe(null);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should log login failure events with error messages", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: null }),
          ipAddressArb,
          userAgentArb,
          fc.constantFrom(
            "Invalid credentials",
            "Account locked",
            "Account disabled",
            "Email not verified",
          ),
          fc.option(
            fc.record({
              attemptNumber: fc.integer({ min: 1, max: 10 }),
            }),
            { nil: undefined },
          ),
          async (userId, ipAddress, userAgent, errorMessage, metadata) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: SecurityEventType.LOGIN_FAILURE,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: false,
              error_message: errorMessage,
              metadata: metadata || null,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log login failure
            await service.logLoginFailure(
              userId,
              ipAddress,
              userAgent,
              errorMessage,
              metadata,
            );

            // Property: Event should be logged with LOGIN_FAILURE type
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.event_type).toBe(
              SecurityEventType.LOGIN_FAILURE,
            );
            expect(createdEntry.user_id).toBe(userId);
            expect(createdEntry.ip_address).toBe(ipAddress);
            expect(createdEntry.user_agent).toBe(userAgent);
            expect(createdEntry.success).toBe(false);
            expect(createdEntry.error_message).toBe(errorMessage);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should log password change events (Requirement 4.8)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          ipAddressArb,
          userAgentArb,
          fc.option(
            fc.record({
              previousPasswordAge: fc.integer({ min: 1, max: 365 }),
            }),
            { nil: undefined },
          ),
          async (userId, ipAddress, userAgent, metadata) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: SecurityEventType.PASSWORD_CHANGE,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: true,
              error_message: null,
              metadata: metadata || null,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log password change
            await service.logPasswordChange(
              userId,
              ipAddress,
              userAgent,
              metadata,
            );

            // Property: Event should be logged with PASSWORD_CHANGE type
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.event_type).toBe(
              SecurityEventType.PASSWORD_CHANGE,
            );
            expect(createdEntry.user_id).toBe(userId);
            expect(createdEntry.success).toBe(true);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should log password reminder requests (Requirement 6.7)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          ipAddressArb,
          userAgentArb,
          async (userId, ipAddress, userAgent) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: SecurityEventType.PASSWORD_REMINDER_REQUEST,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: true,
              error_message: null,
              metadata: null,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log password reminder request
            await service.logPasswordReminderRequest(
              userId,
              ipAddress,
              userAgent,
            );

            // Property: Event should be logged with PASSWORD_REMINDER_REQUEST type
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.event_type).toBe(
              SecurityEventType.PASSWORD_REMINDER_REQUEST,
            );
            expect(createdEntry.user_id).toBe(userId);
            expect(createdEntry.success).toBe(true);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should log MFA verification events with success/failure", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          ipAddressArb,
          userAgentArb,
          fc.boolean(),
          fc.option(
            fc.record({
              codeType: fc.constantFrom("totp", "backup"),
              attemptNumber: fc.integer({ min: 1, max: 5 }),
            }),
            { nil: undefined },
          ),
          async (userId, ipAddress, userAgent, success, metadata) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const eventType = success
              ? SecurityEventType.MFA_SUCCESS
              : SecurityEventType.MFA_FAILURE;
            const errorMessage = success ? null : "Invalid MFA code";

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: eventType,
              ip_address: ipAddress,
              user_agent: userAgent,
              success,
              error_message: errorMessage,
              metadata: metadata || null,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log MFA event
            if (success) {
              await service.logMFASuccess(
                userId,
                ipAddress,
                userAgent,
                metadata,
              );
            } else {
              await service.logMFAFailure(
                userId,
                ipAddress,
                userAgent,
                errorMessage!,
                metadata,
              );
            }

            // Property: Event should be logged with correct MFA type
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.event_type).toBe(eventType);
            expect(createdEntry.user_id).toBe(userId);
            expect(createdEntry.success).toBe(success);
            if (!success) {
              expect(createdEntry.error_message).toBeDefined();
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should log account lockout events", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          ipAddressArb,
          userAgentArb,
          fc.option(
            fc.record({
              failedAttempts: fc.integer({ min: 5, max: 10 }),
              lockoutDuration: fc.integer({ min: 15, max: 60 }),
            }),
            { nil: undefined },
          ),
          async (userId, ipAddress, userAgent, metadata) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: SecurityEventType.ACCOUNT_LOCKOUT,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: true,
              error_message: null,
              metadata: metadata || null,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log account lockout
            await service.logAccountLockout(
              userId,
              ipAddress,
              userAgent,
              metadata,
            );

            // Property: Event should be logged with ACCOUNT_LOCKOUT type
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.event_type).toBe(
              SecurityEventType.ACCOUNT_LOCKOUT,
            );
            expect(createdEntry.user_id).toBe(userId);
            expect(createdEntry.success).toBe(true);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should log suspicious activity events with risk metadata", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          ipAddressArb,
          userAgentArb,
          fc.record({
            reasons: fc.array(
              fc.constantFrom(
                "impossible_travel",
                "unusual_access_pattern",
                "known_malicious_ip",
                "multiple_failed_attempts",
              ),
              { minLength: 1, maxLength: 3 },
            ),
            riskScore: fc.integer({ min: 1, max: 100 }),
          }),
          async (userId, ipAddress, userAgent, metadata) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: SecurityEventType.SUSPICIOUS_ACTIVITY,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: true,
              error_message: null,
              metadata,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log suspicious activity
            await service.logSuspiciousActivity(
              userId,
              ipAddress,
              userAgent,
              metadata,
            );

            // Property: Event should be logged with SUSPICIOUS_ACTIVITY type
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.event_type).toBe(
              SecurityEventType.SUSPICIOUS_ACTIVITY,
            );
            expect(createdEntry.user_id).toBe(userId);
            expect(createdEntry.metadata).toEqual(metadata);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should log device and session revocation events", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          ipAddressArb,
          userAgentArb,
          fc.constantFrom("device", "session"),
          fc.uuid(),
          async (userId, ipAddress, userAgent, revokeType, revokedId) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const eventType =
              revokeType === "device"
                ? SecurityEventType.DEVICE_REVOKED
                : SecurityEventType.SESSION_REVOKED;

            const metadata =
              revokeType === "device"
                ? { deviceId: revokedId }
                : { sessionId: revokedId };

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: eventType,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: true,
              error_message: null,
              metadata,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log revocation event
            if (revokeType === "device") {
              await service.logDeviceRevoked(
                userId,
                ipAddress,
                userAgent,
                metadata,
              );
            } else {
              await service.logSessionRevoked(
                userId,
                ipAddress,
                userAgent,
                metadata,
              );
            }

            // Property: Event should be logged with correct revocation type
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.event_type).toBe(eventType);
            expect(createdEntry.user_id).toBe(userId);
            expect(createdEntry.metadata).toEqual(metadata);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should log password reset events", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          ipAddressArb,
          userAgentArb,
          fc.option(
            fc.record({
              tokenUsed: fc.boolean(),
            }),
            { nil: undefined },
          ),
          async (userId, ipAddress, userAgent, metadata) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: SecurityEventType.PASSWORD_RESET,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: true,
              error_message: null,
              metadata: metadata || null,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log password reset
            await service.logPasswordReset(
              userId,
              ipAddress,
              userAgent,
              metadata,
            );

            // Property: Event should be logged with PASSWORD_RESET type
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.event_type).toBe(
              SecurityEventType.PASSWORD_RESET,
            );
            expect(createdEntry.user_id).toBe(userId);
            expect(createdEntry.success).toBe(true);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve IP address format in logs", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          ipAddressArb,
          userAgentArb,
          eventTypeArb,
          async (userId, ipAddress, userAgent, eventType) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: eventType,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: true,
              error_message: null,
              metadata: null,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log event
            await service.logEvent({
              userId,
              eventType,
              ipAddress,
              userAgent,
              success: true,
            });

            // Property: IP address should be preserved exactly as provided
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.ip_address).toBe(ipAddress);

            // Property: IP address should match IPv4 format
            expect(ipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle null userId for anonymous events", async () => {
      await fc.assert(
        fc.asyncProperty(
          ipAddressArb,
          userAgentArb,
          fc.constantFrom(
            SecurityEventType.LOGIN_FAILURE,
            SecurityEventType.REGISTRATION,
          ),
          async (ipAddress, userAgent, eventType) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: null,
              event_type: eventType,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: eventType === SecurityEventType.REGISTRATION,
              error_message:
                eventType === SecurityEventType.LOGIN_FAILURE
                  ? "Invalid credentials"
                  : null,
              metadata: null,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log event without userId
            await service.logEvent({
              userId: null,
              eventType,
              ipAddress,
              userAgent,
              success: eventType === SecurityEventType.REGISTRATION,
              errorMessage:
                eventType === SecurityEventType.LOGIN_FAILURE
                  ? "Invalid credentials"
                  : null,
            });

            // Property: Event should be logged even without userId
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.user_id).toBe(null);
            expect(createdEntry.event_type).toBe(eventType);
            expect(createdEntry.ip_address).toBe(ipAddress);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should store metadata as JSON for complex event data", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          ipAddressArb,
          userAgentArb,
          eventTypeArb,
          fc.record({
            deviceId: fc.option(fc.uuid(), { nil: undefined }),
            sessionId: fc.option(fc.uuid(), { nil: undefined }),
            reason: fc.option(fc.string({ minLength: 5, maxLength: 50 }), {
              nil: undefined,
            }),
            riskScore: fc.option(fc.integer({ min: 0, max: 100 }), {
              nil: undefined,
            }),
            attemptNumber: fc.option(fc.integer({ min: 1, max: 10 }), {
              nil: undefined,
            }),
          }),
          async (userId, ipAddress, userAgent, eventType, metadata) => {
            // Clear mocks
            mockCreate.mockClear();
            mockSave.mockClear();

            const savedEntity: SecurityLogEntity = {
              id: "test-log-id",
              user_id: userId,
              event_type: eventType,
              ip_address: ipAddress,
              user_agent: userAgent,
              success: true,
              error_message: null,
              metadata,
              created_at: new Date(),
            };

            mockCreate.mockReturnValue(savedEntity);
            mockSave.mockResolvedValue(savedEntity);

            // Log event with metadata
            await service.logEvent({
              userId,
              eventType,
              ipAddress,
              userAgent,
              success: true,
              metadata,
            });

            // Property: Metadata should be stored as-is
            const createdEntry = mockCreate.mock.calls[0][0];
            expect(createdEntry.metadata).toEqual(metadata);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
