/**
 * Operating System Icons and Utilities
 *
 * Global inventory of OS logo icons used across the platform:
 * - Agent monitoring (AgentDetailsPanel, AgentTopConsumers)
 * - Infrastructure overview (LatestAgentsSection)
 * - Account sessions
 *
 * Uses Iconify icon sets: simple-icons, devicon, logos, mdi
 */

export interface OSInfo {
  icon: string;
  label: string;
  color: string;
}

/**
 * OS registry — each entry maps a keyword (matched against the lowercase platform
 * string) to its logo icon, display label, and brand color.
 *
 * Order matters: more specific distros must come BEFORE generic "linux" so that
 * e.g. "ubuntu" matches before the catch-all "linux" entry.
 */
const OS_REGISTRY: { keywords: string[]; info: OSInfo }[] = [
  // ── Windows family ──────────────────────────────────────────────────────────
  {
    keywords: ["windows server"],
    info: { icon: "simple-icons:windowsterminal", label: "Windows Server", color: "#0078D4" },
  },
  {
    keywords: ["windows"],
    info: { icon: "simple-icons:windows11", label: "Windows", color: "#0078D4" },
  },

  // ── macOS / Apple ───────────────────────────────────────────────────────────
  {
    keywords: ["darwin", "macos", "mac os", "sonoma", "ventura", "monterey", "sequoia", "big sur", "catalina"],
    info: { icon: "simple-icons:apple", label: "macOS", color: "#555555" },
  },
  {
    keywords: ["ios", "iphone", "ipad", "ipados"],
    info: { icon: "simple-icons:apple", label: "iOS", color: "#000000" },
  },

  // ── Linux distros (specific before generic) ─────────────────────────────────
  {
    keywords: ["ubuntu"],
    info: { icon: "simple-icons:ubuntu", label: "Ubuntu", color: "#E95420" },
  },
  {
    keywords: ["debian"],
    info: { icon: "simple-icons:debian", label: "Debian", color: "#A81D33" },
  },
  {
    keywords: ["centos"],
    info: { icon: "simple-icons:centos", label: "CentOS", color: "#262577" },
  },
  {
    keywords: ["rhel", "red hat", "redhat"],
    info: { icon: "simple-icons:redhat", label: "Red Hat", color: "#EE0000" },
  },
  {
    keywords: ["fedora"],
    info: { icon: "simple-icons:fedora", label: "Fedora", color: "#51A2DA" },
  },
  {
    keywords: ["suse", "opensuse", "sles"],
    info: { icon: "simple-icons:opensuse", label: "openSUSE", color: "#73BA25" },
  },
  {
    keywords: ["arch"],
    info: { icon: "simple-icons:archlinux", label: "Arch Linux", color: "#1793D1" },
  },
  {
    keywords: ["alpine"],
    info: { icon: "simple-icons:alpinelinux", label: "Alpine Linux", color: "#0D597F" },
  },
  {
    keywords: ["gentoo"],
    info: { icon: "simple-icons:gentoo", label: "Gentoo", color: "#54487A" },
  },
  {
    keywords: ["manjaro"],
    info: { icon: "simple-icons:manjaro", label: "Manjaro", color: "#35BF5C" },
  },
  {
    keywords: ["mint", "linuxmint"],
    info: { icon: "simple-icons:linuxmint", label: "Linux Mint", color: "#87CF3E" },
  },
  {
    keywords: ["kali"],
    info: { icon: "simple-icons:kalilinux", label: "Kali Linux", color: "#557C94" },
  },
  {
    keywords: ["rocky"],
    info: { icon: "simple-icons:rockylinux", label: "Rocky Linux", color: "#10B981" },
  },
  {
    keywords: ["alma", "almalinux"],
    info: { icon: "simple-icons:almalinux", label: "AlmaLinux", color: "#0F4266" },
  },
  {
    keywords: ["nixos"],
    info: { icon: "simple-icons:nixos", label: "NixOS", color: "#5277C3" },
  },
  {
    keywords: ["void"],
    info: { icon: "simple-icons:voidlinux", label: "Void Linux", color: "#478061" },
  },
  {
    keywords: ["pop!_os", "popos", "pop_os"],
    info: { icon: "simple-icons:pop!_os", label: "Pop!_OS", color: "#48B9C7" },
  },
  {
    keywords: ["elementary"],
    info: { icon: "mdi:laptop", label: "elementary OS", color: "#64BAFF" },
  },
  // Generic Linux catch-all (must be after all distros)
  {
    keywords: ["linux"],
    info: { icon: "simple-icons:linux", label: "Linux", color: "#FCC624" },
  },

  // ── BSD family ──────────────────────────────────────────────────────────────
  {
    keywords: ["freebsd"],
    info: { icon: "simple-icons:freebsd", label: "FreeBSD", color: "#AB2B28" },
  },
  {
    keywords: ["openbsd"],
    info: { icon: "mdi:server", label: "OpenBSD", color: "#F2CA30" },
  },
  {
    keywords: ["netbsd"],
    info: { icon: "mdi:server", label: "NetBSD", color: "#FF6600" },
  },

  // ── Mobile ──────────────────────────────────────────────────────────────────
  {
    keywords: ["android"],
    info: { icon: "simple-icons:android", label: "Android", color: "#34A853" },
  },
  {
    keywords: ["harmonyos", "harmony"],
    info: { icon: "simple-icons:harmonyos", label: "HarmonyOS", color: "#000000" },
  },

  // ── Other / Embedded ────────────────────────────────────────────────────────
  {
    keywords: ["chromeos", "chrome os"],
    info: { icon: "simple-icons:googlechrome", label: "ChromeOS", color: "#4285F4" },
  },
  {
    keywords: ["solaris", "sunos"],
    info: { icon: "mdi:white-balance-sunny", label: "Solaris", color: "#E97826" },
  },
  {
    keywords: ["aix"],
    info: { icon: "mdi:server", label: "AIX", color: "#054ADA" },
  },
];

/**
 * Get OS icon, label, and brand color from a platform/OS string.
 *
 * @example
 * getOSInfo("debian")     → { icon: "simple-icons:debian", label: "Debian", color: "#A81D33" }
 * getOSInfo("Darwin")     → { icon: "simple-icons:apple",  label: "macOS",  color: "#555555" }
 * getOSInfo("Windows 11") → { icon: "simple-icons:windows11", label: "Windows", color: "#0078D4" }
 */
export function getOSInfo(os: string): OSInfo {
  const normalized = os.toLowerCase();
  for (const entry of OS_REGISTRY) {
    if (entry.keywords.some((kw) => normalized.includes(kw))) {
      return entry.info;
    }
  }
  // Fallback
  return { icon: "mdi:help-circle-outline", label: os || "Unknown", color: "#666666" };
}

/**
 * Normalize a platform string to a canonical OS display name.
 *
 * @example
 * normalizeOSName("debian") → "Debian"
 * normalizeOSName("Darwin") → "macOS"
 */
export function normalizeOSName(platform: string): string {
  return getOSInfo(platform).label;
}

/**
 * Full OS registry exposed for components that need to enumerate all known OS types
 * (e.g. filter dropdowns, legend tables).
 */
export const OS_LIST = OS_REGISTRY.map((entry) => entry.info);
