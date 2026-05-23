/**
 * Composable to fetch resource-level events from backend.
 * Works for K8S resources (pods, nodes, namespaces, deployments, PVs)
 * and non-K8S resources (VMs, agents) via the main logs table.
 *
 * Uses the K8S cluster logs endpoint which queries:
 *   1. kubernetes_events table (K8S events)
 *   2. kubernetes_pod_logs table
 *   3. Main logs table (OTEL/FluentBit)
 */
import { ref } from "vue";
import { kubernetesApi } from "@/api/kubernetes";
import { logsApi } from "@/api/logs";
import config from "@/config";

export interface ResourceEvent {
  type: "Normal" | "Warning" | string;
  reason: string;
  message: string;
  source: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

/**
 * Fetch events for a Kubernetes resource (node, namespace, deployment, pod, PV).
 * Queries the backend getClusterLogs endpoint which merges kubernetes_events + logs.
 */
export function useResourceEvents() {
  const events = ref<ResourceEvent[]>([]);
  const loading = ref(false);

  async function fetchK8sEvents(
    clusterId: string,
    filters: {
      namespace?: string;
      pod?: string;
      node?: string;
      deployment?: string;
      search?: string;
    },
  ) {
    if (config.useMock || !clusterId) return;

    loading.value = true;
    try {
      const result = await kubernetesApi.getClusterLogs(clusterId, {
        ...filters,
        limit: config.limitDataMax,
      });

      // Parse log lines into event objects
      events.value = result.logs.map((l) => {
        const eventMatch = l.logLine.match(
          /^\[(Normal|Warning)\]\s*(\S+):\s*(\S+)\s*-\s*(.*)/,
        );
        const ts = new Date(l.timestamp).getTime();
        if (eventMatch) {
          return {
            type: eventMatch[1] as "Normal" | "Warning",
            reason: eventMatch[3],
            message: eventMatch[4],
            source: eventMatch[2],
            count: 1,
            firstSeen: ts,
            lastSeen: ts,
          };
        }
        // Non-event log line — treat as info event
        return {
          type: "Normal" as const,
          reason: "Log",
          message: l.logLine,
          source: l.containerName || l.deploymentName || "",
          count: 1,
          firstSeen: ts,
          lastSeen: ts,
        };
      });
    } catch {
      events.value = [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch events for a non-K8S resource (VM, agent) from the main logs table.
   * Searches by hostname/agent name in log body or resource attributes.
   */
  async function fetchGenericEvents(
    searchTerm: string,
    serviceName?: string,
  ) {
    if (config.useMock || !searchTerm) return;

    loading.value = true;
    try {
      const end = Date.now();
      const start = end - 3600_000; // last 1 hour
      const result = await logsApi.query({
        query: searchTerm,
        start,
        end,
        limit: config.limitDataMax,
        services: serviceName ? [serviceName] : undefined,
      });

      if (result.status === "success" && result.data.length > 0) {
        events.value = result.data.map((log) => ({
          type: log.severityText || "info",
          reason: log.severityText || "info",
          message: log.body || "",
          source: log.scopeName || log.resource?.["service.name"] || "",
          count: 1,
          firstSeen: log.timestamp,
          lastSeen: log.timestamp,
        }));
      } else {
        events.value = [];
      }
    } catch {
      events.value = [];
    } finally {
      loading.value = false;
    }
  }

  function clearEvents() {
    events.value = [];
  }

  return {
    events,
    loading,
    fetchK8sEvents,
    fetchGenericEvents,
    clearEvents,
  };
}
