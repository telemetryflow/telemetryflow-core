/**
 * Roles API functions for TelemetryFlow Platform
 * Uses mock data when config.useMock=true; calls real backend otherwise.
 */

import {
  MOCK_ROLES,
  MOCK_PERMISSIONS,
  MOCK_USER_ROLES,
  MOCK_USERS,
} from "@/mocks";
import { config } from "@/config";
import { iamClient } from "./iam";
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  Permission,
  User,
  IAMListParams,
} from "@/types";

// Local state for mock data (to support CRUD operations)
const mockRoles = [...MOCK_ROLES];

// Role-Permission assignments (mutable for CRUD)
const rolePermissionMap: Record<string, string[]> = {};
MOCK_ROLES.forEach((role) => {
  rolePermissionMap[role.id] = role.permissions?.map((p) => p.id) || [];
});

interface RolesListResponse {
  data: Role[];
  total: number;
}

interface PermissionsListResponse {
  data: Permission[];
}

interface UsersListResponse {
  data: User[];
}

// Simulate API delay (mock only)
const delay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const rolesApi = {
  /**
   * List roles with pagination
   */
  list: async (
    params?: IAMListParams & { includeSystem?: boolean },
  ): Promise<RolesListResponse> => {
    if (!config.useMock) {
      const queryParams: Record<string, unknown> = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.includeSystem !== undefined) queryParams.includeSystem = params.includeSystem;

      const raw = await iamClient.get<Role[] | { data: Role[]; total: number }>(
        "/roles",
        { params: queryParams },
      );

      // Backend returns a plain array; guard against wrapped shape too
      const roles = Array.isArray(raw) ? raw : ((raw as { data: Role[] }).data ?? []);
      return { data: roles, total: roles.length };
    }

    await delay();

    let result = [...mockRoles];

    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.description?.toLowerCase().includes(search),
      );
    }

    if (params?.includeSystem === false) {
      result = result.filter((r) => !r.isSystem);
    }

    const total = result.length;
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);

    return { data: result, total };
  },

  /**
   * Get role by ID
   */
  get: async (id: string): Promise<Role> => {
    if (!config.useMock) {
      return await iamClient.get<Role>(`/roles/${id}`);
    }

    await delay();
    const role = mockRoles.find((r) => r.id === id);
    if (!role) throw new Error("Role not found");
    return role;
  },

  /**
   * Create a new role
   */
  create: async (data: CreateRoleRequest): Promise<{ id: string }> => {
    if (!config.useMock) {
      return await iamClient.post<{ id: string }>("/roles", data);
    }

    await delay();
    const now = new Date().toISOString();
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: data.name,
      description: data.description,
      isSystem: false,
      permissions: [],
      createdAt: now,
      updatedAt: now,
    };
    mockRoles.unshift(newRole);
    rolePermissionMap[newRole.id] = [];
    return { id: newRole.id };
  },

  /**
   * Update role
   */
  update: async (id: string, data: UpdateRoleRequest): Promise<void> => {
    if (!config.useMock) {
      await iamClient.patch<void>(`/roles/${id}`, data);
      return;
    }

    await delay();
    const index = mockRoles.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Role not found");
    mockRoles[index] = {
      ...mockRoles[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Delete role
   */
  delete: async (id: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.delete<void>(`/roles/${id}`);
      return;
    }

    await delay();
    const index = mockRoles.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Role not found");
    if (mockRoles[index].isSystem) throw new Error("Cannot delete system role");
    mockRoles.splice(index, 1);
    delete rolePermissionMap[id];
  },

  /**
   * Get role permissions
   */
  getPermissions: async (id: string): Promise<PermissionsListResponse> => {
    if (!config.useMock) {
      const raw = await iamClient.get<Permission[]>(`/roles/${id}/permissions`);
      return { data: Array.isArray(raw) ? raw : (raw as any).data || [] };
    }

    await delay();
    const role = mockRoles.find((r) => r.id === id);
    if (!role) throw new Error("Role not found");
    return { data: role.permissions || [] };
  },

  /**
   * Assign permission to role
   */
  assignPermission: async (
    roleId: string,
    permissionId: string,
  ): Promise<void> => {
    if (!config.useMock) {
      await iamClient.post<void>(`/roles/${roleId}/permissions/${permissionId}`);
      return;
    }

    await delay();
    const roleIndex = mockRoles.findIndex((r) => r.id === roleId);
    if (roleIndex === -1) throw new Error("Role not found");

    const permission = MOCK_PERMISSIONS.find((p) => p.id === permissionId);
    if (!permission) throw new Error("Permission not found");

    const role = mockRoles[roleIndex];
    if (!role.permissions) role.permissions = [];
    if (!role.permissions.find((p) => p.id === permissionId)) {
      role.permissions.push(permission);
    }

    if (!rolePermissionMap[roleId]) rolePermissionMap[roleId] = [];
    if (!rolePermissionMap[roleId].includes(permissionId)) {
      rolePermissionMap[roleId].push(permissionId);
    }
  },

  /**
   * Remove permission from role
   */
  removePermission: async (
    roleId: string,
    permissionId: string,
  ): Promise<void> => {
    if (!config.useMock) {
      await iamClient.delete<void>(`/roles/${roleId}/permissions/${permissionId}`);
      return;
    }

    await delay();
    const roleIndex = mockRoles.findIndex((r) => r.id === roleId);
    if (roleIndex === -1) throw new Error("Role not found");

    const role = mockRoles[roleIndex];
    if (role.permissions) {
      role.permissions = role.permissions.filter((p) => p.id !== permissionId);
    }

    if (rolePermissionMap[roleId]) {
      rolePermissionMap[roleId] = rolePermissionMap[roleId].filter(
        (id) => id !== permissionId,
      );
    }
  },

  /**
   * Get users with this role
   */
  getUsers: async (id: string): Promise<UsersListResponse> => {
    if (!config.useMock) {
      const raw = await iamClient.get<{ data: User[] }>(`/roles/${id}/users`);
      return { data: raw.data };
    }

    await delay();
    const userIds = Object.entries(MOCK_USER_ROLES)
      .filter(([, roleIds]) => roleIds.includes(id))
      .map(([userId]) => userId);
    const users = MOCK_USERS.filter((u) => userIds.includes(u.id));
    return { data: users };
  },
};

export default rolesApi;
