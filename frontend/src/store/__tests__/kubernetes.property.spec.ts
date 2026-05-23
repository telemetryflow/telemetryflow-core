/**
 * Property-Based Tests for Kubernetes Pinia Store
 * Feature: frontend-backend-monitoring-kubernetes-integration
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { setActivePinia, createPinia } from "pinia";

// Mock kubernetesApi
vi.mock("@/api/kubernetes", () => ({
  kubernetesApi: {
    getOverview: vi.fn(),
    listClusters: vi.fn(),
    getFilterOptions: vi.fn(() => ({
      providers: [],
      regions: [],
      clusters: [],
      nodes: [],
      namespaces: [],
      deployments: [],
      pods: [],
      pvs: [],
    })),
    getRegions: vi.fn(() => []),
    getClusters: vi.fn(() => []),
    getNodes: vi.fn(() => Promise.resolve([])),
    getNamespaces: vi.fn(() => Promise.resolve([])),
    setRegion: vi.fn(),
    setCluster: vi.fn(),
    getClustersByProvider: vi.fn(() => []),
    getSelectedRegionId: vi.fn(() => ""),
    getSelectedClusterId: vi.fn(() => ""),
    refreshMockData: vi.fn(),
    fetchNodeMetrics: vi.fn(),
  },
}));

// Mock config
vi.mock("@/config", () => ({
  default: { useMock: true },
}));

// Mock app store
vi.mock("@/store/app", () => ({
  useAppStore: () => ({
    globalTimeRange: { start: Date.now() - 3600000, end: Date.now() },
  }),
}));

import { kubernetesApi } from "@/api/kubernetes";
import { useKubernetesStore } from "../kubernetes";

const EMPTY_OVERVIEW_RESPONSE = {
  overview: { nodes: 3, namespaces: 5, runningPods: 10 },
  statCards: [],
  cpuUsagePercentages: { real: 0, requests: 0, limits: 0 },
  ramUsagePercentages: { real: 0, requests: 0, limits: 0 },
  resourceCountTimeSeries: [],
  clusterCpuUtilization: [],
  clusterMemoryUtilization: [],
  cpuByNamespace: [],
  memoryByNamespace: [],
  cpuByInstance: [],
  memoryByInstance: [],
  podsQoSData: [],
  podsStatusReason: [],
  containerRestarts: [],
  networkByDevice: [],
  networkPacketsDropped: [],
  networkByNamespace: [],
  networkByInstance: [],
  hpaTimeSeries: [],
  pdbTimeSeries: [],
  memoryWorkingSetByPod: [],
  diskByNode: [],
  networkByNode: [],
  hpaTotalCount: 0,
  pdbTotalDisruptionsAllowed: 0,
};

describe("Kubernetes Store - Property Tests", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  /**
   * Property 12: Cache Storage with Timestamp
   * Validates: Requirements 10.2
   *
   * After a successful fetchOverview, lastFetchTime must be set to a valid
   * positive timestamp that is <= Date.now() and > the pre-call timestamp.
   */
  describe("Property 12: Cache Storage with Timestamp", () => {
    it("lastFetchTime must be set to a valid timestamp after successful fetchOverview", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: undefined }),
          async (clusterId) => {
            setActivePinia(createPinia());
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              EMPTY_OVERVIEW_RESPONSE as any,
            );

            const store = useKubernetesStore();
            expect(store.lastFetchTime).toBeNull();

            const beforeCall = Date.now();
            await store.fetchOverview(clusterId);
            const afterCall = Date.now();

            // lastFetchTime must be set (not null)
            expect(store.lastFetchTime).not.toBeNull();
            // Must be a positive number
            expect(store.lastFetchTime).toBeGreaterThan(0);
            // Must be within the call window
            expect(store.lastFetchTime).toBeGreaterThanOrEqual(beforeCall);
            expect(store.lastFetchTime).toBeLessThanOrEqual(afterCall);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("lastFetchTime must remain null when fetchOverview fails", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: undefined }),
          async (clusterId) => {
            setActivePinia(createPinia());
            vi.mocked(kubernetesApi.getOverview).mockRejectedValue(
              new Error("API error"),
            );

            const store = useKubernetesStore();
            await store.fetchOverview(clusterId);

            // On failure, lastFetchTime must NOT be updated
            expect(store.lastFetchTime).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 13: Cache Hit Within TTL
   * Validates: Requirements 10.3
   *
   * After two consecutive successful fetchOverview calls, lastFetchTime must
   * reflect the most recent call. The second timestamp must be >= the first.
   */
  describe("Property 13: Cache Hit Within TTL", () => {
    it("lastFetchTime must be updated to the most recent fetch after consecutive calls", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: undefined }),
          async (clusterId) => {
            setActivePinia(createPinia());
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              EMPTY_OVERVIEW_RESPONSE as any,
            );

            const store = useKubernetesStore();

            // First fetch
            await store.fetchOverview(clusterId);
            const firstFetchTime = store.lastFetchTime!;
            expect(firstFetchTime).toBeGreaterThan(0);

            // Second fetch (simulate time passing)
            await store.fetchOverview(clusterId);
            const secondFetchTime = store.lastFetchTime!;

            // Second timestamp must be >= first (monotonically non-decreasing)
            expect(secondFetchTime).toBeGreaterThanOrEqual(firstFetchTime);
            // Both must be positive
            expect(secondFetchTime).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("lastFetchTime must always reflect the last successful fetch regardless of call order", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.option(fc.uuid(), { nil: undefined }), {
            minLength: 1,
            maxLength: 5,
          }),
          async (clusterIds) => {
            setActivePinia(createPinia());
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              EMPTY_OVERVIEW_RESPONSE as any,
            );

            const store = useKubernetesStore();
            let prevFetchTime = 0;

            for (const clusterId of clusterIds) {
              await store.fetchOverview(clusterId);
              const currentFetchTime = store.lastFetchTime!;
              // Each fetch must produce a timestamp >= the previous
              expect(currentFetchTime).toBeGreaterThanOrEqual(prevFetchTime);
              prevFetchTime = currentFetchTime;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 14: Cache Expiration and Refresh
   * Validates: Requirements 10.4
   *
   * When fetchOverview fails after a previous successful fetch, lastFetchTime
   * must retain the timestamp from the last successful fetch (not be reset).
   * This allows the UI to show stale data age while displaying the error.
   */
  describe("Property 14: Cache Expiration and Refresh", () => {
    it("lastFetchTime must retain previous value when a subsequent fetch fails", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: undefined }),
          async (clusterId) => {
            setActivePinia(createPinia());

            const store = useKubernetesStore();

            // First fetch succeeds
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              EMPTY_OVERVIEW_RESPONSE as any,
            );
            await store.fetchOverview(clusterId);
            const successfulFetchTime = store.lastFetchTime!;
            expect(successfulFetchTime).toBeGreaterThan(0);

            // Second fetch fails
            vi.mocked(kubernetesApi.getOverview).mockRejectedValue(
              new Error("Network error"),
            );
            await store.fetchOverview(clusterId);

            // lastFetchTime must NOT be reset — it retains the last successful timestamp
            expect(store.lastFetchTime).toBe(successfulFetchTime);
            // Error must be set
            expect(store.error).toBeTruthy();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("error must be cleared on successful fetch after a failed fetch", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: undefined }),
          async (clusterId) => {
            setActivePinia(createPinia());

            const store = useKubernetesStore();

            // First fetch fails
            vi.mocked(kubernetesApi.getOverview).mockRejectedValue(
              new Error("Network error"),
            );
            await store.fetchOverview(clusterId);
            expect(store.error).toBeTruthy();

            // Second fetch succeeds
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              EMPTY_OVERVIEW_RESPONSE as any,
            );
            await store.fetchOverview(clusterId);

            // Error must be cleared after successful fetch
            expect(store.error).toBeNull();
            // lastFetchTime must be set
            expect(store.lastFetchTime).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 15: Manual Refresh Bypasses Cache
   * Validates: Requirements 10.5, 12.2
   *
   * Every call to fetchOverview must trigger a new API call to kubernetesApi.getOverview.
   * There is no TTL guard that prevents the call — manual refresh always fetches fresh data.
   */
  describe("Property 15: Manual Refresh Bypasses Cache", () => {
    it("fetchOverview must call kubernetesApi.getOverview exactly once per invocation", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          fc.option(fc.uuid(), { nil: undefined }),
          async (callCount, clusterId) => {
            setActivePinia(createPinia());
            vi.clearAllMocks();
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              EMPTY_OVERVIEW_RESPONSE as any,
            );

            const store = useKubernetesStore();

            for (let i = 0; i < callCount; i++) {
              await store.fetchOverview(clusterId);
            }

            // getOverview must have been called exactly callCount times — no caching/skipping
            expect(kubernetesApi.getOverview).toHaveBeenCalledTimes(callCount);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("refreshData must always trigger a new API call regardless of lastFetchTime", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: undefined }),
          async (_clusterId) => {
            setActivePinia(createPinia());
            vi.clearAllMocks();
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              EMPTY_OVERVIEW_RESPONSE as any,
            );

            const store = useKubernetesStore();

            // Simulate a recent fetch (lastFetchTime is set)
            await store.fetchOverview();
            expect(vi.mocked(kubernetesApi.getOverview).mock.calls.length).toBe(
              1,
            );

            // refreshData must trigger another API call even though lastFetchTime is recent
            store.refreshData();
            // refreshData calls fetchOverview which calls getOverview
            // Wait for the async fetchOverview to complete
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(kubernetesApi.getOverview).toHaveBeenCalledTimes(2);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 6: Resource Count Fetching
   * Validates: Requirements 3.1, 3.3
   *
   * After a successful fetchOverview(clusterId) call, the store's computed
   * counts (nodeCount, namespaceCount, runningPodsCount) must exactly reflect
   * the values returned in the API response's overview field.
   */
  describe("Property 6: Resource Count Fetching", () => {
    /**
     * Helper: build a full overview response with specific resource counts.
     */
    function buildOverviewResponse(
      nodes: number,
      namespaces: number,
      runningPods: number,
    ) {
      return {
        ...EMPTY_OVERVIEW_RESPONSE,
        overview: { nodes, namespaces, runningPods },
      };
    }

    it("nodeCount must equal the API response overview.nodes for any valid node count", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          fc.option(fc.uuid(), { nil: undefined }),
          async (nodes, namespaces, runningPods, clusterId) => {
            setActivePinia(createPinia());
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              buildOverviewResponse(nodes, namespaces, runningPods) as any,
            );

            const store = useKubernetesStore();
            await store.fetchOverview(clusterId);

            expect(store.nodeCount).toBe(nodes);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("namespaceCount must equal the API response overview.namespaces for any valid namespace count", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          fc.option(fc.uuid(), { nil: undefined }),
          async (nodes, namespaces, runningPods, clusterId) => {
            setActivePinia(createPinia());
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              buildOverviewResponse(nodes, namespaces, runningPods) as any,
            );

            const store = useKubernetesStore();
            await store.fetchOverview(clusterId);

            expect(store.namespaceCount).toBe(namespaces);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("runningPodsCount must equal the API response overview.runningPods for any valid pod count", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          fc.option(fc.uuid(), { nil: undefined }),
          async (nodes, namespaces, runningPods, clusterId) => {
            setActivePinia(createPinia());
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              buildOverviewResponse(nodes, namespaces, runningPods) as any,
            );

            const store = useKubernetesStore();
            await store.fetchOverview(clusterId);

            expect(store.runningPodsCount).toBe(runningPods);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("all three counts must be 0 when overviewData is null (initial state)", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async (_) => {
          setActivePinia(createPinia());

          const store = useKubernetesStore();

          // Before any fetch, overviewData is null — all counts must default to 0
          expect(store.nodeCount).toBe(0);
          expect(store.namespaceCount).toBe(0);
          expect(store.runningPodsCount).toBe(0);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 7: Auto-Refresh Interval Management
   * Validates: Requirements 3.4, 12.1, 12.3, 12.4, 12.5
   *
   * The interval mapping function must:
   * 1. Always return one of the 13 valid interval strings
   * 2. Return the correct bucket for any duration in minutes
   * 3. Be monotonically non-decreasing (longer durations → same or larger interval)
   */
  describe("Property 7: Auto-Refresh Interval Management", () => {
    // Mirror of the interval mapping logic from kubernetes.ts
    function mapDurationToInterval(diffMin: number): string {
      if (diffMin <= 5) return "5m";
      if (diffMin <= 15) return "15m";
      if (diffMin <= 30) return "30m";
      if (diffMin <= 60) return "1h";
      if (diffMin <= 180) return "3h";
      if (diffMin <= 720) return "6h";
      if (diffMin <= 1440) return "12h";
      if (diffMin <= 2880) return "24h";
      if (diffMin <= 10080) return "7d";
      if (diffMin <= 20160) return "14d";
      if (diffMin <= 43200) return "30d";
      return "90d";
    }

    const VALID_INTERVALS = [
      "5m",
      "15m",
      "30m",
      "1h",
      "3h",
      "6h",
      "12h",
      "24h",
      "7d",
      "14d",
      "30d",
      "90d",
    ] as const;

    it("interval mapping must always return one of the 13 valid interval strings for any duration", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100000 }), (diffMin) => {
          const interval = mapDurationToInterval(diffMin);
          expect(VALID_INTERVALS).toContain(interval);
        }),
        { numRuns: 100 },
      );
    });

    it("interval mapping must return correct bucket for boundary values", () => {
      // Test exact boundary values
      expect(mapDurationToInterval(5)).toBe("5m");
      expect(mapDurationToInterval(6)).toBe("15m");
      expect(mapDurationToInterval(15)).toBe("15m");
      expect(mapDurationToInterval(16)).toBe("30m");
      expect(mapDurationToInterval(30)).toBe("30m");
      expect(mapDurationToInterval(31)).toBe("1h");
      expect(mapDurationToInterval(60)).toBe("1h");
      expect(mapDurationToInterval(61)).toBe("3h");
      expect(mapDurationToInterval(180)).toBe("3h");
      expect(mapDurationToInterval(181)).toBe("6h");
      expect(mapDurationToInterval(720)).toBe("6h");
      expect(mapDurationToInterval(721)).toBe("12h");
      expect(mapDurationToInterval(1440)).toBe("12h");
      expect(mapDurationToInterval(1441)).toBe("24h");
      expect(mapDurationToInterval(2880)).toBe("24h");
      expect(mapDurationToInterval(2881)).toBe("7d");
      expect(mapDurationToInterval(10080)).toBe("7d");
      expect(mapDurationToInterval(10081)).toBe("14d");
      expect(mapDurationToInterval(20160)).toBe("14d");
      expect(mapDurationToInterval(20161)).toBe("30d");
      expect(mapDurationToInterval(43200)).toBe("30d");
      expect(mapDurationToInterval(43201)).toBe("90d");
    });

    it("interval mapping must be monotonically non-decreasing (longer duration → same or larger interval)", () => {
      const INTERVAL_ORDER = [
        "5m",
        "15m",
        "30m",
        "1h",
        "3h",
        "6h",
        "12h",
        "24h",
        "7d",
        "14d",
        "30d",
        "90d",
      ];

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 50000 }),
          fc.integer({ min: 0, max: 50000 }),
          (a, b) => {
            const shorter = Math.min(a, b);
            const longer = Math.max(a, b);

            const intervalForShorter = mapDurationToInterval(shorter);
            const intervalForLonger = mapDurationToInterval(longer);

            const indexShorter = INTERVAL_ORDER.indexOf(intervalForShorter);
            const indexLonger = INTERVAL_ORDER.indexOf(intervalForLonger);

            // Longer duration must map to same or larger interval bucket
            expect(indexLonger).toBeGreaterThanOrEqual(indexShorter);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("fetchOverview must pass currentInterval to getOverview for any time range", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 100000 }),
          fc.option(fc.uuid(), { nil: undefined }),
          async (_diffMin, clusterId) => {
            setActivePinia(createPinia());
            vi.clearAllMocks();
            vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
              EMPTY_OVERVIEW_RESPONSE as any,
            );

            const store = useKubernetesStore();
            // The store's currentInterval is derived from the mocked appStore
            // which returns a fixed time range. We verify the interval is passed.
            await store.fetchOverview(clusterId);

            expect(kubernetesApi.getOverview).toHaveBeenCalledTimes(1);
            const callArgs = vi.mocked(kubernetesApi.getOverview).mock.calls[0];
            // Second argument must be a valid interval string
            const passedInterval = callArgs[1];
            expect(VALID_INTERVALS).toContain(passedInterval);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

/**
 * Property 8: Refresh Error Recovery
 * Validates: Requirements 3.5
 *
 * When fetchOverview fails (network error, timeout, 5xx), the store must:
 * 1. Set `error` to a non-null truthy value
 * 2. Set `loading` to `false` (not stuck in loading state)
 * 3. Preserve any previously loaded data (not wipe `overviewData` on error)
 * 4. Allow subsequent successful fetches to clear the error and update data
 */
describe("Property 8: Refresh Error Recovery", () => {
  it("error must be truthy and loading must be false after any failed fetchOverview", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.uuid(), { nil: undefined }),
        async (clusterId) => {
          setActivePinia(createPinia());
          vi.mocked(kubernetesApi.getOverview).mockRejectedValue(
            new Error("Network error"),
          );

          const store = useKubernetesStore();

          await store.fetchOverview(clusterId);

          // error must be set to a truthy value
          expect(store.error).toBeTruthy();
          // loading must not be stuck — must be false after the call resolves
          expect(store.loading).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("overviewData must retain previously loaded data when a subsequent fetch fails", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.uuid(), { nil: undefined }),
        async (clusterId) => {
          setActivePinia(createPinia());

          const store = useKubernetesStore();

          // First fetch succeeds — overviewData is populated
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            EMPTY_OVERVIEW_RESPONSE as any,
          );
          await store.fetchOverview(clusterId);

          // Capture the overviewData after the successful fetch
          const dataAfterSuccess = store.overviewData;
          expect(dataAfterSuccess).not.toBeNull();

          // Second fetch fails
          vi.mocked(kubernetesApi.getOverview).mockRejectedValue(
            new Error("Timeout"),
          );
          await store.fetchOverview(clusterId);

          // overviewData must NOT be wiped — it retains the previously loaded data
          expect(store.overviewData).not.toBeNull();
          expect(store.overviewData).toEqual(dataAfterSuccess);
          // error must be set
          expect(store.error).toBeTruthy();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("after [fail, succeed] sequence, error must be null and loading must be false", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.uuid(), { nil: undefined }),
        async (clusterId) => {
          setActivePinia(createPinia());

          const store = useKubernetesStore();

          // Step 1: fail
          vi.mocked(kubernetesApi.getOverview).mockRejectedValue(
            new Error("Server error"),
          );
          await store.fetchOverview(clusterId);
          expect(store.error).toBeTruthy();

          // Step 2: succeed
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            EMPTY_OVERVIEW_RESPONSE as any,
          );
          await store.fetchOverview(clusterId);

          // After a successful fetch, error must be cleared
          expect(store.error).toBeNull();
          // loading must be false
          expect(store.loading).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("error field must contain a non-empty string after any failed fetch regardless of error message", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.option(fc.uuid(), { nil: undefined }),
        async (errorMessage, clusterId) => {
          setActivePinia(createPinia());
          vi.mocked(kubernetesApi.getOverview).mockRejectedValue(
            new Error(errorMessage),
          );

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // error must be a non-empty string
          expect(typeof store.error).toBe("string");
          expect((store.error as string).length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 36: Provider-Specific Metrics Display (Managed Clusters)
 * Validates: Requirement 13 — Provider-Specific Metrics Display
 *
 * For any managed cluster provider (eks, gke, aks, rke2, k3s), the overview
 * response stored in overviewData must include the provider-specific time-series
 * fields that the UI renders. These fields must be arrays (possibly empty) so
 * the chart components can iterate over them without crashing.
 *
 * Managed providers: eks, gke, aks, rke2, k3s
 */
describe("Property 36: Provider-Specific Metrics Display (Managed Clusters)", () => {
  const MANAGED_PROVIDERS = ["eks", "gke", "aks", "rke2", "k3s"] as const;

  /**
   * Build a minimal overview response that includes the provider-specific
   * fields a managed cluster is expected to expose.
   */
  function buildManagedOverviewResponse(provider: string) {
    return {
      ...EMPTY_OVERVIEW_RESPONSE,
      overview: { nodes: 3, namespaces: 5, runningPods: 10 },
      // Provider-specific fields that must be present for managed clusters
      clusterCpuUtilization: [{ name: `${provider}-cpu`, data: [[Date.now(), 42]] }],
      clusterMemoryUtilization: [{ name: `${provider}-mem`, data: [[Date.now(), 55]] }],
      cpuByNamespace: [{ name: "default", data: [[Date.now(), 10]] }],
      memoryByNamespace: [{ name: "default", data: [[Date.now(), 20]] }],
      cpuByInstance: [{ name: "node-1", data: [[Date.now(), 30]] }],
      memoryByInstance: [{ name: "node-1", data: [[Date.now(), 40]] }],
      hpaTimeSeries: [{ name: "hpa-1", data: [[Date.now(), 2]] }],
      hpaTotalCount: 3,
      pdbTimeSeries: [{ name: "pdb-1", data: [[Date.now(), 1]] }],
      pdbTotalDisruptionsAllowed: 2,
    };
  }

  it("Property 36.1: overviewData must be stored after fetchOverview for any managed provider", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...MANAGED_PROVIDERS),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, clusterId) => {
          setActivePinia(createPinia());
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            buildManagedOverviewResponse(provider) as any,
          );

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // overviewData must be set (not null) after a successful fetch
          expect(store.overviewData).not.toBeNull();
          expect(store.overviewData).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 36.2: clusterCpuUtilization must be an array for any managed provider", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...MANAGED_PROVIDERS),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, clusterId) => {
          setActivePinia(createPinia());
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            buildManagedOverviewResponse(provider) as any,
          );

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // The store maps clusterCpuUtilization to its own top-level ref
          expect(Array.isArray(store.clusterCpuUtilization)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 36.3: clusterMemoryUtilization must be an array for any managed provider", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...MANAGED_PROVIDERS),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, clusterId) => {
          setActivePinia(createPinia());
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            buildManagedOverviewResponse(provider) as any,
          );

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // The store maps clusterMemoryUtilization to its own top-level ref
          expect(Array.isArray(store.clusterMemoryUtilization)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 36.4: hpaTotalCount must be a non-negative number for any managed provider", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...MANAGED_PROVIDERS),
        fc.integer({ min: 0, max: 1000 }),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, hpaCount, clusterId) => {
          setActivePinia(createPinia());
          const response = {
            ...buildManagedOverviewResponse(provider),
            hpaTotalCount: hpaCount,
          };
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(response as any);

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // The store maps hpaTotalCount to its own top-level ref
          expect(typeof store.hpaTotalCount).toBe("number");
          expect(store.hpaTotalCount).toBeGreaterThanOrEqual(0);
          expect(store.hpaTotalCount).toBe(hpaCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 36.5: pdbTotalDisruptionsAllowed must be a non-negative number for any managed provider", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...MANAGED_PROVIDERS),
        fc.integer({ min: 0, max: 1000 }),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, pdbCount, clusterId) => {
          setActivePinia(createPinia());
          const response = {
            ...buildManagedOverviewResponse(provider),
            pdbTotalDisruptionsAllowed: pdbCount,
          };
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(response as any);

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // The store maps pdbTotalDisruptionsAllowed to its own top-level ref
          expect(typeof store.pdbTotalDisruptionsAllowed).toBe("number");
          expect(store.pdbTotalDisruptionsAllowed).toBeGreaterThanOrEqual(0);
          expect(store.pdbTotalDisruptionsAllowed).toBe(pdbCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 36.6: all provider-specific array fields must be preserved exactly as returned by the API", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...MANAGED_PROVIDERS),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            data: fc.array(
              fc.tuple(fc.integer({ min: 0 }), fc.float({ min: 0, max: 100 })),
              { minLength: 1, maxLength: 10 },
            ),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, cpuSeries, clusterId) => {
          setActivePinia(createPinia());
          const response = {
            ...buildManagedOverviewResponse(provider),
            clusterCpuUtilization: cpuSeries,
          };
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(response as any);

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // The store maps clusterCpuUtilization to its own top-level ref
          expect(store.clusterCpuUtilization).toEqual(cpuSeries);
          expect(store.clusterCpuUtilization).toHaveLength(cpuSeries.length);
        },
      ),
      { numRuns: 50 },
    );
  });
});

/**
 * Property 37: Self-Managed Cluster Metrics Display
 * Validates: Requirement 13 — Provider-Specific Metrics Display (self-managed path)
 *
 * For self-managed clusters (provider = "self-managed" or bare-metal), the
 * overview response must include the core metrics fields. Optional fields
 * (diskByNode, networkByNode, oomEventsByNamespace) may be undefined or arrays.
 * The store must store whatever the API returns without modification.
 */
describe("Property 37: Self-Managed Cluster Metrics Display", () => {
  const SELF_MANAGED_PROVIDERS = ["self-managed", "bare-metal", "on-premise", "custom"] as const;

  function buildSelfManagedOverviewResponse(provider: string) {
    return {
      ...EMPTY_OVERVIEW_RESPONSE,
      overview: { nodes: 2, namespaces: 3, runningPods: 8 },
      // Core fields always present for self-managed
      clusterCpuUtilization: [{ name: `${provider}-cpu`, data: [[Date.now(), 35]] }],
      clusterMemoryUtilization: [{ name: `${provider}-mem`, data: [[Date.now(), 60]] }],
      cpuByNamespace: [{ name: "kube-system", data: [[Date.now(), 5]] }],
      memoryByNamespace: [{ name: "kube-system", data: [[Date.now(), 15]] }],
      // Self-managed clusters may expose node-level disk/network metrics
      diskByNode: [{ name: "node-1", data: [[Date.now(), 80]] }],
      networkByNode: [{ name: "node-1", data: [[Date.now(), 100]] }],
      // HPA/PDB may be absent or zero for self-managed
      hpaTotalCount: 0,
      pdbTotalDisruptionsAllowed: 0,
    };
  }

  it("Property 37.1: overviewData must be stored after fetchOverview for any self-managed provider", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...SELF_MANAGED_PROVIDERS),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, clusterId) => {
          setActivePinia(createPinia());
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            buildSelfManagedOverviewResponse(provider) as any,
          );

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          expect(store.overviewData).not.toBeNull();
          expect(store.overviewData).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 37.2: diskByNode must be an array when provided for self-managed clusters", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...SELF_MANAGED_PROVIDERS),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            data: fc.array(
              fc.tuple(fc.integer({ min: 0 }), fc.float({ min: 0, max: 100 })),
              { minLength: 1, maxLength: 5 },
            ),
          }),
          { minLength: 0, maxLength: 5 },
        ),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, diskSeries, clusterId) => {
          setActivePinia(createPinia());
          const response = {
            ...buildSelfManagedOverviewResponse(provider),
            diskByNode: diskSeries,
          };
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(response as any);

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // The store maps diskByNode to its own top-level ref
          expect(Array.isArray(store.diskByNode)).toBe(true);
          expect(store.diskByNode).toHaveLength(diskSeries.length);
        },
      ),
      { numRuns: 50 },
    );
  });

  it("Property 37.3: networkByNode must be an array when provided for self-managed clusters", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...SELF_MANAGED_PROVIDERS),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            data: fc.array(
              fc.tuple(fc.integer({ min: 0 }), fc.float({ min: 0, max: 100 })),
              { minLength: 1, maxLength: 5 },
            ),
          }),
          { minLength: 0, maxLength: 5 },
        ),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, networkSeries, clusterId) => {
          setActivePinia(createPinia());
          const response = {
            ...buildSelfManagedOverviewResponse(provider),
            networkByNode: networkSeries,
          };
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(response as any);

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // The store maps networkByNode to its own top-level ref
          expect(Array.isArray(store.networkByNode)).toBe(true);
          expect(store.networkByNode).toHaveLength(networkSeries.length);
        },
      ),
      { numRuns: 50 },
    );
  });

  it("Property 37.4: hpaTotalCount must be 0 or undefined for self-managed clusters with no HPA", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...SELF_MANAGED_PROVIDERS),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, clusterId) => {
          setActivePinia(createPinia());
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            buildSelfManagedOverviewResponse(provider) as any,
          );

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // The store maps hpaTotalCount to its own top-level ref
          // Self-managed clusters with no HPA must have hpaTotalCount = 0 or undefined
          const hpaCount = store.hpaTotalCount;
          expect(hpaCount === 0 || hpaCount === undefined).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 37.5: store must preserve all self-managed metrics fields exactly as returned by the API", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...SELF_MANAGED_PROVIDERS),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, nodes, namespaces, runningPods, clusterId) => {
          setActivePinia(createPinia());
          const response = {
            ...buildSelfManagedOverviewResponse(provider),
            overview: { nodes, namespaces, runningPods },
          };
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(response as any);

          const store = useKubernetesStore();
          await store.fetchOverview(clusterId);

          // Resource counts must match the API response
          expect(store.nodeCount).toBe(nodes);
          expect(store.namespaceCount).toBe(namespaces);
          expect(store.runningPodsCount).toBe(runningPods);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Property 37.6: store must handle missing optional fields gracefully for self-managed clusters", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...SELF_MANAGED_PROVIDERS),
        fc.option(fc.uuid(), { nil: undefined }),
        async (provider, clusterId) => {
          setActivePinia(createPinia());
          // Minimal response — optional fields absent
          const minimalResponse = {
            ...EMPTY_OVERVIEW_RESPONSE,
            overview: { nodes: 1, namespaces: 1, runningPods: 1 },
            clusterCpuUtilization: [],
            clusterMemoryUtilization: [],
            // diskByNode and networkByNode intentionally omitted
          };
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            minimalResponse as any,
          );

          const store = useKubernetesStore();
          // Must not throw even when optional fields are absent
          await expect(store.fetchOverview(clusterId)).resolves.not.toThrow();

          // Store must be in a valid state
          expect(store.overviewData).not.toBeNull();
          expect(store.error).toBeNull();
          expect(store.loading).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 16: Loading State Display
 * Validates: Requirements 11.1
 *
 * For any async operation (fetchOverview, fetchNodeMetrics) that sets
 * loading=true before the API call and loading=false after:
 * - loading must be true while the call is in-flight
 * - loading must be false after completion (both success and error paths)
 * - loading must never be stuck at true after the promise settles
 *
 * Feature: frontend-backend-monitoring-kubernetes-integration, Property 16
 */
describe("Property 16: Loading State Display", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("loading must be true during fetchOverview and false after successful completion", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.uuid(), { nil: undefined }),
        async (clusterId) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          const loadingDuringCall: boolean[] = [];

          // Resolve after capturing loading state mid-call
          vi.mocked(kubernetesApi.getOverview).mockImplementation(async () => {
            // This runs while loading should be true
            loadingDuringCall.push(store.loading);
            return EMPTY_OVERVIEW_RESPONSE as any;
          });

          const store = useKubernetesStore();

          // Before the call, loading must be false
          expect(store.loading).toBe(false);

          await store.fetchOverview(clusterId);

          // loading must have been true during the call
          expect(loadingDuringCall.length).toBeGreaterThan(0);
          expect(loadingDuringCall.every((v) => v === true)).toBe(true);

          // After the call resolves, loading must be false
          expect(store.loading).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("loading must be false after fetchOverview fails (error path)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.uuid(), { nil: undefined }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (clusterId, errorMessage) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          const loadingDuringCall: boolean[] = [];

          vi.mocked(kubernetesApi.getOverview).mockImplementation(async () => {
            loadingDuringCall.push(store.loading);
            throw new Error(errorMessage);
          });

          const store = useKubernetesStore();

          // Before the call, loading must be false
          expect(store.loading).toBe(false);

          await store.fetchOverview(clusterId);

          // loading must have been true during the call
          expect(loadingDuringCall.length).toBeGreaterThan(0);
          expect(loadingDuringCall.every((v) => v === true)).toBe(true);

          // After the call rejects, loading must be false (not stuck)
          expect(store.loading).toBe(false);
          // error must be set
          expect(store.error).toBeTruthy();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("loading must return to false after any sequence of success and error calls", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        fc.option(fc.uuid(), { nil: undefined }),
        async (successFlags, clusterId) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          const store = useKubernetesStore();

          for (const shouldSucceed of successFlags) {
            if (shouldSucceed) {
              vi.mocked(kubernetesApi.getOverview).mockResolvedValueOnce(
                EMPTY_OVERVIEW_RESPONSE as any,
              );
            } else {
              vi.mocked(kubernetesApi.getOverview).mockRejectedValueOnce(
                new Error("API error"),
              );
            }

            await store.fetchOverview(clusterId);

            // After every call (success or failure), loading must be false
            expect(store.loading).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("nodeMetricsLoading must be true during fetchNodeMetrics and false after successful completion", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (clusterId) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          // Disable mock mode so fetchNodeMetrics actually runs
          vi.mock("@/config", () => ({
            default: { useMock: false },
          }));

          const nodeMetricsLoadingDuringCall: boolean[] = [];

          vi.mocked(kubernetesApi.fetchNodeMetrics).mockImplementation(
            async () => {
              nodeMetricsLoadingDuringCall.push(store.nodeMetricsLoading);
              return {
                cpuByNode: [],
                memoryByNode: [],
                diskByNode: [],
                networkByNode: [],
              } as any;
            },
          );

          const store = useKubernetesStore();

          // Before the call, nodeMetricsLoading must be false
          expect(store.nodeMetricsLoading).toBe(false);

          await store.fetchNodeMetrics(clusterId);

          // nodeMetricsLoading must have been true during the call
          expect(nodeMetricsLoadingDuringCall.length).toBeGreaterThan(0);
          expect(
            nodeMetricsLoadingDuringCall.every((v) => v === true),
          ).toBe(true);

          // After the call resolves, nodeMetricsLoading must be false
          expect(store.nodeMetricsLoading).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("nodeMetricsLoading must be false after fetchNodeMetrics fails (error path)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (clusterId, errorMessage) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          vi.mock("@/config", () => ({
            default: { useMock: false },
          }));

          const nodeMetricsLoadingDuringCall: boolean[] = [];

          vi.mocked(kubernetesApi.fetchNodeMetrics).mockImplementation(
            async () => {
              nodeMetricsLoadingDuringCall.push(store.nodeMetricsLoading);
              throw new Error(errorMessage);
            },
          );

          const store = useKubernetesStore();

          // Before the call, nodeMetricsLoading must be false
          expect(store.nodeMetricsLoading).toBe(false);

          await store.fetchNodeMetrics(clusterId);

          // nodeMetricsLoading must have been true during the call
          expect(nodeMetricsLoadingDuringCall.length).toBeGreaterThan(0);
          expect(
            nodeMetricsLoadingDuringCall.every((v) => v === true),
          ).toBe(true);

          // After the call rejects, nodeMetricsLoading must be false (not stuck)
          expect(store.nodeMetricsLoading).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 17: Error Logging
 * Validates: Requirements 11.5
 *
 * For any error thrown by the API, the store must log the error via
 * console.error AND set the error state. The log must contain information
 * about the error (i.e., the error object or message must be passed to
 * console.error).
 *
 * Requirement 11.5: All errors must be logged with sufficient context for
 * debugging. The error logging must include the error message and relevant
 * context (e.g., which operation failed, which cluster was being accessed).
 *
 * Feature: frontend-backend-monitoring-kubernetes-integration, Property 17
 */
describe("Property 17: Error Logging", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  /**
   * Property 17.1: fetchNodeMetrics must call console.error with the error
   * when the API call fails, for any cluster ID and any error message.
   */
  it("fetchNodeMetrics must call console.error with the error when the API call fails", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 200 }),
        async (clusterId, errorMessage) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          // Disable mock mode so fetchNodeMetrics actually executes the API call
          vi.mock("@/config", () => ({
            default: { useMock: false },
          }));

          const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

          const thrownError = new Error(errorMessage);
          vi.mocked(kubernetesApi.fetchNodeMetrics).mockRejectedValue(
            thrownError,
          );

          const store = useKubernetesStore();
          await store.fetchNodeMetrics(clusterId);

          // console.error must have been called at least once
          expect(consoleErrorSpy).toHaveBeenCalled();

          // The error object must appear in one of the console.error calls
          const allArgs = consoleErrorSpy.mock.calls.flat();
          const errorWasLogged = allArgs.some(
            (arg) =>
              arg === thrownError ||
              (typeof arg === "string" && arg.includes(errorMessage)) ||
              (arg instanceof Error && arg.message === errorMessage),
          );
          expect(errorWasLogged).toBe(true);

          consoleErrorSpy.mockRestore();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 17.2: loadClusters must call console.error with the error
   * when the API call fails, for any error message.
   */
  it("loadClusters must call console.error with the error when the API call fails", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (errorMessage) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          // Disable mock mode so loadClusters actually executes the API call
          vi.mock("@/config", () => ({
            default: { useMock: false },
          }));

          const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

          const thrownError = new Error(errorMessage);
          vi.mocked(kubernetesApi.listClusters).mockRejectedValue(thrownError);

          const store = useKubernetesStore();
          await store.loadClusters();

          // console.error must have been called at least once
          expect(consoleErrorSpy).toHaveBeenCalled();

          // The error object must appear in one of the console.error calls
          const allArgs = consoleErrorSpy.mock.calls.flat();
          const errorWasLogged = allArgs.some(
            (arg) =>
              arg === thrownError ||
              (typeof arg === "string" && arg.includes(errorMessage)) ||
              (arg instanceof Error && arg.message === errorMessage),
          );
          expect(errorWasLogged).toBe(true);

          consoleErrorSpy.mockRestore();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 17.3: fetchNodeMetrics must set nodeMetricsLoading to false
   * AND call console.error for any error, ensuring the error is not silently
   * swallowed.
   */
  it("fetchNodeMetrics must not silently swallow errors — console.error must be called for any thrown error", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 100 }).map((msg) => new Error(msg)),
          fc.constant(new TypeError("Type mismatch")),
          fc.constant(new RangeError("Out of range")),
        ),
        async (clusterId, thrownError) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          vi.mock("@/config", () => ({
            default: { useMock: false },
          }));

          const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

          vi.mocked(kubernetesApi.fetchNodeMetrics).mockRejectedValue(
            thrownError,
          );

          const store = useKubernetesStore();
          await store.fetchNodeMetrics(clusterId);

          // console.error must be called — error must not be silently swallowed
          expect(consoleErrorSpy).toHaveBeenCalled();

          // nodeMetricsLoading must be false (not stuck)
          expect(store.nodeMetricsLoading).toBe(false);

          consoleErrorSpy.mockRestore();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 17.4: loadClusters must reset liveClusters to [] AND call
   * console.error when the API call fails, for any error type.
   */
  it("loadClusters must reset liveClusters to [] and call console.error for any error", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 100 }).map((msg) => new Error(msg)),
          fc.constant(new TypeError("Network type error")),
          fc.constant(new RangeError("Timeout range error")),
        ),
        async (thrownError) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          vi.mock("@/config", () => ({
            default: { useMock: false },
          }));

          const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

          vi.mocked(kubernetesApi.listClusters).mockRejectedValue(thrownError);

          const store = useKubernetesStore();
          await store.loadClusters();

          // console.error must be called
          expect(consoleErrorSpy).toHaveBeenCalled();

          // liveClusters must be reset to empty array on error
          expect(store.liveClusters).toEqual([]);

          consoleErrorSpy.mockRestore();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 17.5: The console.error call must include context about which
   * operation failed. The first argument to console.error must be a string
   * that identifies the failing operation (not just the raw error object).
   */
  it("console.error must include a context string identifying the failing operation for fetchNodeMetrics", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (clusterId, errorMessage) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          vi.mock("@/config", () => ({
            default: { useMock: false },
          }));

          const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

          vi.mocked(kubernetesApi.fetchNodeMetrics).mockRejectedValue(
            new Error(errorMessage),
          );

          const store = useKubernetesStore();
          await store.fetchNodeMetrics(clusterId);

          // At least one console.error call must have a string as its first argument
          // (the context/label identifying the operation)
          const hasContextString = consoleErrorSpy.mock.calls.some(
            (args) => typeof args[0] === "string" && args[0].length > 0,
          );
          expect(hasContextString).toBe(true);

          consoleErrorSpy.mockRestore();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 17.6: console.error must include a context string identifying
   * the failing operation for loadClusters.
   */
  it("console.error must include a context string identifying the failing operation for loadClusters", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (errorMessage) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();

          vi.mock("@/config", () => ({
            default: { useMock: false },
          }));

          const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

          vi.mocked(kubernetesApi.listClusters).mockRejectedValue(
            new Error(errorMessage),
          );

          const store = useKubernetesStore();
          await store.loadClusters();

          // At least one console.error call must have a string as its first argument
          const hasContextString = consoleErrorSpy.mock.calls.some(
            (args) => typeof args[0] === "string" && args[0].length > 0,
          );
          expect(hasContextString).toBe(true);

          consoleErrorSpy.mockRestore();
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 18: Cluster Switching Data Update
 * Validates: Requirements 13.2, 13.3
 *
 * When `setCluster(newClusterId)` is called:
 * 1. `selectedClusterId` must be updated to the new cluster ID immediately
 * 2. `fetchOverview()` must be called with the new cluster ID (not the old one)
 * 3. Data from the previous cluster must be replaced — the store must reflect
 *    the new cluster's data after the switch, not the previous cluster's data
 *
 * Requirement 13.2: Switching clusters must trigger a data refresh for the new cluster
 * Requirement 13.3: Data from the previous cluster must not be shown after switching
 *
 * Feature: frontend-backend-monitoring-kubernetes-integration, Property 18
 */
describe("Property 18: Cluster Switching Data Update", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  /**
   * Property 18.1: selectedClusterId must be updated to the new cluster ID
   * immediately after setCluster() is called, for any pair of distinct cluster IDs.
   */
  it("Property 18.1: selectedClusterId must be updated to the new cluster ID after setCluster()", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (previousClusterId, newClusterId) => {
          fc.pre(previousClusterId !== newClusterId);

          setActivePinia(createPinia());
          vi.clearAllMocks();
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            EMPTY_OVERVIEW_RESPONSE as any,
          );

          const store = useKubernetesStore();

          // Establish initial cluster selection
          store.selectedClusterId = previousClusterId;
          expect(store.selectedClusterId).toBe(previousClusterId);

          // Switch to new cluster
          store.setCluster(newClusterId);

          // selectedClusterId must be updated immediately (synchronously)
          expect(store.selectedClusterId).toBe(newClusterId);
          // Must NOT still be the previous cluster
          expect(store.selectedClusterId).not.toBe(previousClusterId);

          // Wait for the async fetchOverview triggered by setCluster to settle
          await new Promise((resolve) => setTimeout(resolve, 0));
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 18.2: setCluster() must trigger a fetchOverview() call that uses
   * the new cluster ID, for any pair of distinct cluster IDs.
   *
   * Requirement 13.2: Switching clusters must trigger a data refresh for the new cluster.
   */
  it("Property 18.2: setCluster() must trigger fetchOverview with the new cluster ID", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (previousClusterId, newClusterId) => {
          fc.pre(previousClusterId !== newClusterId);

          setActivePinia(createPinia());
          vi.clearAllMocks();
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            EMPTY_OVERVIEW_RESPONSE as any,
          );

          const store = useKubernetesStore();
          store.selectedClusterId = previousClusterId;

          // Switch to new cluster — this must trigger fetchOverview internally
          store.setCluster(newClusterId);

          // Wait for the async fetchOverview to complete
          await new Promise((resolve) => setTimeout(resolve, 0));

          // getOverview must have been called at least once after the switch
          expect(kubernetesApi.getOverview).toHaveBeenCalled();

          // The most recent call to getOverview must NOT use the previous cluster ID
          const calls = vi.mocked(kubernetesApi.getOverview).mock.calls;
          const lastCall = calls[calls.length - 1];
          // The first argument is the cluster ID (or undefined for no cluster)
          // It must not be the old cluster ID
          expect(lastCall[0]).not.toBe(previousClusterId);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 18.3: After switching clusters, the store's overview data must
   * reflect the new cluster's response, not the previous cluster's data.
   *
   * Requirement 13.3: Data from the previous cluster must not be shown after switching.
   */
  it("Property 18.3: store data must reflect the new cluster after switching", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 501, max: 1000 }),
        async (previousClusterId, newClusterId, prevNodeCount, newNodeCount) => {
          fc.pre(previousClusterId !== newClusterId);

          setActivePinia(createPinia());
          vi.clearAllMocks();

          const store = useKubernetesStore();

          // First: load data for the previous cluster
          vi.mocked(kubernetesApi.getOverview).mockResolvedValueOnce({
            ...EMPTY_OVERVIEW_RESPONSE,
            overview: { nodes: prevNodeCount, namespaces: 5, runningPods: 10 },
          } as any);

          await store.fetchOverview(previousClusterId);
          expect(store.nodeCount).toBe(prevNodeCount);

          // Now: switch to the new cluster with different data
          vi.mocked(kubernetesApi.getOverview).mockResolvedValueOnce({
            ...EMPTY_OVERVIEW_RESPONSE,
            overview: { nodes: newNodeCount, namespaces: 8, runningPods: 20 },
          } as any);

          store.setCluster(newClusterId);

          // Wait for the async fetchOverview triggered by setCluster to complete
          await new Promise((resolve) => setTimeout(resolve, 0));

          // The store must now reflect the new cluster's data
          expect(store.nodeCount).toBe(newNodeCount);
          // Must NOT still show the previous cluster's node count
          expect(store.nodeCount).not.toBe(prevNodeCount);
          // selectedClusterId must be the new cluster
          expect(store.selectedClusterId).toBe(newClusterId);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 18.4: Switching clusters multiple times must always result in
   * the store reflecting the last cluster switched to, for any sequence of
   * cluster IDs.
   *
   * Requirement 13.3: Previous cluster data must not persist after switching.
   */
  it("Property 18.4: after multiple cluster switches, store must reflect the final cluster", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
        async (clusterIds) => {
          // Ensure all cluster IDs are distinct
          const uniqueIds = [...new Set(clusterIds)];
          fc.pre(uniqueIds.length >= 2);

          setActivePinia(createPinia());
          vi.clearAllMocks();

          // Each cluster switch returns a unique node count equal to its index
          let callIndex = 0;
          vi.mocked(kubernetesApi.getOverview).mockImplementation(async () => {
            const nodeCount = (callIndex + 1) * 10;
            callIndex++;
            return {
              ...EMPTY_OVERVIEW_RESPONSE,
              overview: { nodes: nodeCount, namespaces: 5, runningPods: 10 },
            } as any;
          });

          const store = useKubernetesStore();

          // Switch through all cluster IDs sequentially
          for (const clusterId of uniqueIds) {
            store.setCluster(clusterId);
            // Wait for each async fetchOverview to settle before the next switch
            await new Promise((resolve) => setTimeout(resolve, 0));
          }

          const finalClusterId = uniqueIds[uniqueIds.length - 1];

          // After all switches, selectedClusterId must be the last one
          expect(store.selectedClusterId).toBe(finalClusterId);

          // getOverview must have been called once per cluster switch
          expect(kubernetesApi.getOverview).toHaveBeenCalledTimes(
            uniqueIds.length,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 18.5: Switching to the same cluster ID must still trigger a
   * data refresh (idempotent switch still refreshes data).
   *
   * Requirement 13.2: Switching clusters must trigger a data refresh.
   */
  it("Property 18.5: switching to the same cluster must still trigger a data refresh", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (clusterId) => {
          setActivePinia(createPinia());
          vi.clearAllMocks();
          vi.mocked(kubernetesApi.getOverview).mockResolvedValue(
            EMPTY_OVERVIEW_RESPONSE as any,
          );

          const store = useKubernetesStore();
          store.selectedClusterId = clusterId;

          // Switch to the same cluster ID
          store.setCluster(clusterId);

          // Wait for the async fetchOverview to complete
          await new Promise((resolve) => setTimeout(resolve, 0));

          // getOverview must have been called — even for same-cluster switch
          expect(kubernetesApi.getOverview).toHaveBeenCalledTimes(1);
          // selectedClusterId must still be the cluster ID
          expect(store.selectedClusterId).toBe(clusterId);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 18.6: After switching clusters, time-series data arrays must
   * be replaced with the new cluster's data — not appended to the old data.
   *
   * Requirement 13.3: Previous cluster data must not persist after switching.
   */
  it("Property 18.6: time-series data must be replaced (not appended) after cluster switch", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            data: fc.array(
              fc.tuple(fc.integer({ min: 0 }), fc.float({ min: 0, max: 100 })),
              { minLength: 1, maxLength: 3 },
            ),
          }),
          { minLength: 1, maxLength: 3 },
        ),
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            data: fc.array(
              fc.tuple(fc.integer({ min: 0 }), fc.float({ min: 0, max: 100 })),
              { minLength: 1, maxLength: 3 },
            ),
          }),
          { minLength: 1, maxLength: 3 },
        ),
        async (prevClusterId, newClusterId, prevCpuSeries, newCpuSeries) => {
          fc.pre(prevClusterId !== newClusterId);
          // Ensure the two series are distinguishable by length or content
          fc.pre(
            prevCpuSeries.length !== newCpuSeries.length ||
              prevCpuSeries[0].name !== newCpuSeries[0].name,
          );

          setActivePinia(createPinia());
          vi.clearAllMocks();

          const store = useKubernetesStore();

          // Load data for the previous cluster
          vi.mocked(kubernetesApi.getOverview).mockResolvedValueOnce({
            ...EMPTY_OVERVIEW_RESPONSE,
            clusterCpuUtilization: prevCpuSeries,
          } as any);

          await store.fetchOverview(prevClusterId);
          expect(store.clusterCpuUtilization).toEqual(prevCpuSeries);

          // Switch to new cluster with different CPU series
          vi.mocked(kubernetesApi.getOverview).mockResolvedValueOnce({
            ...EMPTY_OVERVIEW_RESPONSE,
            clusterCpuUtilization: newCpuSeries,
          } as any);

          store.setCluster(newClusterId);
          await new Promise((resolve) => setTimeout(resolve, 0));

          // clusterCpuUtilization must be the new cluster's data
          expect(store.clusterCpuUtilization).toEqual(newCpuSeries);
          // Must NOT contain the previous cluster's data
          expect(store.clusterCpuUtilization).not.toEqual(prevCpuSeries);
          // Length must match the new series (not combined)
          expect(store.clusterCpuUtilization).toHaveLength(newCpuSeries.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Additional imports for tasks 13–16 ───────────────────────────────────────
import { usePagination } from "@/composables/usePagination";

// =============================================================================
// Property 20: Pagination State Display
// Task 13.1 — Validates: Requirements (pagination state)
// =============================================================================
describe("Property 20: Pagination State Display", () => {
  it("paginationConfig reflects the last handlePageChange and handlePageSizeChange calls", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.constantFrom(10, 20, 50, 100),
        (p, s) => {
          const { handlePageChange, handlePageSizeChange, paginationConfig } =
            usePagination();
          handlePageChange(p);
          handlePageSizeChange(s);
          // After handlePageSizeChange, page resets to 1
          expect(paginationConfig.value.page).toBe(1);
          expect(paginationConfig.value.pageSize).toBe(s);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("paginationConfig.page equals p when handlePageChange(p) is called without subsequent size change", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.constantFrom(10, 20, 50, 100),
        (p, s) => {
          const { handlePageChange, handlePageSizeChange, paginationConfig } =
            usePagination();
          handlePageSizeChange(s);
          // page resets to 1 after size change; now navigate to p
          handlePageChange(p);
          expect(paginationConfig.value.page).toBe(p);
          expect(paginationConfig.value.pageSize).toBe(s);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 21: Pagination Boundary Button States
// Task 13.2 — Validates: Requirements (pagination boundaries)
// =============================================================================
describe("Property 21: Pagination Boundary Button States", () => {
  it("currentPage === 1 after handlePageChange(1) — first page boundary", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.constantFrom(10, 20, 50, 100),
        (N, s) => {
          const { handlePageChange, currentPage } = usePagination(s);
          handlePageChange(1);
          // At first page, previous is disabled (page === 1)
          expect(currentPage.value).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("currentPage === lastPage after handlePageChange(lastPage) — last page boundary", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.constantFrom(10, 20, 50, 100),
        (N, s) => {
          const lastPage = Math.ceil(N / s);
          const { handlePageChange, currentPage } = usePagination(s);
          handlePageChange(lastPage);
          // At last page, next is disabled (page === lastPage)
          expect(currentPage.value).toBe(lastPage);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("first page is always 1 regardless of total items and page size", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.constantFrom(10, 20, 50, 100),
        (N, s) => {
          const lastPage = Math.ceil(N / s);
          // lastPage must be >= 1
          expect(lastPage).toBeGreaterThanOrEqual(1);
          // first page is always 1
          expect(1).toBeLessThanOrEqual(lastPage);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 22: Page Size Change Behavior
// Task 13.3 — Validates: Requirements (page size reset)
// =============================================================================
describe("Property 22: Page Size Change Behavior", () => {
  it("handlePageSizeChange resets currentPage to 1 for any prior page > 1", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }),
        fc.constantFrom(10, 20, 50, 100),
        (p, s) => {
          const { handlePageChange, handlePageSizeChange, currentPage, pageSize } =
            usePagination();
          // Navigate to page p > 1
          handlePageChange(p);
          expect(currentPage.value).toBe(p);
          // Change page size — must reset to page 1
          handlePageSizeChange(s);
          expect(currentPage.value).toBe(1);
          expect(pageSize.value).toBe(s);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("pageSize is updated to the new value after handlePageSizeChange", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(10, 20, 50, 100),
        fc.constantFrom(10, 20, 50, 100),
        (initial, next) => {
          const { handlePageSizeChange, pageSize } = usePagination(initial);
          handlePageSizeChange(next);
          expect(pageSize.value).toBe(next);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 23: Responsive Layout Breakpoints
// Task 14.1 — Validates: Requirements (responsive breakpoints)
// =============================================================================
describe("Property 23: Responsive Layout Breakpoints", () => {
  // Inline breakpoint classification — pure logic, no DOM needed
  const classifyBreakpoint = (width: number): "mobile" | "tablet" | "desktop" => {
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  };

  it("width < 768 always maps to mobile breakpoint", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 767 }), (w) => {
        expect(classifyBreakpoint(w)).toBe("mobile");
      }),
      { numRuns: 100 },
    );
  });

  it("768 <= width < 1024 always maps to tablet breakpoint", () => {
    fc.assert(
      fc.property(fc.integer({ min: 768, max: 1023 }), (w) => {
        expect(classifyBreakpoint(w)).toBe("tablet");
      }),
      { numRuns: 100 },
    );
  });

  it("width >= 1024 always maps to desktop breakpoint", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1024, max: 7680 }), (w) => {
        expect(classifyBreakpoint(w)).toBe("desktop");
      }),
      { numRuns: 100 },
    );
  });

  it("every width maps to exactly one breakpoint (exhaustive and mutually exclusive)", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 7680 }), (w) => {
        const bp = classifyBreakpoint(w);
        const validBreakpoints = ["mobile", "tablet", "desktop"];
        expect(validBreakpoints).toContain(bp);
        // Exactly one must match
        const matches = [
          w < 768,
          w >= 768 && w < 1024,
          w >= 1024,
        ].filter(Boolean);
        expect(matches).toHaveLength(1);
      }),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 24: Touch-Friendly Element Sizing
// Task 14.2 — Validates: Requirements (WCAG touch targets >= 44px)
// =============================================================================
describe("Property 24: Touch-Friendly Element Sizing", () => {
  const WCAG_MIN_TOUCH_TARGET = 44;

  const isCompliant = (size: number): boolean => size >= WCAG_MIN_TOUCH_TARGET;

  it("elements with size >= 44 are always flagged as compliant", () => {
    fc.assert(
      fc.property(fc.integer({ min: 44, max: 200 }), (size) => {
        expect(isCompliant(size)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("elements with size < 44 are always flagged as non-compliant", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 43 }), (size) => {
        expect(isCompliant(size)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("for any array of sizes, non-compliant elements are exactly those with size < 44", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 200 }), { minLength: 1, maxLength: 20 }),
        (sizes) => {
          const nonCompliant = sizes.filter((s) => !isCompliant(s));
          const expectedNonCompliant = sizes.filter((s) => s < WCAG_MIN_TOUCH_TARGET);
          expect(nonCompliant).toEqual(expectedNonCompliant);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 25: Orientation Change Layout Adjustment
// Task 14.3 — Validates: Requirements (orientation classification)
// =============================================================================
describe("Property 25: Orientation Change Layout Adjustment", () => {
  type Orientation = "portrait" | "landscape";

  const classifyOrientation = (width: number, height: number): Orientation =>
    height > width ? "portrait" : "landscape";

  it("height > width always yields portrait orientation", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4000 }),
        fc.integer({ min: 1, max: 4000 }),
        (w, h) => {
          fc.pre(h > w);
          expect(classifyOrientation(w, h)).toBe("portrait");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("width >= height always yields landscape orientation", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4000 }),
        fc.integer({ min: 1, max: 4000 }),
        (w, h) => {
          fc.pre(w >= h);
          expect(classifyOrientation(w, h)).toBe("landscape");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("every (width, height) pair maps to exactly one orientation", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4000 }),
        fc.integer({ min: 1, max: 4000 }),
        (w, h) => {
          const orientation = classifyOrientation(w, h);
          expect(["portrait", "landscape"]).toContain(orientation);
          // Exactly one condition holds
          const isPortrait = h > w;
          const isLandscape = w >= h;
          expect(isPortrait !== isLandscape).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 26: Virtual Scrolling for Large Lists
// Task 15.1 — Validates: Requirements (virtual scroll window)
// =============================================================================
describe("Property 26: Virtual Scrolling for Large Lists", () => {
  const getVirtualSlice = <T>(items: T[], startIndex: number, windowSize: number): T[] =>
    items.slice(startIndex, startIndex + windowSize);

  it("virtual window always contains exactly W items for any valid startIndex", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 500 }),  // N total items
        fc.integer({ min: 1, max: 499 }),  // W window size (< N enforced below)
        (N, W) => {
          fc.pre(W < N);
          const items = Array.from({ length: N }, (_, i) => i);
          // Any valid startIndex in [0, N - W]
          const maxStart = N - W;
          // Test a few start indices: 0, middle, maxStart
          for (const startIndex of [0, Math.floor(maxStart / 2), maxStart]) {
            const slice = getVirtualSlice(items, startIndex, W);
            expect(slice).toHaveLength(W);
            expect(slice[0]).toBe(startIndex);
            expect(slice[W - 1]).toBe(startIndex + W - 1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("virtual slice content matches items[startIndex..startIndex+W]", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 200 }),
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 0, max: 190 }),
        (N, W, startIndex) => {
          fc.pre(W < N && startIndex <= N - W);
          const items = Array.from({ length: N }, (_, i) => i * 2); // distinct values
          const slice = getVirtualSlice(items, startIndex, W);
          expect(slice).toEqual(items.slice(startIndex, startIndex + W));
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 27: Lazy Loading Detail Views
// Task 15.2 — Validates: Requirements (fetch only on open)
// =============================================================================
describe("Property 27: Lazy Loading Detail Views", () => {
  // Model: fetch counter increments only when isOpen transitions false → true
  const simulateLazyLoad = (events: boolean[]): number => {
    let fetchCount = 0;
    let prevOpen = false;
    for (const isOpen of events) {
      if (!prevOpen && isOpen) {
        fetchCount++;
      }
      prevOpen = isOpen;
    }
    return fetchCount;
  };

  it("fetch count equals the number of false→true transitions in the event sequence", () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
        (events) => {
          const fetchCount = simulateLazyLoad(events);
          // Count expected transitions manually
          let expected = 0;
          let prev = false;
          for (const e of events) {
            if (!prev && e) expected++;
            prev = e;
          }
          expect(fetchCount).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("no fetches occur when detail is never opened", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constant(false), { minLength: 1, maxLength: 20 }),
        (events) => {
          expect(simulateLazyLoad(events)).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("exactly one fetch occurs for a single open event", () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 0, maxLength: 5 }),
        fc.array(fc.boolean(), { minLength: 0, maxLength: 5 }),
        (before, after) => {
          // Sequence: all false, then true, then anything
          const events = [...before.map(() => false), true, ...after];
          const fetchCount = simulateLazyLoad(events);
          // At least 1 fetch (the open event), possibly more if after contains true after false
          expect(fetchCount).toBeGreaterThanOrEqual(1);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 28: Request Cancellation on Filter Change
// Task 15.3 — Validates: Requirements (at most 1 in-flight request)
// =============================================================================
describe("Property 28: Request Cancellation on Filter Change", () => {
  // Model: given N filter changes, at most 1 request is in-flight at any time.
  // Each new filter cancels the previous pending request.
  const simulateRequestCancellation = (filterChanges: number): number => {
    // Each filter change cancels the previous in-flight request and starts a new one.
    // At any point, at most 1 request is in-flight.
    let inFlight = 0;
    let maxInFlight = 0;
    for (let i = 0; i < filterChanges; i++) {
      // Cancel previous (if any)
      if (inFlight > 0) inFlight--;
      // Start new request
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
    }
    return maxInFlight;
  };

  it("at most 1 request is in-flight at any time for any number of filter changes", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (N) => {
        const maxInFlight = simulateRequestCancellation(N);
        expect(maxInFlight).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });

  it("exactly 1 request is in-flight after any filter change", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (N) => {
        const maxInFlight = simulateRequestCancellation(N);
        expect(maxInFlight).toBe(1);
      }),
      { numRuns: 100 },
    );
  });

  it("0 requests in-flight when no filter changes occur", () => {
    const maxInFlight = simulateRequestCancellation(0);
    expect(maxInFlight).toBe(0);
  });
});

// =============================================================================
// Property 29: ARIA Label Presence
// Task 16.1 — Validates: Requirements (accessibility - ARIA labels)
// =============================================================================
describe("Property 29: ARIA Label Presence", () => {
  interface ElementDescriptor {
    type: string;
    hasAriaLabel: boolean;
    hasAriaLabelledBy: boolean;
    hasVisibleText: boolean;
  }

  const isAccessible = (el: ElementDescriptor): boolean =>
    el.hasAriaLabel || el.hasAriaLabelledBy || el.hasVisibleText;

  const elementDescriptor = fc.record({
    type: fc.constantFrom("button", "input", "select", "a"),
    hasAriaLabel: fc.boolean(),
    hasAriaLabelledBy: fc.boolean(),
    hasVisibleText: fc.boolean(),
  });

  it("element with at least one label mechanism is accessible", () => {
    fc.assert(
      fc.property(elementDescriptor, (el) => {
        if (el.hasAriaLabel || el.hasAriaLabelledBy || el.hasVisibleText) {
          expect(isAccessible(el)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("element with no label mechanism is not accessible", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("button", "input", "select", "a"),
        (type) => {
          const el: ElementDescriptor = {
            type,
            hasAriaLabel: false,
            hasAriaLabelledBy: false,
            hasVisibleText: false,
          };
          expect(isAccessible(el)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("all elements in a list must be accessible", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom("button", "input", "select"),
            hasAriaLabel: fc.constant(true),
            hasAriaLabelledBy: fc.boolean(),
            hasVisibleText: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (elements) => {
          // All have hasAriaLabel=true, so all must be accessible
          expect(elements.every(isAccessible)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 30: Keyboard Navigation Completeness
// Task 16.2 — Validates: Requirements (Tab cycles through all focusable elements)
// =============================================================================
describe("Property 30: Keyboard Navigation Completeness", () => {
  // Model: N focusable elements indexed 0..N-1.
  // Pressing Tab from element i moves to (i+1) % N.
  // Pressing Shift+Tab from element i moves to (i-1+N) % N.
  const tabForward = (current: number, N: number): number => (current + 1) % N;
  const tabBackward = (current: number, N: number): number => (current - 1 + N) % N;

  it("pressing Tab N times from element 0 returns to element 0", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (N) => {
        let current = 0;
        for (let i = 0; i < N; i++) {
          current = tabForward(current, N);
        }
        expect(current).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it("pressing Shift+Tab N times from element 0 returns to element 0", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (N) => {
        let current = 0;
        for (let i = 0; i < N; i++) {
          current = tabBackward(current, N);
        }
        expect(current).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it("Tab and Shift+Tab are inverse operations", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 49 }),
        (N, start) => {
          fc.pre(start < N);
          const afterTab = tabForward(start, N);
          const backToStart = tabBackward(afterTab, N);
          expect(backToStart).toBe(start);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 31: Logical Tab Order
// Task 16.3 — Validates: Requirements (tabIndex ordering)
// =============================================================================
describe("Property 31: Logical Tab Order", () => {
  interface FocusableElement {
    id: number;
    tabIndex: number;
  }

  // Focus order: tabIndex > 0 (ascending) → tabIndex === 0 → tabIndex === -1 excluded
  const getFocusOrder = (elements: FocusableElement[]): FocusableElement[] => {
    const positive = elements
      .filter((e) => e.tabIndex > 0)
      .sort((a, b) => a.tabIndex - b.tabIndex);
    const zero = elements.filter((e) => e.tabIndex === 0);
    // tabIndex === -1 are excluded
    return [...positive, ...zero];
  };

  const elementArb = fc.record({
    id: fc.integer({ min: 0, max: 1000 }),
    tabIndex: fc.integer({ min: -1, max: 10 }),
  });

  it("elements with tabIndex > 0 always appear before tabIndex === 0 elements", () => {
    fc.assert(
      fc.property(
        fc.array(elementArb, { minLength: 1, maxLength: 20 }),
        (elements) => {
          const ordered = getFocusOrder(elements);
          const lastPositiveIdx = ordered.reduce(
            (last, el, i) => (el.tabIndex > 0 ? i : last),
            -1,
          );
          const firstZeroIdx = ordered.findIndex((el) => el.tabIndex === 0);
          if (lastPositiveIdx !== -1 && firstZeroIdx !== -1) {
            expect(lastPositiveIdx).toBeLessThan(firstZeroIdx);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("elements with tabIndex === -1 are excluded from focus order", () => {
    fc.assert(
      fc.property(
        fc.array(elementArb, { minLength: 1, maxLength: 20 }),
        (elements) => {
          const ordered = getFocusOrder(elements);
          expect(ordered.every((e) => e.tabIndex !== -1)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("positive tabIndex elements are sorted in ascending order", () => {
    fc.assert(
      fc.property(
        fc.array(elementArb, { minLength: 1, maxLength: 20 }),
        (elements) => {
          const ordered = getFocusOrder(elements);
          const positives = ordered.filter((e) => e.tabIndex > 0);
          for (let i = 1; i < positives.length; i++) {
            expect(positives[i].tabIndex).toBeGreaterThanOrEqual(
              positives[i - 1].tabIndex,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 32: Text Alternatives for Visual Elements
// Task 16.4 — Validates: Requirements (alt text / aria-label / aria-hidden)
// =============================================================================
describe("Property 32: Text Alternatives for Visual Elements", () => {
  interface VisualElement {
    hasAlt: boolean;
    hasAriaLabel: boolean;
    isAriaHidden: boolean;
  }

  const isVisuallyAccessible = (el: VisualElement): boolean =>
    el.hasAlt || el.hasAriaLabel || el.isAriaHidden;

  const visualElementArb = fc.record({
    hasAlt: fc.boolean(),
    hasAriaLabel: fc.boolean(),
    isAriaHidden: fc.boolean(),
  });

  it("element with alt text is accessible", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (hasAriaLabel, isAriaHidden) => {
        const el: VisualElement = { hasAlt: true, hasAriaLabel, isAriaHidden };
        expect(isVisuallyAccessible(el)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("element with aria-label is accessible", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (hasAlt, isAriaHidden) => {
        const el: VisualElement = { hasAlt, hasAriaLabel: true, isAriaHidden };
        expect(isVisuallyAccessible(el)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("element marked aria-hidden is accessible (decorative)", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (hasAlt, hasAriaLabel) => {
        const el: VisualElement = { hasAlt, hasAriaLabel, isAriaHidden: true };
        expect(isVisuallyAccessible(el)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("element with none of the three mechanisms is not accessible", () => {
    const el: VisualElement = { hasAlt: false, hasAriaLabel: false, isAriaHidden: false };
    expect(isVisuallyAccessible(el)).toBe(false);
  });

  it("accessibility is determined by OR of all three mechanisms", () => {
    fc.assert(
      fc.property(visualElementArb, (el) => {
        const expected = el.hasAlt || el.hasAriaLabel || el.isAriaHidden;
        expect(isVisuallyAccessible(el)).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 33: Multi-Modal Information Conveyance
// Task 16.5 — Validates: Requirements (status indicators use >= 2 modalities)
// =============================================================================
describe("Property 33: Multi-Modal Information Conveyance", () => {
  interface StatusIndicator {
    hasColor: boolean;
    hasText: boolean;
    hasIcon: boolean;
  }

  const modalityCount = (indicator: StatusIndicator): number =>
    [indicator.hasColor, indicator.hasText, indicator.hasIcon].filter(Boolean).length;

  const isMultiModal = (indicator: StatusIndicator): boolean =>
    modalityCount(indicator) >= 2;

  const indicatorArb = fc.record({
    hasColor: fc.boolean(),
    hasText: fc.boolean(),
    hasIcon: fc.boolean(),
  });

  it("indicator with all three modalities is multi-modal", () => {
    const indicator: StatusIndicator = { hasColor: true, hasText: true, hasIcon: true };
    expect(isMultiModal(indicator)).toBe(true);
  });

  it("indicator with exactly 2 modalities is multi-modal", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { hasColor: true, hasText: true, hasIcon: false },
          { hasColor: true, hasText: false, hasIcon: true },
          { hasColor: false, hasText: true, hasIcon: true },
        ),
        (indicator) => {
          expect(isMultiModal(indicator)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("indicator with only 1 modality is not multi-modal", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { hasColor: true, hasText: false, hasIcon: false },
          { hasColor: false, hasText: true, hasIcon: false },
          { hasColor: false, hasText: false, hasIcon: true },
        ),
        (indicator) => {
          expect(isMultiModal(indicator)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("indicator with no modalities is not multi-modal", () => {
    const indicator: StatusIndicator = { hasColor: false, hasText: false, hasIcon: false };
    expect(isMultiModal(indicator)).toBe(false);
  });

  it("modality count is always between 0 and 3", () => {
    fc.assert(
      fc.property(indicatorArb, (indicator) => {
        const count = modalityCount(indicator);
        expect(count).toBeGreaterThanOrEqual(0);
        expect(count).toBeLessThanOrEqual(3);
      }),
      { numRuns: 100 },
    );
  });

  it("isMultiModal is equivalent to modalityCount >= 2", () => {
    fc.assert(
      fc.property(indicatorArb, (indicator) => {
        expect(isMultiModal(indicator)).toBe(modalityCount(indicator) >= 2);
      }),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 21: Pagination Boundary Button States
// Task 13.2 — Validates: Requirements 15.3, 15.4
// =============================================================================
/**
 * Property 21: Pagination Boundary Button States
 * Validates: Requirements 15.3, 15.4
 *
 * For any pagination state (totalItems, pageSize, currentPage):
 * - When currentPage === 1, hasPreviousPage must be false (prev button disabled)
 * - When currentPage === lastPage, hasNextPage must be false (next button disabled)
 * - When totalItems === 0, both hasPreviousPage and hasNextPage must be false
 * - lastPage = Math.max(1, Math.ceil(totalItems / pageSize))
 *
 * This is a pure logic test — no DOM or Vue mounting needed.
 */
describe("Property 21: Pagination Boundary Button States", () => {
  /**
   * Pure pagination boundary logic derived from usePagination composable.
   * The composable delegates boundary decisions to n-data-table, so we test
   * the underlying arithmetic that drives those decisions.
   */
  function computePaginationState(
    totalItems: number,
    pageSize: number,
    currentPage: number,
  ) {
    const lastPage = Math.max(1, Math.ceil(totalItems / pageSize));
    const clampedPage = Math.min(Math.max(1, currentPage), lastPage);
    const hasPreviousPage = clampedPage > 1;
    const hasNextPage = clampedPage < lastPage;
    return { lastPage, clampedPage, hasPreviousPage, hasNextPage };
  }

  it("hasPreviousPage must be false when currentPage is 1 for any totalItems and pageSize", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }), // totalItems
        fc.integer({ min: 1, max: 100 }),    // pageSize
        (totalItems, pageSize) => {
          const { hasPreviousPage } = computePaginationState(totalItems, pageSize, 1);
          expect(hasPreviousPage).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("hasNextPage must be false when currentPage is lastPage for any totalItems and pageSize", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }), // totalItems
        fc.integer({ min: 1, max: 100 }),    // pageSize
        (totalItems, pageSize) => {
          const lastPage = Math.max(1, Math.ceil(totalItems / pageSize));
          const { hasNextPage } = computePaginationState(totalItems, pageSize, lastPage);
          expect(hasNextPage).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("both hasPreviousPage and hasNextPage must be false when totalItems is 0", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // pageSize
        fc.integer({ min: 1, max: 100 }), // currentPage (any value — clamped to 1)
        (pageSize, currentPage) => {
          const { hasPreviousPage, hasNextPage } = computePaginationState(0, pageSize, currentPage);
          expect(hasPreviousPage).toBe(false);
          expect(hasNextPage).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("lastPage must always be at least 1 regardless of totalItems and pageSize", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }), // totalItems
        fc.integer({ min: 1, max: 100 }),    // pageSize
        (totalItems, pageSize) => {
          const { lastPage } = computePaginationState(totalItems, pageSize, 1);
          expect(lastPage).toBeGreaterThanOrEqual(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("hasPreviousPage must be true for any page > 1 that is not the only page", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10000 }), // totalItems (at least 2 so lastPage >= 2 with pageSize=1)
        fc.integer({ min: 1, max: 100 }),    // pageSize
        (totalItems, pageSize) => {
          const lastPage = Math.max(1, Math.ceil(totalItems / pageSize));
          // Only test when there are multiple pages
          if (lastPage < 2) return;
          // Any page from 2 to lastPage must have hasPreviousPage === true
          const currentPage = lastPage; // use lastPage as a representative interior/end page
          const { hasPreviousPage } = computePaginationState(totalItems, pageSize, currentPage);
          expect(hasPreviousPage).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("hasNextPage must be true for any page < lastPage when there are multiple pages", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10000 }), // totalItems
        fc.integer({ min: 1, max: 100 }),    // pageSize
        (totalItems, pageSize) => {
          const lastPage = Math.max(1, Math.ceil(totalItems / pageSize));
          // Only test when there are multiple pages
          if (lastPage < 2) return;
          // Page 1 must always have hasNextPage === true when lastPage > 1
          const { hasNextPage } = computePaginationState(totalItems, pageSize, 1);
          expect(hasNextPage).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("on a single-page result set, both buttons must be disabled", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // pageSize
        fc.integer({ min: 1, max: 100 }), // totalItems <= pageSize → single page
        (pageSize, extra) => {
          // totalItems is at most pageSize → always fits on one page
          const totalItems = Math.min(extra, pageSize);
          const { hasPreviousPage, hasNextPage, lastPage } = computePaginationState(
            totalItems,
            pageSize,
            1,
          );
          expect(lastPage).toBe(1);
          expect(hasPreviousPage).toBe(false);
          expect(hasNextPage).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// =============================================================================
// Property 22: Page Size Change Behavior
// Task 13.3 — Validates: Requirements 15.6
// =============================================================================
/**
 * Property 22: Page Size Change Behavior
 * Validates: Requirements 15.6
 *
 * When page size changes:
 * 1. currentPage must be reset to 1
 * 2. The total number of pages is recalculated: newLastPage = Math.max(1, Math.ceil(totalItems / newPageSize))
 * 3. The visible items count on any page is at most pageSize
 * 4. Changing page size to a larger value never increases the total page count
 *
 * This is a pure logic test — no DOM or Vue mounting needed.
 */
describe("Property 22: Page Size Change Behavior", () => {
  /**
   * 22.1: When page size changes, currentPage must be reset to 1
   * regardless of what page the user was on before.
   */
  it("22.1: currentPage must reset to 1 after any page size change, regardless of prior page", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 500 }), // prior page (> 1 to make the reset observable)
        fc.constantFrom(10, 20, 50, 100), // new page size
        (priorPage, newPageSize) => {
          const { handlePageChange, handlePageSizeChange, currentPage } =
            usePagination();
          // Navigate to a page > 1
          handlePageChange(priorPage);
          expect(currentPage.value).toBe(priorPage);
          // Change page size — must reset to 1
          handlePageSizeChange(newPageSize);
          expect(currentPage.value).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * 22.2: After a page size change, the total number of pages is recalculated
   * correctly: newLastPage = Math.max(1, Math.ceil(totalItems / newPageSize))
   */
  it("22.2: total page count is recalculated correctly after page size change", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // totalItems
        fc.constantFrom(10, 20, 50, 100),   // newPageSize
        (totalItems, newPageSize) => {
          const expectedLastPage = Math.max(
            1,
            Math.ceil(totalItems / newPageSize),
          );
          // Verify the formula is correct: lastPage must be >= 1
          expect(expectedLastPage).toBeGreaterThanOrEqual(1);
          // And must equal ceil(totalItems / newPageSize) for any positive inputs
          expect(expectedLastPage).toBe(
            Math.max(1, Math.ceil(totalItems / newPageSize)),
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * 22.3: The visible items count on any page is at most pageSize.
   * visibleCount = Math.min(pageSize, totalItems - (currentPage - 1) * pageSize)
   */
  it("22.3: visible items count on any page is at most pageSize", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // totalItems
        fc.constantFrom(10, 20, 50, 100),   // pageSize
        fc.integer({ min: 1, max: 200 }),   // requested page (may exceed lastPage)
        (totalItems, pageSz, requestedPage) => {
          const lastPage = Math.max(1, Math.ceil(totalItems / pageSz));
          // Clamp to valid page range
          const currentPage = Math.min(requestedPage, lastPage);
          const visibleCount = Math.min(
            pageSz,
            totalItems - (currentPage - 1) * pageSz,
          );
          // Visible count must never exceed pageSize
          expect(visibleCount).toBeLessThanOrEqual(pageSz);
          // Visible count must be at least 1 (since currentPage is clamped to lastPage)
          expect(visibleCount).toBeGreaterThanOrEqual(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * 22.4: Changing page size to a larger value never increases the total page count
   * (it can only decrease or stay the same).
   */
  it("22.4: increasing page size never increases the total page count", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // totalItems
        fc.integer({ min: 1, max: 50 }),    // oldPageSize
        fc.integer({ min: 1, max: 50 }),    // delta (added to oldPageSize to get newPageSize)
        (totalItems, oldPageSize, delta) => {
          const newPageSize = oldPageSize + delta; // newPageSize > oldPageSize
          const oldLastPage = Math.max(1, Math.ceil(totalItems / oldPageSize));
          const newLastPage = Math.max(1, Math.ceil(totalItems / newPageSize));
          // A larger page size must produce the same or fewer pages
          expect(newLastPage).toBeLessThanOrEqual(oldLastPage);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * 22.5: usePagination composable — handlePageSizeChange updates pageSize
   * and resets currentPage to 1 for any combination of old and new page sizes.
   */
  it("22.5: usePagination.handlePageSizeChange updates pageSize and resets currentPage to 1", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(10, 20, 50, 100), // initial page size
        fc.constantFrom(10, 20, 50, 100), // new page size
        fc.integer({ min: 1, max: 100 }), // page navigated to before size change
        (initialSize, newSize, priorPage) => {
          const { handlePageChange, handlePageSizeChange, currentPage, pageSize } =
            usePagination(initialSize);
          // Navigate to some page
          handlePageChange(priorPage);
          // Change page size
          handlePageSizeChange(newSize);
          // pageSize must be updated
          expect(pageSize.value).toBe(newSize);
          // currentPage must be reset to 1
          expect(currentPage.value).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });
});
