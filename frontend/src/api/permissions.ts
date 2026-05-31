/**
 * Permissions API functions for TelemetryFlow Platform
 * Uses mock data when config.useMock=true; calls real backend otherwise.
 */

import { MOCK_PERMISSIONS } from "@/mocks";
import { config } from "@/config";
import { iamClient } from "./iam";
import type {
  Permission,
  CreatePermissionRequest,
  IAMListParams,
} from "@/types";

// Local state for mock data (to support CRUD operations)
const mockPermissions = [...MOCK_PERMISSIONS];

interface PermissionsListResponse {
  data: Permission[];
  total: number;
}

// Simulate API delay
const delay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const permissionsApi = {
  /**
   * List permissions with pagination
   */
  list: async (
    params?: IAMListParams & { resource?: string },
  ): Promise<PermissionsListResponse> => {
    if (!config.useMock) {
      const queryParams: Record<string, unknown> = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.resource) queryParams.resource = params.resource;

      const raw = await iamClient.get<{
        data: Permission[];
        total: number;
      }>("/permissions", { params: queryParams });

      return { data: raw.data, total: raw.total };
    }

    await delay();

    let result = [...mockPermissions];

    if (params?.resource) {
      result = result.filter((p) => p.resource === params.resource);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.resource.toLowerCase().includes(search),
      );
    }

    const total = result.length;
    const page = params?.page || 1;
    const limit = params?.limit || 200;
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);

    return { data: result, total };
  },

  /**
   * Get permission by ID
   */
  get: async (id: string): Promise<Permission> => {
    if (!config.useMock) {
      return await iamClient.get<Permission>(`/permissions/${id}`);
    }

    await delay();
    const permission = mockPermissions.find((p) => p.id === id);
    if (!permission) throw new Error("Permission not found");
    return permission;
  },

  /**
   * Create a new permission
   */
  create: async (data: CreatePermissionRequest): Promise<{ id: string }> => {
    if (!config.useMock) {
      return await iamClient.post<{ id: string }>("/permissions", data);
    }

    await delay();
    const now = new Date().toISOString();
    const newPermission: Permission = {
      id: `perm-${Date.now()}`,
      name: data.name,
      description: data.description,
      resource: data.resource,
      action: data.action,
      createdAt: now,
      updatedAt: now,
    };
    mockPermissions.unshift(newPermission);
    return { id: newPermission.id };
  },

  /**
   * Update permission
   */
  update: async (
    id: string,
    data: Partial<CreatePermissionRequest>,
  ): Promise<void> => {
    if (!config.useMock) {
      await iamClient.patch<void>(`/permissions/${id}`, data);
      return;
    }

    await delay();
    const index = mockPermissions.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Permission not found");
    mockPermissions[index] = {
      ...mockPermissions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Delete permission
   */
  delete: async (id: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.delete<void>(`/permissions/${id}`);
      return;
    }

    await delay();
    const index = mockPermissions.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Permission not found");
    mockPermissions.splice(index, 1);
  },

  /**
   * Get permissions by resource
   */
  getByResource: async (resource: string): Promise<PermissionsListResponse> => {
    if (!config.useMock) {
      const raw = await iamClient.get<{
        data: Permission[];
        total: number;
      }>("/permissions", { params: { resource } });
      return { data: raw.data, total: raw.total };
    }

    await delay();
    const result = mockPermissions.filter((p) => p.resource === resource);
    return { data: result, total: result.length };
  },

  /**
   * Get unique resources
   */
  getResources: async (): Promise<string[]> => {
    if (!config.useMock) {
      return await iamClient.get<string[]>("/permissions/resources");
    }

    await delay();
    const resources = [...new Set(mockPermissions.map((p) => p.resource))];
    return resources.sort();
  },
};

export default permissionsApi;
