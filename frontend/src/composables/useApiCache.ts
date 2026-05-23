/**
 * API Cache Management Composable
 * TASK-06: Provides reactive cache management for API responses
 */

import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  type Ref,
  type ComputedRef,
} from "vue";
import {
  getCacheMetadata,
  getCacheSize,
  clearAllCache,
  clearCacheByPattern,
  cleanExpiredCache,
  getFromCache,
  removeFromCache,
  type CacheMetadata,
} from "@/utils/api-cache";
import { config } from "@/config";

export interface UseApiCacheOptions {
  /** Auto-refresh metadata interval in ms (0 = disabled) */
  autoRefreshInterval?: number;
  /** Use sessionStorage instead of localStorage */
  useSessionStorage?: boolean;
}

export interface UseApiCacheReturn {
  // State
  metadata: Ref<CacheMetadata[]>;
  totalSize: Ref<number>;
  totalEntries: ComputedRef<number>;
  isEnabled: ComputedRef<boolean>;

  // Computed
  formattedSize: ComputedRef<string>;
  expiredCount: ComputedRef<number>;
  cacheByEndpoint: ComputedRef<Record<string, CacheMetadata[]>>;

  // Actions
  refresh: () => void;
  clearAll: () => void;
  clearByPattern: (pattern: string | RegExp) => number;
  clearExpired: () => number;
  clearEntry: (endpoint: string, params?: Record<string, unknown>) => void;
  getEntry: <T>(endpoint: string, params?: Record<string, unknown>) => T | null;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * API Cache management composable
 * Provides reactive access to cache state and management functions
 */
export function useApiCache(options?: UseApiCacheOptions): UseApiCacheReturn {
  const { autoRefreshInterval = 0, useSessionStorage = false } = options || {};

  // State
  const metadata = ref<CacheMetadata[]>([]);
  const totalSize = ref(0);

  // Auto-refresh timer
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  // Computed
  const totalEntries = computed(() => metadata.value.length);
  const isEnabled = computed(() => config.enableCache);

  const formattedSize = computed(() => formatBytes(totalSize.value));

  const expiredCount = computed(() => {
    const now = Date.now();
    return metadata.value.filter((entry) => entry.expiresAt < now).length;
  });

  const cacheByEndpoint = computed(() => {
    const grouped: Record<string, CacheMetadata[]> = {};
    for (const entry of metadata.value) {
      const endpoint = entry.endpoint;
      if (!grouped[endpoint]) {
        grouped[endpoint] = [];
      }
      grouped[endpoint].push(entry);
    }
    return grouped;
  });

  // Actions
  function refresh(): void {
    metadata.value = getCacheMetadata(useSessionStorage);
    totalSize.value = getCacheSize(useSessionStorage);
  }

  function clearAll(): void {
    clearAllCache(useSessionStorage);
    refresh();
  }

  function clearByPattern(pattern: string | RegExp): number {
    const cleared = clearCacheByPattern(pattern, useSessionStorage);
    refresh();
    return cleared;
  }

  function clearExpired(): number {
    const cleaned = cleanExpiredCache(useSessionStorage);
    refresh();
    return cleaned;
  }

  function clearEntry(
    endpoint: string,
    params?: Record<string, unknown>,
  ): void {
    removeFromCache(endpoint, params, { useSessionStorage });
    refresh();
  }

  function getEntry<T>(
    endpoint: string,
    params?: Record<string, unknown>,
  ): T | null {
    return getFromCache<T>(endpoint, params, { useSessionStorage });
  }

  // Lifecycle
  onMounted(() => {
    refresh();

    if (autoRefreshInterval > 0) {
      refreshTimer = setInterval(refresh, autoRefreshInterval);
    }
  });

  onUnmounted(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  });

  return {
    metadata,
    totalSize,
    totalEntries,
    isEnabled,
    formattedSize,
    expiredCount,
    cacheByEndpoint,
    refresh,
    clearAll,
    clearByPattern,
    clearExpired,
    clearEntry,
    getEntry,
  };
}

export default useApiCache;
