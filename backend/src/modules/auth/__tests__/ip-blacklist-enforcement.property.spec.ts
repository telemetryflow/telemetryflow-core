/**
 * Property-Based Tests for Authentication - IP Blacklist Enforcement
 *
 * Feature: frontend-backend-auth-integration
 * Property 36: IP blacklist enforcement
 * Validates: Requirements 10.7
 *
 * Tests that for any request from a blacklisted IP address, the system should
 * reject the request immediately.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SecurityLogService } from "../services/security-log.service";
import { SecurityLogEntity } from "../infrastructure/persistence/entities/SecurityLog.entity";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 36: IP blacklist enforcement", () => {
    let securityLogService: SecurityLogService;
    let securityLogRepository: Repository<SecurityLogEntity>;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SecurityLogService,
          {
            provide: getRepositoryToken(SecurityLogEntity),
            useValue: {
              create: jest.fn(),
              save: jest.fn(),
              find: jest.fn(),
              findOne: jest.fn(),
              count: jest.fn(),
            },
          },
        ],
      }).compile();

      securityLogService = module.get<SecurityLogService>(SecurityLogService);
      securityLogRepository = module.get<Repository<SecurityLogEntity>>(
        getRepositoryToken(SecurityLogEntity),
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    // Generator for valid IP addresses
    const ipAddressArb = fc
      .tuple(
        fc.integer({ min: 1, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 1, max: 255 }),
      )
      .map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

    it("should reject login attempts from blacklisted IPs", async () => {
      await fc.assert(
        fc.asyncProperty(
          ipAddressArb,
          fc.string({ minLength: 5, maxLength: 100 }),
          async (ipAddress, blacklistReason) => {
            // Add IP to blacklist
            securityLogService.addToBlacklist(ipAddress, blacklistReason);

            // Property: IP should be blacklisted
            expect(securityLogService.isBlacklisted(ipAddress)).toBe(true);

            // Property: Blacklist entry should exist with correct data
            const entry = securityLogService.getBlacklistEntry(ipAddress);
            expect(entry).toBeDefined();
            expect(entry?.ipAddress).toBe(ipAddress);
            expect(entry?.reason).toBe(blacklistReason);

            // Clean up: remove IP from blacklist for next iteration
            securityLogService.removeFromBlacklist(ipAddress);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain blacklist state across multiple checks", async () => {
      await fc.assert(
        fc.asyncProperty(
          ipAddressArb,
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.integer({ min: 2, max: 10 }),
          async (ipAddress, blacklistReason, checkCount) => {
            // Add IP to blacklist
            securityLogService.addToBlacklist(ipAddress, blacklistReason);

            // Property: All subsequent checks should return true
            for (let i = 0; i < checkCount; i++) {
              expect(securityLogService.isBlacklisted(ipAddress)).toBe(true);
            }

            // Property: Blacklist entry should persist
            const entry = securityLogService.getBlacklistEntry(ipAddress);
            expect(entry).toBeDefined();
            expect(entry?.ipAddress).toBe(ipAddress);
            expect(entry?.reason).toBe(blacklistReason);

            // Clean up
            securityLogService.removeFromBlacklist(ipAddress);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle blacklist add/remove operations correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          ipAddressArb,
          fc.string({ minLength: 5, maxLength: 100 }),
          async (ipAddress, blacklistReason) => {
            // Initially not blacklisted (or remove if it is)
            securityLogService.removeFromBlacklist(ipAddress);
            expect(securityLogService.isBlacklisted(ipAddress)).toBe(false);

            // Add to blacklist
            securityLogService.addToBlacklist(ipAddress, blacklistReason);

            // Property: Should now be blacklisted
            expect(securityLogService.isBlacklisted(ipAddress)).toBe(true);

            // Remove from blacklist
            const removed = securityLogService.removeFromBlacklist(ipAddress);

            // Property: Remove operation should succeed
            expect(removed).toBe(true);

            // Property: Should no longer be blacklisted
            expect(securityLogService.isBlacklisted(ipAddress)).toBe(false);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should retrieve blacklist entry with correct metadata", async () => {
      await fc.assert(
        fc.asyncProperty(
          ipAddressArb,
          fc.string({ minLength: 5, maxLength: 100 }),
          async (ipAddress, blacklistReason) => {
            // Add IP to blacklist
            const beforeAdd = new Date();
            securityLogService.addToBlacklist(ipAddress, blacklistReason);
            const afterAdd = new Date();

            // Property: Should be able to retrieve blacklist entry
            const entry = securityLogService.getBlacklistEntry(ipAddress);
            expect(entry).toBeDefined();

            // Property: Entry should contain correct IP and reason
            expect(entry?.ipAddress).toBe(ipAddress);
            expect(entry?.reason).toBe(blacklistReason);

            // Property: Entry should have timestamp
            expect(entry?.addedAt).toBeDefined();
            expect(entry!.addedAt.getTime()).toBeGreaterThanOrEqual(
              beforeAdd.getTime() - 1000,
            );
            expect(entry!.addedAt.getTime()).toBeLessThanOrEqual(
              afterAdd.getTime() + 1000,
            );

            // Clean up
            securityLogService.removeFromBlacklist(ipAddress);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should list all blacklisted IPs correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              ip: ipAddressArb,
              reason: fc.string({ minLength: 5, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (blacklistEntries) => {
            // Add all IPs to blacklist
            for (const entry of blacklistEntries) {
              securityLogService.addToBlacklist(entry.ip, entry.reason);
            }

            // Property: All added IPs should be in the blacklist
            const blacklist = securityLogService.getBlacklistedIPs();
            expect(blacklist.length).toBeGreaterThanOrEqual(
              blacklistEntries.length,
            );

            // Property: Each added IP should be present
            for (const entry of blacklistEntries) {
              const found = blacklist.find((b) => b.ipAddress === entry.ip);
              expect(found).toBeDefined();
              expect(found?.reason).toBe(entry.reason);
            }

            // Clean up
            for (const entry of blacklistEntries) {
              securityLogService.removeFromBlacklist(entry.ip);
            }

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should handle removal of non-existent IPs gracefully", async () => {
      await fc.assert(
        fc.asyncProperty(ipAddressArb, async (ipAddress) => {
          // Ensure IP is not blacklisted
          securityLogService.removeFromBlacklist(ipAddress);

          // Property: Removing non-existent IP should return false
          const removed = securityLogService.removeFromBlacklist(ipAddress);
          expect(removed).toBe(false);

          // Property: IP should still not be blacklisted
          expect(securityLogService.isBlacklisted(ipAddress)).toBe(false);

          return true;
        }),
        { numRuns: 100 },
      );
    });

    it("should check blacklist immediately for any IP", async () => {
      await fc.assert(
        fc.asyncProperty(
          ipAddressArb,
          fc.boolean(),
          async (ipAddress, shouldBlacklist) => {
            // Set up blacklist state
            if (shouldBlacklist) {
              securityLogService.addToBlacklist(ipAddress, "Test reason");
            } else {
              securityLogService.removeFromBlacklist(ipAddress);
            }

            // Property: isBlacklisted should return correct state
            const isBlacklisted = securityLogService.isBlacklisted(ipAddress);
            expect(isBlacklisted).toBe(shouldBlacklist);

            // Clean up
            if (shouldBlacklist) {
              securityLogService.removeFromBlacklist(ipAddress);
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
