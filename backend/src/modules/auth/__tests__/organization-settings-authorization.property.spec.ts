/**
 * Property-Based Tests for Organization Settings Authorization
 *
 * Feature: frontend-backend-auth-integration
 * Property 49: Organization settings authorization
 * **Validates: Requirements 13.6, 13.7**
 *
 * Tests that for any attempt to modify organization settings, the system
 * should allow the operation only if the user is the organization creator.
 * Non-creator administrators should receive authorization errors.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus } from "@nestjs/cqrs";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ForbiddenException } from "@nestjs/common";
import {
  OrganizationService,
  OrganizationSettings,
} from "../services/organization.service";
import { EmailService } from "../services/email.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { IOrganizationRepository } from "../../iam/domain/repositories/IOrganizationRepository";
import { Organization } from "../../iam/domain/aggregates/Organization";
import { OrganizationId } from "../../iam/domain/value-objects/OrganizationId";
import { RegionId } from "../../iam/domain/value-objects/RegionId";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 49: Organization settings authorization", () => {
    let service: OrganizationService;
    let mockCommandBus: any;
    let mockUserRepository: any;
    let mockOrganizationRepository: any;
    let mockEmailService: any;

    beforeEach(async () => {
      mockCommandBus = {
        execute: jest.fn(),
      };

      mockUserRepository = {
        findOne: jest.fn(),
      };

      mockOrganizationRepository = {
        findById: jest.fn(),
        save: jest.fn(),
      };

      mockEmailService = {
        sendRegistrationConfirmation: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OrganizationService,
          {
            provide: CommandBus,
            useValue: mockCommandBus,
          },
          {
            provide: getRepositoryToken(UserEntity),
            useValue: mockUserRepository,
          },
          {
            provide: "IOrganizationRepository",
            useValue: mockOrganizationRepository,
          },
          {
            provide: EmailService,
            useValue: mockEmailService,
          },
        ],
      }).compile();

      service = module.get<OrganizationService>(OrganizationService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    /**
     * Property: Organization creator can modify settings
     *
     * For any organization and any user who is the organization creator,
     * the system should allow modification of organization settings.
     */
    it("should allow organization creator to modify settings", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // userId (creator)
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
            domain: fc.option(fc.domain()),
          }),
          async (organizationId, userId, settings) => {
            // Setup: User is organization creator
            mockUserRepository.findOne.mockResolvedValue({
              id: userId,
              organization_id: organizationId,
              isOrganizationCreator: true,
            });

            // Setup: Organization exists
            const mockOrganization = Organization.reconstitute(
              OrganizationId.create(organizationId),
              "Test Organization",
              "ORG123",
              "Test Description",
              null,
              true,
              RegionId.create("region-1"),
            );
            mockOrganizationRepository.findById.mockResolvedValue(
              mockOrganization,
            );
            mockCommandBus.execute.mockResolvedValue(undefined);

            // Property: Organization creator can modify settings without error
            await expect(
              service.updateOrganizationSettings(
                organizationId,
                userId,
                settings as OrganizationSettings,
              ),
            ).resolves.not.toThrow();

            // Verify authorization check was performed
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
              where: {
                id: userId,
                organization_id: organizationId,
              },
            });

            // Verify update command was executed
            expect(mockCommandBus.execute).toHaveBeenCalled();
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    /**
     * Property: Non-creator administrator cannot modify settings
     *
     * For any organization and any user who is an administrator but NOT
     * the organization creator, the system should reject the modification
     * attempt with a ForbiddenException.
     */
    it("should reject non-creator administrator from modifying settings", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // userId (non-creator admin)
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
            domain: fc.option(fc.domain()),
          }),
          async (organizationId, userId, settings) => {
            // Setup: User is administrator but NOT organization creator
            mockUserRepository.findOne.mockResolvedValue({
              id: userId,
              organization_id: organizationId,
              isOrganizationCreator: false, // Key: not the creator
              role: "administrator", // But is an administrator
            });

            // Property: Non-creator administrator should be rejected with ForbiddenException
            await expect(
              service.updateOrganizationSettings(
                organizationId,
                userId,
                settings as OrganizationSettings,
              ),
            ).rejects.toThrow(ForbiddenException);

            // Verify authorization check was performed
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
              where: {
                id: userId,
                organization_id: organizationId,
              },
            });

            // Verify update command was NOT executed
            expect(mockCommandBus.execute).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    /**
     * Property: User from different organization cannot modify settings
     *
     * For any organization and any user who belongs to a different organization,
     * the system should reject the modification attempt.
     */
    it("should reject user from different organization", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // userId
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
            domain: fc.option(fc.domain()),
          }),
          async (organizationId, userId, settings) => {
            // Setup: User belongs to a different organization (no match found)
            mockUserRepository.findOne.mockResolvedValue(null);

            // Property: User from different organization should be rejected
            await expect(
              service.updateOrganizationSettings(
                organizationId,
                userId,
                settings as OrganizationSettings,
              ),
            ).rejects.toThrow(ForbiddenException);

            // Verify authorization check was performed
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
              where: {
                id: userId,
                organization_id: organizationId,
              },
            });

            // Verify update command was NOT executed
            expect(mockCommandBus.execute).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    /**
     * Property: Authorization check precedes all other operations
     *
     * For any modification attempt, the system should check authorization
     * BEFORE attempting to fetch the organization or execute updates.
     */
    it("should check authorization before fetching organization", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // userId (non-creator)
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
            domain: fc.option(fc.domain()),
          }),
          async (organizationId, userId, settings) => {
            // Setup: User is not organization creator
            mockUserRepository.findOne.mockResolvedValue({
              id: userId,
              organization_id: organizationId,
              isOrganizationCreator: false,
            });

            // Property: Authorization check should happen first
            await expect(
              service.updateOrganizationSettings(
                organizationId,
                userId,
                settings as OrganizationSettings,
              ),
            ).rejects.toThrow(ForbiddenException);

            // Verify authorization check was performed
            expect(mockUserRepository.findOne).toHaveBeenCalled();

            // Verify organization was NOT fetched (authorization failed first)
            expect(mockOrganizationRepository.findById).not.toHaveBeenCalled();

            // Verify update command was NOT executed
            expect(mockCommandBus.execute).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    /**
     * Property: Error message is consistent for authorization failures
     *
     * For any authorization failure, the system should return a consistent
     * error message that clearly indicates the authorization requirement.
     */
    it("should return consistent error message for authorization failures", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // userId (non-creator)
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
            domain: fc.option(fc.domain()),
          }),
          async (organizationId, userId, settings) => {
            // Setup: User is not organization creator
            mockUserRepository.findOne.mockResolvedValue({
              id: userId,
              organization_id: organizationId,
              isOrganizationCreator: false,
            });

            // Property: Error message should be consistent
            try {
              await service.updateOrganizationSettings(
                organizationId,
                userId,
                settings as OrganizationSettings,
              );
              fail("Expected ForbiddenException to be thrown");
            } catch (error) {
              expect(error).toBeInstanceOf(ForbiddenException);
              expect(error.message).toBe(
                "Only the organization creator can modify organization settings",
              );
            }
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    /**
     * Property: Multiple administrators can exist, but only creator can modify settings
     *
     * For any organization with multiple administrators, only the one with
     * isOrganizationCreator=true should be able to modify settings.
     */
    it("should enforce creator-only modification even with multiple administrators", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // creatorUserId
          fc.array(fc.uuid({ version: 4 }), { minLength: 1, maxLength: 5 }), // otherAdminIds
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
            domain: fc.option(fc.domain()),
          }),
          async (organizationId, creatorUserId, otherAdminIds, settings) => {
            // Setup organization
            const mockOrganization = Organization.reconstitute(
              OrganizationId.create(organizationId),
              "Test Organization",
              "ORG123",
              "Test Description",
              null,
              true,
              RegionId.create("region-1"),
            );
            mockOrganizationRepository.findById.mockResolvedValue(
              mockOrganization,
            );
            mockCommandBus.execute.mockResolvedValue(undefined);

            // Property: Creator can modify settings
            mockUserRepository.findOne.mockResolvedValue({
              id: creatorUserId,
              organization_id: organizationId,
              isOrganizationCreator: true,
              role: "administrator",
            });

            await expect(
              service.updateOrganizationSettings(
                organizationId,
                creatorUserId,
                settings as OrganizationSettings,
              ),
            ).resolves.not.toThrow();

            // Property: Other administrators cannot modify settings
            for (const adminId of otherAdminIds) {
              if (adminId === creatorUserId) continue; // Skip creator

              mockUserRepository.findOne.mockResolvedValue({
                id: adminId,
                organization_id: organizationId,
                isOrganizationCreator: false,
                role: "administrator",
              });

              await expect(
                service.updateOrganizationSettings(
                  organizationId,
                  adminId,
                  settings as OrganizationSettings,
                ),
              ).rejects.toThrow(ForbiddenException);
            }
          },
        ),
        { numRuns: 30 },
      );
    }, 30000);
  });
});
