import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../../iam/infrastructure/persistence/entities/User.entity";
import { UserRoleType } from "../../iam/domain/value-objects/UserRole";
import { SessionService } from "./session.service";
import { EmailService } from "./email.service";
import { SecurityLogService } from "./security-log.service";

/**
 * AdminManagementService - Administrator account management service
 *
 * Responsibilities:
 * - Administrator deactivation (Super Admin only)
 * - Administrator reactivation (Super Admin only)
 * - Super Admin authorization checks
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.7
 */
@Injectable()
export class AdminManagementService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
    private readonly securityLogService: SecurityLogService,
  ) {}

  /**
   * Deactivate an administrator account
   * Only Super Administrators can deactivate administrator accounts
   * Requirement: 14.1, 14.3, 14.4, 14.6, 14.7
   *
   * @param adminUserId - ID of the administrator to deactivate
   * @param superAdminId - ID of the Super Administrator performing the action
   * @param ticketRef - Ticket reference for audit trail
   * @throws ForbiddenException if the requesting user is not a Super Administrator
   * @throws NotFoundException if the administrator user is not found
   * @throws BadRequestException if the user is not an administrator
   */
  async deactivateAdministrator(
    adminUserId: string,
    superAdminId: string,
    ticketRef: string,
  ): Promise<void> {
    // Verify Super Admin authorization
    const isSuperAdmin = await this.isSuperAdmin(superAdminId);
    if (!isSuperAdmin) {
      throw new ForbiddenException(
        "Only Super Administrators can deactivate administrator accounts",
      );
    }

    // Find the administrator user
    const adminUser = await this.userRepository.findOne({
      where: { id: adminUserId },
    });

    if (!adminUser) {
      throw new NotFoundException("Administrator user not found");
    }

    // Verify the user is an administrator (not Super Admin, not regular user)
    // Note: We check the user_roles table for the actual role assignment
    const userRole = await this.getUserRole(adminUserId);
    if (
      userRole !== UserRoleType.ADMINISTRATOR &&
      userRole !== UserRoleType.SUPER_ADMINISTRATOR
    ) {
      throw new BadRequestException(
        "User is not an administrator and cannot be deactivated through this endpoint",
      );
    }

    // Prevent Super Admins from deactivating other Super Admins
    if (userRole === UserRoleType.SUPER_ADMINISTRATOR) {
      throw new ForbiddenException(
        "Super Administrators cannot be deactivated through this endpoint",
      );
    }

    // Deactivate the administrator
    adminUser.isActive = false;
    adminUser.updatedAt = new Date();

    // Store deactivation metadata (we'll add these fields to the entity)
    // For now, we'll use the existing fields
    await this.userRepository.save(adminUser);

    // Invalidate all active sessions for the administrator
    // Requirement: 14.4
    await this.sessionService.revokeUserSessions(
      adminUserId,
      undefined,
      `Administrator deactivated by Super Admin (Ticket: ${ticketRef})`,
    );

    // Send notification email to the deactivated administrator
    // Requirement: 14.6
    await this.emailService.sendAdministratorDeactivationNotification(
      adminUser.email,
    );

    // Log the deactivation event for audit trail
    // Requirement: 14.7
    await this.securityLogService.logAdministratorDeactivation(
      adminUserId,
      superAdminId,
      ticketRef,
    );
  }

  /**
   * Reactivate an administrator account
   * Only Super Administrators can reactivate administrator accounts
   * Requirement: 14.2
   *
   * @param adminUserId - ID of the administrator to reactivate
   * @param superAdminId - ID of the Super Administrator performing the action
   * @throws ForbiddenException if the requesting user is not a Super Administrator
   * @throws NotFoundException if the administrator user is not found
   */
  async reactivateAdministrator(
    adminUserId: string,
    superAdminId: string,
  ): Promise<void> {
    // Verify Super Admin authorization
    const isSuperAdmin = await this.isSuperAdmin(superAdminId);
    if (!isSuperAdmin) {
      throw new ForbiddenException(
        "Only Super Administrators can reactivate administrator accounts",
      );
    }

    // Find the administrator user
    const adminUser = await this.userRepository.findOne({
      where: { id: adminUserId },
    });

    if (!adminUser) {
      throw new NotFoundException("Administrator user not found");
    }

    // Reactivate the administrator
    adminUser.isActive = true;
    adminUser.updatedAt = new Date();

    await this.userRepository.save(adminUser);

    // Log the reactivation event
    await this.securityLogService.logAdministratorReactivation(
      adminUserId,
      superAdminId,
    );
  }

  /**
   * Check if a user is a Super Administrator
   * Requirement: 14.3
   *
   * @param userId - User ID to check
   * @returns True if the user is a Super Administrator
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const userRole = await this.getUserRole(userId);
    return userRole === UserRoleType.SUPER_ADMINISTRATOR;
  }

  /**
   * Check if a user can modify organization settings
   * Only organization creators can modify organization settings
   * Requirement: 13.6, 13.7
   *
   * @param userId - User ID to check
   * @param organizationId - Organization ID
   * @returns True if the user can modify organization settings
   */
  async canModifyOrganizationSettings(
    userId: string,
    organizationId: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // Check if user is the organization creator
    return (
      user.organization_id === organizationId && user.isOrganizationCreator
    );
  }

  /**
   * Get the role of a user
   * This queries the user_roles table to get the actual role assignment
   *
   * @param userId - User ID
   * @returns UserRoleType or null if no role found
   */
  private async getUserRole(userId: string): Promise<UserRoleType | null> {
    // Query the user_roles table to get the role
    const result = await this.userRepository.query(
      `
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
      LIMIT 1
    `,
      [userId],
    );

    if (result.length === 0) {
      return null;
    }

    const roleName = result[0].name;

    // Map role name to UserRoleType
    switch (roleName) {
      case "Super Administrator":
        return UserRoleType.SUPER_ADMINISTRATOR;
      case "Administrator":
        return UserRoleType.ADMINISTRATOR;
      case "Developer":
        return UserRoleType.DEVELOPER;
      case "Viewer":
        return UserRoleType.VIEWER;
      default:
        return null;
    }
  }
}
