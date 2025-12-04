import { UserRole, UserRoleType } from '../value-objects/UserRole';
import { OrganizationId } from '../value-objects/OrganizationId';

export interface PermissionContext {
  userRole: UserRole;
  userOrganizationId: OrganizationId | null;
  targetOrganizationId?: OrganizationId;
}

export class PermissionService {
  /**
   * Check if user can perform action based on role and organization scope
   */
  static canPerformAction(
    action: 'create' | 'read' | 'update' | 'delete',
    context: PermissionContext,
  ): boolean {
    const { userRole, userOrganizationId, targetOrganizationId } = context;

    // SuperAdministrator can do everything across all organizations
    if (userRole.isSuperAdministrator()) {
      return true;
    }

    // Check organization scope for non-SuperAdmin users
    if (targetOrganizationId && userOrganizationId) {
      if (!targetOrganizationId.equals(userOrganizationId)) {
        return false; // Cannot access resources outside their organization
      }
    }

    // Check action permissions based on role
    switch (action) {
      case 'create':
        return userRole.canCreate();
      case 'read':
        return userRole.canRead();
      case 'update':
        return userRole.canUpdate();
      case 'delete':
        return userRole.canDelete();
      default:
        return false;
    }
  }

  /**
   * Get permission matrix for role
   */
  static getPermissionMatrix(role: UserRoleType): Record<string, boolean> {
    const userRole = UserRole.create(role);
    
    return {
      // Platform Management (SuperAdmin only)
      'platform:manage': userRole.canManageAllPlatform(),
      'platform:view': true,
      
      // Organization Management
      'organization:create': userRole.canManageAllPlatform(),
      'organization:read': true,
      'organization:update': userRole.canManageOrganization(),
      'organization:delete': userRole.canManageAllPlatform(),
      
      // User Management
      'user:create': userRole.canCreate(),
      'user:read': userRole.canRead(),
      'user:update': userRole.canUpdate(),
      'user:delete': userRole.canDelete(),
      
      // Role Management
      'role:create': userRole.canManageOrganization(),
      'role:read': userRole.canRead(),
      'role:update': userRole.canManageOrganization(),
      'role:delete': userRole.canManageOrganization(),
      
      // Permission Management
      'permission:create': userRole.canManageAllPlatform(),
      'permission:read': userRole.canRead(),
      'permission:update': userRole.canManageAllPlatform(),
      'permission:delete': userRole.canManageAllPlatform(),
      
      // Tenant Management
      'tenant:create': userRole.canCreate(),
      'tenant:read': userRole.canRead(),
      'tenant:update': userRole.canUpdate(),
      'tenant:delete': userRole.canDelete(),
      
      // Workspace Management
      'workspace:create': userRole.canCreate(),
      'workspace:read': userRole.canRead(),
      'workspace:update': userRole.canUpdate(),
      'workspace:delete': userRole.canDelete(),
      
      // Region Management
      'region:create': userRole.canManageAllPlatform(),
      'region:read': userRole.canRead(),
      'region:update': userRole.canManageAllPlatform(),
      'region:delete': userRole.canManageAllPlatform(),
      
      // Monitoring & Observability
      'metrics:read': userRole.canRead(),
      'metrics:write': userRole.canCreate(),
      'logs:read': userRole.canRead(),
      'logs:write': userRole.canCreate(),
      'traces:read': userRole.canRead(),
      'traces:write': userRole.canCreate(),
      
      // Dashboard Management
      'dashboard:create': userRole.canCreate(),
      'dashboard:read': userRole.canRead(),
      'dashboard:update': userRole.canUpdate(),
      'dashboard:delete': userRole.canDelete(),
      
      // Alert Management
      'alert:create': userRole.canCreate(),
      'alert:read': userRole.canRead(),
      'alert:update': userRole.canUpdate(),
      'alert:delete': userRole.canDelete(),
      
      // Alert Rule Groups
      'alert-rule-group:create': userRole.canCreate(),
      'alert-rule-group:read': userRole.canRead(),
      'alert-rule-group:update': userRole.canUpdate(),
      'alert-rule-group:delete': userRole.canDelete(),
      
      // Agent Management
      'agent:create': userRole.canCreate(),
      'agent:read': userRole.canRead(),
      'agent:update': userRole.canUpdate(),
      'agent:delete': userRole.canDelete(),
      'agent:register': userRole.canCreate(),
      'agent:unregister': userRole.canDelete(),
      
      // Uptime Monitoring
      'uptime:create': userRole.canCreate(),
      'uptime:read': userRole.canRead(),
      'uptime:update': userRole.canUpdate(),
      'uptime:delete': userRole.canDelete(),
      'uptime:check': userRole.canRead(),
      
      // Audit Logs
      'audit:read': userRole.canRead(),
      'audit:export': userRole.canManageOrganization(),
    };
  }

  /**
   * Check if user can access organization
   */
  static canAccessOrganization(
    userRole: UserRole,
    userOrganizationId: OrganizationId | null,
    targetOrganizationId: OrganizationId,
  ): boolean {
    // SuperAdmin can access all organizations
    if (userRole.isSuperAdministrator()) {
      return true;
    }

    // Other users can only access their own organization
    if (!userOrganizationId) {
      return false;
    }

    return userOrganizationId.equals(targetOrganizationId);
  }

  /**
   * Get role description
   */
  static getRoleDescription(role: UserRoleType): string {
    switch (role) {
      case UserRoleType.SUPER_ADMINISTRATOR:
        return 'Can manage all the SaaS Platform across all organizations and regions';
      case UserRoleType.ADMINISTRATOR:
        return 'Can manage all permissions within their organization across multiple regions';
      case UserRoleType.DEVELOPER:
        return 'Can create and update resources within their organization, but cannot delete';
      case UserRoleType.VIEWER:
        return 'Read-only access to resources within their organization';
      default:
        return 'Unknown role';
    }
  }
}
