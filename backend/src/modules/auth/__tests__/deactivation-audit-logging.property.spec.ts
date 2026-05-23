/**
 * Property-Based Tests for Authentication - Deactivation Audit Logging
 *
 * Feature: frontend-backend-auth-integration
 * Property 58: Deactivation audit logging
 * Validates: Requirement 14.7
 *
 * Tests that for any administrator deactivation, a security log entry should be
 * created containing the Super Administrator's identity and ticket reference.
 */

import fc from "fast-check";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminManagementService } from "../services/admin-management.service";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { SessionService } from "../services/session.service";
import { EmailService } from "../services/email.service";
import { SecurityLogService } from "../services/security-log.service";

describe("Feature: frontend-backend-auth-integration", () => {
  describe("Property 58: Deactivation audit logging", () => {
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

    it("should create audit log entry with Super Administrator identity and ticket reference", async () => {
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

            // Property: Audit log should be created with all required information
            expect(securityLogService.logAdministratorDeactivation).toHaveBeenCalledTimes(1);
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

    it("should create audit log with correct Super Administrator ID", async () => {
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
              if (params[0] === superAdminId) {
                return Promise.resolve([{ name: "Super Administrator" }]);
              }
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

            // Property: Audit log should contain the exact Super Administrator ID
            const logCalls = (securityLogService.logAdministratorDeactivation as jest.Mock).mock.calls;
            expect(logCalls.length).toBe(1);
            expect(logCalls[0][1]).toBe(superAdminId);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should create audit log with correct administrator user ID", async () => {
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
              if (params[0] === superAdminId) {
                return Promise.resolve([{ name: "Super Administrator" }]);
              }
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

            // Property: Audit log should contain the exact administrator user ID
            const logCalls = (securityLogService.logAdministratorDeactivation as jest.Mock).mock.calls;
            expect(logCalls.length).toBe(1);
            expect(logCalls[0][0]).toBe(adminUserId);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should create audit log with correct ticket reference", async () => {
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
              if (params[0] === superAdminId) {
                return Promise.resolve([{ name: "Super Administrator" }]);
              }
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

            // Property: Audit log should contain the exact ticket reference
            const logCalls = (securityLogService.logAdministratorDeactivation as jest.Mock).mock.calls;
            expect(logCalls.length).toBe(1);
            expect(logCalls[0][2]).toBe(ticketRef);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should create audit log after deactivation is saved", async () => {
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

            // Track operation order
            const operationOrder: string[] = [];

            // Setup mock to return different values for different calls
            const queryMock = userRepository.query as jest.Mock;
            queryMock.mockImplementation((sql: string, params: any[]) => {
              if (params[0] === superAdminId) {
                return Promise.resolve([{ name: "Super Administrator" }]);
              }
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
                operationOrder.push("revokeSession");
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

            // Property: Audit log should be created after save operation
            const saveIndex = operationOrder.indexOf("save");
            const logIndex = operationOrder.indexOf("logDeactivation");

            expect(saveIndex).toBeGreaterThanOrEqual(0);
            expect(logIndex).toBeGreaterThanOrEqual(0);
            expect(logIndex).toBeGreaterThan(saveIndex);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should create audit log for any valid ticket reference format", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // superAdminId
          fc.uuid(), // adminUserId
          fc.oneof(
            // Various ticket reference formats
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.integer({ min: 1, max: 999999 }).map(n => `${n}`),
            fc.uuid(),
            fc.string({ minLength: 5, maxLength: 20 }).map(s => `TICKET-${s}`),
            fc.string({ minLength: 5, maxLength: 20 }).map(s => `REQ-${s}`),
            fc.string({ minLength: 5, maxLength: 20 }).map(s => `ADMIN-${s}`),
          ),
          async (superAdminId, adminUserId, ticketRef) => {
            // Ensure IDs are different
            fc.pre(superAdminId !== adminUserId);

            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Setup mock to return different values for different calls
            const queryMock = userRepository.query as jest.Mock;
            queryMock.mockImplementation((sql: string, params: any[]) => {
              if (params[0] === superAdminId) {
                return Promise.resolve([{ name: "Super Administrator" }]);
              }
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

            // Property: Audit log should be created with any valid ticket reference format
            expect(securityLogService.logAdministratorDeactivation).toHaveBeenCalledTimes(1);
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

    it("should always create audit log for successful deactivations", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // superAdminId
          fc.uuid(), // adminUserId
          ticketRefArb,
          fc.emailAddress(), // adminEmail
          fc.string({ minLength: 1, maxLength: 100 }), // organizationId
          fc.boolean(), // isOrganizationCreator
          async (
            superAdminId,
            adminUserId,
            ticketRef,
            adminEmail,
            organizationId,
            isOrganizationCreator,
          ) => {
            // Ensure IDs are different
            fc.pre(superAdminId !== adminUserId);

            // Clear mocks before each iteration
            jest.clearAllMocks();

            // Setup mock to return different values for different calls
            const queryMock = userRepository.query as jest.Mock;
            queryMock.mockImplementation((sql: string, params: any[]) => {
              if (params[0] === superAdminId) {
                return Promise.resolve([{ name: "Super Administrator" }]);
              }
              if (params[0] === adminUserId) {
                return Promise.resolve([{ name: "Administrator" }]);
              }
              return Promise.resolve([]);
            });

            // Mock: Administrator user with various properties
            const adminUser: Partial<UserEntity> = {
              id: adminUserId,
              email: adminEmail,
              isActive: true,
              organization_id: organizationId,
              isOrganizationCreator: isOrganizationCreator,
              updatedAt: new Date(),
            };

            (userRepository.findOne as jest.Mock).mockResolvedValue(adminUser);
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

            // Property: Audit log should always be created regardless of other user properties
            expect(securityLogService.logAdministratorDeactivation).toHaveBeenCalledTimes(1);
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
  });
});
