export * from "./signals";
export * from "./infrastructure";
export * from "./monitoring";

// Export all handlers for module registration
import {
  QueryMetricsHandler,
  GetMetricNamesHandler,
  GetLabelValuesHandler,
} from "./signals/QueryMetrics.handler";
import {
  QueryLogsHandler,
  GetLogSeverityLevelsHandler,
  GetLogCountBySeverityHandler,
} from "./signals/QueryLogs.handler";
import {
  QueryTracesHandler,
  GetTraceByIdHandler,
  GetTraceSummariesHandler,
  GetTraceServiceNamesHandler,
  GetSpanNamesHandler,
} from "./signals/QueryTraces.handler";
import { InfrastructureQueryHandlers } from "./infrastructure";
import { MonitoringQueryHandlers } from "./monitoring";

export const SignalQueryHandlers = [
  QueryMetricsHandler,
  GetMetricNamesHandler,
  GetLabelValuesHandler,
  QueryLogsHandler,
  GetLogSeverityLevelsHandler,
  GetLogCountBySeverityHandler,
  QueryTracesHandler,
  GetTraceByIdHandler,
  GetTraceSummariesHandler,
  GetTraceServiceNamesHandler,
  GetSpanNamesHandler,
];

export const AllQueryHandlers = [
  ...SignalQueryHandlers,
  ...InfrastructureQueryHandlers,
  ...MonitoringQueryHandlers,
];
