/**
 * Network Map Types
 * Type definitions for network topology, nodes, and connections
 */

export type NodeType =
  | "server"
  | "router"
  | "switch"
  | "firewall"
  | "load_balancer"
  | "database"
  | "cache"
  | "cdn"
  | "dns"
  | "gateway";

export type NodeStatus =
  | "healthy"
  | "degraded"
  | "down"
  | "maintenance"
  | "unknown";

export type ConnectionStatus = "active" | "degraded" | "down" | "idle";

export type ConnectionProtocol =
  | "tcp"
  | "udp"
  | "http"
  | "https"
  | "grpc"
  | "dns"
  | "icmp";

export interface NetworkNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  ipAddress: string;
  hostname: string;
  region: string;
  zone: string;
  provider: string;
  metadata: Record<string, unknown>;
  metrics: NodeMetrics;
  tags: string[];
  parentId: string | null;
  positionX: number | null;
  positionY: number | null;
  createdAt: number;
  updatedAt: number;
  lastCheckedAt: number;
}

export interface NodeMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkIn: number;
  networkOut: number;
  latency: number;
  packetLoss: number;
  connections: number;
  uptime: number;
}

export interface NetworkConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  status: ConnectionStatus;
  protocol: ConnectionProtocol;
  port: number;
  latency: number;
  bandwidth: number;
  throughput: number;
  packetLoss: number;
  encrypted: boolean;
  bidirectional: boolean;
  metadata: Record<string, unknown>;
  createdAt: number;
  lastCheckedAt: number;
}

export interface NetworkTopology {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  clusters: TopologyCluster[];
  summary: TopologySummary;
  generatedAt: number;
}

export interface TopologyCluster {
  id: string;
  name: string;
  region: string;
  nodeIds: string[];
  status: NodeStatus;
}

export interface TopologySummary {
  totalNodes: number;
  healthyNodes: number;
  degradedNodes: number;
  downNodes: number;
  totalConnections: number;
  activeConnections: number;
  avgLatency: number;
  avgPacketLoss: number;
}

export interface CreateNodeRequest {
  name: string;
  type: NodeType;
  ipAddress: string;
  hostname?: string;
  region?: string;
  zone?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  parentId?: string;
}

export interface UpdateNodeRequest {
  name?: string;
  type?: NodeType;
  ipAddress?: string;
  hostname?: string;
  region?: string;
  zone?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  parentId?: string;
  positionX?: number;
  positionY?: number;
}

export interface CreateConnectionRequest {
  sourceNodeId: string;
  targetNodeId: string;
  protocol: ConnectionProtocol;
  port: number;
  bidirectional?: boolean;
  metadata?: Record<string, unknown>;
}
