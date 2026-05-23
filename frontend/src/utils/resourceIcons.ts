/**
 * Resource Icons and Utilities
 * Centralized icon inventory for metrics, resources, and monitoring
 * Provides consistent icons across the application
 */

export interface ResourceIconInfo {
  icon: string;
  label: string;
  color: string;
  cssClass?: string;
}

/**
 * Resource/Metric Icons
 * Used for CPU, Memory, Disk, Network metrics
 */
export const resourceIcons = {
  // Compute Resources
  cpu: {
    icon: "carbon:chip",
    label: "CPU",
    color: "#3B82F6", // Blue
    cssClass: "cpu",
  },
  memory: {
    icon: "ph:memory-fill",
    label: "Memory",
    color: "#8B5CF6", // Purple
    cssClass: "memory",
  },
  ram: {
    icon: "ph:memory-fill",
    label: "RAM",
    color: "#8B5CF6", // Purple
    cssClass: "memory",
  },

  // Storage Resources
  disk: {
    icon: "carbon:data-volume",
    label: "Disk",
    color: "#F59E0B", // Amber
    cssClass: "disk",
  },
  storage: {
    icon: "carbon:data-volume",
    label: "Storage",
    color: "#F59E0B", // Amber
    cssClass: "storage",
  },
  volume: {
    icon: "carbon:data-volume",
    label: "Volume",
    color: "#F59E0B", // Amber
    cssClass: "volume",
  },

  // Network Resources
  network: {
    icon: "carbon:network-3",
    label: "Network",
    color: "#10B981", // Emerald
    cssClass: "network",
  },
  networkIn: {
    icon: "carbon:arrow-down",
    label: "Network In",
    color: "#10B981", // Emerald
    cssClass: "network-in",
  },
  networkOut: {
    icon: "carbon:arrow-up",
    label: "Network Out",
    color: "#06B6D4", // Cyan
    cssClass: "network-out",
  },
  bandwidth: {
    icon: "carbon:network-4",
    label: "Bandwidth",
    color: "#14B8A6", // Teal
    cssClass: "bandwidth",
  },

  // Performance Metrics
  iops: {
    icon: "carbon:meter",
    label: "IOPS",
    color: "#F59E0B", // Amber
    cssClass: "iops",
  },
  throughput: {
    icon: "carbon:meter-alt",
    label: "Throughput",
    color: "#8B5CF6", // Purple
    cssClass: "throughput",
  },
  latency: {
    icon: "carbon:time",
    label: "Latency",
    color: "#EF4444", // Red
    cssClass: "latency",
  },

  // Kubernetes Resources
  pods: {
    icon: "carbon:deployment-unit",
    label: "Pods",
    color: "#3B82F6", // Blue
    cssClass: "pods",
  },
  containers: {
    icon: "carbon:container-software",
    label: "Containers",
    color: "#0EA5E9", // Sky
    cssClass: "containers",
  },
  nodes: {
    icon: "carbon:bare-metal-server",
    label: "Nodes",
    color: "#64748B", // Slate
    cssClass: "nodes",
  },
  namespace: {
    icon: "carbon:folder",
    label: "Namespace",
    color: "#8B5CF6", // Purple
    cssClass: "namespace",
  },
  deployment: {
    icon: "carbon:deployment-unit",
    label: "Deployment",
    color: "#3B82F6", // Blue
    cssClass: "deployment",
  },
  service: {
    icon: "carbon:network-public",
    label: "Service",
    color: "#10B981", // Emerald
    cssClass: "service",
  },
  pv: {
    icon: "carbon:data-volume",
    label: "Persistent Volume",
    color: "#F59E0B", // Amber
    cssClass: "pv",
  },

  // Status Icons
  status: {
    icon: "carbon:status-change",
    label: "Status",
    color: "#22C55E", // Green
    cssClass: "status",
  },
  health: {
    icon: "carbon:health-cross",
    label: "Health",
    color: "#22C55E", // Green
    cssClass: "health",
  },
  version: {
    icon: "carbon:version",
    label: "Version",
    color: "#22C55E", // Green
    cssClass: "version",
  },

  // Misc
  chart: {
    icon: "carbon:chart-line",
    label: "Chart",
    color: "#3B82F6", // Blue
    cssClass: "chart",
  },
  logs: {
    icon: "carbon:document",
    label: "Logs",
    color: "#64748B", // Slate
    cssClass: "logs",
  },
  tags: {
    icon: "carbon:tag-group",
    label: "Tags",
    color: "#8B5CF6", // Purple
    cssClass: "tags",
  },
  info: {
    icon: "carbon:information",
    label: "Information",
    color: "#0EA5E9", // Sky
    cssClass: "info",
  },
  meter: {
    icon: "carbon:meter",
    label: "Meter",
    color: "#F59E0B", // Amber
    cssClass: "meter",
  },
} as const;

export type ResourceIconType = keyof typeof resourceIcons;

/**
 * Get resource icon info by type
 */
export function getResourceIcon(
  type: ResourceIconType | string,
): ResourceIconInfo {
  const key = type.toLowerCase() as ResourceIconType;
  if (resourceIcons[key]) {
    return resourceIcons[key];
  }

  // Fallback
  return {
    icon: "carbon:meter",
    label: type,
    color: "#64748B",
    cssClass: "default",
  };
}

/**
 * Get resource icon string only
 */
export function getResourceIconString(type: ResourceIconType | string): string {
  return getResourceIcon(type).icon;
}

/**
 * Get resource color only
 */
export function getResourceColor(type: ResourceIconType | string): string {
  return getResourceIcon(type).color;
}

/**
 * Stat Panel color mapping
 * Maps semantic colors to actual hex values
 */
export const statPanelColors = {
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#0EA5E9",
  primary: "#3B82F6",
  secondary: "#64748B",
  purple: "#8B5CF6",
} as const;

export type StatPanelColorType = keyof typeof statPanelColors;
