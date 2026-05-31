/**
 * Organizations API functions for TelemetryFlow Platform
 * Uses mock data for development/demo mode; calls real backend in production.
 */

import { MOCK_ORGANIZATIONS } from "@/mocks";
import { config } from "@/config";
import { iamClient } from "./iam";
import type {
  Organization,
  IAMPaginatedResponse,
  IAMListParams,
} from "@/types";

// Local state for mock data (to support CRUD operations)
const mockOrganizations = [...MOCK_ORGANIZATIONS];

export interface CreateOrganizationRequest {
  name: string;
  slug?: string;
  description?: string;
  regionId: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  description?: string;
}

export interface OrganizationListParams extends IAMListParams {
  regionId?: string;
}

// Simulate API delay
const delay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Shape returned by backend GET /organizations */
interface BackendOrganization {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  domain?: string;
  isActive: boolean;
  regionId: string;
  createdAt?: string;
  updatedAt?: string;
}

function backendOrgToFrontend(o: BackendOrganization): Organization {
  return {
    id: o.organizationId,
    name: o.name,
    slug: o.code,
    description: o.description,
    regionId: o.regionId,
    createdAt: o.createdAt || "",
    updatedAt: o.updatedAt || "",
  };
}

export const organizationsApi = {
  /**
   * List all organizations with pagination
   */
  list: async (
    params?: OrganizationListParams,
  ): Promise<IAMPaginatedResponse<Organization>> => {
    if (!config.useMock) {
      const queryParams: Record<string, unknown> = {};
      if (params?.regionId) queryParams.regionId = params.regionId;

      const raw = await iamClient.get<BackendOrganization[]>("/tenancy/organizations", {
        params: queryParams,
      });

      let result = raw.map(backendOrgToFrontend);

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (o) =>
            o.name.toLowerCase().includes(search) ||
            o.slug.toLowerCase().includes(search),
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

    let result = [...mockOrganizations];

    // Filter by regionId
    if (params?.regionId) {
      result = result.filter((o) => o.regionId === params.regionId);
    }

    // Filter by search
    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(search) ||
          o.slug.toLowerCase().includes(search),
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
   * Get a single organization by ID
   */
  get: async (id: string): Promise<Organization> => {
    if (!config.useMock) {
      const raw = await iamClient.get<BackendOrganization>(`/tenancy/organizations/${id}`);
      return backendOrgToFrontend(raw);
    }
    await delay();
    const org = mockOrganizations.find((o) => o.id === id);
    if (!org) throw new Error("Organization not found");
    return org;
  },

  /**
   * Create a new organization
   */
  create: async (data: CreateOrganizationRequest): Promise<Organization> => {
    if (!config.useMock) {
      const raw = await iamClient.post<BackendOrganization>("/tenancy/organizations", {
        name: data.name,
        code: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: data.description,
        regionId: data.regionId,
      });
      return backendOrgToFrontend(raw);
    }
    await delay();
    const now = new Date().toISOString();
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: data.description,
      regionId: data.regionId,
      createdAt: now,
      updatedAt: now,
    };
    mockOrganizations.unshift(newOrg);
    return newOrg;
  },

  /**
   * Update an organization
   */
  update: async (
    id: string,
    data: UpdateOrganizationRequest,
  ): Promise<Organization> => {
    if (!config.useMock) {
      const body: Record<string, unknown> = {};
      if (data.name !== undefined) body.name = data.name;
      if (data.slug !== undefined) body.code = data.slug;
      if (data.description !== undefined) body.description = data.description;
      const raw = await iamClient.patch<BackendOrganization>(`/tenancy/organizations/${id}`, body);
      return backendOrgToFrontend(raw);
    }
    await delay();
    const index = mockOrganizations.findIndex((o) => o.id === id);
    if (index === -1) throw new Error("Organization not found");
    mockOrganizations[index] = {
      ...mockOrganizations[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockOrganizations[index];
  },

  /**
   * Delete an organization
   */
  delete: async (id: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.delete(`/tenancy/organizations/${id}`);
      return;
    }
    await delay();
    const index = mockOrganizations.findIndex((o) => o.id === id);
    if (index === -1) throw new Error("Organization not found");
    mockOrganizations.splice(index, 1);
  },
};

export default organizationsApi;
