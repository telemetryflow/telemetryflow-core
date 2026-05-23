/**
 * Unit Tests: useKubernetesStore
 * Feature: frontend-backend-monitoring-kubernetes-integration
 * Task 22 — Validates: Requirements 10.1, 10.2, 13.2, 13.3
 *
 * Tests cover:
 *  - loadClusters: store state is updated from API response
 *  - setCluster / setRegion / setProvider: selection state updates
 *  - fetchOverview: time-series data is mapped to store refs
 *  - resetAllFilters: all selection state is cleared
 *
 * kubernetesApi is mocked to prevent real HTTP calls.
 * Config is forced to useMock=false so live-mode code paths are exercised.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

// ── Mock config before importing the store ─────────────────────────────────
vi.mock("@/config", () => ({
  default: { useMock: false },
}));

// ── Mock kubernetesApi ──────────────────────────────────────────────────────
vi.mock("@/api/kubernetes", () => ({
  kubernetesApi: {
    listClusters: vi.fn(),
    getOverview: vi.fn(),
    fetchNodeMetrics: vi.fn(),
    refreshMockData: vi.fn(),
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
    getSelectedRegionId: vi.fn(() => ""),
    getSelectedClusterId: vi.fn(() => ""),
    setRegion: vi.fn(),
    setCluster: vi.fn(),
    getClustersByProvider: vi.fn(() => []),
    getNamespaces: vi.fn(() => []),
    getNodes: vi.fn(() => []),
  },
}));

// ── Mock app store ──────────────────────────────────────────────────────────
vi.mock("@/store/app", () => ({
  useAppStore: () => ({
    globalTimeRange: {
      start: Date.now() - 60 * 60 * 1000, // 1 hour ago
      end: Date.now(),
    },
  }),
}));

import { useKubernetesStore } from "@/store/kubernetes";
import { kubernetesApi } from "@/api/kubernetes";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeCluster(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "cluster-1",
    name: "prod-cluster",
    displayName: "Production Cluster",
    provider: "eks",
    region: "us-east-1",
    apiServerUrl: "https://k8s.example.com",
    version: "1.28",
    status: "active",
    nodeCount: 3,
    podCount: 42,
    namespaceCount: 5,
    organizationId: "org-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    labels: {},
    ...overrides,
  };
}

function makeOverviewResponse() {
  const series = [{ name: "node-1", data: [[Date.now(), 55]] }];
  return {
    overview: { nodes: 3, namespaces: 5, runningPods: 42, deployments: 10 },
    statCards: [],
    cpuUsagePercentages: { real: 45, requests: 60, limits: 80 },
    ramUsagePercentages: { real: 55, requests: 70, limits: 90 },
    resourceCountTimeSeries: [],
    clusterCpuUtilization: series,
    clusterMemoryUtilization: series,
    cpuByNamespace: series,
    memoryByNamespace: series,
    cpuByInstance: series,
    memoryByInstance: series,
    cpuThrottledByNamespace: [],
    cpuThrottledByInstance: [],
    podsQoSData: series,
    podsStatusReason: series,
    oomEventsByNamespace: [],
    containerRestarts: series,
    networkByDevice: series,
    networkPacketsDropped: series,
    networkByNamespace: series,
    networkByInstance: series,
    networkByInstanceK8sProd: [],
    hpaTimeSeries: [],
    hpaTotalCount: 0,
    pdbTimeSeries: [],
    pdbTotalDisruptionsAllowed: 0,
    memoryWorkingSetByPod: series,
    diskByNode: series,
    networkByNode: series,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("useKubernetesStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // ── loadClusters ─────────────────────────────────────────────────────────

  describe("loadClusters()", () => {
    it("populates liveClusters from API response (data array)", async () => {
      const cluster = makeCluster();
      vi.mocked(kubernetesApi.listClusters).mockResolvedValue({
        data: [cluster],
        total: 1,
        page: 1,
        limit: 1000,
      } as any);

      const store = useKubernetesStore();
      await store.loadClusters();

      const regions = store.getRegions();
      expect(regions.some((r) => r.id === cluster.region)).toBe(true);
    });

    it("populates liveClusters from API response (clusters array)", async () => {
      const cluster = makeCluster();
      vi.mocked(kubernetesApi.listClusters).mockResolvedValue({
        clusters: [cluster],
      } as any);

      const store = useKubernetesStore();
      await store.loadClusters();

      const clusters = store.getClusters();
      expect(clusters.some((c) => c.id === cluster.id)).toBe(true);
    });

    it("auto-selects the first cluster when none is selected", async () => {
      const cluster = makeCluster({ id: "auto-select-1", region: "eu-west-1" });
      vi.mocked(kubernetesApi.listClusters).mockResolvedValue({
        clusters: [cluster],
      } as any);

      const store = useKubernetesStore();
      expect(store.selectedClusterId).toBe("");

      await store.loadClusters();

      expect(store.selectedClusterId).toBe("auto-select-1");
      expect(store.selectedRegionId).toBe("eu-west-1");
    });

    it("does not overwrite an already-selected cluster", async () => {
      const cluster1 = makeCluster({ id: "c1" });
      const cluster2 = makeCluster({ id: "c2" });
      vi.mocked(kubernetesApi.listClusters).mockResolvedValue({
        clusters: [cluster1, cluster2],
      } as any);

      const store = useKubernetesStore();
      store.selectedClusterId = "c2"; // pre-selected

      await store.loadClusters();

      expect(store.selectedClusterId).toBe("c2");
    });

    it("sets liveClusters to [] when API throws", async () => {
      vi.mocked(kubernetesApi.listClusters).mockRejectedValue(new Error("network error"));

      const store = useKubernetesStore();
      await store.loadClusters();

      // Store should not crash; clusters should be empty
      expect(store.getClusters()).toHaveLength(0);
    });
  });

  // ── setCluster / setRegion / setProvider ─────────────────────────────────

  describe("setCluster()", () => {
    it("updates selectedClusterId", () => {
      vi.mocked(kubernetesApi.getOverview).mockResolvedValue(makeOverviewResponse() as any);

      const store = useKubernetesStore();
      store.setCluster("cluster-xyz");

      expect(store.selectedClusterId).toBe("cluster-xyz");
    });

    it("triggers fetchOverview after updating selection", async () => {
      vi.mocked(kubernetesApi.getOverview).mockResolvedValue(makeOverviewResponse() as any);

      const store = useKubernetesStore();
      store.setCluster("cluster-xyz");

      // Allow promises to settle
      await Promise.resolve();
      expect(kubernetesApi.getOverview).toHaveBeenCalled();
    });
  });

  describe("setRegion()", () => {
    it("updates selectedRegionId", () => {
      vi.mocked(kubernetesApi.getOverview).mockResolvedValue(makeOverviewResponse() as any);

      const store = useKubernetesStore();
      store.setRegion("us-west-2");

      expect(store.selectedRegionId).toBe("us-west-2");
    });

    it("auto-selects first cluster in region (live mode)", () => {
      vi.mocked(kubernetesApi.getOverview).mockResolvedValue(makeOverviewResponse() as any);

      const store = useKubernetesStore();
      // Seed liveClusters by direct assignment (bypass loadClusters)
      (store as any).liveClusters = [
        makeCluster({ id: "c-west", region: "us-west-2" }),
        makeCluster({ id: "c-east", region: "us-east-1" }),
      ];

      store.setRegion("us-west-2");
      expect(store.selectedClusterId).toBe("c-west");
    });
  });

  describe("setProvider()", () => {
    it("updates selectedProvider", () => {
      vi.mocked(kubernetesApi.getOverview).mockResolvedValue(makeOverviewResponse() as any);

      const store = useKubernetesStore();
      store.setProvider("gke");

      expect(store.selectedProvider).toBe("gke");
    });

    it("auto-selects first cluster matching provider (live mode)", () => {
      vi.mocked(kubernetesApi.getOverview).mockResolvedValue(makeOverviewResponse() as any);

      const store = useKubernetesStore();
      (store as any).liveClusters = [
        makeCluster({ id: "gke-1", provider: "gke" }),
        makeCluster({ id: "eks-1", provider: "eks" }),
      ];

      store.setProvider("gke");
      expect(store.selectedClusterId).toBe("gke-1");
    });
  });

  // ── fetchOverview ─────────────────────────────────────────────────────────

  describe("fetchOverview()", () => {
    it("maps API response to time-series store refs", async () => {
      const response = makeOverviewResponse();
      vi.mocked(kubernetesApi.getOverview).mockResolvedValue(response as any);

      const store = useKubernetesStore();
      await store.fetchOverview("cluster-1");

      expect(store.clusterCpuUtilization).toEqual(response.clusterCpuUtilization);
      expect(store.clusterMemoryUtilization).toEqual(response.clusterMemoryUtilization);
      expect(store.cpuByNamespace).toEqual(response.cpuByNamespace);
      expect(store.memoryByNamespace).toEqual(response.memoryByNamespace);
      expect(store.containerRestarts).toEqual(response.containerRestarts);
      expect(store.diskByNode).toEqual(response.diskByNode);
      expect(store.networkByNode).toEqual(response.networkByNode);
    });

    it("sets loading=true during fetch and loading=false after", async () => {
      let resolveOverview!: (v: unknown) => void;
      const pending = new Promise((res) => (resolveOverview = res));
      vi.mocked(kubernetesApi.getOverview).mockReturnValue(pending as any);

      const store = useKubernetesStore();
      const fetchPromise = store.fetchOverview("cluster-1");

      expect(store.loading).toBe(true);

      resolveOverview(makeOverviewResponse());
      await fetchPromise;

      expect(store.loading).toBe(false);
    });

    it("sets error ref on API failure", async () => {
      vi.mocked(kubernetesApi.getOverview).mockRejectedValue(new Error("Server error"));

      const store = useKubernetesStore();
      await store.fetchOverview("cluster-1");

      expect(store.error).toMatch(/Server error|Failed/);
      expect(store.loading).toBe(false);
    });

    it("passes currentInterval to the API call", async () => {
      const response = makeOverviewResponse();
      vi.mocked(kubernetesApi.getOverview).mockResolvedValue(response as any);

      const store = useKubernetesStore();
      await store.fetchOverview("cluster-1");

      // currentInterval is derived from globalTimeRange diff (1h → "1h")
      const [, interval] = vi.mocked(kubernetesApi.getOverview).mock.calls[0];
      expect(["5m", "15m", "30m", "1h", "3h", "6h"]).toContain(interval);
    });
  });

  // ── resetAllFilters ───────────────────────────────────────────────────────

  describe("resetAllFilters()", () => {
    it("clears all filter selection state", () => {
      const store = useKubernetesStore();
      store.selectedProvider = "eks";
      store.selectedRegionId = "us-east-1";
      store.selectedClusterId = "cluster-1";
      store.selectedNode = "node-1";
      store.selectedNamespace = "default";
      store.selectedPod = "my-pod";

      store.resetAllFilters();

      expect(store.selectedProvider).toBe("");
      expect(store.selectedRegionId).toBe("");
      expect(store.selectedClusterId).toBe("");
      expect(store.selectedNode).toBe("");
      expect(store.selectedNamespace).toBe("");
      expect(store.selectedPod).toBe("");
    });

    it("activeFilters becomes empty after resetAllFilters()", () => {
      const store = useKubernetesStore();
      store.selectedProvider = "eks";
      store.selectedRegionId = "us-east-1";
      store.resetAllFilters();

      expect(store.activeFilters).toHaveLength(0);
    });
  });

  // ── currentInterval ───────────────────────────────────────────────────────

  describe("currentInterval", () => {
    it("maps a 1-hour time range to '1h'", () => {
      const store = useKubernetesStore();
      // globalTimeRange mock returns 1h diff → should map to "1h"
      expect(store.currentInterval).toBe("1h");
    });
  });
});
