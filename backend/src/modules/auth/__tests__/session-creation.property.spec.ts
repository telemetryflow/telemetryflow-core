/**
 * Property-Based Tests for Authentication - Session Creation
 *
 * Feature: frontend-backend-auth-integration
 * Property 3: Session creation on authentication
 * Validates: Requirements 1.5, 9.7
 *
 * Tests that for any successful authentication, a session record should be created
 * containing the user ID, device fingerprint, and token metadata.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  SessionService,
  SessionMetadata,
  Session,
} from "../services/session.service";
import { SessionEntity } from "../infrastructure/persistence/entities/Session.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 3: Session creation on authentication", () => {
    let sessionService: SessionService;
    let sessionRepository: Repository<SessionEntity>;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SessionService,
          {
            provide: getRepositoryToken(SessionEntity),
            useValue: {
              create: jest.fn((data) => ({
                ...data,
                id: "mock-session-id",
                created_at: new Date(),
                terminated_at: null,
                terminated_reason: null,
              })),
              save: jest.fn((entity) => Promise.resolve(entity)),
              findOne: jest.fn(),
              find: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(() => Promise.resolve({ affected: 1 })),
            },
          },
        ],
      }).compile();

      sessionService = module.get<SessionService>(SessionService);
      sessionRepository = module.get<Repository<SessionEntity>>(
        getRepositoryToken(SessionEntity),
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should create a session for any valid user authentication", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid user IDs (UUIDs)
          fc.uuid(),
          // Generate valid device IDs (UUIDs)
          fc.uuid(),
          // Generate session metadata
          fc.record({
            deviceName: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            deviceType: fc.option(
              fc.constantFrom("desktop", "mobile", "tablet", "unknown"),
            ),
            browser: fc.option(
              fc.constantFrom("Chrome", "Firefox", "Safari", "Edge", "Opera"),
            ),
            browserVersion: fc.option(
              fc.string({ minLength: 1, maxLength: 20 }),
            ),
            os: fc.option(
              fc.constantFrom("Windows", "macOS", "Linux", "iOS", "Android"),
            ),
            osVersion: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
            ipAddress: fc.option(fc.ipV4()),
            location: fc.option(
              fc.record({
                country: fc.string({ minLength: 2, maxLength: 2 }),
                city: fc.string({ minLength: 1, maxLength: 100 }),
              }),
            ),
            rememberMe: fc.boolean(),
          }),
          async (userId, deviceId, metadata) => {
            // Property: Session creation should succeed for any valid inputs
            const session = await sessionService.createSession(
              userId,
              deviceId,
              metadata as SessionMetadata,
            );

            // Property: Session should be created with correct user ID
            expect(session.userId).toBe(userId);

            // Property: Session should be created with correct device ID (as session token)
            expect(session.sessionToken).toBe(deviceId);

            // Property: Session should have an ID
            expect(session.id).toBeDefined();
            expect(typeof session.id).toBe("string");

            // Property: Session should be marked as current
            expect(session.isCurrent).toBe(true);

            // Property: Session should have creation timestamp
            expect(session.createdAt).toBeInstanceOf(Date);

            // Property: Session should have last activity timestamp
            expect(session.lastActivityAt).toBeInstanceOf(Date);

            // Property: Session should have expiry timestamp
            expect(session.expiresAt).toBeInstanceOf(Date);

            // Property: Session should not be terminated initially
            expect(session.terminatedAt).toBeNull();
            expect(session.terminatedReason).toBeNull();

            // Verify repository methods were called
            expect(sessionRepository.create).toHaveBeenCalled();
            expect(sessionRepository.save).toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should create sessions with correct expiry time based on rememberMe flag", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.boolean(),
          async (userId, deviceId, rememberMe) => {
            const metadata: SessionMetadata = {
              rememberMe,
              ipAddress: "192.168.1.1",
            };

            const session = await sessionService.createSession(
              userId,
              deviceId,
              metadata,
            );

            // Calculate expected expiry
            const now = new Date();
            const expectedExpiryDays = rememberMe ? 30 : 7;
            const expectedExpiry = new Date(now);
            expectedExpiry.setDate(
              expectedExpiry.getDate() + expectedExpiryDays,
            );

            // Property: Session expiry should be approximately correct
            // Allow 1 second tolerance for test execution time
            const expiryDiff = Math.abs(
              session.expiresAt.getTime() - expectedExpiry.getTime(),
            );
            expect(expiryDiff).toBeLessThan(1000);

            // Property: rememberMe flag should be stored correctly
            expect(session.rememberMe).toBe(rememberMe);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should store device metadata correctly in session", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom("desktop", "mobile", "tablet"),
          fc.constantFrom("Chrome", "Firefox", "Safari"),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.constantFrom("Windows", "macOS", "Linux"),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.ipV4(),
          async (
            userId,
            deviceId,
            deviceName,
            deviceType,
            browser,
            browserVersion,
            os,
            osVersion,
            ipAddress,
          ) => {
            const metadata: SessionMetadata = {
              deviceName,
              deviceType,
              browser,
              browserVersion,
              os,
              osVersion,
              ipAddress,
              rememberMe: false,
            };

            const session = await sessionService.createSession(
              userId,
              deviceId,
              metadata,
            );

            // Property: All device metadata should be stored correctly
            expect(session.deviceName).toBe(deviceName);
            expect(session.deviceType).toBe(deviceType);
            expect(session.browser).toBe(browser);
            expect(session.browserVersion).toBe(browserVersion);
            expect(session.os).toBe(os);
            expect(session.osVersion).toBe(osVersion);
            expect(session.ipAddress).toBe(ipAddress);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle optional metadata fields correctly", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), fc.uuid(), async (userId, deviceId) => {
          // Create session with minimal metadata
          const metadata: SessionMetadata = {
            rememberMe: false,
          };

          const session = await sessionService.createSession(
            userId,
            deviceId,
            metadata,
          );

          // Property: Optional fields should be null when not provided
          expect(session.deviceName).toBeNull();
          expect(session.deviceType).toBeNull();
          expect(session.browser).toBeNull();
          expect(session.browserVersion).toBeNull();
          expect(session.os).toBeNull();
          expect(session.osVersion).toBeNull();
          expect(session.ipAddress).toBeNull();
          expect(session.location).toBeNull();

          // Property: Required fields should still be set
          expect(session.userId).toBe(userId);
          expect(session.sessionToken).toBe(deviceId);
          expect(session.isCurrent).toBe(true);
          expect(session.rememberMe).toBe(false);

          return true;
        }),
        { numRuns: 50 },
      );
    });

    it("should store location data correctly when provided", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.record({
            country: fc.string({ minLength: 2, maxLength: 2 }),
            city: fc.string({ minLength: 1, maxLength: 100 }),
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
          }),
          async (userId, deviceId, location) => {
            const metadata: SessionMetadata = {
              location,
              rememberMe: false,
            };

            const session = await sessionService.createSession(
              userId,
              deviceId,
              metadata,
            );

            // Property: Location data should be stored correctly
            expect(session.location).toEqual(location);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should create different sessions for different users", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId1, userId2, deviceId) => {
            // Skip if user IDs are the same
            fc.pre(userId1 !== userId2);

            const metadata: SessionMetadata = {
              rememberMe: false,
              ipAddress: "192.168.1.1",
            };

            // Create sessions for both users
            const session1 = await sessionService.createSession(
              userId1,
              deviceId,
              metadata,
            );
            const session2 = await sessionService.createSession(
              userId2,
              deviceId,
              metadata,
            );

            // Property: Sessions should have different user IDs
            expect(session1.userId).toBe(userId1);
            expect(session2.userId).toBe(userId2);
            expect(session1.userId).not.toBe(session2.userId);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should create different sessions for different devices", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId, deviceId1, deviceId2) => {
            // Skip if device IDs are the same
            fc.pre(deviceId1 !== deviceId2);

            const metadata: SessionMetadata = {
              rememberMe: false,
              ipAddress: "192.168.1.1",
            };

            // Create sessions for both devices
            const session1 = await sessionService.createSession(
              userId,
              deviceId1,
              metadata,
            );
            const session2 = await sessionService.createSession(
              userId,
              deviceId2,
              metadata,
            );

            // Property: Sessions should have different device IDs
            expect(session1.sessionToken).toBe(deviceId1);
            expect(session2.sessionToken).toBe(deviceId2);
            expect(session1.sessionToken).not.toBe(session2.sessionToken);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle edge case metadata values", async () => {
      const edgeCases = [
        // Empty strings
        {
          deviceName: "",
          browser: "",
          os: "",
        },
        // Very long strings (within limits)
        {
          deviceName: "A".repeat(100),
          browser: "B".repeat(100),
          os: "C".repeat(100),
        },
        // Special characters
        {
          deviceName: "Device-123_Test",
          browser: "Chrome/123.0",
          os: "Windows 10 Pro",
        },
      ];

      for (const metadata of edgeCases) {
        const userId = "12345678-1234-1234-1234-123456789012";
        const deviceId = "87654321-4321-4321-4321-210987654321";

        const session = await sessionService.createSession(userId, deviceId, {
          ...metadata,
          rememberMe: false,
        });

        // Property: Edge case values should be stored correctly
        expect(session.userId).toBe(userId);
        expect(session.sessionToken).toBe(deviceId);
        expect(session.deviceName).toBe(metadata.deviceName || null);
        expect(session.browser).toBe(metadata.browser || null);
        expect(session.os).toBe(metadata.os || null);
      }
    });

    it("should set lastActivityAt to current time on creation", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), fc.uuid(), async (userId, deviceId) => {
          const beforeCreation = new Date();

          const session = await sessionService.createSession(userId, deviceId, {
            rememberMe: false,
          });

          const afterCreation = new Date();

          // Property: lastActivityAt should be between before and after timestamps
          expect(session.lastActivityAt.getTime()).toBeGreaterThanOrEqual(
            beforeCreation.getTime() - 1000,
          );
          expect(session.lastActivityAt.getTime()).toBeLessThanOrEqual(
            afterCreation.getTime() + 1000,
          );

          return true;
        }),
        { numRuns: 50 },
      );
    });

    it("should create sessions with consistent structure", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.record({
            deviceName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            browser: fc.option(fc.constantFrom("Chrome", "Firefox", "Safari")),
            os: fc.option(fc.constantFrom("Windows", "macOS", "Linux")),
            ipAddress: fc.option(fc.ipV4()),
            rememberMe: fc.boolean(),
          }),
          async (userId, deviceId, metadata) => {
            const session = await sessionService.createSession(
              userId,
              deviceId,
              metadata as SessionMetadata,
            );

            // Property: Session should have all required fields
            const requiredFields = [
              "id",
              "userId",
              "sessionToken",
              "isCurrent",
              "rememberMe",
              "lastActivityAt",
              "expiresAt",
              "createdAt",
              "terminatedAt",
              "terminatedReason",
            ];

            for (const field of requiredFields) {
              expect(session).toHaveProperty(field);
            }

            // Property: Session should have all optional metadata fields
            const optionalFields = [
              "deviceName",
              "deviceType",
              "browser",
              "browserVersion",
              "os",
              "osVersion",
              "ipAddress",
              "location",
            ];

            for (const field of optionalFields) {
              expect(session).toHaveProperty(field);
            }

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
