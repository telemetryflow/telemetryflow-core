/**
 * VM Metrics Helpers Export
 */

// Generator
export {
  generateVMMetrics,
  generateCPUMetrics,
  generateMemoryMetrics,
  generateDiskMetrics,
  generateNetworkMetrics,
  generateVMInfo,
  generateVMList,
  generateAllVMMetrics,
  // Infrastructure VM generation
  generateVirtualMachine,
  generateVirtualMachines,
  generateVMTimeSeries,
} from './generator';
export type { VMGeneratorConfig } from './generator';

// Agent monitoring
export {
  generateAgents,
  generateK8sNodeAgent,
  generateVMAgent,
  generateAgentTimeSeries,
  getAgentSummary,
} from './agent';

// Fetcher
export {
  fetchVMMetrics,
  fetchVMList,
  fetchVMInfo,
  fetchVMMetricsSeries,
  fetchCPUMetrics,
  fetchMemoryMetrics,
  fetchDiskMetrics,
  fetchNetworkMetrics,
  fetchInfrastructureOverview,
} from './fetcher';

// CPU Helpers
export {
  getCPUUtilization,
  getCPULoadAverage,
  getCPUStatus,
  isCPUOverloaded,
  getCPUStatusColor,
  calculateCPUUsageFromTime,
  calculateLoadAverageStatus,
  formatLoadAverage,
  summarizeCPUMetrics,
  generatePerCoreUtilization,
} from './cpu';

// Memory Helpers
export {
  getMemoryUtilization,
  getMemoryUsage,
  getMemoryStatus,
  isMemoryPressure,
  getMemoryStatusColor,
  calculateMemoryUtilization,
  calculateAvailableMemory,
  calculateEffectiveMemoryUsage,
  formatMemoryBytes,
  formatMemoryUsage,
  formatMemoryPercent,
  summarizeMemoryMetrics,
  detectOOMRisk,
  getSwapUsageWarning,
} from './memory';

// Disk Helpers
export {
  getDiskIOPS,
  getDiskUsage,
  getDiskStatus,
  isDiskFull,
  getDiskStatusColor,
  calculateDiskUtilization,
  calculateIOPS,
  calculateThroughput,
  calculateIOWait,
  formatDiskBytes,
  formatDiskUsage,
  formatIOPS,
  formatThroughput,
  summarizeDiskMetrics,
  predictDiskFull,
  getFilesystemHealthCheck,
} from './disk';

// Network Helpers
export {
  getNetworkThroughput,
  getNetworkErrors,
  getNetworkStatus,
  hasNetworkIssues,
  getNetworkStatusColor,
  calculateBandwidth,
  calculateErrorRate,
  calculatePacketLoss,
  calculateUtilization as calculateNetworkUtilization,
  formatNetworkBandwidth,
  formatBytes as formatNetworkBytes,
  formatPackets,
  summarizeNetworkMetrics,
  detectNetworkAnomalies,
} from './network';
