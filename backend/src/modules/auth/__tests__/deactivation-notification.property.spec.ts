/**
 * Property-Based Tests for Authentication - Deactivation Notification
 *
 * Feature: frontend-backend-auth-integration
 * Property 57: Deactivation notification
 * Validates: Requirement 14.6
 *
 * Tests that for any administrator account deactivation, a notification email
 * should be sent to the deactivated administrator.
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
  describe("Property 57: Deactivation notification", () => {
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

    // Generator for email addresses
    const emailArb = fc.oneof(
      fc.emailAddress(),
      fc.string({ minLength: 3, maxLength: 20 }).map(s => `${s}@example.com`),
      fc.string({ minLength: 3, maxLength: 20 }).map(s => `admin.${s}@company.org`),
    );

    // Generator for ticket references
    const ticketRefArb = fc.oneof(
      fc.string({ minLength: 5, maxLength: 20 }).map(s => `TICKET-${s}`),
      fc.integer({ min: 1000, max: 9999 }).map(n => `ADMIN-DEACT-${n}`),
      fc.uuid().map(id => `REQ-${id.substring(0, 8)}`),
    );

    it("should send notification email to deactivated administrator", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // superAdminId
          fc.uuid(), // adminUserId
          emailArb,
          ticketRefArb,
          async (superAdminId, adminUserId, adminEmail, ticketRef) => {
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
              email: adminEmail,
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

            // Property: Notification email should be sent to the administrator's email
            expect(emailService.sendAdministratorDeactivationNotification).toHaveBeenCalledTimes(1);
            expect(emailService.sendAdministratorDeactivationNotification).toHaveBeenCalledWith(
              adminEmail,
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send notification email after deactivation is saved", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // superAdminId
          fc.uuid(), // adminUserId
          emailArb,
          ticketRefArb,
          async (superAdminId, adminUserId, adminEmail, ticketRef) => {
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
              email: adminEmail,
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

            // Property: Email should be sent after save operation
            const saveIndex = operationOrder.indexOf("save");
            const emailIndex = operationOrder.indexOf("sendEmail");

            expect(saveIndex).toBeGreaterThanOrEqual(0);
            expect(emailIndex).toBeGreaterThanOrEqual(0);
            expect(emailIndex).toBeGreaterThan(saveIndex);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send notification email with correct administrator email address", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // superAdminId
          fc.uuid(), // adminUserId
          emailArb,
          ticketRefArb,
          async (superAdminId, adminUserId, adminEmail, ticketRef) => {
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

            // Mock: Administrator user exists with specific email
            const adminUser: Partial<UserEntity> = {
              id: adminUserId,
              email: adminEmail,
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

            // Property: Email should be sent to the exact email address from the user entity
            const emailCalls = (emailService.sendAdministratorDeactivationNotification as jest.Mock).mock.calls;
            expect(emailCalls.length).toBe(1);
            expect(emailCalls[0][0]).toBe(adminEmail);

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should send notification email for any valid administrator deactivation", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // superAdminId
          fc.uuid(), // adminUserId
          emailArb,
          fc.string({ minLength: 1, maxLength: 100 }), // organizationId
          fc.boolean(), // isOrganizationCreator
          ticketRefArb,
          async (
            superAdminId,
            adminUserId,
            adminEmail,
            organizationId,
            isOrganizationCreator,
            ticketRef,
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

            // Property: Notification email should always be sent regardless of other user properties
            expect(emailService.sendAdministratorDeactivationNotification).toHaveBeenCalledTimes(1);
            expect(emailService.sendAdministratorDeactivationNotification).toHaveBeenCalledWith(
              adminEmail,
            );

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
