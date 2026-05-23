import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has at least one of the required permissions
    // Supports hierarchical matching: "telemetry:read" grants "telemetry:metrics:read"
    const hasPermission = requiredPermissions.some((required) =>
      user.permissions.some((held) => {
        // Exact match
        if (held === required) return true;

        // Hierarchical: "telemetry:read" matches "telemetry:metrics:read"
        // Split both into segments and check if the held permission is a parent
        const heldParts = held.split(':');
        const requiredParts = required.split(':');

        if (heldParts.length < 2 || requiredParts.length < 3) return false;

        // e.g. held = "telemetry:read" → resource="telemetry", action="read"
        // required = "telemetry:metrics:read" → resource="telemetry", sub="metrics", action="read"
        const heldResource = heldParts[0];
        const heldAction = heldParts[heldParts.length - 1];
        const requiredResource = requiredParts[0];
        const requiredAction = requiredParts[requiredParts.length - 1];

        return heldResource === requiredResource && heldAction === requiredAction;
      }),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(' or ')}`,
      );
    }

    return true;
  }
}
