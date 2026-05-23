/**
 * Retention Policy API client
 * TASK-10: Frontend API client for Retention module
 */

import { iamClient } from "./iam";
import { config } from "@/config";
import type {
  RetentionPolicy,
  RetentionPolicyResponse,
  RetentionStatistics,
  RetentionStatisticsResponse,
  EnforceRetentionResult,
  EnforceRetentionResultResponse,
  CreateRetentionPolicyRequest,
  UpdateRetentionPolicyRequest,
  ListRetentionPoliciesQuery,
  EnforceRetentionRequest,
  DataType,
} from "@/types/retention";
import {
  transformRetentionPolicy,
  transformRetentionStatistics,
  transformEnforceResult,
} from "@/types/retention";

// ==================== ENDPOINTS ====================
// Relative to iamClient baseURL (config.iamApiUrl/api/v2)

export const RETENTION_ENDPOINTS = {
  BASE: "/retention/policies",
  SINGLE: (id: string) => `/retention/policies/${id}`,
  STATISTICS: "/retention/policies/statistics",
  ENFORCE: "/retention/policies/enforce",
  ACTIVATE: (id: string) => `/retention/policies/${id}/activate`,
  DEACTIVATE: (id: string) => `/retention/policies/${id}/deactivate`,
} as const;

// ==================== MOCK DATA ====================

function generateMockPolicies(): RetentionPolicy[] {
  const now = Date.now();
  const dataTypes: DataType[] = [
    "logs",
    "metrics",
    "traces",
    "alerts",
    "exemplars",
  ];

  const policies: RetentionPolicy[] = [];

  // Generate default policies (one per data type)
  dataTypes.forEach((dataType, index) => {
    policies.push({
      id: `policy-default-${dataType}`,
      name: `Default ${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Retention`,
      description: `System default retention policy for ${dataType}`,
      dataType,
      retentionDays: [30, 90, 30, 90, 30][index],
      archiveEnabled: false,
      isDefault: true,
      isActive: true,
      createdAt: now - 365 * 24 * 60 * 60 * 1000,
      updatedAt: now - 30 * 24 * 60 * 60 * 1000,
    });
  });

  // Generate custom policies
  policies.push({
    id: `policy-custom-1`,
    name: "Production Logs 90 Days",
    description: "Extended retention for production logs with archiving",
    dataType: "logs",
    retentionDays: 90,
    archiveEnabled: true,
    archiveDestination: "s3://telemetryflow-archive/logs/production",
    filters: { env: "production" },
    isDefault: false,
    isActive: true,
    organizationId: "org-devopscorner",
    lastEnforcedAt: now - 24 * 60 * 60 * 1000,
    createdAt: now - 60 * 24 * 60 * 60 * 1000,
    updatedAt: now - 7 * 24 * 60 * 60 * 1000,
  });

  policies.push({
    id: `policy-custom-2`,
    name: "Critical Metrics 1 Year",
    description: "Long-term retention for critical metrics",
    dataType: "metrics",
    retentionDays: 365,
    archiveEnabled: true,
    archiveDestination: "s3://telemetryflow-archive/metrics/critical",
    filters: { severity: "critical" },
    isDefault: false,
    isActive: true,
    organizationId: "org-devopscorner",
    lastEnforcedAt: now - 12 * 60 * 60 * 1000,
    createdAt: now - 45 * 24 * 60 * 60 * 1000,
    updatedAt: now - 3 * 24 * 60 * 60 * 1000,
  });

  policies.push({
    id: `policy-custom-3`,
    name: "Development Traces 7 Days",
    description: "Short retention for development traces",
    dataType: "traces",
    retentionDays: 7,
    archiveEnabled: false,
    filters: { env: "development" },
    isDefault: false,
    isActive: true,
    organizationId: "org-devopscorner",
    createdAt: now - 30 * 24 * 60 * 60 * 1000,
    updatedAt: now - 10 * 24 * 60 * 60 * 1000,
  });

  policies.push({
    id: `policy-custom-4`,
    name: "Disabled Alert Policy",
    description: "Inactive policy for alerts",
    dataType: "alerts",
    retentionDays: 60,
    archiveEnabled: false,
    isDefault: false,
    isActive: false,
    organizationId: "org-devopscorner",
    createdAt: now - 20 * 24 * 60 * 60 * 1000,
    updatedAt: now - 5 * 24 * 60 * 60 * 1000,
  });

  return policies;
}

function generateMockStatistics(): RetentionStatistics[] {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  return [
    {
      dataType: "logs",
      totalRecords: 125847392,
      oldestRecord: now - 90 * oneDay,
      newestRecord: now - 5 * 60 * 1000,
      estimatedSize: "156.8 GB",
      retentionPolicy: {
        name: "Default Logs Retention",
        retentionDays: 30,
        cutoffDate: now - 30 * oneDay,
      },
      recordsToDelete: 42583921,
      estimatedSizeToDelete: "52.3 GB",
    },
    {
      dataType: "metrics",
      totalRecords: 892741563,
      oldestRecord: now - 180 * oneDay,
      newestRecord: now - 60 * 1000,
      estimatedSize: "312.5 GB",
      retentionPolicy: {
        name: "Default Metrics Retention",
        retentionDays: 90,
        cutoffDate: now - 90 * oneDay,
      },
      recordsToDelete: 156283451,
      estimatedSizeToDelete: "54.7 GB",
    },
    {
      dataType: "traces",
      totalRecords: 45892173,
      oldestRecord: now - 45 * oneDay,
      newestRecord: now - 2 * 60 * 1000,
      estimatedSize: "89.2 GB",
      retentionPolicy: {
        name: "Default Traces Retention",
        retentionDays: 30,
        cutoffDate: now - 30 * oneDay,
      },
      recordsToDelete: 12847362,
      estimatedSizeToDelete: "24.8 GB",
    },
    {
      dataType: "alerts",
      totalRecords: 284731,
      oldestRecord: now - 365 * oneDay,
      newestRecord: now - 30 * 60 * 1000,
      estimatedSize: "1.2 GB",
      retentionPolicy: {
        name: "Default Alerts Retention",
        retentionDays: 90,
        cutoffDate: now - 90 * oneDay,
      },
      recordsToDelete: 84231,
      estimatedSizeToDelete: "356 MB",
    },
    {
      dataType: "exemplars",
      totalRecords: 1284573,
      oldestRecord: now - 60 * oneDay,
      newestRecord: now - 10 * 60 * 1000,
      estimatedSize: "4.5 GB",
      retentionPolicy: {
        name: "Default Exemplars Retention",
        retentionDays: 30,
        cutoffDate: now - 30 * oneDay,
      },
      recordsToDelete: 428571,
      estimatedSizeToDelete: "1.5 GB",
    },
  ];
}

// ==================== API CLIENT ====================

export const retentionApi = {
  /**
   * List retention policies
   */
  async listPolicies(
    query: ListRetentionPoliciesQuery = {},
  ): Promise<RetentionPolicy[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let policies = generateMockPolicies();

      if (query.dataType) {
        policies = policies.filter((p) => p.dataType === query.dataType);
      }

      if (query.includeDefaults === false) {
        policies = policies.filter((p) => !p.isDefault);
      }

      return policies;
    }

    const response = await iamClient.get<RetentionPolicyResponse[]>(
      RETENTION_ENDPOINTS.BASE,
      {
        params: {
          dataType: query.dataType,
          includeDefaults: query.includeDefaults,
        },
      },
    );

    return response.map(transformRetentionPolicy);
  },

  /**
   * Get a retention policy by ID
   */
  async getPolicy(id: string): Promise<RetentionPolicy> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const policies = generateMockPolicies();
      const policy = policies.find((p) => p.id === id);
      if (!policy) {
        throw new Error("Policy not found");
      }
      return policy;
    }

    const response = await iamClient.get<RetentionPolicyResponse>(
      RETENTION_ENDPOINTS.SINGLE(id),
    );
    return transformRetentionPolicy(response);
  },

  /**
   * Create a retention policy
   */
  async createPolicy(
    data: CreateRetentionPolicyRequest,
  ): Promise<RetentionPolicy> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const now = Date.now();

      return {
        id: `policy-${now}`,
        name: data.name,
        description: data.description,
        dataType: data.dataType,
        retentionDays: data.retentionDays,
        archiveEnabled: data.archiveEnabled || false,
        archiveDestination: data.archiveDestination,
        filters: data.filters,
        isDefault: false,
        isActive: true,
        organizationId: "org-devopscorner",
        createdAt: now,
        updatedAt: now,
      };
    }

    const response = await iamClient.post<RetentionPolicyResponse>(
      RETENTION_ENDPOINTS.BASE,
      {
        name: data.name,
        description: data.description,
        dataType: data.dataType,
        retentionDays: data.retentionDays,
        archiveEnabled: data.archiveEnabled,
        archiveDestination: data.archiveDestination,
        filters: data.filters,
      },
    );

    return transformRetentionPolicy(response);
  },

  /**
   * Update a retention policy
   */
  async updatePolicy(
    id: string,
    data: UpdateRetentionPolicyRequest,
  ): Promise<RetentionPolicy> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const policies = generateMockPolicies();
      const policy = policies.find((p) => p.id === id);
      if (!policy) {
        throw new Error("Policy not found");
      }

      return {
        ...policy,
        name: data.name || policy.name,
        description: data.description ?? policy.description,
        retentionDays: data.retentionDays || policy.retentionDays,
        archiveEnabled: data.archiveEnabled ?? policy.archiveEnabled,
        archiveDestination:
          data.archiveDestination ?? policy.archiveDestination,
        filters: data.filters ?? policy.filters,
        isActive: data.isActive ?? policy.isActive,
        updatedAt: Date.now(),
      };
    }

    const response = await iamClient.put<RetentionPolicyResponse>(
      RETENTION_ENDPOINTS.SINGLE(id),
      {
        name: data.name,
        description: data.description,
        retentionDays: data.retentionDays,
        archiveEnabled: data.archiveEnabled,
        archiveDestination: data.archiveDestination,
        filters: data.filters,
        isActive: data.isActive,
      },
    );

    return transformRetentionPolicy(response);
  },

  /**
   * Delete a retention policy
   */
  async deletePolicy(id: string): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    await iamClient.delete(RETENTION_ENDPOINTS.SINGLE(id));
  },

  /**
   * Activate a retention policy
   */
  async activatePolicy(id: string): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    await iamClient.post(RETENTION_ENDPOINTS.ACTIVATE(id));
  },

  /**
   * Deactivate a retention policy
   */
  async deactivatePolicy(id: string): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }

    await iamClient.post(RETENTION_ENDPOINTS.DEACTIVATE(id));
  },

  /**
   * Get retention statistics
   */
  async getStatistics(dataType?: DataType): Promise<RetentionStatistics[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      let stats = generateMockStatistics();
      if (dataType) {
        stats = stats.filter((s) => s.dataType === dataType);
      }

      return stats;
    }

    const response = await iamClient.get<RetentionStatisticsResponse[]>(
      RETENTION_ENDPOINTS.STATISTICS,
      {
        params: { dataType },
      },
    );

    return response.map(transformRetentionStatistics);
  },

  /**
   * Enforce retention policies
   */
  async enforceRetention(
    data: EnforceRetentionRequest = {},
  ): Promise<EnforceRetentionResult[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const stats = generateMockStatistics();
      let results = stats.map((s) => ({
        dataType: s.dataType,
        recordsDeleted: data.dryRun ? 0 : s.recordsToDelete || 0,
        spaceReclaimed: data.dryRun ? "0 B" : s.estimatedSizeToDelete || "0 B",
        duration: Math.floor(Math.random() * 5000) + 1000,
        dryRun: data.dryRun || false,
      }));

      if (data.dataType) {
        results = results.filter((r) => r.dataType === data.dataType);
      }

      return results;
    }

    const response = await iamClient.post<EnforceRetentionResultResponse[]>(
      RETENTION_ENDPOINTS.ENFORCE,
      {
        dataType: data.dataType,
        dryRun: data.dryRun,
      },
    );

    return response.map(transformEnforceResult);
  },
};

export default retentionApi;
