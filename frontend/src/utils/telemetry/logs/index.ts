/**
 * Logs Helpers Export
 */

// Generator
export {
  generateLogRecord,
  generateLogRecords,
  generateErrorLog,
  generateAccessLog,
  generateK8sLog,
  generateMockLogs,
  generateLogsForService,
  generateLogPatterns,
  buildLogQuery,
  // Stream generators
  generateStreamLog,
  generateStreamLogBatch,
  generateLogBurst,
  streamLogs,
  generateLogsForTimeWindow,
  generateLogsChunk,
  generateBufferedLogs,
} from './generator';
export type { LogGeneratorConfig, LogStreamConfig } from './generator';

// Fetcher
export {
  fetchLogs,
  fetchLogPatterns,
  fetchLogFields,
  fetchLogAggregations,
  fetchLogServices,
  fetchLogStream,
} from './fetcher';

// Transformer
export {
  transformOTELv1LogToTFO,
  transformOTELv1LogsToTFO,
  transformTFOLogToOTELv1,
  transformTFOLogsToOTELv1,
  severityNumberToText,
  severityTextToNumber,
  normalizeLogLevel,
  logLevelToSeverityRange,
  formatLogMessage,
  formatLogAsJson,
  filterLogsByLevel,
  filterLogsByService,
  filterLogsByTimeRange,
  filterLogsByQuery,
  groupLogsByLevel,
  groupLogsByService,
  countLogsByLevel,
} from './transformer';
