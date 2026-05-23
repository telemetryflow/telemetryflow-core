/**
 * Property-Based Tests for Authentication - Device Fingerprinting
 *
 * Feature: frontend-backend-auth-integration
 * Property 25: Device fingerprinting on login
 * Validates: Requirements 8.1
 *
 * Tests that for any login attempt, the system should capture device fingerprint
 * information including browser, OS, IP address, and user agent.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Request } from "express";
import { DeviceService, DeviceInfo, Device } from "../services/device.service";
import { DeviceEntity } from "../infrastructure/persistence/entities/Device.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 25: Device fingerprinting on login", () => {
    let deviceService: DeviceService;
    let deviceRepository: Repository<DeviceEntity>;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DeviceService,
          {
            provide: getRepositoryToken(DeviceEntity),
            useValue: {
              create: jest.fn((data) => ({
                ...data,
                id: "mock-device-id",
                first_seen_at: new Date(),
                last_seen_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
              })),
              save: jest.fn((entity) => Promise.resolve(entity)),
              findOne: jest.fn(),
              find: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        ],
      }).compile();

      deviceService = module.get<DeviceService>(DeviceService);
      deviceRepository = module.get<Repository<DeviceEntity>>(
        getRepositoryToken(DeviceEntity),
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should generate fingerprint for any request with user agent and IP", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various user agents
          fc.constantFrom(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          ),
          // Generate IP addresses
          fc.ipV4(),
          // Generate accept-language headers
          fc.constantFrom("en-US,en;q=0.9", "fr-FR,fr;q=0.9", "es-ES,es;q=0.9"),
          // Generate accept-encoding headers
          fc.constantFrom("gzip, deflate, br", "gzip, deflate", "identity"),
          async (userAgent, ipAddress, acceptLanguage, acceptEncoding) => {
            // Create mock request
            const mockRequest = {
              headers: {
                "user-agent": userAgent,
                "accept-language": acceptLanguage,
                "accept-encoding": acceptEncoding,
              },
              ip: ipAddress,
            } as unknown as Request;

            // Property: Fingerprint should be generated for any request
            const fingerprint = deviceService.generateFingerprint(mockRequest);

            // Property: Fingerprint should be a non-empty string
            expect(fingerprint).toBeDefined();
            expect(typeof fingerprint).toBe("string");
            expect(fingerprint.length).toBeGreaterThan(0);

            // Property: Fingerprint should be a SHA-256 hash (64 hex characters)
            expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should extract device information including browser, OS, IP, and user agent", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            {
              userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              expectedBrowser: "Chrome",
              expectedOS: "Windows",
            },
            {
              userAgent:
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              expectedBrowser: "Chrome",
              expectedOS: "macOS",
            },
            {
              userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
              expectedBrowser: "Firefox",
              expectedOS: "Windows",
            },
            {
              userAgent:
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
              expectedBrowser: "Safari",
              expectedOS: "macOS",
            },
            {
              userAgent:
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              expectedBrowser: "Chrome",
              expectedOS: "Linux",
            },
          ),
          fc.ipV4(),
          async (testCase, ipAddress) => {
            const mockRequest = {
              headers: {
                "user-agent": testCase.userAgent,
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br",
              },
              ip: ipAddress,
            } as unknown as Request;

            // Property: Device info should be extracted for any request
            const deviceInfo = deviceService.extractDeviceInfo(mockRequest);

            // Property: Device info should contain fingerprint
            expect(deviceInfo.fingerprint).toBeDefined();
            expect(typeof deviceInfo.fingerprint).toBe("string");
            expect(deviceInfo.fingerprint.length).toBeGreaterThan(0);

            // Property: Device info should contain browser information
            expect(deviceInfo.browser).toBe(testCase.expectedBrowser);

            // Property: Device info should contain OS information
            expect(deviceInfo.os).toBe(testCase.expectedOS);

            // Property: Device info should contain IP address
            expect(deviceInfo.ipAddress).toBe(ipAddress);

            // Property: Device info should contain user agent
            expect(deviceInfo.userAgent).toBe(testCase.userAgent);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should generate consistent fingerprints for identical requests", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ),
          fc.ipV4(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (userAgent, ipAddress, acceptLanguage, acceptEncoding) => {
            const mockRequest1 = {
              headers: {
                "user-agent": userAgent,
                "accept-language": acceptLanguage,
                "accept-encoding": acceptEncoding,
              },
              ip: ipAddress,
            } as unknown as Request;

            const mockRequest2 = {
              headers: {
                "user-agent": userAgent,
                "accept-language": acceptLanguage,
                "accept-encoding": acceptEncoding,
              },
              ip: ipAddress,
            } as unknown as Request;

            // Property: Identical requests should produce identical fingerprints
            const fingerprint1 =
              deviceService.generateFingerprint(mockRequest1);
            const fingerprint2 =
              deviceService.generateFingerprint(mockRequest2);

            expect(fingerprint1).toBe(fingerprint2);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should generate different fingerprints for different requests", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ),
          fc.constantFrom(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ),
          fc.ipV4(),
          async (userAgent1, userAgent2, ipAddress) => {
            // Skip if user agents are the same
            fc.pre(userAgent1 !== userAgent2);

            const mockRequest1 = {
              headers: {
                "user-agent": userAgent1,
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br",
              },
              ip: ipAddress,
            } as unknown as Request;

            const mockRequest2 = {
              headers: {
                "user-agent": userAgent2,
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br",
              },
              ip: ipAddress,
            } as unknown as Request;

            // Property: Different user agents should produce different fingerprints
            const fingerprint1 =
              deviceService.generateFingerprint(mockRequest1);
            const fingerprint2 =
              deviceService.generateFingerprint(mockRequest2);

            expect(fingerprint1).not.toBe(fingerprint2);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should detect device type correctly for mobile, tablet, and desktop", async () => {
      const testCases = [
        {
          userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
          expectedDeviceType: "mobile",
        },
        {
          userAgent:
            "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
          expectedDeviceType: "tablet",
        },
        {
          userAgent:
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          expectedDeviceType: "mobile",
        },
        {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          expectedDeviceType: "desktop",
        },
        {
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          expectedDeviceType: "desktop",
        },
      ];

      for (const testCase of testCases) {
        const mockRequest = {
          headers: {
            "user-agent": testCase.userAgent,
            "accept-language": "en-US,en;q=0.9",
            "accept-encoding": "gzip, deflate, br",
          },
          ip: "192.168.1.1",
        } as unknown as Request;

        const deviceInfo = deviceService.extractDeviceInfo(mockRequest);

        // Property: Device type should be correctly detected
        expect(deviceInfo.deviceType).toBe(testCase.expectedDeviceType);
      }
    });

    it("should capture device information on login for new devices", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ),
          fc.ipV4(),
          async (userId, userAgent, ipAddress) => {
            const mockRequest = {
              headers: {
                "user-agent": userAgent,
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br",
              },
              ip: ipAddress,
            } as unknown as Request;

            const deviceInfo = deviceService.extractDeviceInfo(mockRequest);
            const fingerprint = deviceService.generateFingerprint(mockRequest);

            // Mock repository to return null (new device)
            jest.spyOn(deviceRepository, "findOne").mockResolvedValueOnce(null);

            // Property: Device should be created on first login
            const device = await deviceService.getOrCreateDevice(
              userId,
              fingerprint,
              deviceInfo,
            );

            // Property: Device should have correct user ID
            expect(device.userId).toBe(userId);

            // Property: Device should have correct fingerprint
            expect(device.fingerprint).toBe(fingerprint);

            // Property: Device should have browser information
            expect(device.browser).toBeDefined();

            // Property: Device should have OS information
            expect(device.os).toBeDefined();

            // Property: Device should have IP address
            expect(device.lastIpAddress).toBe(ipAddress);

            // Property: Device should have user agent stored in device info
            expect(deviceInfo.userAgent).toBe(userAgent);

            // Property: Device should have login count of 1 for new device
            expect(device.loginCount).toBe(1);

            // Property: Device should not be trusted initially
            expect(device.isTrusted).toBe(false);

            // Verify repository methods were called
            expect(deviceRepository.create).toHaveBeenCalled();
            expect(deviceRepository.save).toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should update device information on subsequent logins", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ),
          fc.ipV4(),
          fc.integer({ min: 1, max: 100 }),
          async (userId, userAgent, ipAddress, existingLoginCount) => {
            const mockRequest = {
              headers: {
                "user-agent": userAgent,
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br",
              },
              ip: ipAddress,
            } as unknown as Request;

            const deviceInfo = deviceService.extractDeviceInfo(mockRequest);
            const fingerprint = deviceService.generateFingerprint(mockRequest);

            // Mock existing device
            const existingDevice = {
              id: "existing-device-id",
              user_id: userId,
              device_fingerprint: fingerprint,
              device_name: null,
              device_type: "desktop",
              browser: "Chrome",
              browser_version: "119.0",
              os: "Windows",
              os_version: "10",
              last_ip_address: "192.168.1.100",
              last_location: null,
              login_count: existingLoginCount,
              first_seen_at: new Date("2024-01-01"),
              last_seen_at: new Date("2026-02-27"),
              is_trusted: false,
              trust_expires_at: null,
              created_at: new Date("2024-01-01"),
              updated_at: new Date("2026-02-27"),
            } as DeviceEntity;

            jest
              .spyOn(deviceRepository, "findOne")
              .mockResolvedValueOnce(existingDevice);

            // Property: Device should be updated on subsequent login
            const device = await deviceService.getOrCreateDevice(
              userId,
              fingerprint,
              deviceInfo,
            );

            // Property: Login count should be incremented
            expect(device.loginCount).toBe(existingLoginCount + 1);

            // Property: Last IP address should be updated
            expect(device.lastIpAddress).toBe(ipAddress);

            // Property: Device ID should remain the same
            expect(device.id).toBe("existing-device-id");

            // Verify repository save was called
            expect(deviceRepository.save).toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle missing or empty headers gracefully", async () => {
      const testCases = [
        {
          headers: {},
          ip: "192.168.1.1",
        },
        {
          headers: { "user-agent": "" },
          ip: "192.168.1.1",
        },
        {
          headers: { "user-agent": "Mozilla/5.0" },
          ip: undefined,
        },
        {
          headers: {
            "user-agent": "Mozilla/5.0",
            "accept-language": "",
            "accept-encoding": "",
          },
          ip: "192.168.1.1",
        },
      ];

      for (const testCase of testCases) {
        const mockRequest = {
          headers: testCase.headers,
          ip: testCase.ip,
        } as unknown as Request;

        // Property: Fingerprint should be generated even with missing headers
        const fingerprint = deviceService.generateFingerprint(mockRequest);
        expect(fingerprint).toBeDefined();
        expect(typeof fingerprint).toBe("string");
        expect(fingerprint.length).toBeGreaterThan(0);

        // Property: Device info should be extracted even with missing headers
        const deviceInfo = deviceService.extractDeviceInfo(mockRequest);
        expect(deviceInfo).toBeDefined();
        expect(deviceInfo.fingerprint).toBeDefined();
        expect(deviceInfo.userAgent).toBeDefined();
      }
    });

    it("should extract browser version information when available", async () => {
      const testCases = [
        {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          expectedBrowser: "Chrome",
          expectedVersionPattern: /^\d+\.\d+$/,
        },
        {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
          expectedBrowser: "Firefox",
          expectedVersionPattern: /^\d+\.\d+$/,
        },
        {
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
          expectedBrowser: "Safari",
          expectedVersionPattern: /^\d+\.\d+$/,
        },
      ];

      for (const testCase of testCases) {
        const mockRequest = {
          headers: {
            "user-agent": testCase.userAgent,
            "accept-language": "en-US,en;q=0.9",
            "accept-encoding": "gzip, deflate, br",
          },
          ip: "192.168.1.1",
        } as unknown as Request;

        const deviceInfo = deviceService.extractDeviceInfo(mockRequest);

        // Property: Browser should be detected
        expect(deviceInfo.browser).toBe(testCase.expectedBrowser);

        // Property: Browser version should be extracted when available
        if (deviceInfo.browserVersion) {
          expect(deviceInfo.browserVersion).toMatch(
            testCase.expectedVersionPattern,
          );
        }
      }
    });

    it("should extract OS version information when available", async () => {
      const testCases = [
        {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          expectedOS: "Windows",
          expectedOSVersion: "10",
        },
        {
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          expectedOS: "macOS",
          expectedOSVersionPattern: /^\d+\.\d+$/,
        },
        {
          userAgent:
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          expectedOS: "Android",
          expectedOSVersionPattern: /^\d+\.\d+$/,
        },
      ];

      for (const testCase of testCases) {
        const mockRequest = {
          headers: {
            "user-agent": testCase.userAgent,
            "accept-language": "en-US,en;q=0.9",
            "accept-encoding": "gzip, deflate, br",
          },
          ip: "192.168.1.1",
        } as unknown as Request;

        const deviceInfo = deviceService.extractDeviceInfo(mockRequest);

        // Property: OS should be detected
        expect(deviceInfo.os).toBe(testCase.expectedOS);

        // Property: OS version should be extracted when available
        if (testCase.expectedOSVersion) {
          expect(deviceInfo.osVersion).toBe(testCase.expectedOSVersion);
        } else if (testCase.expectedOSVersionPattern && deviceInfo.osVersion) {
          expect(deviceInfo.osVersion).toMatch(
            testCase.expectedOSVersionPattern,
          );
        }
      }
    });

    it("should generate unique fingerprints for different IP addresses", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ),
          fc.ipV4(),
          fc.ipV4(),
          async (userAgent, ipAddress1, ipAddress2) => {
            // Skip if IP addresses are the same
            fc.pre(ipAddress1 !== ipAddress2);

            const mockRequest1 = {
              headers: {
                "user-agent": userAgent,
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br",
              },
              ip: ipAddress1,
            } as unknown as Request;

            const mockRequest2 = {
              headers: {
                "user-agent": userAgent,
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br",
              },
              ip: ipAddress2,
            } as unknown as Request;

            // Property: Different IP addresses should produce different fingerprints
            const fingerprint1 =
              deviceService.generateFingerprint(mockRequest1);
            const fingerprint2 =
              deviceService.generateFingerprint(mockRequest2);

            expect(fingerprint1).not.toBe(fingerprint2);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should store all captured device information in device record", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.record({
            userAgent: fc.constantFrom(
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ),
            ipAddress: fc.ipV4(),
            location: fc.option(
              fc.record({
                country: fc.string({ minLength: 2, maxLength: 2 }),
                city: fc.string({ minLength: 1, maxLength: 100 }),
              }),
            ),
          }),
          async (userId, testData) => {
            const mockRequest = {
              headers: {
                "user-agent": testData.userAgent,
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br",
              },
              ip: testData.ipAddress,
            } as unknown as Request;

            const deviceInfo = deviceService.extractDeviceInfo(mockRequest);
            deviceInfo.location = testData.location || undefined;
            const fingerprint = deviceService.generateFingerprint(mockRequest);

            // Mock repository to return null (new device)
            jest.spyOn(deviceRepository, "findOne").mockResolvedValueOnce(null);

            // Property: All device information should be captured and stored
            const device = await deviceService.getOrCreateDevice(
              userId,
              fingerprint,
              deviceInfo,
            );

            // Property: All required fields should be present
            expect(device.userId).toBe(userId);
            expect(device.fingerprint).toBe(fingerprint);
            expect(device.browser).toBeDefined();
            expect(device.os).toBeDefined();
            expect(device.lastIpAddress).toBe(testData.ipAddress);

            // Property: Optional location should be stored if provided
            if (testData.location) {
              expect(device.lastLocation).toEqual(testData.location);
            }

            // Property: Timestamps should be set
            expect(device.firstSeenAt).toBeInstanceOf(Date);
            expect(device.lastSeenAt).toBeInstanceOf(Date);

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
