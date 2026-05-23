/**
 * Kubernetes Multi-Cluster Configuration
 * Hierarchical structure: Region → Cluster → Namespace → Resources
 */

// ============================================
// Types
// ============================================

export const K8S_REGIONS = [
  { id: 'us-west-2', name: 'US West (Oregon)', provider: 'aws' },
  { id: 'us-east-1', name: 'US East (N. Virginia)', provider: 'aws' },
  { id: 'eu-west-1', name: 'EU West (Ireland)', provider: 'aws' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', provider: 'aws' },
] as const;

export type K8sRegionId = typeof K8S_REGIONS[number]['id'];

export interface K8sClusterConfig {
  id: string;
  name: string;
  displayName: string;
  version: string;
  provider: 'eks' | 'gke' | 'aks';
  region: K8sRegionId;
  environment: 'production' | 'staging' | 'development';
  namespaces: string[];
  nodeCount: number;
  status: 'healthy' | 'degraded' | 'critical';
}

export interface K8sNodeConfig {
  name: string;
  instanceType: string;
  cpu: number;
  memory: number;
  zone: string;
}

// ============================================
// Cluster Configurations by Region
// ============================================

export const K8S_CLUSTERS: Record<K8sRegionId, K8sClusterConfig[]> = {
  'us-west-2': [
    {
      id: 'usw2-prod-01',
      name: 'prod-cluster-01',
      displayName: 'Production US-West',
      version: '1.34.2',
      provider: 'eks',
      region: 'us-west-2',
      environment: 'production',
      namespaces: ['ecommerce', 'monitoring', 'istio-system', 'kube-system', 'cert-manager', 'logging'],
      nodeCount: 6,
      status: 'healthy',
    },
    {
      id: 'usw2-staging-01',
      name: 'staging-cluster-01',
      displayName: 'Staging US-West',
      version: '1.34.2',
      provider: 'eks',
      region: 'us-west-2',
      environment: 'staging',
      namespaces: ['ecommerce-staging', 'monitoring', 'kube-system'],
      nodeCount: 3,
      status: 'healthy',
    },
  ],
  'us-east-1': [
    {
      id: 'use1-prod-01',
      name: 'prod-cluster-east',
      displayName: 'Production US-East',
      version: '1.34.2',
      provider: 'eks',
      region: 'us-east-1',
      environment: 'production',
      namespaces: ['ecommerce', 'monitoring', 'istio-system', 'kube-system', 'cert-manager'],
      nodeCount: 5,
      status: 'healthy',
    },
    {
      id: 'use1-dr-01',
      name: 'dr-cluster-01',
      displayName: 'Disaster Recovery',
      version: '1.33.4',
      provider: 'eks',
      region: 'us-east-1',
      environment: 'production',
      namespaces: ['ecommerce-dr', 'monitoring', 'kube-system'],
      nodeCount: 4,
      status: 'degraded',
    },
    {
      id: 'use1-aks-01',
      name: 'aks-cluster-east',
      displayName: 'AKS Production US-East',
      version: '1.34.0',
      provider: 'aks',
      region: 'us-east-1',
      environment: 'production',
      namespaces: ['ecommerce', 'monitoring', 'kube-system', 'ingress-nginx'],
      nodeCount: 4,
      status: 'healthy',
    },
  ],
  'eu-west-1': [
    {
      id: 'euw1-prod-01',
      name: 'prod-cluster-eu',
      displayName: 'Production EU-West',
      version: '1.34.2',
      provider: 'eks',
      region: 'eu-west-1',
      environment: 'production',
      namespaces: ['ecommerce', 'monitoring', 'istio-system', 'kube-system', 'cert-manager', 'gdpr-compliance'],
      nodeCount: 5,
      status: 'healthy',
    },
    {
      id: 'euw1-gke-01',
      name: 'gke-cluster-eu',
      displayName: 'GKE Production EU',
      version: '1.34.1',
      provider: 'gke',
      region: 'eu-west-1',
      environment: 'production',
      namespaces: ['ecommerce', 'monitoring', 'istio-system', 'kube-system'],
      nodeCount: 4,
      status: 'healthy',
    },
  ],
  'ap-southeast-1': [
    {
      id: 'apse1-prod-01',
      name: 'prod-cluster-apac',
      displayName: 'Production APAC',
      version: '1.33.4',
      provider: 'eks',
      region: 'ap-southeast-1',
      environment: 'production',
      namespaces: ['ecommerce', 'monitoring', 'kube-system'],
      nodeCount: 4,
      status: 'healthy',
    },
    {
      id: 'apse1-dev-01',
      name: 'dev-cluster-apac',
      displayName: 'Development APAC',
      version: '1.34.2',
      provider: 'eks',
      region: 'ap-southeast-1',
      environment: 'development',
      namespaces: ['ecommerce-dev', 'testing', 'kube-system'],
      nodeCount: 2,
      status: 'healthy',
    },
  ],
};

// ============================================
// Node Configurations by Cluster
// ============================================

export const K8S_NODES_BY_CLUSTER: Record<string, K8sNodeConfig[]> = {
  'usw2-prod-01': [
    { name: 'ip-10-0-1-101.us-west-2.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'us-west-2a' },
    { name: 'ip-10-0-1-102.us-west-2.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'us-west-2a' },
    { name: 'ip-10-0-2-103.us-west-2.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'us-west-2b' },
    { name: 'ip-10-0-2-104.us-west-2.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'us-west-2b' },
    { name: 'ip-10-0-3-105.us-west-2.compute.internal', instanceType: 'c6i.4xlarge', cpu: 16, memory: 32, zone: 'us-west-2c' },
    { name: 'ip-10-0-3-106.us-west-2.compute.internal', instanceType: 'c6i.4xlarge', cpu: 16, memory: 32, zone: 'us-west-2c' },
  ],
  'usw2-staging-01': [
    { name: 'ip-10-1-1-101.us-west-2.compute.internal', instanceType: 'm6i.xlarge', cpu: 4, memory: 16, zone: 'us-west-2a' },
    { name: 'ip-10-1-1-102.us-west-2.compute.internal', instanceType: 'm6i.xlarge', cpu: 4, memory: 16, zone: 'us-west-2b' },
    { name: 'ip-10-1-2-103.us-west-2.compute.internal', instanceType: 'm6i.xlarge', cpu: 4, memory: 16, zone: 'us-west-2c' },
  ],
  'use1-prod-01': [
    { name: 'ip-10-0-1-201.us-east-1.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'us-east-1a' },
    { name: 'ip-10-0-1-202.us-east-1.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'us-east-1a' },
    { name: 'ip-10-0-2-203.us-east-1.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'us-east-1b' },
    { name: 'ip-10-0-2-204.us-east-1.compute.internal', instanceType: 'c6i.4xlarge', cpu: 16, memory: 32, zone: 'us-east-1b' },
    { name: 'ip-10-0-3-205.us-east-1.compute.internal', instanceType: 'c6i.4xlarge', cpu: 16, memory: 32, zone: 'us-east-1c' },
  ],
  'use1-dr-01': [
    { name: 'ip-10-2-1-201.us-east-1.compute.internal', instanceType: 'm6i.xlarge', cpu: 4, memory: 16, zone: 'us-east-1a' },
    { name: 'ip-10-2-1-202.us-east-1.compute.internal', instanceType: 'm6i.xlarge', cpu: 4, memory: 16, zone: 'us-east-1b' },
    { name: 'ip-10-2-2-203.us-east-1.compute.internal', instanceType: 'm6i.xlarge', cpu: 4, memory: 16, zone: 'us-east-1c' },
    { name: 'ip-10-2-2-204.us-east-1.compute.internal', instanceType: 'm6i.xlarge', cpu: 4, memory: 16, zone: 'us-east-1c' },
  ],
  'euw1-prod-01': [
    { name: 'ip-10-0-1-301.eu-west-1.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'eu-west-1a' },
    { name: 'ip-10-0-1-302.eu-west-1.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'eu-west-1a' },
    { name: 'ip-10-0-2-303.eu-west-1.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'eu-west-1b' },
    { name: 'ip-10-0-2-304.eu-west-1.compute.internal', instanceType: 'c6i.4xlarge', cpu: 16, memory: 32, zone: 'eu-west-1b' },
    { name: 'ip-10-0-3-305.eu-west-1.compute.internal', instanceType: 'c6i.4xlarge', cpu: 16, memory: 32, zone: 'eu-west-1c' },
  ],
  'apse1-prod-01': [
    { name: 'ip-10-0-1-401.ap-southeast-1.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'ap-southeast-1a' },
    { name: 'ip-10-0-1-402.ap-southeast-1.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'ap-southeast-1a' },
    { name: 'ip-10-0-2-403.ap-southeast-1.compute.internal', instanceType: 'm6i.2xlarge', cpu: 8, memory: 32, zone: 'ap-southeast-1b' },
    { name: 'ip-10-0-2-404.ap-southeast-1.compute.internal', instanceType: 'c6i.4xlarge', cpu: 16, memory: 32, zone: 'ap-southeast-1c' },
  ],
  'apse1-dev-01': [
    { name: 'ip-10-1-1-401.ap-southeast-1.compute.internal', instanceType: 'm6i.large', cpu: 2, memory: 8, zone: 'ap-southeast-1a' },
    { name: 'ip-10-1-1-402.ap-southeast-1.compute.internal', instanceType: 'm6i.large', cpu: 2, memory: 8, zone: 'ap-southeast-1b' },
  ],
  'euw1-gke-01': [
    { name: 'gke-euw1-prod-pool-1-a1b2c3d4', instanceType: 'n2-standard-8', cpu: 8, memory: 32, zone: 'europe-west1-b' },
    { name: 'gke-euw1-prod-pool-1-e5f6g7h8', instanceType: 'n2-standard-8', cpu: 8, memory: 32, zone: 'europe-west1-c' },
    { name: 'gke-euw1-prod-pool-2-i9j0k1l2', instanceType: 'n2-highmem-4', cpu: 4, memory: 32, zone: 'europe-west1-d' },
    { name: 'gke-euw1-prod-pool-2-m3n4o5p6', instanceType: 'n2-highcpu-8', cpu: 8, memory: 8, zone: 'europe-west1-b' },
  ],
  'use1-aks-01': [
    { name: 'aks-use1-agentpool-12345678-vmss000000', instanceType: 'Standard_D8s_v3', cpu: 8, memory: 32, zone: 'eastus-1' },
    { name: 'aks-use1-agentpool-12345678-vmss000001', instanceType: 'Standard_D8s_v3', cpu: 8, memory: 32, zone: 'eastus-2' },
    { name: 'aks-use1-agentpool-12345678-vmss000002', instanceType: 'Standard_F8s_v2', cpu: 8, memory: 16, zone: 'eastus-3' },
    { name: 'aks-use1-agentpool-12345678-vmss000003', instanceType: 'Standard_D4s_v3', cpu: 4, memory: 16, zone: 'eastus-1' },
  ],
};

// ============================================
// Flat Lists for Easy Access
// ============================================

export const K8S_ALL_CLUSTERS = Object.values(K8S_CLUSTERS).flat();

// Legacy exports for backward compatibility
export const K8S_CLUSTER = K8S_CLUSTERS['us-west-2'][0];
export const K8S_NODES = K8S_NODES_BY_CLUSTER['usw2-prod-01'];

// ============================================
// Helper Functions
// ============================================

/**
 * Get clusters by region
 */
export function getClustersByRegion(regionId: K8sRegionId): K8sClusterConfig[] {
  return K8S_CLUSTERS[regionId] || [];
}

/**
 * Get cluster by ID
 */
export function getClusterById(clusterId: string): K8sClusterConfig | undefined {
  return K8S_ALL_CLUSTERS.find(c => c.id === clusterId);
}

/**
 * Get nodes by cluster ID
 */
export function getNodesByCluster(clusterId: string): K8sNodeConfig[] {
  return K8S_NODES_BY_CLUSTER[clusterId] || [];
}

/**
 * Get namespaces by cluster ID
 */
export function getNamespacesByCluster(clusterId: string): string[] {
  const cluster = getClusterById(clusterId);
  return cluster?.namespaces || [];
}

/**
 * Get all regions
 */
export function getRegions() {
  return K8S_REGIONS;
}

/**
 * Get region by ID
 */
export function getRegionById(regionId: K8sRegionId) {
  return K8S_REGIONS.find(r => r.id === regionId);
}

/**
 * Get clusters by provider
 */
export function getClustersByProvider(provider: 'eks' | 'gke' | 'aks'): K8sClusterConfig[] {
  return K8S_ALL_CLUSTERS.filter(c => c.provider === provider);
}

/**
 * Get clusters by environment
 */
export function getClustersByEnvironment(environment: 'production' | 'staging' | 'development'): K8sClusterConfig[] {
  return K8S_ALL_CLUSTERS.filter(c => c.environment === environment);
}

/**
 * Get healthy clusters
 */
export function getHealthyClusters(): K8sClusterConfig[] {
  return K8S_ALL_CLUSTERS.filter(c => c.status === 'healthy');
}

/**
 * Get degraded clusters
 */
export function getDegradedClusters(): K8sClusterConfig[] {
  return K8S_ALL_CLUSTERS.filter(c => c.status === 'degraded' || c.status === 'critical');
}
