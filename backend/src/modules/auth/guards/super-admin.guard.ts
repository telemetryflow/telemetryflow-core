import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { AdminManagementService } from "../services/admin-management.service";

/**
 * SuperAdminGuard - Guard to ensure only Super Administrators can access protected endpoints
 *
 * This guard checks if the authenticated user has Super Administrator privileges.
 * It should be used in combination with JwtAuthGuard to ensure the user is authenticated.
 *
 * Requirements: 14.1, 14.3
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, SuperAdminGuard)
 * @Post('admin/deactivate')
 * async deactivateAdmin(@Body() dto: DeactivateAdministratorDto) {
 *   // Only Super Admins can access this endpoint
 * }
 * ```
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly adminManagementService: AdminManagementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user is authenticated
    if (!user || !user.id) {
      throw new UnauthorizedException("User must be authenticated");
    }

    // Check if user is a Super Administrator
    const isSuperAdmin = await this.adminManagementService.isSuperAdmin(
      user.id,
    );

    if (!isSuperAdmin) {
      throw new ForbiddenException(
        "Only Super Administrators can access this resource",
      );
    }

    return true;
  }
}
