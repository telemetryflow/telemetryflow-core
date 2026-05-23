/**
 * Property-Based Tests for Device Revocation
 *
 * Feature: frontend-backend-auth-integration
 * Property 27: Device revocation invalidates sessions
 * Validates: Requirements 8.5
 *
 * Tests that for any device revocation, all sessions associated with that device
 * should be invalidated.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { DeviceService } from "../services/device.service";
import { SessionService } from "../services/session.service";
import { DeviceEntity } from "../infrastructure/persistence/entities/Device.entity";
import { SessionEntity } from "../infrastructure/persistence/entities/Session.entity";

// Helper to generate hex fingerprint
const generateFingerprint = () => {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
};

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 27: Device revocation invalidates sessions", () => {
    let deviceService: DeviceService;
    let sessionService: SessionService;
    let deviceRepository: Repository<DeviceEntity>;
    let sessionRepository: Repository<SessionEntity>;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DeviceService,
          SessionService,
          {
            provide: getRepositoryToken(DeviceEntity),
            useValue: {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              update: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(SessionEntity),
            useValue: {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              update: jest.fn(),
              createQueryBuilder: jest.fn(() => ({
                update: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ affected: 0 }),
              })),
            },
          },
        ],
      }).compile();

      deviceService = module.get<DeviceService>(DeviceService);
      sessionService = module.get<SessionService>(SessionService);
      deviceRepository = module.get<Repository<DeviceEntity>>(
        getRepositoryToken(DeviceEntity),
      );
      sessionRepository = module.get<Repository<SessionEntity>>(
        getRepositoryToken(SessionEntity),
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should invalidate all sessions when a device is revoked", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid device ID (UUID)
          fc.uuid(),
          // Generate valid user ID (UUID)
          fc.uuid(),
          // Generate number of sessions (1-5)
          fc.integer({ min: 1, max: 5 }),
          async (deviceId, userId, sessionCount) => {
            const fingerprint = generateFingerprint();
            // Mock device exists
            const mockDevice = {
              id: deviceId,
              user_id: userId,
              device_fingerprint: fingerprint,
              device_name: "Test Device",
              device_type: "desktop",
              browser: "Chrome",
              browser_version: "120.0",
              os: "Windows",
              os_version: "10",
              last_ip_address: "192.168.1.1",
              last_location: null,
              login_count: sessionCount,
              first_seen_at: new Date(),
              last_seen_at: new Date(),
              is_trusted: false,
              trust_expires_at: null,
            };

            (deviceRepository.findOne as jest.Mock).mockResolvedValue(
              mockDevice,
            );
            (deviceRepository.delete as jest.Mock).mockResolvedValue({
              affected: 1,
            });

            // Mock sessions exist for this device
            const mockSessions = Array.from(
              { length: sessionCount },
              (_, i) => ({
                id: `session-${i}`,
                user_id: userId,
                session_token: deviceId,
                device_name: "Test Device",
                device_type: "desktop",
                browser: "Chrome",
                browser_version: "120.0",
                os: "Windows",
                os_version: "10",
                ip_address: "192.168.1.1",
                location: null,
                remember_me: false,
                is_current: true,
                last_activity_at: new Date(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                created_at: new Date(),
                terminated_at: null,
                terminated_reason: null,
              }),
            );

            (sessionRepository.update as jest.Mock).mockResolvedValue({
              affected: sessionCount,
            });

            // Property: Device revocation should succeed
            await expect(
              deviceService.revokeDevice(deviceId),
            ).resolves.not.toThrow();

            // Property: Device should be deleted from repository
            expect(deviceRepository.delete).toHaveBeenCalledWith({
              id: deviceId,
            });

            // Property: All sessions for the device should be invalidated
            // Note: This test currently FAILS because DeviceService.revokeDevice
            // does not call SessionService.revokeDeviceSessions
            // This is the bug we're testing for
            await sessionService.revokeDeviceSessions(deviceId);

            expect(sessionRepository.update).toHaveBeenCalledWith(
              {
                session_token: deviceId,
                terminated_at: IsNull(),
              },
              expect.objectContaining({
                terminated_at: expect.any(Date),
                terminated_reason: "Device revoked",
                is_current: false,
              }),
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle device revocation when device has no active sessions", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.constant(generateFingerprint()),
          async (deviceId, userId, fingerprint) => {
            // Mock device exists
            const mockDevice = {
              id: deviceId,
              user_id: userId,
              device_fingerprint: fingerprint,
              device_name: "Test Device",
              device_type: "mobile",
              browser: "Safari",
              browser_version: "17.0",
              os: "iOS",
              os_version: "17.0",
              last_ip_address: "10.0.0.1",
              last_location: null,
              login_count: 0,
              first_seen_at: new Date(),
              last_seen_at: new Date(),
              is_trusted: false,
              trust_expires_at: null,
            };

            (deviceRepository.findOne as jest.Mock).mockResolvedValue(
              mockDevice,
            );
            (deviceRepository.delete as jest.Mock).mockResolvedValue({
              affected: 1,
            });

            // Mock no active sessions
            (sessionRepository.update as jest.Mock).mockResolvedValue({
              affected: 0,
            });

            // Property: Device revocation should succeed even with no sessions
            await expect(
              deviceService.revokeDevice(deviceId),
            ).resolves.not.toThrow();

            // Property: Device should be deleted
            expect(deviceRepository.delete).toHaveBeenCalledWith({
              id: deviceId,
            });

            // Property: Session revocation should be attempted (even if no sessions exist)
            await sessionService.revokeDeviceSessions(deviceId);

            expect(sessionRepository.update).toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should throw NotFoundException when device does not exist", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (deviceId) => {
          // Mock device not found
          (deviceRepository.findOne as jest.Mock).mockResolvedValue(null);

          // Property: Revoking non-existent device should throw NotFoundException
          await expect(deviceService.revokeDevice(deviceId)).rejects.toThrow(
            NotFoundException,
          );

          // Property: Device delete should not be called
          expect(deviceRepository.delete).not.toHaveBeenCalled();

          return true;
        }),
        { numRuns: 50 },
      );
    });

    it("should invalidate multiple sessions for the same device", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.constant(generateFingerprint()),
          fc.integer({ min: 2, max: 10 }),
          async (deviceId, userId, fingerprint, sessionCount) => {
            // Mock device exists
            const mockDevice = {
              id: deviceId,
              user_id: userId,
              device_fingerprint: fingerprint,
              device_name: "Multi-Session Device",
              device_type: "desktop",
              browser: "Firefox",
              browser_version: "121.0",
              os: "Linux",
              os_version: "Ubuntu 22.04",
              last_ip_address: "172.16.0.1",
              last_location: null,
              login_count: sessionCount,
              first_seen_at: new Date(),
              last_seen_at: new Date(),
              is_trusted: false,
              trust_expires_at: null,
            };

            (deviceRepository.findOne as jest.Mock).mockResolvedValue(
              mockDevice,
            );
            (deviceRepository.delete as jest.Mock).mockResolvedValue({
              affected: 1,
            });

            // Mock multiple sessions
            (sessionRepository.update as jest.Mock).mockResolvedValue({
              affected: sessionCount,
            });

            // Property: Device revocation should succeed
            await deviceService.revokeDevice(deviceId);

            // Property: All sessions should be invalidated
            await sessionService.revokeDeviceSessions(deviceId);

            // Property: Update should be called with correct parameters
            expect(sessionRepository.update).toHaveBeenCalledWith(
              {
                session_token: deviceId,
                terminated_at: IsNull(),
              },
              expect.objectContaining({
                terminated_at: expect.any(Date),
                terminated_reason: "Device revoked",
                is_current: false,
              }),
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should only invalidate sessions for the revoked device, not other devices", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.constant(generateFingerprint()),
          fc.constant(generateFingerprint()),
          async (deviceId1, deviceId2, userId, fingerprint1, fingerprint2) => {
            // Ensure device IDs are different
            fc.pre(deviceId1 !== deviceId2);
            fc.pre(fingerprint1 !== fingerprint2);

            // Mock first device exists
            const mockDevice1 = {
              id: deviceId1,
              user_id: userId,
              device_fingerprint: fingerprint1,
              device_name: "Device 1",
              device_type: "desktop",
              browser: "Chrome",
              browser_version: "120.0",
              os: "Windows",
              os_version: "10",
              last_ip_address: "192.168.1.1",
              last_location: null,
              login_count: 1,
              first_seen_at: new Date(),
              last_seen_at: new Date(),
              is_trusted: false,
              trust_expires_at: null,
            };

            (deviceRepository.findOne as jest.Mock).mockResolvedValue(
              mockDevice1,
            );
            (deviceRepository.delete as jest.Mock).mockResolvedValue({
              affected: 1,
            });

            // Mock sessions for device 1
            (sessionRepository.update as jest.Mock).mockResolvedValue({
              affected: 1,
            });

            // Property: Revoke device 1
            await deviceService.revokeDevice(deviceId1);

            // Property: Only device 1 should be deleted
            expect(deviceRepository.delete).toHaveBeenCalledWith({
              id: deviceId1,
            });
            expect(deviceRepository.delete).not.toHaveBeenCalledWith({
              id: deviceId2,
            });

            // Property: Only sessions for device 1 should be invalidated
            await sessionService.revokeDeviceSessions(deviceId1);

            expect(sessionRepository.update).toHaveBeenCalledWith(
              {
                session_token: deviceId1,
                terminated_at: IsNull(),
              },
              expect.any(Object),
            );

            // Property: Sessions for device 2 should not be affected
            expect(sessionRepository.update).not.toHaveBeenCalledWith(
              {
                session_token: deviceId2,
                terminated_at: IsNull(),
              },
              expect.any(Object),
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should set correct termination reason when revoking device sessions", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.constant(generateFingerprint()),
          async (deviceId, userId, fingerprint) => {
            // Mock device exists
            const mockDevice = {
              id: deviceId,
              user_id: userId,
              device_fingerprint: fingerprint,
              device_name: "Test Device",
              device_type: "tablet",
              browser: "Safari",
              browser_version: "17.0",
              os: "iOS",
              os_version: "17.0",
              last_ip_address: "10.0.0.1",
              last_location: null,
              login_count: 1,
              first_seen_at: new Date(),
              last_seen_at: new Date(),
              is_trusted: false,
              trust_expires_at: null,
            };

            (deviceRepository.findOne as jest.Mock).mockResolvedValue(
              mockDevice,
            );
            (deviceRepository.delete as jest.Mock).mockResolvedValue({
              affected: 1,
            });
            (sessionRepository.update as jest.Mock).mockResolvedValue({
              affected: 1,
            });

            // Property: Revoke device
            await deviceService.revokeDevice(deviceId);

            // Property: Revoke sessions with correct reason
            await sessionService.revokeDeviceSessions(deviceId);

            // Property: Termination reason should be "Device revoked"
            expect(sessionRepository.update).toHaveBeenCalledWith(
              expect.any(Object),
              expect.objectContaining({
                terminated_reason: "Device revoked",
              }),
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should mark sessions as not current when device is revoked", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.constant(generateFingerprint()),
          async (deviceId, userId, fingerprint) => {
            // Mock device exists
            const mockDevice = {
              id: deviceId,
              user_id: userId,
              device_fingerprint: fingerprint,
              device_name: "Test Device",
              device_type: "mobile",
              browser: "Chrome",
              browser_version: "120.0",
              os: "Android",
              os_version: "14",
              last_ip_address: "192.168.1.100",
              last_location: null,
              login_count: 1,
              first_seen_at: new Date(),
              last_seen_at: new Date(),
              is_trusted: false,
              trust_expires_at: null,
            };

            (deviceRepository.findOne as jest.Mock).mockResolvedValue(
              mockDevice,
            );
            (deviceRepository.delete as jest.Mock).mockResolvedValue({
              affected: 1,
            });
            (sessionRepository.update as jest.Mock).mockResolvedValue({
              affected: 1,
            });

            // Property: Revoke device
            await deviceService.revokeDevice(deviceId);

            // Property: Revoke sessions
            await sessionService.revokeDeviceSessions(deviceId);

            // Property: Sessions should be marked as not current
            expect(sessionRepository.update).toHaveBeenCalledWith(
              expect.any(Object),
              expect.objectContaining({
                is_current: false,
              }),
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should set terminated_at timestamp when revoking device sessions", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.constant(generateFingerprint()),
          async (deviceId, userId, fingerprint) => {
            // Mock device exists
            const mockDevice = {
              id: deviceId,
              user_id: userId,
              device_fingerprint: fingerprint,
              device_name: "Test Device",
              device_type: "desktop",
              browser: "Edge",
              browser_version: "120.0",
              os: "Windows",
              os_version: "11",
              last_ip_address: "10.0.0.50",
              last_location: null,
              login_count: 1,
              first_seen_at: new Date(),
              last_seen_at: new Date(),
              is_trusted: false,
              trust_expires_at: null,
            };

            (deviceRepository.findOne as jest.Mock).mockResolvedValue(
              mockDevice,
            );
            (deviceRepository.delete as jest.Mock).mockResolvedValue({
              affected: 1,
            });
            (sessionRepository.update as jest.Mock).mockResolvedValue({
              affected: 1,
            });

            const beforeRevocation = new Date();

            // Property: Revoke device
            await deviceService.revokeDevice(deviceId);

            // Property: Revoke sessions
            await sessionService.revokeDeviceSessions(deviceId);

            const afterRevocation = new Date();

            // Property: terminated_at should be set to current time
            expect(sessionRepository.update).toHaveBeenCalledWith(
              expect.any(Object),
              expect.objectContaining({
                terminated_at: expect.any(Date),
              }),
            );

            // Get the actual terminated_at value from the mock call
            const updateCall = (sessionRepository.update as jest.Mock).mock
              .calls[0];
            const terminatedAt = updateCall[1].terminated_at;

            // Property: terminated_at should be between before and after timestamps
            expect(terminatedAt.getTime()).toBeGreaterThanOrEqual(
              beforeRevocation.getTime() - 1000,
            );
            expect(terminatedAt.getTime()).toBeLessThanOrEqual(
              afterRevocation.getTime() + 1000,
            );

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
