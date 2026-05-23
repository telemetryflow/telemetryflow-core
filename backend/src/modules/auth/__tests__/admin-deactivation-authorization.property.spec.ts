/**
 * Property-Based Tests for Authentication - Administrator Deactivation Authorization
 *
 * Feature: frontend-backend-auth-integration
 * Property 54: Administrator deactivation authorization
 * Validates: Requirements 14.1, 14.3
 *
 * Tests that for any administrator deactivation request, the system should require
 * Super Administrator privileges and reject requests from non-Super Administrator users.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ForbiddenException, NotFoundException, BadRequestException } from "@nestjs/common";
import { AdminManagementService } from "../services/admin-management.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { UserRoleType } from "../../iam/domain/value-objects/UserRole";
import { SessionService } from "../services/session.service";
import { EmailService } from "../services/email.service";
import { SecurityLogService } from "../services/security-log.service";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 54: Administrator deactivation authorization", () => {
    let service: AdminManagementService;
    let userRepository: Repository<UserEntity>;
    let sessionService: SessionService;
    let emailService: EmailService;
    let securityLogService: SecurityLogService;

    beforeEach(async () => {
      const mockUserRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
        query: jest.fn(),
      };

      const mockSessionService = {
        revokeUserSessions: jest.fn().mockResolvedValue(undefined),
      };

      const mockEmailService = {
        sendAdministratorDeactivationNotification: jest.fn().mockResolvedValue(undefined),
      };

      const mockSecurityLogService = {
        logAdministratorDeactivation: jest.fn().mockResolvedValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AdminManagementService,
          {
            provide: getRepositoryToken(UserEntity),
            useValue: mockUserRepository,
          },
          {
            provide: SessionService,
            useValue: mockSessionService,
          },
          {
            provide: EmailService,
            useValue: mockEmailService,
          },
          {
            provide: SecurityLogService,
            useValue: mockSecurityLogService,
          },
        ],
      }).compile();

      service = module.get<AdminManagementService>(AdminManagementService);
      userRepository = module.get<Repository<UserEntity>>(
        getRepositoryToken(UserEntity),
      );
      sessionService = module.get<SessionService>(SessionService);
      emailService = module.get<EmailService>(EmailService);
      securityLogService = module.get<SecurityLogService>(SecurityLogService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    // Generator for ticket references
    const ticketRefArb = fc.oneof(
      fc.string({ minLength: 5, maxLength: 20 }).map(s => `TICKET-${s}`),
      fc.integer({ min: 1000, max: 9999 }).map(n => `ADMIN-DEACT-${n}`),
      fc.uuid().map(id => `REQ-${id.substring(0, 8)}`),
    );

    it("should allow Super Administrators to deactivate administrator accounts", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // superAdminId
          fc.uuid(), // adminUserId
          ticketRefArb,
          async (superAdminId, adminUserId, ticketRef) => {
            // Ensure IDs are different
            fc.pre(superAdminId !== adminUserId);

            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Setup mock to return different values for different calls
            const queryMock = userRepository.query as jest.Mock;
            queryMock.mockImplementation((sql: string, params: any[]) => {
              // First call: check if requesting user is Super Admin
              if (params[0] === superAdminId) {
                return Promise.resolve([{ name: "Super Administrator" }]);
              }
              // Second call: check target user's role
              if (params[0] === adminUserId) {
                return Promise.resolve([{ name: "Administrator" }]);
              }
              return Promise.resolve([]);
            });

            // Mock: Administrator user exists
            const adminUser: Partial<UserEntity> = {
              id: adminUserId,
              email: "admin@example.com",
              isActive: true,
              organization_id: "org-123",
              isOrganizationCreator: false,
              updatedAt: new Date(),
            };

            (userRepository.findOne as jest.Mock).mockResolvedValue(adminUser);

            // Mock: Save returns the updated user
            (userRepository.save as jest.Mock).mockResolvedValue({
              ...adminUser,
              isActive: false,
            });

            // Execute deactivation
            await service.deactivateAdministrator(
              adminUserId,
              superAdminId,
              ticketRef,
            );

            // Property: Super Admin authorization should be checked
            expect(userRepository.query).toHaveBeenCalledWith(
              expect.stringContaining("user_roles"),
              [superAdminId],
            );

            // Property: Administrator user should be found
            expect(userRepository.findOne).toHaveBeenCalledWith({
              where: { id: adminUserId },
            });

            // Property: User should be deactivated (isActive set to false)
            expect(userRepository.save).toHaveBeenCalledWith(
              expect.objectContaining({
                isActive: false,
              }),
            );

            // Property: Sessions should be revoked
            expect(sessionService.revokeUserSessions).toHaveBeenCalledWith(
              adminUserId,
              undefined,
              expect.stringContaining(ticketRef),
            );

            // Property: Notification email should be sent
            expect(emailService.sendAdministratorDeactivationNotification).toHaveBeenCalledWith(
              adminUser.email,
            );

            // Property: Audit log should be created
            expect(securityLogService.logAdministratorDeactivation).toHaveBeenCalledWith(
              adminUserId,
              superAdminId,
              ticketRef,
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject deactivation requests from non-Super Administrator users", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // regularUserId (not Super Admin)
          fc.uuid(), // adminUserId
          ticketRefArb,
          fc.constantFrom(
            UserRoleType.ADMINISTRATOR,
            UserRoleType.DEVELOPER,
            UserRoleType.VIEWER,
            null, // No role assigned
          ),
          async (regularUserId, adminUserId, ticketRef, userRole) => {
            // Ensure IDs are different
            fc.pre(regularUserId !== adminUserId);

            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Mock: User role check returns non-Super Admin role
            if (userRole === null) {
              (userRepository.query as jest.Mock).mockResolvedValue([]);
            } else {
              const roleNameMap = {
                [UserRoleType.ADMINISTRATOR]: "Administrator",
                [UserRoleType.DEVELOPER]: "Developer",
                [UserRoleType.VIEWER]: "Viewer",
              };
              (userRepository.query as jest.Mock).mockResolvedValue([
                { name: roleNameMap[userRole] },
              ]);
            }

            // Property: Deactivation should be rejected with ForbiddenException
            await expect(
              service.deactivateAdministrator(
                adminUserId,
                regularUserId,
                ticketRef,
              ),
            ).rejects.toThrow(ForbiddenException);

            await expect(
              service.deactivateAdministrator(
                adminUserId,
                regularUserId,
                ticketRef,
              ),
            ).rejects.toThrow(
              "Only Super Administrators can deactivate administrator accounts",
            );

            // Property: Authorization check should be performed
            expect(userRepository.query).toHaveBeenCalledWith(
              expect.stringContaining("user_roles"),
              [regularUserId],
            );

            // Property: No further operations should be performed
            expect(userRepository.findOne).not.toHaveBeenCalled();
            expect(userRepository.save).not.toHaveBeenCalled();
            expect(sessionService.revokeUserSessions).not.toHaveBeenCalled();
            expect(emailService.sendAdministratorDeactivationNotification).not.toHaveBeenCalled();
            expect(securityLogService.logAdministratorDeactivation).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject deactivation when target user is not found", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // superAdminId
          fc.uuid(), // nonExistentUserId
          ticketRefArb,
          async (superAdminId, nonExistentUserId, ticketRef) => {
            // Ensure IDs are different
            fc.pre(superAdminId !== nonExistentUserId);

            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Mock: Super Admin role check returns true
            (userRepository.query as jest.Mock).mockResolvedValue([
              { name: "Super Administrator" },
            ]);

            // Mock: User not found
            (userRepository.findOne as jest.Mock).mockResolvedValue(null);

            // Property: Should throw NotFoundException
            await expect(
              service.deactivateAdministrator(
                nonExistentUserId,
                superAdminId,
                ticketRef,
              ),
            ).rejects.toThrow(NotFoundException);

            await expect(
              service.deactivateAdministrator(
                nonExistentUserId,
                superAdminId,
                ticketRef,
              ),
            ).rejects.toThrow("Administrator user not found");

            // Property: Authorization should be checked first
            expect(userRepository.query).toHaveBeenCalledWith(
              expect.stringContaining("user_roles"),
              [superAdminId],
            );

            // Property: User lookup should be attempted
            expect(userRepository.findOne).toHaveBeenCalledWith({
              where: { id: nonExistentUserId },
            });

            // Property: No deactivation operations should be performed
            expect(userRepository.save).not.toHaveBeenCalled();
            expect(sessionService.revokeUserSessions).not.toHaveBeenCalled();
            expect(emailService.sendAdministratorDeactivationNotification).not.toHaveBeenCalled();
            expect(securityLogService.logAdministratorDeactivation).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject deactivation when target user is not an administrator", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // superAdminId
          fc.uuid(), // regularUserId
          ticketRefArb,
          fc.constantFrom(
            UserRoleType.DEVELOPER,
            UserRoleType.VIEWER,
            null, // No role
          ),
          async (superAdminId, regularUserId, ticketRef, userRole) => {
            // Ensure IDs are different
            fc.pre(superAdminId !== regularUserId);

            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Setup mock to return different values for different calls
            const queryMock = userRepository.query as jest.Mock;
            queryMock.mockImplementation((sql: string, params: any[]) => {
              // First call: check if requesting user is Super Admin
              if (params[0] === superAdminId) {
                return Promise.resolve([{ name: "Super Administrator" }]);
              }
              // Second call: check target user's role
              if (params[0] === regularUserId) {
                if (userRole === null) {
                  return Promise.resolve([]);
                }
                const roleNameMap = {
                  [UserRoleType.DEVELOPER]: "Developer",
                  [UserRoleType.VIEWER]: "Viewer",
                };
                return Promise.resolve([{ name: roleNameMap[userRole] }]);
              }
              return Promise.resolve([]);
            });

            // Mock: Regular user exists
            const regularUser: Partial<UserEntity> = {
              id: regularUserId,
              email: "user@example.com",
              isActive: true,
              organization_id: "org-123",
              isOrganizationCreator: false,
              updatedAt: new Date(),
            };

            (userRepository.findOne as jest.Mock).mockResolvedValue(regularUser);

            // Property: Should throw BadRequestException
            await expect(
              service.deactivateAdministrator(
                regularUserId,
                superAdminId,
                ticketRef,
              ),
            ).rejects.toThrow(BadRequestException);

            await expect(
              service.deactivateAdministrator(
                regularUserId,
                superAdminId,
                ticketRef,
              ),
            ).rejects.toThrow(
              "User is not an administrator and cannot be deactivated through this endpoint",
            );

            // Property: Authorization and user lookup should be performed
            expect(userRepository.query).toHaveBeenCalled();
            expect(userRepository.findOne).toHaveBeenCalled();

            // Property: No deactivation operations should be performed
            expect(userRepository.save).not.toHaveBeenCalled();
            expect(sessionService.revokeUserSessions).not.toHaveBeenCalled();
            expect(emailService.sendAdministratorDeactivationNotification).not.toHaveBeenCalled();
            expect(securityLogService.logAdministratorDeactivation).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should prevent Super Administrators from deactivating other Super Administrators", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // superAdminId1
          fc.uuid(), // superAdminId2
          ticketRefArb,
          async (superAdminId1, superAdminId2, ticketRef) => {
            // Ensure IDs are different
            fc.pre(superAdminId1 !== superAdminId2);

            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Setup mock to return different values for different calls
            const queryMock = userRepository.query as jest.Mock;
            queryMock.mockImplementation((sql: string, params: any[]) => {
              // Both users are Super Administrators
              return Promise.resolve([{ name: "Super Administrator" }]);
            });

            // Mock: Target Super Admin exists
            const targetSuperAdmin: Partial<UserEntity> = {
              id: superAdminId2,
              email: "superadmin2@example.com",
              isActive: true,
              organization_id: "org-123",
              isOrganizationCreator: false,
              updatedAt: new Date(),
            };

            (userRepository.findOne as jest.Mock).mockResolvedValue(targetSuperAdmin);

            // Property: Should throw ForbiddenException
            await expect(
              service.deactivateAdministrator(
                superAdminId2,
                superAdminId1,
                ticketRef,
              ),
            ).rejects.toThrow(ForbiddenException);

            await expect(
              service.deactivateAdministrator(
                superAdminId2,
                superAdminId1,
                ticketRef,
              ),
            ).rejects.toThrow(
              "Super Administrators cannot be deactivated through this endpoint",
            );

            // Property: Authorization and user lookup should be performed
            expect(userRepository.query).toHaveBeenCalled();
            expect(userRepository.findOne).toHaveBeenCalled();

            // Property: No deactivation operations should be performed
            expect(userRepository.save).not.toHaveBeenCalled();
            expect(sessionService.revokeUserSessions).not.toHaveBeenCalled();
            expect(emailService.sendAdministratorDeactivationNotification).not.toHaveBeenCalled();
            expect(securityLogService.logAdministratorDeactivation).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should enforce authorization check before any other operations", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // unauthorizedUserId
          fc.uuid(), // adminUserId
          ticketRefArb,
          async (unauthorizedUserId, adminUserId, ticketRef) => {
            // Ensure IDs are different
            fc.pre(unauthorizedUserId !== adminUserId);

            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Mock: User is not a Super Admin
            (userRepository.query as jest.Mock).mockResolvedValue([
              { name: "Administrator" },
            ]);

            // Property: Should fail authorization before checking if target user exists
            await expect(
              service.deactivateAdministrator(
                adminUserId,
                unauthorizedUserId,
                ticketRef,
              ),
            ).rejects.toThrow(ForbiddenException);

            // Property: Only authorization check should be performed
            expect(userRepository.query).toHaveBeenCalledTimes(1);
            expect(userRepository.query).toHaveBeenCalledWith(
              expect.stringContaining("user_roles"),
              [unauthorizedUserId],
            );

            // Property: No other operations should be attempted
            expect(userRepository.findOne).not.toHaveBeenCalled();
            expect(userRepository.save).not.toHaveBeenCalled();
            expect(sessionService.revokeUserSessions).not.toHaveBeenCalled();
            expect(emailService.sendAdministratorDeactivationNotification).not.toHaveBeenCalled();
            expect(securityLogService.logAdministratorDeactivation).not.toHaveBeenCalled();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
