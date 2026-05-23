/**
 * IAM Assignments API client
 * Manages user-role and user-permission assignments for RBAC
 * Uses collectorClient for real HTTP calls with config.useMock branching
 */

import { collectorClient } from "./collector";
import { config } from "@/config";

// ==================== TYPES ====================
// Note: Types are also available in @/types/iam-assignments.ts

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

// ==================== ENDPOINTS ====================

export const IAM_ASSIGNMENT_ENDPOINTS = {
  LIST: "/api/v2/iam/assignments",
  USER: (userId: string) => `/api/v2/iam/assignments/users/${userId}`,
  USER_ROLES: (userId: string) =>
    `/api/v2/iam/assignments/users/${userId}/roles`,
  USER_ROLE: (userId: string, roleId: string) =>
    `/api/v2/iam/assignments/users/${userId}/roles/${roleId}`,
  USER_PERMISSIONS: (userId: string) =>
    `/api/v2/iam/assignments/users/${userId}/permissions`,
} as const;

// ==================== MOCK DATA ====================

// All 24 users matching backend 08-DefaultUsersSeed.ts
const MOCK_USERS_BASE = [
  // ── Default 5-Tier (5) ──
  { userId: "user-001", username: "superadmin.telemetryflow", email: "superadmin.telemetryflow@telemetryflow.id", firstName: "Super", lastName: "Admin", isActive: true, tier: 1, roleName: "Super Administrator", roleId: "role-super-admin" },
  { userId: "user-002", username: "admin.telemetryflow", email: "administrator.telemetryflow@telemetryflow.id", firstName: "Admin", lastName: "TelemetryFlow", isActive: true, tier: 2, roleName: "Administrator", roleId: "role-admin" },
  { userId: "user-003", username: "developer.telemetryflow", email: "developer.telemetryflow@telemetryflow.id", firstName: "Developer", lastName: "TelemetryFlow", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },
  { userId: "user-004", username: "viewer.telemetryflow", email: "viewer.telemetryflow@telemetryflow.id", firstName: "Viewer", lastName: "TelemetryFlow", isActive: true, tier: 4, roleName: "Viewer", roleId: "role-viewer" },
  { userId: "user-005", username: "demo.telemetryflow", email: "demo.telemetryflow@telemetryflow.id", firstName: "Demo", lastName: "TelemetryFlow", isActive: true, tier: 5, roleName: "Demo", roleId: "role-demo" },

  // ── Platform Engineering (3) ──
  { userId: "user-006", username: "platform.engineer01", email: "platform.engineer01@telemetryflow.id", firstName: "Platform", lastName: "Engineer 01", isActive: true, tier: 2, roleName: "Administrator", roleId: "role-admin" },
  { userId: "user-007", username: "platform.engineer02", email: "platform.engineer02@telemetryflow.id", firstName: "Platform", lastName: "Engineer 02", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },
  { userId: "user-008", username: "platform.engineer03", email: "platform.engineer03@telemetryflow.id", firstName: "Platform", lastName: "Engineer 03", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },

  // ── SRE (3) ──
  { userId: "user-009", username: "sre.team01", email: "sre.team01@telemetryflow.id", firstName: "SRE", lastName: "Team 01", isActive: true, tier: 2, roleName: "Administrator", roleId: "role-admin" },
  { userId: "user-010", username: "sre.team02", email: "sre.team02@telemetryflow.id", firstName: "SRE", lastName: "Team 02", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },
  { userId: "user-011", username: "sre.team03", email: "sre.team03@telemetryflow.id", firstName: "SRE", lastName: "Team 03", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },

  // ── DevOps (3) ──
  { userId: "user-012", username: "devops.team01", email: "devops.team01@telemetryflow.id", firstName: "DevOps", lastName: "Team 01", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },
  { userId: "user-013", username: "devops.team02", email: "devops.team02@telemetryflow.id", firstName: "DevOps", lastName: "Team 02", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },
  { userId: "user-014", username: "devops.team03", email: "devops.team03@telemetryflow.id", firstName: "DevOps", lastName: "Team 03", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },

  // ── Backend (2) ──
  { userId: "user-015", username: "backend.dev01", email: "backend.dev01@telemetryflow.id", firstName: "Backend", lastName: "Dev 01", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },
  { userId: "user-016", username: "backend.dev02", email: "backend.dev02@telemetryflow.id", firstName: "Backend", lastName: "Dev 02", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },

  // ── Frontend (2) ──
  { userId: "user-017", username: "frontend.dev01", email: "frontend.dev01@telemetryflow.id", firstName: "Frontend", lastName: "Dev 01", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },
  { userId: "user-018", username: "frontend.dev02", email: "frontend.dev02@telemetryflow.id", firstName: "Frontend", lastName: "Dev 02", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },

  // ── QA (2) ──
  { userId: "user-019", username: "qa.engineer01", email: "qa.engineer01@telemetryflow.id", firstName: "QA", lastName: "Engineer 01", isActive: true, tier: 4, roleName: "Viewer", roleId: "role-viewer" },
  { userId: "user-020", username: "qa.engineer02", email: "qa.engineer02@telemetryflow.id", firstName: "QA", lastName: "Engineer 02", isActive: true, tier: 4, roleName: "Viewer", roleId: "role-viewer" },

  // ── Product (2) ──
  { userId: "user-021", username: "product.manager01", email: "product.manager01@telemetryflow.id", firstName: "Product", lastName: "Manager 01", isActive: true, tier: 4, roleName: "Viewer", roleId: "role-viewer" },
  { userId: "user-022", username: "product.owner01", email: "product.owner01@telemetryflow.id", firstName: "Product", lastName: "Owner 01", isActive: true, tier: 4, roleName: "Viewer", roleId: "role-viewer" },

  // ── Security (1) ──
  { userId: "user-023", username: "security.analyst01", email: "security.analyst01@telemetryflow.id", firstName: "Security", lastName: "Analyst 01", isActive: true, tier: 2, roleName: "Administrator", roleId: "role-admin" },

  // ── Data (1) ──
  { userId: "user-024", username: "data.engineer01", email: "data.engineer01@telemetryflow.id", firstName: "Data", lastName: "Engineer 01", isActive: true, tier: 3, roleName: "Developer", roleId: "role-developer" },
];

function generateMockAssignment(
  user: (typeof MOCK_USERS_BASE)[0],
): UserAssignment {
  const roleDescriptions: Record<string, string> = {
    "Super Administrator": "Platform management across all organizations. Full access to all resources.",
    Administrator: "Full CRUD within organization. Can manage users, roles, and resources.",
    Developer: "Create/Read/Update access (no delete). Can work with most resources.",
    Viewer: "Read-only access. Can view resources but cannot modify them.",
    Demo: "Demo access in demo organization. Limited read-only access.",
  };

  const effectivePermsMap: Record<number, string[]> = {
    1: ["users:*", "roles:*", "permissions:*", "organizations:*", "telemetry:*", "monitoring:*", "platform:*", "llm:*"],
    2: ["users:*", "roles:read", "roles:update", "permissions:*", "organizations:read", "telemetry:*", "monitoring:*", "llm:*"],
    3: ["users:create", "users:read", "users:update", "telemetry:read", "telemetry:write", "monitoring:read", "monitoring:write", "llm:read", "llm:chat", "llm:insights"],
    4: ["users:read", "roles:read", "telemetry:read", "monitoring:read", "llm:read", "llm:chat"],
    5: ["organizations:read", "telemetry:read", "monitoring:read", "llm:read", "llm:chat"],
  };

  const directPerms: DirectPermission[] = [];
  // Platform Engineer 02 has extra API key manage for CI/CD
  if (user.userId === "user-007") {
    directPerms.push({
      id: "dp-001",
      permissionId: "perm-api-keys-delete",
      permissionName: "api-keys:delete",
      description: "Delete API keys",
      resource: "api-keys",
      action: "delete",
      grantedAt: "2025-08-15T10:00:00Z",
      grantedBy: "user-001",
      expiresAt: null,
      reason: "Needs API key cleanup for CI/CD pipeline rotation",
    });
  }
  // Security Analyst has extra audit access
  if (user.userId === "user-023") {
    directPerms.push({
      id: "dp-002",
      permissionId: "perm-platform-audit",
      permissionName: "platform:audit",
      description: "View audit logs",
      resource: "platform",
      action: "audit",
      grantedAt: "2025-10-01T08:00:00Z",
      grantedBy: "user-001",
      expiresAt: "2026-04-01T08:00:00Z",
      reason: "Security review access for Q4 compliance audit",
    });
  }

  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    roles: [
      {
        id: `assignment-${user.userId}-${user.roleId}`,
        roleId: user.roleId,
        roleName: user.roleName,
        roleDescription: roleDescriptions[user.roleName] || "",
        roleTier: user.tier,
        isSystem: true,
        assignedAt: "2024-01-15T09:00:00Z",
        assignedBy: "user-001",
        expiresAt: user.tier === 5 ? "2025-12-31T23:59:59Z" : null,
      },
    ],
    directPermissions: directPerms,
    effectivePermissions: effectivePermsMap[user.tier] || [],
    lastLoginAt: user.isActive
      ? new Date(
          Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        ).toISOString()
      : null,
  };
}

function generateMockAssignments(
  query: AssignmentListQuery = {},
): AssignmentListResponse {
  let users = [...MOCK_USERS_BASE];

  if (query.search) {
    const search = query.search.toLowerCase();
    users = users.filter(
      (u) =>
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.firstName.toLowerCase().includes(search) ||
        u.lastName.toLowerCase().includes(search),
    );
  }
  if (query.roleId) {
    users = users.filter((u) => u.roleId === query.roleId);
  }
  if (query.isActive !== undefined) {
    users = users.filter((u) => u.isActive === query.isActive);
  }

  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const total = users.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const pageUsers = users.slice(start, start + pageSize);

  return {
    assignments: pageUsers.map(generateMockAssignment),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ==================== API CLIENT ====================

export const iamAssignmentsApi = {
  /**
   * List all user-role assignments with pagination and filtering
   * Shows which users have which roles and direct permissions
   */
  async listAssignments(
    query: AssignmentListQuery = {},
  ): Promise<AssignmentListResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return generateMockAssignments(query);
    }

    const response = await collectorClient.get<AssignmentListResponse>(
      IAM_ASSIGNMENT_ENDPOINTS.LIST,
      {
        params: {
          page: query.page,
          page_size: query.pageSize,
          search: query.search,
          role_id: query.roleId,
          is_active: query.isActive,
        },
      },
    );
    return response.data;
  },

  /**
   * Get assignments for a specific user
   * Returns roles, direct permissions, and effective permissions
   */
  async getUserAssignment(userId: string): Promise<UserAssignment> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const user = MOCK_USERS_BASE.find((u) => u.userId === userId);
      if (user) {
        return generateMockAssignment(user);
      }
      // Return first user with modified ID for demo
      return { ...generateMockAssignment(MOCK_USERS_BASE[0]), userId };
    }

    const response = await collectorClient.get<UserAssignment>(
      IAM_ASSIGNMENT_ENDPOINTS.USER(userId),
    );
    return response.data;
  },

  /**
   * Assign a role to a user
   * Supports optional expiration and reason tracking
   */
  async assignRole(
    userId: string,
    data: AssignRoleRequest,
  ): Promise<AssignRoleResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const roleName =
        data.roleId === "role-admin"
          ? "Administrator"
          : data.roleId === "role-developer"
            ? "Developer"
            : data.roleId === "role-viewer"
              ? "Viewer"
              : "Custom";
      return {
        message: `Role ${roleName} assigned successfully`,
        assignment: {
          id: `assignment-${userId}-${data.roleId}`,
          roleId: data.roleId,
          roleName,
          roleDescription: `${roleName} role assignment`,
          roleTier:
            data.roleId === "role-admin"
              ? 2
              : data.roleId === "role-developer"
                ? 3
                : 4,
          isSystem: true,
          assignedAt: new Date().toISOString(),
          assignedBy: "user-001",
          expiresAt: data.expiresAt || null,
        },
      };
    }

    const response = await collectorClient.post<AssignRoleResponse>(
      IAM_ASSIGNMENT_ENDPOINTS.USER_ROLES(userId),
      data,
    );
    return response.data;
  },

  /**
   * Remove a role assignment from a user
   */
  async removeRole(
    userId: string,
    roleId: string,
  ): Promise<RemoveRoleResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { message: "Role assignment removed successfully" };
    }

    const response = await collectorClient.delete<RemoveRoleResponse>(
      IAM_ASSIGNMENT_ENDPOINTS.USER_ROLE(userId, roleId),
    );
    return response.data;
  },

  /**
   * Assign a direct permission to a user (bypassing role inheritance)
   * Used for temporary or special-case permission grants
   */
  async assignDirectPermission(
    userId: string,
    data: AssignDirectPermissionRequest,
  ): Promise<AssignDirectPermissionResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        message: "Direct permission assigned successfully",
        permission: {
          id: `dp-${Date.now()}`,
          permissionId: data.permissionId,
          permissionName: data.permissionId,
          description: "Directly assigned permission",
          resource: "custom",
          action: "manage",
          grantedAt: new Date().toISOString(),
          grantedBy: "user-001",
          expiresAt: data.expiresAt || null,
          reason: data.reason || null,
        },
      };
    }

    const response = await collectorClient.post<AssignDirectPermissionResponse>(
      IAM_ASSIGNMENT_ENDPOINTS.USER_PERMISSIONS(userId),
      data,
    );
    return response.data;
  },
};

export default iamAssignmentsApi;
