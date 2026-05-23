/**
 * Property-Based Tests for Authentication - Deactivation Session Invalidation
 *
 * Feature: frontend-backend-auth-integration
 * Property 55: Deactivation session invalidation
 * Validates: Requirement 14.4
 *
 * Tests that for any administrator account deactivation, all active sessions
 * for that administrator should be invalidated immediately.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminManagementService } from "../services/admin-management.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { UserRoleType } from "../../iam/domain/value-objects/UserRole";
import { SessionService } from "../services/session.service";
import { EmailService } from "../services/email.service";
import { SecurityLogService } from "../services/security-log.service";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 55: Deactivation session invalidation", () => {
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

    it("should invalidate all active sessions when an administrator is deactivated", async () => {
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

            // Property: All sessions for the administrator should be invalidated
            expect(sessionService.revokeUserSessions).toHaveBeenCalledTimes(1);
            expect(sessionService.revokeUserSessions).toHaveBeenCalledWith(
              adminUserId,
              undefined, // No session should be excluded
              expect.stringContaining(ticketRef),
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should invalidate sessions immediately during deactivation process", async () => {
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

            // Track the order of operations
            const operationOrder: string[] = [];

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

            // Mock: Save tracks operation order
            (userRepository.save as jest.Mock).mockImplementation(async (user) => {
              operationOrder.push("save");
              return { ...user, isActive: false };
            });

            // Mock: Session revocation tracks operation order
            (sessionService.revokeUserSessions as jest.Mock).mockImplementation(
              async () => {
                operationOrder.push("revokeUserSessions");
              },
            );

            // Mock: Email notification tracks operation order
            (emailService.sendAdministratorDeactivationNotification as jest.Mock).mockImplementation(
              async () => {
                operationOrder.push("sendEmail");
              },
            );

            // Mock: Security log tracks operation order
            (securityLogService.logAdministratorDeactivation as jest.Mock).mockImplementation(
              async () => {
                operationOrder.push("logDeactivation");
              },
            );

            // Execute deactivation
            await service.deactivateAdministrator(
              adminUserId,
              superAdminId,
              ticketRef,
            );

            // Property: Session revocation should occur after user save
            const saveIndex = operationOrder.indexOf("save");
            const revokeIndex = operationOrder.indexOf("revokeUserSessions");

            expect(saveIndex).toBeGreaterThanOrEqual(0);
            expect(revokeIndex).toBeGreaterThanOrEqual(0);
            expect(revokeIndex).toBeGreaterThan(saveIndex);

            // Property: Session revocation should be called
            expect(sessionService.revokeUserSessions).toHaveBeenCalledWith(
              adminUserId,
              undefined,
              expect.stringContaining(ticketRef),
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should include ticket reference in session revocation reason", async () => {
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

            // Property: Session revocation reason should include ticket reference
            const callArgs = (sessionService.revokeUserSessions as jest.Mock).mock.calls[0];
            const reason = callArgs[2];
            
            // Property: Reason should indicate it's an administrator deactivation
            expect(reason).toContain("Administrator deactivated");
            expect(reason).toContain("Super Admin");
            expect(reason).toContain(ticketRef);
            
            // Property: All parameters should be correct
            expect(sessionService.revokeUserSessions).toHaveBeenCalledWith(
              adminUserId,
              undefined,
              expect.stringContaining(ticketRef),
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should not exclude any sessions from revocation during deactivation", async () => {
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

            // Property: No session should be excluded from revocation
            // The second parameter (exceptSessionId) should be undefined
            const callArgs = (sessionService.revokeUserSessions as jest.Mock).mock.calls[0];
            const exceptSessionId = callArgs[1];
            expect(exceptSessionId).toBeUndefined();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should revoke sessions for the correct administrator user", async () => {
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

            // Property: Sessions should be revoked for the correct user ID
            const callArgs = (sessionService.revokeUserSessions as jest.Mock).mock.calls[0];
            const targetUserId = callArgs[0];
            expect(targetUserId).toBe(adminUserId);

            // Property: Sessions should NOT be revoked for the Super Admin
            expect(targetUserId).not.toBe(superAdminId);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
