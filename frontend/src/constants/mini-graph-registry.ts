/**
 * TelemetryFlow Mini-Graph Registry
 *
 * Central inventory of ALL MiniChartCard (compact inline trend charts)
 * rendered inside detail drawers / panels across the platform.
 *
 * Mini-graphs are distinct from RegistryGraphPanel charts:
 *   - Scoped to a single selected entity (pod, node, service, monitor, etc.)
 *   - Rendered via MiniChartCard component or RegistryGraphPanel variant="mini"
 *   - Embedded in drawer/detail panels, not standalone section panels
 *
 * ID scheme: XXX4#### (type digit 4 = mini-graph)
 *   e.g. K8S40001, NWM40001, SVM40001, UPT40001, INF40001, AGT40001
 *
 * Per-module files live under ./mini-graphs/
 *
 * Usage:
 *   import { MINI_GRAPH_REGISTRY, getMiniGraphById } from '@/constants/mini-graph-registry';
 */

export type {
  MiniGraphDefinition,
  MiniGraphChartType,
  MiniGraphSignalType,
} from "./mini-graphs/types";

import type { MiniGraphDefinition } from "./mini-graphs/types";

import { K8S_MINI_GRAPHS } from "./mini-graphs/mini-graph-registry-k8s";
import { NWM_MINI_GRAPHS } from "./mini-graphs/mini-graph-registry-nwm";
import { SVM_MINI_GRAPHS } from "./mini-graphs/mini-graph-registry-svm";
import { UPT_MINI_GRAPHS } from "./mini-graphs/mini-graph-registry-upt";
import { INF_MINI_GRAPHS } from "./mini-graphs/mini-graph-registry-inf";
import { AGT_MINI_GRAPHS } from "./mini-graphs/mini-graph-registry-agt";

export {
  K8S_MINI_GRAPHS,
  NWM_MINI_GRAPHS,
  SVM_MINI_GRAPHS,
  UPT_MINI_GRAPHS,
  INF_MINI_GRAPHS,
  AGT_MINI_GRAPHS,
};

// ─── Aggregated Mini-Graph Registry ─────────────────────────────────────────────

export const MINI_GRAPH_REGISTRY: MiniGraphDefinition[] = [
  ...K8S_MINI_GRAPHS,  // 11 entries: pods (3), nodes (3), namespace (2), pv (3)
  ...NWM_MINI_GRAPHS,  //  2 entries: network node detail
  ...SVM_MINI_GRAPHS,  //  2 entries: service detail
  ...UPT_MINI_GRAPHS,  //  1 entry:  monitor detail
  ...INF_MINI_GRAPHS,  //  4 entries: VM detail (cross-ref INF10009–INF10012)
  ...AGT_MINI_GRAPHS,  //  4 entries: agent detail (cross-ref AGT10013–AGT10016)
];

// ─── Helper Functions ─────────────────────────────────────────────────────────────

/**
 * Get a mini-graph definition by its unique miniGraphId
 */
export function getMiniGraphById(miniGraphId: string): MiniGraphDefinition | undefined {
  return MINI_GRAPH_REGISTRY.find((g) => g.miniGraphId === miniGraphId);
}

/**
 * Get all mini-graphs for a specific module
 */
export function getMiniGraphsByModule(module: string): MiniGraphDefinition[] {
  return MINI_GRAPH_REGISTRY.filter((g) => g.module === module);
}

/**
 * Get all mini-graphs for a specific detail panel context
 */
export function getMiniGraphsByContext(
  context: MiniGraphDefinition["context"],
): MiniGraphDefinition[] {
  return MINI_GRAPH_REGISTRY.filter((g) => g.context === context);
}

/**
 * Total mini-graph count
 */
export const TOTAL_MINI_GRAPHS = MINI_GRAPH_REGISTRY.length;
