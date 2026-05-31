/**
 * Regions API functions for TelemetryFlow Platform
 * Uses mock data for development/demo mode; calls real backend in production.
 */

import { MOCK_REGIONS } from "@/mocks";
import { config } from "@/config";
import { iamClient } from "./iam";
import type { Region, IAMPaginatedResponse, IAMListParams } from "@/types";

// Local state for mock data (to support CRUD operations)
const mockRegions = [...MOCK_REGIONS];

export interface CreateRegionRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateRegionRequest {
  name?: string;
  code?: string;
  description?: string;
}

// Simulate API delay
const delay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Shape returned by backend GET /iam/regions */
interface BackendRegion {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function backendRegionToFrontend(r: BackendRegion): Region {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    description: r.description,
    createdAt: r.createdAt ?? "",
    updatedAt: r.updatedAt ?? "",
  };
}

export const regionsApi = {
  /**
   * List all regions with pagination
   */
  list: async (
    params?: IAMListParams,
  ): Promise<IAMPaginatedResponse<Region>> => {
    if (!config.useMock) {
      const raw = await iamClient.get<BackendRegion[]>("/tenancy/regions");

      let result = raw.map(backendRegionToFrontend);

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (r) =>
            r.name.toLowerCase().includes(search) ||
            r.code.toLowerCase().includes(search),
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

    let result = [...mockRegions];

    // Filter by search
    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.code.toLowerCase().includes(search),
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
   * Get a single region by ID
   */
  get: async (id: string): Promise<Region> => {
    if (!config.useMock) {
      const raw = await iamClient.get<BackendRegion>(`/tenancy/regions/${id}`);
      return backendRegionToFrontend(raw);
    }
    await delay();
    const region = mockRegions.find((r) => r.id === id);
    if (!region) throw new Error("Region not found");
    return region;
  },

  /**
   * Create a new region
   */
  create: async (data: CreateRegionRequest): Promise<Region> => {
    if (!config.useMock) {
      const raw = await iamClient.post<BackendRegion>("/tenancy/regions", data);
      return backendRegionToFrontend(raw);
    }
    await delay();
    const now = new Date().toISOString();
    const newRegion: Region = {
      id: `region-${Date.now()}`,
      name: data.name,
      code: data.code,
      description: data.description,
      createdAt: now,
      updatedAt: now,
    };
    mockRegions.unshift(newRegion);
    return newRegion;
  },

  /**
   * Update a region
   */
  update: async (id: string, data: UpdateRegionRequest): Promise<Region> => {
    if (!config.useMock) {
      const raw = await iamClient.patch<BackendRegion>(`/tenancy/regions/${id}`, data);
      return backendRegionToFrontend(raw);
    }
    await delay();
    const index = mockRegions.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Region not found");
    mockRegions[index] = {
      ...mockRegions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockRegions[index];
  },

  /**
   * Delete a region
   */
  delete: async (id: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.delete(`/tenancy/regions/${id}`);
      return;
    }
    await delay();
    const index = mockRegions.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Region not found");
    mockRegions.splice(index, 1);
  },
};

export default regionsApi;
