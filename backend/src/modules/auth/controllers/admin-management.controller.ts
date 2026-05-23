import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AdminManagementService } from "../services/admin-management.service";
import { AuditService, AuditEventResult } from "../../audit/audit.service";
import { AuthenticatedUser } from "../interfaces/jwt-payload.interface";

/**
 * DTOs for Admin Management
 */
export class DeactivateAdministratorDto {
  adminUserId: string;
  ticketRef: string;
}

export class ReactivateAdministratorDto {
  adminUserId: string;
}

/**
 * Admin Management Controller
 *
 * Handles privileged administrator account management operations.
 * All endpoints require Super Administrator privileges.
 *
 * Requirements:
 * - 14.1: Administrator deactivation requires Super Administrator ticketing system
 * - 14.2: Administrator reactivation (Super Admin only)
 * - 14.3: Super Admin authorization checks
 * - 14.7: Audit logging with Super Admin identity and ticket reference
 */
@ApiTags("admin-management")
@Controller("admin-management")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminManagementController {
  constructor(
    private readonly adminManagementService: AdminManagementService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Deactivate an administrator account
   * Only Super Administrators can access this endpoint
   *
   * @param dto - Deactivation request with admin user ID and ticket reference
   * @param req - Request object containing authenticated Super Admin
   */
  @Post("administrators/:adminUserId/deactivate")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Deactivate administrator account",
    description:
      "Deactivate an administrator account through the Super Administrator ticketing system. " +
      "Only Super Administrators can perform this action. " +
      "Invalidates all active sessions for the administrator and sends notification email. " +
      "Requires a ticket reference for audit trail.",
  })
  @ApiParam({
    name: "adminUserId",
    description: "Administrator user ID to deactivate",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({
    type: DeactivateAdministratorDto,
    examples: {
      example1: {
        summary: "Deactivate administrator",
        value: {
          adminUserId: "123e4567-e89b-12d3-a456-426614174000",
          ticketRef: "TICKET-ADMIN-DEACT-12345",
        },
      },
    },
  })
  @ApiResponse({
    status: 204,
    description:
      "Administrator account deactivated successfully. All sessions terminated. Notification email sent.",
  })
  @ApiResponse({
    status: 403,
    description:
      "Only Super Administrators can deactivate administrator accounts",
    schema: {
      example: {
        error: {
          code: "FORBIDDEN",
          message:
            "Only Super Administrators can deactivate administrator accounts",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Administrator user not found",
    schema: {
      example: {
        error: {
          code: "NOT_FOUND",
          message: "Administrator user not found",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "User is not an administrator or Super Administrator cannot be deactivated",
    schema: {
      oneOf: [
        {
          example: {
            error: {
              code: "BAD_REQUEST",
              message:
                "User is not an administrator and cannot be deactivated through this endpoint",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
        {
          example: {
            error: {
              code: "FORBIDDEN",
              message:
                "Super Administrators cannot be deactivated through this endpoint",
              timestamp: "2026-02-27T10:30:00Z",
              requestId: "req-123456",
            },
          },
        },
      ],
    },
  })
  async deactivateAdministrator(
    @Param("adminUserId") adminUserId: string,
    @Body() dto: DeactivateAdministratorDto,
    @Request() req: any,
  ): Promise<void> {
    const superAdmin: AuthenticatedUser = req.user;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      // Deactivate administrator (includes authorization check)
      await this.adminManagementService.deactivateAdministrator(
        adminUserId,
        superAdmin.userId,
        dto.ticketRef,
      );

      // Log audit event (success)
      this.auditService.logAuth(
        "deactivate_administrator",
        AuditEventResult.SUCCESS,
        {
          userId: superAdmin.userId,
          userEmail: superAdmin.email,
          resource: "administrator",
          ipAddress: ip,
          userAgent,
          metadata: {
            requestMethod: "POST",
            requestPath: `/api/v2/admin-management/administrators/${adminUserId}/deactivate`,
            targetAdminUserId: adminUserId,
            ticketRef: dto.ticketRef,
          },
        },
      );
    } catch (error) {
      // Log audit event (failure)
      this.auditService.logAuth(
        "deactivate_administrator",
        AuditEventResult.FAILURE,
        {
          userId: superAdmin.userId,
          userEmail: superAdmin.email,
          resource: "administrator",
          ipAddress: ip,
          userAgent,
          errorMessage: error.message,
          metadata: {
            requestMethod: "POST",
            requestPath: `/api/v2/admin-management/administrators/${adminUserId}/deactivate`,
            targetAdminUserId: adminUserId,
            ticketRef: dto.ticketRef,
          },
        },
      );
      throw error;
    }
  }

  /**
   * Reactivate an administrator account
   * Only Super Administrators can access this endpoint
   *
   * @param adminUserId - Administrator user ID to reactivate
   * @param req - Request object containing authenticated Super Admin
   */
  @Post("administrators/:adminUserId/reactivate")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Reactivate administrator account",
    description:
      "Reactivate a previously deactivated administrator account. " +
      "Only Super Administrators can perform this action. " +
      "The administrator will be able to log in again after reactivation.",
  })
  @ApiParam({
    name: "adminUserId",
    description: "Administrator user ID to reactivate",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: 204,
    description: "Administrator account reactivated successfully",
  })
  @ApiResponse({
    status: 403,
    description:
      "Only Super Administrators can reactivate administrator accounts",
    schema: {
      example: {
        error: {
          code: "FORBIDDEN",
          message:
            "Only Super Administrators can reactivate administrator accounts",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Administrator user not found",
    schema: {
      example: {
        error: {
          code: "NOT_FOUND",
          message: "Administrator user not found",
          timestamp: "2026-02-27T10:30:00Z",
          requestId: "req-123456",
        },
      },
    },
  })
  async reactivateAdministrator(
    @Param("adminUserId") adminUserId: string,
    @Request() req: any,
  ): Promise<void> {
    const superAdmin: AuthenticatedUser = req.user;
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    try {
      // Reactivate administrator (includes authorization check)
      await this.adminManagementService.reactivateAdministrator(
        adminUserId,
        superAdmin.userId,
      );

      // Log audit event (success)
      this.auditService.logAuth(
        "reactivate_administrator",
        AuditEventResult.SUCCESS,
        {
          userId: superAdmin.userId,
          userEmail: superAdmin.email,
          resource: "administrator",
          ipAddress: ip,
          userAgent,
          metadata: {
            requestMethod: "POST",
            requestPath: `/api/v2/admin-management/administrators/${adminUserId}/reactivate`,
            targetAdminUserId: adminUserId,
          },
        },
      );
    } catch (error) {
      // Log audit event (failure)
      this.auditService.logAuth(
        "reactivate_administrator",
        AuditEventResult.FAILURE,
        {
          userId: superAdmin.userId,
          userEmail: superAdmin.email,
          resource: "administrator",
          ipAddress: ip,
          userAgent,
          errorMessage: error.message,
          metadata: {
            requestMethod: "POST",
            requestPath: `/api/v2/admin-management/administrators/${adminUserId}/reactivate`,
            targetAdminUserId: adminUserId,
          },
        },
      );
      throw error;
    }
  }
}
