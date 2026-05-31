/**
 * Users API functions for TelemetryFlow Platform
 * Uses mock data in development/demo mode; calls real backend in production.
 */

import { MOCK_USERS, MOCK_ROLES, MOCK_USER_ROLES } from "@/mocks";
import { config } from "@/config";
import { iamClient } from "./iam";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Role,
  Permission,
  IAMListParams,
} from "@/types";

// Local state for mock data (to support CRUD operations)
const mockUsers = [...MOCK_USERS];

export interface UsersListParams extends IAMListParams {
  organizationId?: string;
  workspaceId?: string;
  tenantId?: string;
  isActive?: boolean;
}

export interface UsersListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RolesListResponse {
  data: Role[];
}

export interface PermissionsListResponse {
  data: Permission[];
}

interface BackendUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  mfaEnabled: boolean;
  isActive: boolean;
  emailVerified: boolean;
  organizationId?: string;
  tenantId?: string;
  createdAt: string;
}

function backendUserToFrontend(u: BackendUser): User {
  return {
    id: u.id,
    username: u.email.split("@")[0],
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    isActive: u.isActive,
    avatar: u.avatar,
    timezone: "UTC",
    locale: "en-US",
    mfaEnabled: u.mfaEnabled,
    emailVerified: u.emailVerified,
    organizationId: u.organizationId,
    tenantId: u.tenantId,
    loginCount: 0,
    createdAt: u.createdAt,
    updatedAt: u.createdAt,
  };
}

// Simulate API delay
const delay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const usersApi = {
  /**
   * List users with pagination and filters
   */
  list: async (params?: UsersListParams): Promise<UsersListResponse> => {
    if (!config.useMock) {
      const queryParams: Record<string, unknown> = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.organizationId) queryParams.organizationId = params.organizationId;
      if (params?.workspaceId) queryParams.workspaceId = params.workspaceId;
      if (params?.tenantId) queryParams.tenantId = params.tenantId;
      if (params?.isActive !== undefined) queryParams.isActive = params.isActive;

      const raw = await iamClient.get<{
        data: BackendUser[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>("/users", { params: queryParams });

      return {
        data: raw.data.map(backendUserToFrontend),
        total: raw.total,
        page: raw.page,
        limit: raw.limit,
        totalPages: raw.totalPages,
      };
    }

    await delay();
    let result = [...mockUsers];

    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(search) ||
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search),
      );
    }
    if (params?.organizationId) {
      result = result.filter((u) => u.organizationId === params.organizationId);
    }
    if (params?.tenantId) {
      result = result.filter((u) => u.tenantId === params.tenantId);
    }
    if (params?.isActive !== undefined) {
      result = result.filter((u) => u.isActive === params.isActive);
    }

    const total = result.length;
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);

    return { data: result, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Get user by ID
   */
  get: async (id: string): Promise<User> => {
    if (!config.useMock) {
      const raw = await iamClient.get<BackendUser>(`/users/${id}`);
      return backendUserToFrontend(raw);
    }
    await delay();
    const user = mockUsers.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    return user;
  },

  /**
   * Create a new user (admin)
   */
  create: async (data: CreateUserRequest): Promise<{ id: string }> => {
    if (!config.useMock) {
      const result = await iamClient.post<{ id: string }>("/users", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationId: data.organizationId,
        workspaceId: data.workspaceId,
        tenantId: data.tenantId,
        roleId: data.roleId,
        sendEmailVerification: data.sendEmailVerification ?? false,
      });
      return result;
    }
    await delay();
    const now = new Date().toISOString();
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: data.username || data.email.split("@")[0],
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: true,
      avatar: undefined,
      timezone: "Asia/Jakarta",
      locale: "id-ID",
      lastLoginAt: undefined,
      loginCount: 0,
      mfaEnabled: false,
      emailVerified: false,
      organizationId: data.organizationId,
      tenantId: data.tenantId,
      createdAt: now,
      updatedAt: now,
    };
    mockUsers.unshift(newUser);
    return { id: newUser.id };
  },

  /**
   * Update user profile fields
   */
  update: async (id: string, data: UpdateUserRequest): Promise<void> => {
    if (!config.useMock) {
      await iamClient.put(`/users/${id}`, data);
      return;
    }
    await delay();
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    mockUsers[index] = { ...mockUsers[index], ...data, updatedAt: new Date().toISOString() };
  },

  /**
   * Delete user (soft-delete)
   */
  delete: async (id: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.delete(`/users/${id}`);
      return;
    }
    await delay();
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    mockUsers.splice(index, 1);
  },

  /**
   * Activate user account
   */
  activate: async (id: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.post(`/users/${id}/activate`);
      return;
    }
    await delay();
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    mockUsers[index].isActive = true;
    mockUsers[index].updatedAt = new Date().toISOString();
  },

  /**
   * Deactivate user account
   */
  deactivate: async (id: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.post(`/users/${id}/deactivate`);
      return;
    }
    await delay();
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    mockUsers[index].isActive = false;
    mockUsers[index].updatedAt = new Date().toISOString();
  },

  /**
   * Admin reset user password
   */
  resetPassword: async (id: string, password: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.put(`/users/${id}/password`, { password });
      return;
    }
    await delay();
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("User not found");
    mockUsers[index].updatedAt = new Date().toISOString();
  },

  /**
   * Send/re-send verification email to user
   */
  sendVerificationEmail: async (id: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.post("/auth/email/send-verification", { userId: id });
      return;
    }
    await delay();
  },

  /**
   * Get roles assigned to a user
   */
  getRoles: async (id: string): Promise<RolesListResponse> => {
    if (!config.useMock) {
      const raw = await iamClient.get<Role[]>(`/users/${id}/roles`);
      return { data: raw };
    }
    await delay();
    const roleIds = MOCK_USER_ROLES[id] || [];
    const roles = MOCK_ROLES.filter((r) => roleIds.includes(r.id));
    return { data: roles };
  },

  /**
   * Assign role to user
   */
  assignRole: async (userId: string, roleId: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.post(`/users/${userId}/roles`, { roleId });
      return;
    }
    await delay();
    if (!MOCK_USER_ROLES[userId]) MOCK_USER_ROLES[userId] = [];
    if (!MOCK_USER_ROLES[userId].includes(roleId)) MOCK_USER_ROLES[userId].push(roleId);
  },

  /**
   * Revoke role from user
   */
  revokeRole: async (userId: string, roleId: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.delete(`/users/${userId}/roles/${roleId}`);
      return;
    }
    await delay();
    if (MOCK_USER_ROLES[userId]) {
      MOCK_USER_ROLES[userId] = MOCK_USER_ROLES[userId].filter((id) => id !== roleId);
    }
  },

  /**
   * Get permissions assigned to a user
   */
  getPermissions: async (id: string): Promise<PermissionsListResponse> => {
    if (!config.useMock) {
      const raw = await iamClient.get<Permission[]>(`/users/${id}/permissions`);
      return { data: raw };
    }
    await delay();
    const roleIds = MOCK_USER_ROLES[id] || [];
    const roles = MOCK_ROLES.filter((r) => roleIds.includes(r.id));
    const permissions = roles.flatMap((r) => r.permissions || []);
    const uniquePermissions = permissions.filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
    );
    return { data: uniquePermissions };
  },

  /**
   * Assign direct permission to user
   */
  assignPermission: async (userId: string, permissionId: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.post(`/users/${userId}/permissions`, { permissionId });
      return;
    }
    await delay();
  },

  /**
   * Revoke direct permission from user
   */
  revokePermission: async (userId: string, permissionId: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.delete(`/users/${userId}/permissions/${permissionId}`);
      return;
    }
    await delay();
  },
};

export default usersApi;
