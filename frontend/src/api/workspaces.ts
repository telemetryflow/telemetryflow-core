/**
 * Workspaces API functions for TelemetryFlow Platform
 * Uses mock data for development/demo mode; calls real backend in production.
 */

import { MOCK_WORKSPACES } from "@/mocks";
import { config } from "@/config";
import { iamClient } from "./iam";
import type { Workspace, IAMPaginatedResponse, IAMListParams } from "@/types";

// Local state for mock data (to support CRUD operations)
const mockWorkspaces = [...MOCK_WORKSPACES];

export interface CreateWorkspaceRequest {
  name: string;
  slug?: string;
  description?: string;
  organizationId: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  slug?: string;
  description?: string;
}

export interface WorkspaceListParams extends IAMListParams {
  organizationId?: string;
}

// Simulate API delay
const delay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Shape returned by backend GET /iam/workspaces */
interface BackendWorkspace {
  workspaceId: string;
  name: string;
  code: string;
  description?: string;
  organizationId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function backendWsToFrontend(w: BackendWorkspace): Workspace {
  return {
    id: w.workspaceId,
    name: w.name,
    slug: w.code,
    description: w.description,
    organizationId: w.organizationId,
    createdAt: w.createdAt || "",
    updatedAt: w.updatedAt || "",
  };
}

export const workspacesApi = {
  /**
   * List all workspaces with pagination
   */
  list: async (
    params?: WorkspaceListParams,
  ): Promise<IAMPaginatedResponse<Workspace>> => {
    if (!config.useMock) {
      const queryParams: Record<string, unknown> = {};
      if (params?.organizationId) queryParams.organizationId = params.organizationId;

      const raw = await iamClient.get<BackendWorkspace[]>("/tenancy/workspaces", {
        params: queryParams,
      });

      let result = raw.map(backendWsToFrontend);

      if (params?.search) {
        const search = params.search.toLowerCase();
        result = result.filter(
          (w) =>
            w.name.toLowerCase().includes(search) ||
            w.slug.toLowerCase().includes(search),
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

    let result = [...mockWorkspaces];

    // Filter by organizationId
    if (params?.organizationId) {
      result = result.filter((w) => w.organizationId === params.organizationId);
    }

    // Filter by search
    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(search) ||
          w.slug.toLowerCase().includes(search),
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
   * Get a single workspace by ID
   */
  get: async (id: string): Promise<Workspace> => {
    if (!config.useMock) {
      const raw = await iamClient.get<BackendWorkspace>(`/tenancy/workspaces/${id}`);
      return backendWsToFrontend(raw);
    }
    await delay();
    const ws = mockWorkspaces.find((w) => w.id === id);
    if (!ws) throw new Error("Workspace not found");
    return ws;
  },

  /**
   * Create a new workspace
   */
  create: async (data: CreateWorkspaceRequest): Promise<Workspace> => {
    if (!config.useMock) {
      const raw = await iamClient.post<BackendWorkspace>("/tenancy/workspaces", {
        name: data.name,
        code: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: data.description,
        organizationId: data.organizationId,
      });
      return backendWsToFrontend(raw);
    }
    await delay();
    const now = new Date().toISOString();
    const newWorkspace: Workspace = {
      id: `ws-${Date.now()}`,
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: data.description,
      organizationId: data.organizationId,
      createdAt: now,
      updatedAt: now,
    };
    mockWorkspaces.unshift(newWorkspace);
    return newWorkspace;
  },

  /**
   * Update a workspace
   */
  update: async (
    id: string,
    data: UpdateWorkspaceRequest,
  ): Promise<Workspace> => {
    if (!config.useMock) {
      const body: Record<string, unknown> = {};
      if (data.name !== undefined) body.name = data.name;
      if (data.slug !== undefined) body.code = data.slug;
      if (data.description !== undefined) body.description = data.description;
      const raw = await iamClient.patch<BackendWorkspace>(`/tenancy/workspaces/${id}`, body);
      return backendWsToFrontend(raw);
    }
    await delay();
    const index = mockWorkspaces.findIndex((w) => w.id === id);
    if (index === -1) throw new Error("Workspace not found");
    mockWorkspaces[index] = {
      ...mockWorkspaces[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return mockWorkspaces[index];
  },

  /**
   * Delete a workspace
   */
  delete: async (id: string): Promise<void> => {
    if (!config.useMock) {
      await iamClient.delete(`/tenancy/workspaces/${id}`);
      return;
    }
    await delay();
    const index = mockWorkspaces.findIndex((w) => w.id === id);
    if (index === -1) throw new Error("Workspace not found");
    mockWorkspaces.splice(index, 1);
  },
};

export default workspacesApi;
