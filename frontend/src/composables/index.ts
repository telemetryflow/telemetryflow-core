/**
 * Composables barrel export
 *
 * NOTE: .mock.ts files are NOT exported here.
 * They are only imported internally by their corresponding composable
 * behind `config.useMock` guards.
 */

// ── UI Utilities ──
export * from "./useChartGroup";
export * from "./useChartZoom";
export * from "./useTableScroll";
export * from "./usePagination";
export * from "./useTagColors";
export * from "./usePermission";
export * from "./useRawJsonView";
export * from "./useLineNumberedEditor";

// ── API & Error Handling ──
export * from "./useApiCache";
export * from "./useApiError";
export * from "./useRecaptcha";

// ── Module Statistics ──
export * from "./useModuleStats";
export * from "./useModuleDatatable";
export * from "./useAgentStats";
export * from "./useKubernetesStats";
export * from "./useAlertStats";
export * from "./useAuditStats";
export * from "./useAuditLogs";
export * from "./useTelemetryStats";
export * from "./useOverviewStats";

// ── Registry Composables ──
export * from "./useGraphFromRegistry";
export * from "./useStatPanelsFromRegistry";
export * from "./useDataTableFromRegistry";
export * from "./useGraphAlert";
export * from "./useGraphShare";

// ── Telemetry Data (ClickHouse) ──
export * from "./useTelemetryTable";
export * from "./useTelemetryGraph";
export * from "./useQueryPanel";
export * from "./useWidgetQuery";

// ── Kubernetes Data Types ──
export * from "./useKubernetesData";

// ── Uptime Monitoring ──
export * from "./useUptimeBars";
export * from "./useMonitorPolling";

// ── LLM / AI ──
export * from "./useLLMContext";
export * from "./useAIChatbot";
