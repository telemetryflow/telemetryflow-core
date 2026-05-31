/**
 * Tenants API functions for TelemetryFlow Platform
 * Uses mock data for development/demo mode; calls real backend in production.
 */

import { MOCK_TENANTS } from "@/mocks";
import { config } from "@/config";
import { iamClient } from "./iam";
import type { Tenant, IAMPaginatedResponse, IAMListParams } from "@/types";

// Local state for mock data (to support CRUD operations)
const mockTenants = [...MOCK_TENANTS];

export interface CreateTenantRequest {
  name: string;
  slug?: string;
  description?: string;
  workspaceId: string;
}

export interface UpdateTenantRequest {
  name?: string;
  slug?: string;
  description?: string;
}

export interface TenantListParams extends IAMListParams {
  workspaceId?: string;
}

// Simulate API delay
const delay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Shape returned by backend GET /iam/tenants */
interface BackendTenant {
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  domain?: string;
  workspaceId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function backendTenantToFrontend(t: BackendTenant): Tenant {
  return {
    id: t.tenantId,
    name: t.name,
    slug: t.code,
    description: t.description,
    workspaceId: t.workspaceId,
    createdAt: t.createdAt || "",
    updatedAt: t.updatedAt || "",
  };
}

export const tenantsApi = {
  /**
   * List all tenants with pagination
   */
  list: async (
    params?: TenantListParams,
  ): Promise<IAMPaginatedResponse<Tenant>> => {
    if (!config.useMock) {
      const queryParams: Record<string, unknown> = {};
      if (params?.workspaceId) queryParams.workspaceId = params.workspaceId;

      const raw = await iamClient.get<BackendTenant[]>("/tenancy/tenants", {
        params: queryParams,
      });

      let result = raw.map(backendTenantToFrontend);

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (t) =>
            t.name.toLowerCase().includes(search) ||
            t.slug.toLowerCase().includes(search),
        );
      }

      const total = result.length;
      const page = params?.page || 1;
      const limit = params?.limit || 100;
      const start = (page - 1) * limit;
      return {
        data: result.slice(start, start + limit),
        total,
        page,
        pageSize: limit,
      };
    }

    await delay();

    let result = [...mockTenants];

    // Filter by workspaceId
    if (params?.workspaceId) {
      result = result.filter((t) => t.workspaceId === params.workspaceId);
    }

    // Filter by search
    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.slug.toLowerCase().includes(search),
      );
    }

    const total = result.length;

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);

    return {
      data: result,
      total,
      page,
      pageSize: limit,
    };
  },

  /**
   * Get a single tenant by ID
   */
  get: async (id: string): Promise<Tenant> => {
    if (!config.useMock) {
      const raw = await iamClient.get<BackendTenant>(`/tenancy/tenants/${id}`);
      return backendTenantToFrontend(raw);
    }
    await delay();
    const tenant = mockTenants.find((t) => t.id === id);
    if (!tenant) throw new Error("Tenant not found");
    return tenant;
  },

  /**
   * Create a new tenant
   */
  create: async (data: CreateTenantRequest): Promise<Tenant> => {
    if (!config.useMock) {
      const raw = await iamClient.post<BackendTenant>("/tenancy/tenants", {
        name: data.name,
        code: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: data.description,
        workspaceId: data.workspaceId,
      });
      return backendTenantToFrontend(raw);
    }
    await delay();
    const now = new Date().toISOString();
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: data.description,
      workspaceId: data.workspaceId,
      createdAt: now,
      updatedAt: now,
    };
    mockTenants.unshift(newTenant);
    return newTenant;
  },

  /**
   * Update a tenant
   */
  update: async (id: string, data: UpdateTenantRequest): Promise<Tenant> => {
    if (!config.useMock) {
      const body: Record<string, unknown> = {};
      if (data.name !== undefined) body.name = data.name;
      if (data.slug !== undefined) body.code = data.slug;
      if (data.description !== undefined) body.description = data.description;
      const raw = await iamClient.patch<BackendTenant>(`/tenancy/tenants/${id}`, body);
      return backendTenantToFrontend(raw);
    }
    await delay();
    const index = mockTenants.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Tenant not found");
    mockTenants[index] = {
      ...mockTenants[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockTenants[index];
  },

  /**
   * Delete a tenant
   */
  delete: async (id: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.delete(`/tenancy/tenants/${id}`);
      return;
    }
    await delay();
    const index = mockTenants.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Tenant not found");
    mockTenants.splice(index, 1);
  },
};

export default tenantsApi;
