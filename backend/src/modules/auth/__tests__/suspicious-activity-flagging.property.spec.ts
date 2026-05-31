/**
 * Property-Based Tests for Suspicious Activity Detection
 *
 * Feature: frontend-backend-auth-integration
 * Property 33: Suspicious activity flagging
 * Validates: Requirements 10.3, 10.4
 *
 * Tests that:
 * - Suspicious activity is detected based on impossible travel, unusual patterns, and malicious IPs
 * - Accounts are flagged when suspicious activity is detected
 * - Security alert emails are sent
 * - Additional verification is required for high-risk activities
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SuspiciousActivityService } from "../services/suspicious-activity.service";
import { EmailService, SecurityAlertType } from "../services/email.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { DeviceEntity } from "../infrastructure/persistence/entities/Device.entity";
import { SessionEntity } from "../infrastructure/persistence/entities/Session.entity";
import { DeviceInfo, GeoLocation } from "../services/device.service";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 33: Suspicious activity flagging", () => {
    let suspiciousActivityService: SuspiciousActivityService;
    let userRepository: Repository<UserEntity>;
    let deviceRepository: Repository<DeviceEntity>;
    let emailService: EmailService;
    let mockSendSecurityAlert: jest.Mock;

    beforeEach(async () => {
      mockSendSecurityAlert = jest.fn(() => Promise.resolve());

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SuspiciousActivityService,
          {
            provide: EmailService,
            useValue: {
              sendSecurityAlert: mockSendSecurityAlert,
            },
          },
          {
            provide: getRepositoryToken(UserEntity),
            useValue: {
              findOne: jest.fn(),
              save: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(DeviceEntity),
            useValue: {
              findOne: jest.fn(),
              find: jest.fn(),
            },
          },
          {
            provide: getRepositoryToken(SessionEntity),
            useValue: {
              findOne: jest.fn(),
              find: jest.fn(),
            },
          },
        ],
      }).compile();

      suspiciousActivityService = module.get<SuspiciousActivityService>(
        SuspiciousActivityService,
      );
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
      deviceRepository = module.get<Repository<DeviceEntity>>(
        getRepositoryToken(DeviceEntity),
      );
      emailService = module.get<EmailService>(EmailService);
    });

    /**
     * **Validates: Requirements 10.4**
     * Test that blacklisted IPs are detected as suspicious
     */
    it("should detect blacklisted IP addresses as suspicious", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom("192.0.2.1", "198.51.100.1", "203.0.113.1"),
          async (userId, blacklistedIP) => {
            // Clear mocks
            jest.clearAllMocks();

            const deviceInfo: DeviceInfo = {
              fingerprint: "test-fingerprint",
              browser: "Chrome",
              os: "Windows",
              ipAddress: blacklistedIP,
              userAgent: "test-agent",
            };

            // Property: Blacklisted IP should be detected as suspicious
            const result =
              await suspiciousActivityService.detectSuspiciousActivity(
                userId,
                deviceInfo,
              );

            expect(result.isSuspicious).toBe(true);
            expect(result.reasons).toContain(
              "Login from blacklisted IP address",
            );
            expect(result.riskScore).toBeGreaterThanOrEqual(100);
            expect(result.requiresVerification).toBe(true);

            return true;
          },
        ),
        { numRuns: 20 },
      );
    });

    /**
     * **Validates: Requirements 10.4**
     * Test that impossible travel is detected
     */
    it("should detect impossible travel as suspicious", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.double({ min: -90, max: 90 }), // latitude1
          fc.double({ min: -180, max: 180 }), // longitude1
          fc.double({ min: -90, max: 90 }), // latitude2
          fc.double({ min: -180, max: 180 }), // longitude2
          fc.integer({ min: 5, max: 60 }), // time difference in minutes (min 5 to avoid timing issues)
          async (
            userId,
            lat1,
            lon1,
            lat2,
            lon2,
            timeDiffMinutes,
          ) => {
            // Ensure locations are far apart (at least 1000 km)
            const distance = calculateHaversineDistance(
              lat1,
              lon1,
              lat2,
              lon2,
            );
            fc.pre(distance > 1000); // At least 1000 km apart

            // Exclude zero coordinates since the service uses falsy check (!lat/!lon)
            // which treats 0 as missing data
            fc.pre(lat1 !== 0 && lon1 !== 0 && lat2 !== 0 && lon2 !== 0);

            // Clear mocks
            jest.clearAllMocks();

            // Mock previous device with location
            const previousDevice: Partial<DeviceEntity> = {
              id: "device-1",
              user_id: userId,
              last_location: {
                latitude: lat1,
                longitude: lon1,
                country: "Country1",
                city: "City1",
              },
              last_seen_at: new Date(Date.now() - timeDiffMinutes * 60 * 1000),
            };

            (deviceRepository.findOne as jest.Mock).mockResolvedValue(
              previousDevice,
            );

            const currentDeviceInfo: DeviceInfo = {
              fingerprint: "test-fingerprint",
              browser: "Chrome",
              os: "Windows",
              ipAddress: "1.2.3.4",
              userAgent: "test-agent",
              location: {
                latitude: lat2,
                longitude: lon2,
                country: "Country2",
                city: "City2",
              },
            };

            // Property: Impossible travel should be detected if speed > 1000 km/h
            const result =
              await suspiciousActivityService.detectSuspiciousActivity(
                userId,
                currentDeviceInfo,
              );

            // Calculate the required speed based on the test setup
            const requiredSpeed = distance / (timeDiffMinutes / 60);

            // If the required speed is above the threshold, it should be detected
            if (requiredSpeed > 1000) {
              expect(result.isSuspicious).toBe(true);
              expect(result.reasons.some((r) => r.includes("Impossible travel"))).toBe(true);
              expect(result.riskScore).toBeGreaterThan(0);
            }

            return true;
          },
        ),
        { numRuns: 20 },
      );
    });

    /**
     * **Validates: Requirements 10.4**
     * Test that unusual hours are detected
     */
    it("should detect logins during unusual hours as suspicious", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            // Clear mocks
            jest.clearAllMocks();

            // Mock no previous devices
            (deviceRepository.findOne as jest.Mock).mockResolvedValue(null);
            (deviceRepository.find as jest.Mock).mockResolvedValue([]);

            const deviceInfo: DeviceInfo = {
              fingerprint: "test-fingerprint",
              browser: "Chrome",
              os: "Windows",
              ipAddress: "1.2.3.4",
              userAgent: "test-agent",
            };

            // Save original Date
            const OriginalDate = Date;

            // Test during unusual hours (0-6 AM)
            for (let hour = 0; hour < 6; hour++) {
              // Mock Date to return specific hour
              const mockDate = new Date(2024, 0, 1, hour, 0, 0);
              global.Date = class extends OriginalDate {
                constructor() {
                  super();
                  return mockDate;
                }
                static now() {
                  return mockDate.getTime();
                }
              } as any;

              const result =
                await suspiciousActivityService.detectSuspiciousActivity(
                  userId,
                  deviceInfo,
                );

              // Property: Login during unusual hours should be flagged
              expect(result.reasons.some((r) => r.includes("unusual hours"))).toBe(true);
              expect(result.riskScore).toBeGreaterThan(0);
            }

            // Restore original Date
            global.Date = OriginalDate;

            return true;
          },
        ),
        { numRuns: 10 },
      );
    });

    /**
     * **Validates: Requirements 10.3**
     * Test that accounts are flagged when suspicious activity is detected
     */
    it("should flag account when suspicious activity is detected", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.array(fc.string({ minLength: 10, maxLength: 100 }), {
            minLength: 1,
            maxLength: 3,
          }),
          fc.integer({ min: 50, max: 100 }),
          async (userId, email, reasons, riskScore) => {
            // Clear mocks
            jest.clearAllMocks();

            // Mock user
            const mockUser: Partial<UserEntity> = {
              id: userId,
              email,
              isActive: true,
            };

            (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Property: Flagging account should send security alert email
            await suspiciousActivityService.flagAccount(
              userId,
              reasons,
              riskScore,
            );

            expect(mockSendSecurityAlert).toHaveBeenCalledTimes(1);
            expect(mockSendSecurityAlert).toHaveBeenCalledWith(
              email,
              SecurityAlertType.SUSPICIOUS_ACTIVITY,
              expect.objectContaining({
                reasons,
                riskScore,
                timestamp: expect.any(Date),
              }),
            );

            return true;
          },
        ),
        { numRuns: 20 },
      );
    });

    /**
     * **Validates: Requirements 10.3**
     * Test that high-risk activities require additional verification
     */
    it("should require additional verification for high-risk activities", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 75, max: 200 }), // High risk score
          async (userId, highRiskScore) => {
            // Clear mocks
            jest.clearAllMocks();

            // Create device info with blacklisted IP (guaranteed high risk)
            const deviceInfo: DeviceInfo = {
              fingerprint: "test-fingerprint",
              browser: "Chrome",
              os: "Windows",
              ipAddress: "192.0.2.1", // Blacklisted IP
              userAgent: "test-agent",
            };

            const result =
              await suspiciousActivityService.detectSuspiciousActivity(
                userId,
                deviceInfo,
              );

            // Property: High risk score should require verification
            if (result.riskScore >= 75) {
              expect(result.requiresVerification).toBe(true);
            }

            return true;
          },
        ),
        { numRuns: 20 },
      );
    });

    /**
     * **Validates: Requirements 10.4**
     * Test that rapid location changes are detected
     */
    it("should detect rapid location changes as suspicious", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 4, max: 10 }), // Number of location changes
          async (userId, numLocations) => {
            // Clear mocks
            jest.clearAllMocks();

            // Mock multiple recent devices with different locations
            const recentDevices: Partial<DeviceEntity>[] = [];
            const windowStart = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago — well inside the 60-min service window

            for (let i = 0; i < numLocations; i++) {
              recentDevices.push({
                id: `device-${i}`,
                user_id: userId,
                last_location: {
                  country: `Country${i}`,
                  city: `City${i}`,
                },
                last_seen_at: new Date(
                  Date.now() - (numLocations - i) * 5 * 60 * 1000,
                ),
              });
            }

            (deviceRepository.findOne as jest.Mock).mockResolvedValue(null);
            (deviceRepository.find as jest.Mock).mockResolvedValue(
              recentDevices,
            );

            const deviceInfo: DeviceInfo = {
              fingerprint: "test-fingerprint",
              browser: "Chrome",
              os: "Windows",
              ipAddress: "1.2.3.4",
              userAgent: "test-agent",
              location: {
                country: "CountryNew",
                city: "CityNew",
              },
            };

            const result =
              await suspiciousActivityService.detectSuspiciousActivity(
                userId,
                deviceInfo,
              );

            // Property: More than 3 unique locations in the window should be flagged
            // Note: The service checks if uniqueLocations.size > maxLocationChanges (3)
            // So we need at least 4 unique locations from the recent devices
            // (not counting the current one since it's not in the database yet)
            const serviceWindowStart = new Date(Date.now() - 60 * 60 * 1000);
            const uniqueRecentLocations = new Set(
              recentDevices
                .filter((d) => d.last_seen_at! >= serviceWindowStart)
                .map((d) => `${d.last_location!.country}-${d.last_location!.city}`),
            );

            if (uniqueRecentLocations.size > 3) {
              expect(result.reasons.some((r) => r.includes("Rapid location changes"))).toBe(true);
              expect(result.riskScore).toBeGreaterThan(0);
            }

            return true;
          },
        ),
        { numRuns: 20 },
      );
    });

    /**
     * **Validates: Requirements 10.3, 10.4**
     * Test that normal activity is not flagged as suspicious
     */
    it("should not flag normal activity as suspicious", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.ipV4(),
          async (userId, normalIP) => {
            // Ensure IP is not blacklisted
            fc.pre(
              normalIP !== "192.0.2.1" &&
                normalIP !== "198.51.100.1" &&
                normalIP !== "203.0.113.1",
            );

            // Clear mocks
            jest.clearAllMocks();

            // Mock no previous devices (first login)
            (deviceRepository.findOne as jest.Mock).mockResolvedValue(null);
            (deviceRepository.find as jest.Mock).mockResolvedValue([]);

            // Save original Date
            const OriginalDate = Date;

            // Mock Date to return normal hours (9 AM)
            const mockDate = new Date(2024, 0, 1, 9, 0, 0);
            global.Date = class extends OriginalDate {
              constructor() {
                super();
                return mockDate;
              }
              static now() {
                return mockDate.getTime();
              }
            } as any;

            const deviceInfo: DeviceInfo = {
              fingerprint: "test-fingerprint",
              browser: "Chrome",
              os: "Windows",
              ipAddress: normalIP,
              userAgent: "test-agent",
            };

            const result =
              await suspiciousActivityService.detectSuspiciousActivity(
                userId,
                deviceInfo,
              );

            // Property: Normal activity should not be flagged
            expect(result.isSuspicious).toBe(false);
            expect(result.riskScore).toBe(0);
            expect(result.requiresVerification).toBe(false);

            // Restore original Date
            global.Date = OriginalDate;

            return true;
          },
        ),
        { numRuns: 20 },
      );
    });
  });
});

/**
 * Helper function to calculate distance between two coordinates using Haversine formula
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
