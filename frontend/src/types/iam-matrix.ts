/**
 * IAM Matrix Types
 * Type definitions for role-permission matrix management
 */

export interface PermissionEntry {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage" | "execute" | "assign" | "write" | "chat" | "insights" | "audit";
  category: string;
}

export interface RolePermissionMapping {
  permissionId: string;
  granted: boolean;
  inherited: boolean;
  inheritedFrom?: string;
}

export interface MatrixRole {
  id: string;
  name: string;
  description: string;
  tier: number;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
  permissions: RolePermissionMapping[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionMatrix {
  roles: MatrixRole[];
  permissions: PermissionEntry[];
  categories: string[];
  totalRoles: number;
  totalPermissions: number;
}

export interface UpdateRolePermissionsRequest {
  permissions: Array<{
    permissionId: string;
    granted: boolean;
  }>;
}

export interface UpdateRolePermissionsResponse {
  roleId: string;
  updatedCount: number;
  permissions: RolePermissionMapping[];
  message: string;
}
