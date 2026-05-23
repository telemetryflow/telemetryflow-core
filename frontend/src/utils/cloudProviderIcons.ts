/**
 * Cloud Provider Icons and Utilities
 * Provides icons and colors for different cloud providers
 */

export interface CloudProviderInfo {
  icon: string;
  label: string;
  color: string;
}

/**
 * Cloud provider icon mapping
 */
export const cloudProviders: Record<string, CloudProviderInfo> = {
  aws: {
    icon: "mdi:aws",
    label: "Amazon Web Services",
    color: "#FF9900",
  },
  amazon: {
    icon: "mdi:aws",
    label: "Amazon Web Services",
    color: "#FF9900",
  },
  gcp: {
    icon: "mdi:google-cloud",
    label: "Google Cloud Platform",
    color: "#4285F4",
  },
  google: {
    icon: "mdi:google-cloud",
    label: "Google Cloud Platform",
    color: "#4285F4",
  },
  azure: {
    icon: "mdi:microsoft-azure",
    label: "Microsoft Azure",
    color: "#0089D6",
  },
  microsoft: {
    icon: "mdi:microsoft-azure",
    label: "Microsoft Azure",
    color: "#0089D6",
  },
  digitalocean: {
    icon: "mdi:digital-ocean",
    label: "DigitalOcean",
    color: "#0080FF",
  },
  linode: {
    icon: "simple-icons:linode",
    label: "Linode",
    color: "#00A95C",
  },
  vultr: {
    icon: "simple-icons:vultr",
    label: "Vultr",
    color: "#007BFC",
  },
  alibaba: {
    icon: "simple-icons:alibabacloud",
    label: "Alibaba Cloud",
    color: "#FF6A00",
  },
  oracle: {
    icon: "simple-icons:oracle",
    label: "Oracle Cloud",
    color: "#F80000",
  },
  ibm: {
    icon: "simple-icons:ibmcloud",
    label: "IBM Cloud",
    color: "#1261FE",
  },
  onprem: {
    icon: "carbon:server-rack",
    label: "On-Premises",
    color: "#64748B",
  },
  local: {
    icon: "carbon:server-rack",
    label: "Local",
    color: "#64748B",
  },
  rancher: {
    icon: "simple-icons:rancher",
    label: "Rancher",
    color: "#0075A8",
  },
  rke: {
    icon: "simple-icons:rancher",
    label: "Rancher RKE",
    color: "#0075A8",
  },
  rke2: {
    icon: "simple-icons:rancher",
    label: "Rancher RKE2",
    color: "#0075A8",
  },
  k8s: {
    icon: "simple-icons:kubernetes",
    label: "Kubernetes",
    color: "#326CE5",
  },
  kubernetes: {
    icon: "simple-icons:kubernetes",
    label: "Kubernetes",
    color: "#326CE5",
  },
  // ── Managed Kubernetes Services ──────────────────────────────────────────
  eks: {
    icon: "simple-icons:amazonaws",
    label: "Amazon EKS",
    color: "#FF9900",
  },
  gke: {
    icon: "simple-icons:googlecloud",
    label: "Google GKE",
    color: "#4285F4",
  },
  aks: {
    icon: "simple-icons:microsoftazure",
    label: "Azure AKS",
    color: "#0089D6",
  },
  ack: {
    icon: "simple-icons:alibabacloud",
    label: "Alibaba ACK",
    color: "#FF6A00",
  },
  cce: {
    icon: "simple-icons:huawei",
    label: "Huawei CCE",
    color: "#CF0A2C",
  },
  // ── OpenShift family ──────────────────────────────────────────────────────
  openshift: {
    icon: "simple-icons:redhatopenshift",
    label: "OpenShift",
    color: "#EE0000",
  },
  okd: {
    icon: "simple-icons:redhatopenshift",
    label: "OKD",
    color: "#EE0000",
  },
  microshift: {
    icon: "simple-icons:redhatopenshift",
    label: "MicroShift",
    color: "#EE0000",
  },
  // ── Lightweight / Local K8s distributions ────────────────────────────────
  k3s: {
    icon: "simple-icons:kubernetes",
    label: "K3s",
    color: "#326CE5",
  },
  kubesphere: {
    icon: "simple-icons:kubernetes",
    label: "KubeSphere",
    color: "#326CE5",
  },
  kind: {
    icon: "simple-icons:kubernetes",
    label: "KinD",
    color: "#326CE5",
  },
  minikube: {
    icon: "simple-icons:kubernetes",
    label: "Minikube",
    color: "#326CE5",
  },
  // ── On-Premises / Bare Metal ──────────────────────────────────────────────
  baremetal: {
    icon: "carbon:bare-metal-server",
    label: "Bare Metal",
    color: "#64748B",
  },
  // ── Other / Self-Managed / Unknown ────────────────────────────────────────
  other: {
    icon: "carbon:network-enterprise",
    label: "Other",
    color: "#64748B",
  },
  "self-managed": {
    icon: "carbon:network-enterprise",
    label: "Self-Managed",
    color: "#64748B",
  },
  unknown: {
    icon: "carbon:network-enterprise",
    label: "Unknown",
    color: "#64748B",
  },
};

/**
 * Get cloud provider icon and info based on provider name
 */
export function getCloudProviderInfo(provider: string): CloudProviderInfo {
  if (!provider || !provider.trim()) {
    return {
      icon: "carbon:network-enterprise",
      label: "Unknown",
      color: "#64748B",
    };
  }

  const normalized = provider.toLowerCase().trim();

  // Direct match
  if (cloudProviders[normalized]) {
    return cloudProviders[normalized];
  }

  // Partial match (only check if normalized contains a known key, not the reverse)
  for (const [key, info] of Object.entries(cloudProviders)) {
    if (normalized.includes(key)) {
      return info;
    }
  }

  // Default fallback
  return {
    icon: "carbon:network-enterprise",
    label: provider,
    color: "#64748B",
  };
}

/**
 * Get cloud provider icon only
 */
export function getCloudProviderIcon(provider: string): string {
  return getCloudProviderInfo(provider).icon;
}

/**
 * Get cloud provider color only
 */
export function getCloudProviderColor(provider: string): string {
  return getCloudProviderInfo(provider).color;
}
