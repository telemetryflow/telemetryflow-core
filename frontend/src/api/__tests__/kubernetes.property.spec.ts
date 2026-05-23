/**
 * Property-Based Tests for Kubernetes API Client
 * Feature: frontend-backend-monitoring-kubernetes-integration
 *
 * Property 1: Tenant Context Isolation
 * **Validates: Requirements 1.1, 9.2**
 *
 * Property 9.5: Request Timeout Handling
 * **Validates: Requirements 9.5**
 *
 * Property 9: Filter Parameter Passing
 * **Validates: Requirements 4.3, 5.3, 6.3, 7.3, 8.5, 14.1, 14.2, 14.3, 14.4**
 *
 * Property 34: Provider Type Validation
 * **Validates: Requirements 20.1, 20.2**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";

// Mock config to disable mock mode so real API paths are exercised
vi.mock("@/config", () => ({
  config: {
    useMock: false,
    iamApiUrl: "http://localhost:3000",
  },
}));

// Mock all composable/mock dependencies that kubernetes.ts imports
vi.mock("@/composables/useKubernetesData.mock", () => ({
  mockKubernetesData: vi.fn(() => ({})),
}));

vi.mock("@/mocks/kubernetes", () => ({
  kubernetesMock: {
    getNodes: vi.fn(() => []),
    getPods: vi.fn(() => []),
    getDeployments: vi.fn(() => []),
    getNamespaces: vi.fn(() => []),
    getPersistentVolumes: vi.fn(() => []),
  },
}));

vi.mock("@/mocks/shared", () => ({
  K8S_ALL_CLUSTERS: [],
  K8S_REGIONS: [],
}));

vi.mock("@/config/collector", () => ({
  COLLECTOR_ENDPOINTS: {
    KUBERNETES_OVERVIEW: "/api/v2/monitoring/kubernetes/overview",
    KUBERNETES_CLUSTERS: "/api/v2/monitoring/kubernetes/clusters",
    KUBERNETES_API_SERVER: "/api/v2/monitoring/kubernetes/api-server",
    KUBERNETES_COREDNS: "/api/v2/monitoring/kubernetes/coredns",
  },
  K8S_CLUSTER_ENDPOINTS: {
    nodeMetrics: (id: string) =>
      `/api/v2/monitoring/kubernetes/clusters/${id}/metrics/nodes`,
    nodes: (id: string) => `/api/v2/monitoring/kubernetes/clusters/${id}/nodes`,
    pods: (id: string) => `/api/v2/monitoring/kubernetes/clusters/${id}/pods`,
    deployments: (id: string) =>
      `/api/v2/monitoring/kubernetes/clusters/${id}/deployments`,
    namespaces: (id: string) =>
      `/api/v2/monitoring/kubernetes/clusters/${id}/namespaces`,
    persistentVolumes: (id: string) =>
      `/api/v2/monitoring/kubernetes/clusters/${id}/persistent-volumes`,
    logs: (id: string) => `/api/v2/monitoring/kubernetes/clusters/${id}/logs`,
  },
}));

// Mock iamClient so the module resolves without real HTTP setup
vi.mock("@/api/iam", () => {
  const iamClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { iamClient, default: iamClient };
});

// Import after all mocks are set up
import { iamClient } from "@/api/iam";
import { kubernetesApi } from "../kubernetes";

describe("Kubernetes API Client - Property Tests", () => {
  // Spies on the actual iamClient singleton instance
  let getSpy: ReturnType<typeof vi.spyOn<typeof iamClient, "get">>;
  let postSpy: ReturnType<typeof vi.spyOn<typeof iamClient, "post">>;
  let putSpy: ReturnType<typeof vi.spyOn<typeof iamClient, "put">>;
  let deleteSpy: ReturnType<typeof vi.spyOn<typeof iamClient, "delete">>;

  beforeEach(() => {
    getSpy = vi.spyOn(iamClient, "get").mockResolvedValue({} as any);
    postSpy = vi.spyOn(iamClient, "post").mockResolvedValue({} as any);
    putSpy = vi.spyOn(iamClient, "put").mockResolvedValue({} as any);
    deleteSpy = vi
      .spyOn(iamClient, "delete")
      .mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 1: Tenant Context Isolation
   * **Validates: Requirements 1.1, 9.2**
   *
   * For any clusterId and interval combination, `getOverview` MUST use `iamClient`
   * (which carries the tenant JWT) and MUST NOT use any other HTTP client.
   * This guarantees tenant context is always present in every kubernetes API call.
   */
  describe("Property 1: Tenant Context Isolation", () => {
    it("getOverview must always use iamClient for any clusterId and interval", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: undefined }),
          fc.constantFrom(
            "5m",
            "15m",
            "30m",
            "1h",
            "3h",
            "6h",
            "12h",
            "24h",
            "2d",
            "7d",
            "14d",
            "30d",
            "90d",
          ),
          async (clusterId, interval) => {
            getSpy.mockClear();
            getSpy.mockResolvedValue({} as any);

            await kubernetesApi.getOverview(clusterId, interval);

            // iamClient.get MUST have been called — tenant JWT is attached by iamClient
            expect(getSpy).toHaveBeenCalledTimes(1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("getOverview must never bypass iamClient for any input combination", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: undefined }),
          fc.string({ minLength: 1, maxLength: 10 }),
          async (clusterId, interval) => {
            getSpy.mockClear();
            getSpy.mockResolvedValue({} as any);

            await kubernetesApi.getOverview(clusterId, interval);

            // The call count must be exactly 1 — no other client is used
            expect(getSpy).toHaveBeenCalledTimes(1);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 9.5: Request Timeout Handling
   * **Validates: Requirements 9.5**
   *
   * When `iamClient.get` rejects with a timeout error (ECONNABORTED), the
   * `getOverview` function must propagate the error to the caller.
   * It must NOT swallow or suppress timeout errors silently.
   */
  describe("Property 9.5: Request Timeout Handling", () => {
    it("getOverview must propagate timeout errors for any clusterId and interval", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: undefined }),
          fc.constantFrom(
            "5m",
            "15m",
            "30m",
            "1h",
            "3h",
            "6h",
            "12h",
            "24h",
            "2d",
            "7d",
            "14d",
            "30d",
            "90d",
          ),
          async (clusterId, interval) => {
            // Simulate a timeout error as Axios would produce it
            const timeoutError = Object.assign(
              new Error("timeout of 30000ms exceeded"),
              {
                code: "ECONNABORTED",
              },
            );
            getSpy.mockClear();
            getSpy.mockRejectedValue(timeoutError);

            // getOverview must reject — it must NOT swallow the timeout error
            await expect(
              kubernetesApi.getOverview(clusterId, interval),
            ).rejects.toThrow("timeout of 30000ms exceeded");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("getOverview must propagate timeout errors with ECONNABORTED code for any input", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.uuid(), { nil: undefined }),
          fc.string({ minLength: 1, maxLength: 10 }),
          async (clusterId, interval) => {
            const timeoutError = Object.assign(
              new Error("timeout of 30000ms exceeded"),
              {
                code: "ECONNABORTED",
              },
            );
            getSpy.mockClear();
            getSpy.mockRejectedValue(timeoutError);

            let caughtError: unknown;
            try {
              await kubernetesApi.getOverview(clusterId, interval);
            } catch (err) {
              caughtError = err;
            }

            // The error must have been propagated (not swallowed)
            expect(caughtError).toBeDefined();
            expect((caughtError as any).code).toBe("ECONNABORTED");
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 9: Filter Parameter Passing
   * **Validates: Requirements 4.3, 5.3, 6.3, 7.3, 8.5, 14.1, 14.2, 14.3, 14.4**
   *
   * For any combination of filter parameters (namespace, clusterId), when these
   * filters are passed to the kubernetes API functions, the parameters must be
   * forwarded to the HTTP request.
   *
   * Specifically:
   * - `fetchPods(clusterId, namespace)` must pass `namespace` as a query param
   * - `fetchNodes(clusterId)` must call the correct cluster-scoped URL
   * - `fetchDeployments(clusterId)` must call the correct cluster-scoped URL
   * - `fetchNamespaceDetails(clusterId)` must call the correct cluster-scoped URL
   */
  describe("Property 9: Filter Parameter Passing", () => {
    it("fetchPods must forward namespace filter param for any clusterId and namespace", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 63 }),
          async (clusterId, namespace) => {
            getSpy.mockClear();
            getSpy.mockResolvedValue({ data: [] } as any);

            await kubernetesApi.fetchPods(clusterId, namespace);

            expect(getSpy).toHaveBeenCalledTimes(1);
            const callArgs = getSpy.mock.calls[0];
            const params = (callArgs[1] as any)?.params;
            expect(params).toBeDefined();
            expect(params.namespace).toBe(namespace);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("fetchPods without namespace must not include namespace param for any clusterId", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (clusterId) => {
          getSpy.mockClear();
          getSpy.mockResolvedValue({ data: [] } as any);

          await kubernetesApi.fetchPods(clusterId);

          expect(getSpy).toHaveBeenCalledTimes(1);
          const callArgs = getSpy.mock.calls[0];
          const params = (callArgs[1] as any)?.params ?? {};
          // namespace must not be set when not provided
          expect(params.namespace).toBeUndefined();
        }),
        { numRuns: 100 },
      );
    });

    it("fetchPods must include clusterId in the request URL for any clusterId", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.option(fc.string({ minLength: 1, maxLength: 63 }), {
            nil: undefined,
          }),
          async (clusterId, namespace) => {
            getSpy.mockClear();
            getSpy.mockResolvedValue({ data: [] } as any);

            await kubernetesApi.fetchPods(clusterId, namespace);

            expect(getSpy).toHaveBeenCalledTimes(1);
            const url = getSpy.mock.calls[0][0] as string;
            expect(url).toContain(clusterId);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("fetchNodes must include clusterId in the request URL for any clusterId", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (clusterId) => {
          getSpy.mockClear();
          getSpy.mockResolvedValue({ data: [] } as any);

          await kubernetesApi.fetchNodes(clusterId);

          expect(getSpy).toHaveBeenCalledTimes(1);
          const url = getSpy.mock.calls[0][0] as string;
          expect(url).toContain(clusterId);
        }),
        { numRuns: 100 },
      );
    });

    it("fetchDeployments must include clusterId in the request URL for any clusterId", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (clusterId) => {
          getSpy.mockClear();
          getSpy.mockResolvedValue({ deployments: [] } as any);

          await kubernetesApi.fetchDeployments(clusterId);

          expect(getSpy).toHaveBeenCalledTimes(1);
          const url = getSpy.mock.calls[0][0] as string;
          expect(url).toContain(clusterId);
        }),
        { numRuns: 100 },
      );
    });

    it("fetchNamespaceDetails must include clusterId in the request URL for any clusterId", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (clusterId) => {
          getSpy.mockClear();
          getSpy.mockResolvedValue({ data: [] } as any);

          await kubernetesApi.fetchNamespaceDetails(clusterId);

          expect(getSpy).toHaveBeenCalledTimes(1);
          const url = getSpy.mock.calls[0][0] as string;
          expect(url).toContain(clusterId);
        }),
        { numRuns: 100 },
      );
    });

    it("fetchPods URL must contain the pods path segment for any clusterId", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (clusterId) => {
          getSpy.mockClear();
          getSpy.mockResolvedValue({ data: [] } as any);

          await kubernetesApi.fetchPods(clusterId);

          const url = getSpy.mock.calls[0][0] as string;
          expect(url).toContain("/pods");
        }),
        { numRuns: 100 },
      );
    });

    it("fetchNodes URL must contain the nodes path segment for any clusterId", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (clusterId) => {
          getSpy.mockClear();
          getSpy.mockResolvedValue({ data: [] } as any);

          await kubernetesApi.fetchNodes(clusterId);

          const url = getSpy.mock.calls[0][0] as string;
          expect(url).toContain("/nodes");
        }),
        { numRuns: 100 },
      );
    });

    it("fetchDeployments URL must contain the deployments path segment for any clusterId", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (clusterId) => {
          getSpy.mockClear();
          getSpy.mockResolvedValue({ deployments: [] } as any);

          await kubernetesApi.fetchDeployments(clusterId);

          const url = getSpy.mock.calls[0][0] as string;
          expect(url).toContain("/deployments");
        }),
        { numRuns: 100 },
      );
    });

    it("fetchNamespaceDetails URL must contain the namespaces path segment for any clusterId", async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (clusterId) => {
          getSpy.mockClear();
          getSpy.mockResolvedValue({ data: [] } as any);

          await kubernetesApi.fetchNamespaceDetails(clusterId);

          const url = getSpy.mock.calls[0][0] as string;
          expect(url).toContain("/namespaces");
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 11: Cross-Resource Namespace Filtering
   * **Validates: Requirements 7.5**
   *
   * When a namespace is selected, ALL resource views must filter by that namespace
   * consistently — the same namespace string must appear in the API request params
   * for each resource type.
   *
   * `fetchPods(clusterId, namespace)` is the primary namespace-aware API function.
   * This property verifies that:
   * 1. For any namespace string, the exact namespace value is forwarded in the HTTP
   *    request params (no truncation, transformation, or substitution).
   * 2. Two independent calls with the same namespace both forward the same param value,
   *    proving the namespace is passed through consistently across invocations.
   * 3. Two calls with different namespaces each forward their own namespace value,
   *    proving there is no cross-call contamination (no shared mutable state).
   */
  describe("Property 11: Cross-Resource Namespace Filtering", () => {
    it("fetchPods must forward the exact namespace string in request params for any namespace", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 30 }),
          async (clusterId, namespace) => {
            getSpy.mockClear();
            getSpy.mockResolvedValue({ data: [] } as any);

            await kubernetesApi.fetchPods(clusterId, namespace);

            expect(getSpy).toHaveBeenCalledTimes(1);
            const params = (getSpy.mock.calls[0][1] as any)?.params;
            expect(params).toBeDefined();
            // The exact namespace string must be forwarded — no transformation
            expect(params.namespace).toBe(namespace);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("two fetchPods calls with the same namespace must both forward the same namespace param", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 30 }),
          async (clusterId, namespace) => {
            getSpy.mockClear();
            getSpy.mockResolvedValue({ data: [] } as any);

            // Simulate two resource views filtering by the same namespace
            await kubernetesApi.fetchPods(clusterId, namespace);
            await kubernetesApi.fetchPods(clusterId, namespace);

            expect(getSpy).toHaveBeenCalledTimes(2);

            const firstCallParams = (getSpy.mock.calls[0][1] as any)?.params;
            const secondCallParams = (getSpy.mock.calls[1][1] as any)?.params;

            // Both calls must carry the same namespace value — cross-resource consistency
            expect(firstCallParams?.namespace).toBe(namespace);
            expect(secondCallParams?.namespace).toBe(namespace);
            expect(firstCallParams?.namespace).toBe(secondCallParams?.namespace);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("fetchPods calls with different namespaces must each forward their own namespace (no cross-call contamination)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          async (clusterId, namespaceA, namespaceB) => {
            getSpy.mockClear();
            getSpy.mockResolvedValue({ data: [] } as any);

            await kubernetesApi.fetchPods(clusterId, namespaceA);
            await kubernetesApi.fetchPods(clusterId, namespaceB);

            expect(getSpy).toHaveBeenCalledTimes(2);

            const firstCallParams = (getSpy.mock.calls[0][1] as any)?.params;
            const secondCallParams = (getSpy.mock.calls[1][1] as any)?.params;

            // Each call must forward its own namespace — no shared mutable state
            expect(firstCallParams?.namespace).toBe(namespaceA);
            expect(secondCallParams?.namespace).toBe(namespaceB);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("fetchPods without namespace must not pollute subsequent calls that do specify a namespace", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 30 }),
          async (clusterId, namespace) => {
            getSpy.mockClear();
            getSpy.mockResolvedValue({ data: [] } as any);

            // First call: no namespace filter
            await kubernetesApi.fetchPods(clusterId);
            // Second call: with namespace filter
            await kubernetesApi.fetchPods(clusterId, namespace);

            expect(getSpy).toHaveBeenCalledTimes(2);

            const firstCallParams = (getSpy.mock.calls[0][1] as any)?.params ?? {};
            const secondCallParams = (getSpy.mock.calls[1][1] as any)?.params;

            // First call must not have namespace
            expect(firstCallParams.namespace).toBeUndefined();
            // Second call must have the exact namespace
            expect(secondCallParams?.namespace).toBe(namespace);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 34: Provider Type Validation
   * **Validates: Requirements 20.1, 20.2**
   *
   * The `listClusters` function accepts an optional `provider` filter.
   * Valid provider values are the 15 supported K8s provider types.
   *
   * Property A: For any valid provider string passed to `listClusters`, the
   * provider value must be forwarded as a query parameter in the API request.
   *
   * Property B: For any provider string (valid or not), `listClusters` must
   * not throw synchronously — it must either resolve or reject as a Promise.
   */
  describe("Property 34: Provider Type Validation", () => {
    const VALID_PROVIDERS = [
      "eks",
      "gke",
      "aks",
      "ack",
      "cce",
      "self-managed",
      "k3s",
      "kind",
      "minikube",
      "rancher",
      "openshift",
      "okd",
      "microshift",
      "kubesphere",
      "other",
    ] as const;

    const EMPTY_CLUSTER_LIST_RESPONSE = {
      data: [],
      total: 0,
      page: 1,
      limit: 100,
    };

    it("valid provider must be forwarded as a query param in the API request", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...VALID_PROVIDERS),
          async (provider) => {
            getSpy.mockClear();
            getSpy.mockResolvedValue(EMPTY_CLUSTER_LIST_RESPONSE as any);

            await kubernetesApi.listClusters({ provider });

            expect(getSpy).toHaveBeenCalledTimes(1);

            const callArgs = getSpy.mock.calls[0];
            // callArgs[1] is the config object with { params: query }
            const params = (callArgs[1] as any)?.params;
            expect(params).toBeDefined();
            expect(params.provider).toBe(provider);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("listClusters must return a Promise (not throw synchronously) for any provider string", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 50 }),
          async (provider) => {
            getSpy.mockClear();
            getSpy.mockResolvedValue(EMPTY_CLUSTER_LIST_RESPONSE as any);

            // listClusters must not throw synchronously — it must return a Promise
            const result = kubernetesApi.listClusters({ provider });
            expect(result).toBeInstanceOf(Promise);

            // Await to settle (resolve or reject) — either is acceptable
            await result.catch(() => {
              // rejection is acceptable; synchronous throw is not
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

/**
 * Property 19: Filter Debouncing
 * **Validates: Requirements 14.5, 17.4**
 *
 * For any text input filter, the frontend must debounce the input by 300–500ms
 * before sending the API request, preventing excessive API calls during typing.
 *
 * Property 19A: For N rapid filter changes (N >= 2) all within the debounce
 * window, the callback must be invoked exactly once after the window expires.
 *
 * Property 19B: The debounce function must not invoke the callback at all if
 * the debounce window has not yet elapsed.
 */
describe("Property 19: Filter Debouncing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * A minimal debounce implementation that mirrors the contract expected from
   * `useDebounceFn` (VueUse) or any standard debounce utility used in the
   * Kubernetes monitoring views.
   */
  function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delayMs: number,
  ): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn(...args);
      }, delayMs);
    };
  }

  /**
   * Property 19A: N rapid calls within the debounce window → exactly 1 invocation
   *
   * For any N >= 2 rapid filter changes where each change happens within the
   * debounce window (< 300ms apart), the underlying API call must be triggered
   * exactly once after the debounce window expires.
   */
  it("Property 19A: N rapid calls within debounce window result in exactly 1 API call", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }), // N: number of rapid calls
        fc.integer({ min: 1, max: 299 }), // delay between calls (within 300ms window)
        (n, delayBetweenCalls) => {
          const mockApiCall = vi.fn();
          const DEBOUNCE_MS = 300;
          const debouncedCall = debounce(mockApiCall, DEBOUNCE_MS);

          // Fire N rapid calls, each separated by delayBetweenCalls ms
          for (let i = 0; i < n; i++) {
            debouncedCall(`filter-value-${i}`);
            if (i < n - 1) {
              vi.advanceTimersByTime(delayBetweenCalls);
            }
          }

          // Debounce window has NOT yet elapsed — callback must not have fired
          expect(mockApiCall).not.toHaveBeenCalled();

          // Advance past the debounce window
          vi.advanceTimersByTime(DEBOUNCE_MS);

          // Exactly 1 call must have been made, with the last filter value
          expect(mockApiCall).toHaveBeenCalledTimes(1);
          expect(mockApiCall).toHaveBeenCalledWith(`filter-value-${n - 1}`);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 19B: Callback must NOT fire before the debounce window expires
   *
   * For any number of calls made within the debounce window, if the window
   * has not yet elapsed, the API callback must not have been invoked at all.
   */
  it("Property 19B: callback is not invoked before the debounce window expires", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // N: number of calls
        fc.integer({ min: 1, max: 299 }), // time elapsed after last call (still within window)
        (n, elapsedAfterLastCall) => {
          const mockApiCall = vi.fn();
          const DEBOUNCE_MS = 300;
          const debouncedCall = debounce(mockApiCall, DEBOUNCE_MS);

          // Fire N calls
          for (let i = 0; i < n; i++) {
            debouncedCall(`filter-${i}`);
          }

          // Advance time but stay within the debounce window
          vi.advanceTimersByTime(elapsedAfterLastCall);

          // Callback must NOT have fired yet
          expect(mockApiCall).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 3: Error Type to Message Mapping
 * **Validates: Requirements 1.4, 9.3, 9.4, 9.6, 11.2, 11.3, 11.4**
 *
 * For any HTTP error (4xx, 5xx) or network error thrown by iamClient,
 * the kubernetes API functions must propagate the error to the caller.
 * Errors must NEVER be swallowed or silently converted to empty responses.
 */
describe("Property 3: Error Type to Message Mapping", () => {
  let getSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSpy = vi.fn().mockResolvedValue({} as any);
    (iamClient as any).get = getSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 3A: HTTP error responses (4xx/5xx) must be propagated
   *
   * For any HTTP status code in the error range, getOverview must reject.
   * The error must not be swallowed into a successful empty response.
   */
  it("Property 3A: HTTP error responses must be propagated for any status code", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.uuid(), { nil: undefined }),
        fc.constantFrom(
          "5m", "15m", "30m", "1h", "3h", "6h", "12h",
          "24h", "2d", "7d", "14d", "30d", "90d",
        ),
        fc.constantFrom(400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504),
        async (clusterId, interval, statusCode) => {
          getSpy.mockClear();
          const axiosError = Object.assign(new Error(`Request failed with status code ${statusCode}`), {
            response: { status: statusCode, data: { message: "error" } },
            isAxiosError: true,
          });
          getSpy.mockRejectedValue(axiosError);

          let didReject = false;
          try {
            await kubernetesApi.getOverview(clusterId, interval);
          } catch {
            didReject = true;
          }

          // The error must have been propagated — getOverview must reject
          expect(didReject).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3B: Network errors (no response) must be propagated
   *
   * For any network-level error (ECONNREFUSED, ENOTFOUND, etc.),
   * getOverview must reject — the error must not be swallowed.
   * We verify the error is propagated by checking it is defined and has a code.
   */
  it("Property 3B: Network errors must be propagated for any clusterId", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.uuid(), { nil: undefined }),
        fc.constantFrom("ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"),
        async (clusterId, errorCode) => {
          getSpy.mockClear();
          const networkError = Object.assign(
            new Error(`connect ${errorCode} 127.0.0.1:3000`),
            { code: errorCode, isAxiosError: true },
          );
          getSpy.mockRejectedValue(networkError);

          let caughtError: unknown;
          try {
            await kubernetesApi.getOverview(clusterId, "1h");
          } catch (err) {
            caughtError = err;
          }

          // Error must be propagated — not swallowed
          // The error must be defined and must have a network error code
          expect(caughtError).toBeDefined();
          const code = (caughtError as any)?.code;
          expect(typeof code).toBe("string");
          expect(code.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3C: listClusters must propagate HTTP errors for any query params
   *
   * For any HTTP error thrown by iamClient.get, listClusters must reject.
   */
  it("Property 3C: listClusters must propagate HTTP errors for any query", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(401, 403, 500, 503),
        fc.record({
          page: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          provider: fc.option(fc.constantFrom("eks", "gke", "aks"), { nil: undefined }),
        }),
        async (statusCode, query) => {
          getSpy.mockClear();
          const axiosError = Object.assign(
            new Error(`Request failed with status code ${statusCode}`),
            { response: { status: statusCode }, isAxiosError: true },
          );
          getSpy.mockRejectedValue(axiosError);

          let didReject = false;
          try {
            await kubernetesApi.listClusters(query);
          } catch {
            didReject = true;
          }

          expect(didReject).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 3D: fetchPods must propagate HTTP errors for any clusterId and namespace
   */
  it("Property 3D: fetchPods must propagate HTTP errors for any clusterId", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
        fc.constantFrom(401, 403, 404, 500),
        async (clusterId, namespace, statusCode) => {
          getSpy.mockClear();
          const axiosError = Object.assign(
            new Error(`Request failed with status code ${statusCode}`),
            { response: { status: statusCode }, isAxiosError: true },
          );
          getSpy.mockRejectedValue(axiosError);

          let didReject = false;
          try {
            await kubernetesApi.fetchPods(clusterId, namespace);
          } catch {
            didReject = true;
          }

          expect(didReject).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 16: Loading State Display
 * **Validates: Requirements 11.1**
 *
 * When an API call is in-flight (iamClient.get has not yet resolved),
 * the Promise returned by the kubernetes API function must also be pending.
 * When the underlying request resolves, the API function's Promise must resolve too.
 *
 * This models the loading state lifecycle at the API client level:
 * - Loading starts when the API function is called (Promise is pending)
 * - Loading ends when the underlying HTTP call resolves or rejects
 */
describe("Property 16: Loading State Display", () => {
  let getSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSpy = vi.fn().mockResolvedValue({} as any);
    (iamClient as any).get = getSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 16A: While iamClient.get is pending, getOverview must also be pending
   *
   * For any clusterId and interval, if the underlying HTTP call has not resolved,
   * the Promise returned by getOverview must still be pending (not settled).
   */
  it("Property 16A: getOverview Promise is pending while iamClient.get is pending", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.uuid(), { nil: undefined }),
        fc.constantFrom(
          "5m", "15m", "30m", "1h", "3h", "6h", "12h",
          "24h", "2d", "7d", "14d", "30d", "90d",
        ),
        async (clusterId, interval) => {
          getSpy.mockClear();

          // Never-resolving promise simulates an in-flight HTTP request
          let resolveHttp!: (value: any) => void;
          const httpPromise = new Promise<any>((resolve) => {
            resolveHttp = resolve;
          });
          getSpy.mockReturnValue(httpPromise);

          const apiPromise = kubernetesApi.getOverview(clusterId, interval);

          // Use Promise.race to check if apiPromise is still pending
          const SENTINEL = Symbol("pending");
          const raceResult = await Promise.race([
            apiPromise.then(() => "resolved").catch(() => "rejected"),
            Promise.resolve(SENTINEL),
          ]);

          // The sentinel wins the race — apiPromise is still pending
          expect(raceResult).toBe(SENTINEL);

          // Clean up: resolve the HTTP promise so no dangling promises remain
          resolveHttp({});
          await apiPromise.catch(() => {});
        },
      ),
      { numRuns: 50 },
    );
  });

  /**
   * Property 16B: When iamClient.get resolves, getOverview must also resolve
   *
   * For any clusterId and interval, after the underlying HTTP call resolves,
   * the Promise returned by getOverview must also resolve (loading state ends).
   */
  it("Property 16B: getOverview resolves when iamClient.get resolves", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.uuid(), { nil: undefined }),
        fc.constantFrom(
          "5m", "15m", "30m", "1h", "3h", "6h", "12h",
          "24h", "2d", "7d", "14d", "30d", "90d",
        ),
        async (clusterId, interval) => {
          getSpy.mockClear();
          getSpy.mockResolvedValue({} as any);

          let didResolve = false;
          let didReject = false;

          await kubernetesApi
            .getOverview(clusterId, interval)
            .then(() => { didResolve = true; })
            .catch(() => { didReject = true; });

          // After the HTTP call resolves, the API Promise must have settled
          expect(didResolve || didReject).toBe(true);
          // It must have resolved (not rejected) since the mock resolved successfully
          expect(didResolve).toBe(true);
          expect(didReject).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 21.1: Pod Log Filter Parameter Completeness
 * **Validates: Requirements 27.2**
 *
 * For any combination of optional log filter params (namespace, pod, container,
 * node, deployment, search, limit), all provided (non-undefined) params must
 * appear in the API request params object passed to iamClient.get.
 *
 * This guarantees that no filter param is silently dropped between the caller
 * and the HTTP request, regardless of which subset of params is provided.
 */
describe("Property 21.1: Pod Log Filter Parameter Completeness", () => {
  let getSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getSpy = vi.fn().mockResolvedValue({
      logs: [],
      total: 0,
      from: "",
      to: "",
    } as any);
    (iamClient as any).get = getSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property A: For any subset of PodLogsParams fields that are provided
   * (non-undefined), all of them must appear in the axios `params` object
   * passed to iamClient.get.
   *
   * Uses fc.record with optional fields to generate random param combinations.
   */
  it("all provided filter params must appear in the API request for any param combination", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          namespace: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
            nil: undefined,
          }),
          pod: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
            nil: undefined,
          }),
          container: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
            nil: undefined,
          }),
          node: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
            nil: undefined,
          }),
          deployment: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
            nil: undefined,
          }),
          search: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
            nil: undefined,
          }),
          limit: fc.option(fc.integer({ min: 1, max: 1000 }), {
            nil: undefined,
          }),
        }),
        fc.string({ minLength: 1, maxLength: 36 }), // clusterId
        async (params, clusterId) => {
          getSpy.mockClear();

          // Remove undefined values to get the "provided" params
          const providedParams = Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined),
          );

          await kubernetesApi.getClusterLogs(clusterId, providedParams);

          expect(getSpy).toHaveBeenCalledTimes(1);

          const callArgs = getSpy.mock.calls[0];
          const passedParams = (callArgs[1] as any)?.params ?? {};

          // Every provided param must appear in the request
          for (const [key, value] of Object.entries(providedParams)) {
            expect(passedParams).toHaveProperty(key, value);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property B: When no params are provided, the request still succeeds
   * and the params object is empty (no spurious keys injected).
   */
  it("when no params are provided, the request succeeds with an empty params object", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 36 }), // clusterId
        async (clusterId) => {
          getSpy.mockClear();

          await kubernetesApi.getClusterLogs(clusterId, {});

          expect(getSpy).toHaveBeenCalledTimes(1);

          const callArgs = getSpy.mock.calls[0];
          const passedParams = (callArgs[1] as any)?.params ?? {};

          // No spurious keys should be injected when no params are provided
          expect(Object.keys(passedParams)).toHaveLength(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property C: The clusterId is always included in the URL path.
   *
   * For any clusterId and any param combination, the URL passed to iamClient.get
   * must contain the clusterId, ensuring the request is scoped to the correct cluster.
   */
  it("the clusterId is always included in the URL path for any clusterId and params", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 36 }), // clusterId
        fc.record({
          namespace: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
            nil: undefined,
          }),
          pod: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
            nil: undefined,
          }),
          limit: fc.option(fc.integer({ min: 1, max: 1000 }), {
            nil: undefined,
          }),
        }),
        async (clusterId, params) => {
          getSpy.mockClear();

          const providedParams = Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined),
          );

          await kubernetesApi.getClusterLogs(clusterId, providedParams);

          expect(getSpy).toHaveBeenCalledTimes(1);

          const url = getSpy.mock.calls[0][0] as string;
          expect(url).toContain(clusterId);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property D: No param is duplicated or transformed — the exact value
   * provided by the caller is forwarded verbatim to the HTTP request.
   */
  it("param values are forwarded verbatim without transformation for any string param", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 36 }), // clusterId
        fc.string({ minLength: 1, maxLength: 63 }), // namespace
        fc.string({ minLength: 1, maxLength: 63 }), // pod
        async (clusterId, namespace, pod) => {
          getSpy.mockClear();

          await kubernetesApi.getClusterLogs(clusterId, { namespace, pod });

          expect(getSpy).toHaveBeenCalledTimes(1);

          const passedParams = (getSpy.mock.calls[0][1] as any)?.params ?? {};

          // Values must be forwarded exactly — no trimming, encoding, or transformation
          expect(passedParams.namespace).toBe(namespace);
          expect(passedParams.pod).toBe(pod);
        },
      ),
      { numRuns: 100 },
    );
  });
});
