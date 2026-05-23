/**
 * IAM Assignments Types
 * Type definitions for role and permission assignments
 */

export interface RoleAssignment {
  id: string;
  roleId: string;
  roleName: string;
  roleDescription: string;
  roleTier: number;
  isSystem: boolean;
  assignedAt: string;
  assignedBy: string;
  expiresAt: string | null;
}

export interface DirectPermission {
  id: string;
  permissionId: string;
  permissionName: string;
  description: string;
  resource: string;
  action: string;
  grantedAt: string;
  grantedBy: string;
  expiresAt: string | null;
  reason: string | null;
}

export interface UserAssignment {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: RoleAssignment[];
  directPermissions: DirectPermission[];
  effectivePermissions: string[];
  lastLoginAt: string | null;
}

export interface AssignmentListResponse {
  assignments: UserAssignment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AssignRoleRequest {
  roleId: string;
  expiresAt?: string;
  reason?: string;
}

export interface AssignRoleResponse {
  message: string;
  assignment: RoleAssignment;
}

export interface RemoveRoleResponse {
  message: string;
}

export interface AssignDirectPermissionRequest {
  permissionId: string;
  expiresAt?: string;
  reason?: string;
}

export interface AssignDirectPermissionResponse {
  message: string;
  permission: DirectPermission;
}

export interface AssignmentListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
}
