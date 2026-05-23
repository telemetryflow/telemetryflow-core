// Format utilities
export {
  formatTimestamp,
  formatTime,
  formatTimeShort,
  formatDateShort,
  formatBarChartTime,
  formatBarChartCategories,
  formatDuration,
  formatNanoseconds,
  formatBytes,
  formatBytesK8s,
  parseK8sMemory,
  formatNumber,
  formatCompactNumber,
  formatMetricNumber,
  formatPercent,
  formatAge,
  formatRelativeTime,
  formatTimeWindow,
} from "./format";

// Clipboard utilities
export { copyToClipboard, copyJsonToClipboard } from "./clipboard";

// Chart color palette
export {
  SERIES_COLORS,
  VM_COLORS,
  AGENT_COLORS,
  K8S_COLORS,
  withK8sColors,
} from "./chartColors";

// JSON utilities
export {
  formatJsonWithHighlight,
  formatJsonWithLineNumbers,
  getJsonHighlightedLines,
  highlightJsonLine,
  prettyJson,
  safeJsonParse,
  isValidJson,
  getJsonValueType,
} from "./json";
export type { JsonHighlightedLine } from "./json";

// TFQL (TelemetryFlow Query Language) utilities
export {
  URL_PARAM_TO_TFQL_FIELD,
  formatTfqlValue,
  buildTfqlTerm,
  buildTfqlFromUrlParams,
  parseTfqlTerm,
  parseTfqlResourceFilters,
  parseTfqlToStructuredFilters,
  getTfqlFieldUrlParam,
  tfqlToUrlParams,
  TFQL_OPERATORS,
  TFQL_BOOLEAN_OPERATORS,
} from "./tfql";
export type { TfqlOperator, TfqlBooleanOperator, TfqlStructuredFilters } from "./tfql";

// Constants and helpers
export {
  levelColors,
  getSeverityDescription,
  getLevelColorBySeverity,
  getLevelColor,
  spanStatusCodes,
  spanKinds,
  getSpanStatusText,
  getSpanKindText,
} from "./constants";

// DataTable utilities
export { withSortableColumns, createSorter } from "./datatable";

// Export utilities
export {
  exportToCSV,
  exportToJSON,
  convertToCSV,
  convertToJSON,
  downloadFile,
  getExportFilename,
} from "./export";

// Stats and trend utilities
export {
  calculateTrend,
  getPreviousPeriod,
  computeStatsWithTrends,
  formatTrend,
  formatTrendValue,
  getTrendType,
  getTrendDirection,
  formatTimeRangeSuffix,
  getTimeRangeLabel,
} from "./stats";

// Tag color utilities
export {
  TAG_COLOR_PALETTE,
  getTagColor,
  getTagColors,
  // Entity colors (Organizations, Workspaces, Regions, etc.)
  ENTITY_COLORS,
  getEntityColorByIndex,
  getEntityColor,
} from "./tag-colors";
export type { TagColor } from "./tag-colors";

// OS icon utilities
export { getOSInfo, normalizeOSName, OS_LIST } from "./osIcons";
export type { OSInfo } from "./osIcons";

// Cloud provider icon utilities
export {
  cloudProviders,
  getCloudProviderInfo,
  getCloudProviderIcon,
  getCloudProviderColor,
} from "./cloudProviderIcons";
export type { CloudProviderInfo } from "./cloudProviderIcons";

// Notification channel icon utilities
export { getChannelIcon } from "./channelIcons";

// Resource icon utilities
export {
  resourceIcons,
  getResourceIcon,
  getResourceIconString,
  getResourceColor,
  statPanelColors,
} from "./resourceIcons";
export type {
  ResourceIconInfo,
  ResourceIconType,
  StatPanelColorType,
} from "./resourceIcons";

// Service icon utilities (50-service brand inventory)
export {
  SERVICE_TYPE_ICON_MAP,
  SERVICE_NAME_ICON_MAP,
  getServiceIcon,
  getServiceColor,
  getServiceIconEntry,
} from "./serviceIcons";
export type { ServiceIconEntry } from "./serviceIcons";

// Status utilities
export {
  STATUS_THRESHOLDS,
  STATUS_COLORS,
  STATUS_ICONS,
  getHealthStatus,
  getUsageStatus,
  getStatusColor,
  getResourceStatus,
  getCpuStatus,
  getMemoryStatus,
  getStorageStatus,
  getNetworkStatus,
} from "./status";
export type { StatusBadge, StatusThresholds } from "./status";

// Field extractor utilities
export {
  STANDARD_LOG_FIELDS,
  DEFAULT_SELECTED_FIELDS,
  extractFieldsFromLogs,
  groupFieldsByCategory,
  getFieldValueByPath,
  formatFieldValue,
  detectFieldType,
  getFieldCategory,
  getFieldDisplayName,
  isStandardField,
  getFieldDescription,
} from "./field-extractor";
export type { FieldCategory } from "./field-extractor";

// Time range utilities (matching header time picker dropdown)
export {
  DURATION_MS,
  TIME_RANGE_PRESETS,
  TIME_RANGE_PRESET_MAP,
  DEFAULT_TIME_RANGE_PRESET,
  getTimeRangeByPreset,
  getTimeRangeFromTimestamps,
  formatDurationLabel,
  getTimeRangeTitleSuffix,
  getTrendComparisonSuffix,
  getPreviousPeriodRange,
  isValidTimeRangePreset,
  getTimeRangeOptions,
  parseRelativeTime,
  formatToRelativeTime,
} from "./time-range";
export type { TimeRangePreset, TimeRangeConfig, TimeRange } from "./time-range";

// StatPanel utilities
export {
  STAT_PANEL_COLORS,
  STATUS_ICON_COLORS,
  VALUE_COLORS,
  DEFAULT_THRESHOLDS,
  STAT_PANEL_ICONS,
  getValueColor,
  getValueColorByStatus,
  getValueColorBySeverity,
  getStatPanelColor,
  getStatPanelColorByStatus,
  buildTrendConfig,
  buildStatusIconConfig,
  createStatPanelConfig,
  createStatPanelWithTrend,
  createStatPanelWithStatus,
  createStatPanelForPercentage,
  getStatPanelHexColor,
  getStatPanelTextColor,
  getStatPanelBgColor,
  // Time range integrated functions
  createStatPanelWithTimeRange,
  createStatPanelWithTrendAndTimeRange,
  createStatPanelWithStatusAndTimeRange,
  createStatPanelForPercentageWithTimeRange,
  getTimeRangeDisplayInfo,
} from "./stat-panel";
export type {
  StatPanelColor,
  StatStatusColor,
  TrendDirection,
  TrendConfig,
  StatusIconConfig,
  StatPanelConfig,
  ValueThresholds,
  TimeRangeParams,
} from "./stat-panel";

// Overview panel utilities (OVERVIEW_ prefix)
export {
  OVERVIEW_STAT_CARD_COLORS,
  OVERVIEW_PANEL_ICONS,
  createOverviewStatCard,
  createOverviewNodeStatCards,
  createOverviewPodStatCards,
  createOverviewNamespaceStatCards,
  createOverviewDetailBox,
  createOverviewResourceDetailBoxes,
  createOverviewQuotaItem,
  createOverviewQuotaItems,
  createOverviewCapacityItems,
  createOverviewHealthCard,
  createOverviewPodHealthCard,
  createOverviewResourceCard,
  createOverviewCpuResourceCard,
  createOverviewMemoryResourceCard,
  createOverviewCpuQuotaCard,
  createOverviewMemoryQuotaCard,
  createOverviewCpuCapacityCard,
  createOverviewMemoryCapacityCard,
  formatOverviewValue,
  formatOverviewPercent,
  formatOverviewPercentShort,
  getOverviewStatCardIconStyle,
  getOverviewHealthIconStyle,
  calculateOverviewHealthPercentage,
  calculateOverviewUsagePercentage,
} from "./overview-helpers";
export type {
  OverviewStatCardColor,
  OverviewStatCardIconType,
  OverviewStatCardConfig,
  OverviewDetailBoxConfig,
  OverviewQuotaItemConfig,
  OverviewHealthCardConfig,
  OverviewResourceCardConfig,
} from "./overview-helpers";

// ============================================
// Telemetry Helpers (Mock, OTEL v1, TFO v2)
// ============================================
export * from "./telemetry";

// ============================================
// API Cache (TASK-06)
// ============================================
export {
  generateCacheKey,
  getFromCache,
  setInCache,
  removeFromCache,
  clearAllCache,
  clearCacheByPattern,
  getCacheMetadata,
  getCacheSize,
  cleanExpiredCache,
  cachedFetch,
} from "./api-cache";
export type { CacheEntry, CacheMetadata, CacheOptions } from "./api-cache";
