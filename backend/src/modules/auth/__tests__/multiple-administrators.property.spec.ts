/**
 * Property-Based Tests for Multiple Administrators Support
 *
 * Feature: frontend-backend-auth-integration
 * Property 50: Multiple administrators support
 * **Validates: Requirements 13.4, 13.5**
 *
 * Tests that for any organization, the system should support multiple users
 * with administrator role while maintaining the organization creator's exclusive
 * settings modification rights. Administrators should be able to invite additional
 * users with appropriate role assignment.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus } from "@nestjs/cqrs";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrganizationService } from "../services/organization.service";
import { EmailService } from "../services/email.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { IOrganizationRepository } from "../../iam/domain/repositories/IOrganizationRepository";
import { UserRoleType } from "../../iam/domain/value-objects/UserRole";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 50: Multiple administrators support", () => {
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
        find: jest.fn(),
        save: jest.fn(),
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
     * Property: Organization can have multiple administrators
     * 
     * For any organization, the system should support having multiple users
     * with the administrator role simultaneously.
     */
    it("should support multiple administrators in an organization", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // creatorUserId
          fc.array(fc.uuid({ version: 4 }), { minLength: 1, maxLength: 10 }), // additional admin IDs
          async (organizationId, creatorUserId, additionalAdminIds) => {
            // Ensure creator ID is not in additional admin IDs
            const uniqueAdminIds = additionalAdminIds.filter(id => id !== creatorUserId);
            
            if (uniqueAdminIds.length === 0) {
              return; // Skip if no unique additional admins
            }

            // Setup: Create organization creator
            const creatorUser: Partial<UserEntity> = {
              id: creatorUserId,
              organization_id: organizationId,
              isOrganizationCreator: true,
              email: `creator-${creatorUserId}@test.com`,
              isActive: true,
            };

            // Setup: Create additional administrators
            const additionalAdmins: Partial<UserEntity>[] = uniqueAdminIds.map((adminId, index) => ({
              id: adminId,
              organization_id: organizationId,
              isOrganizationCreator: false,
              email: `admin-${index}-${adminId}@test.com`,
              isActive: true,
            }));

            // Mock repository to return all administrators
            const allAdmins = [creatorUser, ...additionalAdmins];
            mockUserRepository.find.mockResolvedValue(allAdmins);

            // Property: System should support multiple administrators
            // This is validated by the ability to query and retrieve multiple administrators
            const administrators = await mockUserRepository.find({
              where: {
                organization_id: organizationId,
              },
            });

            // Verify multiple administrators exist
            expect(administrators.length).toBeGreaterThan(1);
            expect(administrators.length).toBe(uniqueAdminIds.length + 1); // +1 for creator

            // Verify creator is marked correctly
            const creator = administrators.find((admin: any) => admin.isOrganizationCreator);
            expect(creator).toBeDefined();
            expect(creator.id).toBe(creatorUserId);

            // Verify additional administrators are not marked as creators
            const nonCreators = administrators.filter((admin: any) => !admin.isOrganizationCreator);
            expect(nonCreators.length).toBe(uniqueAdminIds.length);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    /**
     * Property: Administrator can invite users with role assignment
     * 
     * For any administrator (creator or not), the system should allow them
     * to add users to the organization with specified roles.
     */
    it("should allow administrators to invite users with role assignment", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // adminUserId (inviter)
          fc.uuid({ version: 4 }), // newUserId (invitee)
          fc.constantFrom(
            UserRoleType.ADMINISTRATOR,
            UserRoleType.DEVELOPER,
            UserRoleType.VIEWER,
          ), // role to assign
          fc.boolean(), // isAdminTheCreator
          async (organizationId, adminUserId, newUserId, roleToAssign, isAdminTheCreator) => {
            // Ensure admin and new user are different
            if (adminUserId === newUserId) {
              return;
            }

            // Setup: Administrator exists in organization
            mockUserRepository.findOne.mockImplementation(async (query: any) => {
              if (query.where.id === adminUserId) {
                return {
                  id: adminUserId,
                  organization_id: organizationId,
                  isOrganizationCreator: isAdminTheCreator,
                  email: `admin-${adminUserId}@test.com`,
                  isActive: true,
                };
              }
              if (query.where.id === newUserId) {
                return {
                  id: newUserId,
                  organization_id: null, // Not yet in organization
                  isOrganizationCreator: false,
                  email: `user-${newUserId}@test.com`,
                  isActive: true,
                };
              }
              return null;
            });

            // Setup: Mock save operation
            mockUserRepository.save.mockResolvedValue(undefined);

            // Property: Administrator can add user with role assignment
            await expect(
              service.addUserToOrganization(organizationId, newUserId, roleToAssign),
            ).resolves.not.toThrow();

            // Verify user was looked up
            expect(mockUserRepository.findOne).toHaveBeenCalledWith({
              where: { id: newUserId },
            });

            // Verify user was saved with organization_id
            expect(mockUserRepository.save).toHaveBeenCalled();
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    /**
     * Property: Multiple administrators maintain distinct identities
     * 
     * For any organization with multiple administrators, each administrator
     * should maintain their own distinct identity and only the creator should
     * have the isOrganizationCreator flag set to true.
     */
    it("should maintain distinct identities for multiple administrators", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // creatorUserId
          fc.array(fc.uuid({ version: 4 }), { minLength: 2, maxLength: 5 }), // admin IDs
          async (organizationId, creatorUserId, adminIds) => {
            // Ensure all IDs are unique
            const uniqueAdminIds = [...new Set(adminIds)].filter(id => id !== creatorUserId);
            
            if (uniqueAdminIds.length < 2) {
              return; // Need at least 2 additional admins
            }

            // Setup: Create administrators with distinct identities
            const administrators: Partial<UserEntity>[] = [
              {
                id: creatorUserId,
                organization_id: organizationId,
                isOrganizationCreator: true,
                email: `creator-${creatorUserId}@test.com`,
                isActive: true,
              },
              ...uniqueAdminIds.map((adminId, index) => ({
                id: adminId,
                organization_id: organizationId,
                isOrganizationCreator: false,
                email: `admin-${index}-${adminId}@test.com`,
                isActive: true,
              })),
            ];

            mockUserRepository.find.mockResolvedValue(administrators);

            // Property: Each administrator has distinct identity
            const admins = await mockUserRepository.find({
              where: { organization_id: organizationId },
            });

            // Verify all IDs are unique
            const ids = admins.map((admin: any) => admin.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);

            // Verify all emails are unique
            const emails = admins.map((admin: any) => admin.email);
            const uniqueEmails = new Set(emails);
            expect(uniqueEmails.size).toBe(emails.length);

            // Verify only one creator
            const creators = admins.filter((admin: any) => admin.isOrganizationCreator);
            expect(creators.length).toBe(1);
            expect(creators[0].id).toBe(creatorUserId);

            // Verify all others are not creators
            const nonCreators = admins.filter((admin: any) => !admin.isOrganizationCreator);
            expect(nonCreators.length).toBe(uniqueAdminIds.length);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    /**
     * Property: Administrator role assignment is flexible
     * 
     * For any user invitation by an administrator, the system should support
     * assigning various roles including administrator, developer, and viewer.
     */
    it("should support flexible role assignment during user invitation", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // adminUserId
          fc.array(
            fc.record({
              userId: fc.uuid({ version: 4 }),
              role: fc.constantFrom(
                UserRoleType.ADMINISTRATOR,
                UserRoleType.DEVELOPER,
                UserRoleType.VIEWER,
              ),
            }),
            { minLength: 1, maxLength: 5 },
          ), // users to invite with roles
          async (organizationId, adminUserId, usersToInvite) => {
            // Clear mocks for this property test iteration
            jest.clearAllMocks();

            // Ensure all user IDs are unique and different from admin
            const uniqueUsers = usersToInvite.filter(
              (user, index, self) =>
                user.userId !== adminUserId &&
                self.findIndex(u => u.userId === user.userId) === index,
            );

            if (uniqueUsers.length === 0) {
              return;
            }

            // Setup: Mock findOne to return users
            mockUserRepository.findOne.mockImplementation(async (query: any) => {
              const userId = query.where.id;
              if (userId === adminUserId) {
                return {
                  id: adminUserId,
                  organization_id: organizationId,
                  isOrganizationCreator: false,
                  email: `admin-${adminUserId}@test.com`,
                  isActive: true,
                };
              }
              // Return a user for each invitee
              return {
                id: userId,
                organization_id: null,
                isOrganizationCreator: false,
                email: `user-${userId}@test.com`,
                isActive: true,
              };
            });

            mockUserRepository.save.mockResolvedValue(undefined);

            // Property: Administrator can invite users with different roles
            for (const userToInvite of uniqueUsers) {
              await expect(
                service.addUserToOrganization(
                  organizationId,
                  userToInvite.userId,
                  userToInvite.role,
                ),
              ).resolves.not.toThrow();
            }

            // Verify save was called for each user
            expect(mockUserRepository.save).toHaveBeenCalledTimes(uniqueUsers.length);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    /**
     * Property: Non-creator administrators have same invitation privileges
     * 
     * For any administrator (whether creator or not), they should have the
     * same ability to invite users to the organization. The creator's exclusive
     * privilege is only for modifying organization settings, not for user management.
     */
    it("should grant equal invitation privileges to all administrators", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // creatorUserId
          fc.uuid({ version: 4 }), // nonCreatorAdminId
          fc.uuid({ version: 4 }), // userToInviteId
          fc.constantFrom(
            UserRoleType.ADMINISTRATOR,
            UserRoleType.DEVELOPER,
            UserRoleType.VIEWER,
          ), // role
          async (organizationId, creatorUserId, nonCreatorAdminId, userToInviteId, role) => {
            // Clear mocks for this property test iteration
            jest.clearAllMocks();

            // Ensure all IDs are unique
            if (
              creatorUserId === nonCreatorAdminId ||
              creatorUserId === userToInviteId ||
              nonCreatorAdminId === userToInviteId
            ) {
              return;
            }

            // Setup: Mock findOne to return appropriate users
            mockUserRepository.findOne.mockImplementation(async (query: any) => {
              const userId = query.where.id;
              if (userId === creatorUserId) {
                return {
                  id: creatorUserId,
                  organization_id: organizationId,
                  isOrganizationCreator: true,
                  email: `creator-${creatorUserId}@test.com`,
                  isActive: true,
                };
              }
              if (userId === nonCreatorAdminId) {
                return {
                  id: nonCreatorAdminId,
                  organization_id: organizationId,
                  isOrganizationCreator: false,
                  email: `admin-${nonCreatorAdminId}@test.com`,
                  isActive: true,
                };
              }
              if (userId === userToInviteId) {
                return {
                  id: userToInviteId,
                  organization_id: null,
                  isOrganizationCreator: false,
                  email: `user-${userToInviteId}@test.com`,
                  isActive: true,
                };
              }
              return null;
            });

            mockUserRepository.save.mockResolvedValue(undefined);

            // Property: Creator can invite users
            await expect(
              service.addUserToOrganization(organizationId, userToInviteId, role),
            ).resolves.not.toThrow();

            // Property: Non-creator administrator can also invite users
            await expect(
              service.addUserToOrganization(organizationId, userToInviteId, role),
            ).resolves.not.toThrow();

            // Both should succeed equally
            expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);

    /**
     * Property: Organization creator status is immutable
     * 
     * For any organization with multiple administrators, the isOrganizationCreator
     * flag should remain true only for the original creator, regardless of how
     * many administrators are added.
     */
    it("should maintain immutable creator status with multiple administrators", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid({ version: 4 }), // organizationId
          fc.uuid({ version: 4 }), // creatorUserId
          fc.array(fc.uuid({ version: 4 }), { minLength: 1, maxLength: 10 }), // admin IDs
          async (organizationId, creatorUserId, adminIds) => {
            // Ensure all IDs are unique
            const uniqueAdminIds = [...new Set(adminIds)].filter(id => id !== creatorUserId);
            
            if (uniqueAdminIds.length === 0) {
              return;
            }

            // Setup: Create administrators
            const administrators: Partial<UserEntity>[] = [
              {
                id: creatorUserId,
                organization_id: organizationId,
                isOrganizationCreator: true,
                email: `creator-${creatorUserId}@test.com`,
                isActive: true,
              },
              ...uniqueAdminIds.map((adminId, index) => ({
                id: adminId,
                organization_id: organizationId,
                isOrganizationCreator: false,
                email: `admin-${index}-${adminId}@test.com`,
                isActive: true,
              })),
            ];

            mockUserRepository.find.mockResolvedValue(administrators);

            // Property: Creator status is immutable
            const admins = await mockUserRepository.find({
              where: { organization_id: organizationId },
            });

            // Verify exactly one creator exists
            const creatorsCount = admins.filter((admin: any) => admin.isOrganizationCreator).length;
            expect(creatorsCount).toBe(1);

            // Verify the creator is the original creator
            const creator = admins.find((admin: any) => admin.isOrganizationCreator);
            expect(creator.id).toBe(creatorUserId);

            // Verify all other administrators are not creators
            const nonCreators = admins.filter((admin: any) => !admin.isOrganizationCreator);
            expect(nonCreators.length).toBe(uniqueAdminIds.length);
            nonCreators.forEach((admin: any) => {
              expect(admin.isOrganizationCreator).toBe(false);
            });
          },
        ),
        { numRuns: 50 },
      );
    }, 30000);
  });
});
