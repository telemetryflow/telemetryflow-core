/**
 * useGraphShare — per-graph public share/unshare composable
 *
 * Manages the public share link for a graph registry entry:
 *  - Fetches current share state on mount
 *  - `isShared` reactive boolean
 *  - `shareUrl` / `shortUrl` computed absolute URLs for copying
 *  - `share()` / `unshare()` / `regenerate()` actions
 *
 * Usage:
 *   const { isShared, shareUrl, share, unshare, regenerate, loading }
 *     = useGraphShare("HOM10005", "CPU Usage", [{ dialect: "tfql", expression: "..." }])
 */
import { ref, computed, onMounted } from "vue";
import { iamClient } from "@/api/iam";

export interface GraphShareState {
  graphId: string;
  title: string;
  defaultQueries: object[];
  isPublic: boolean;
  publicToken: string | null;
  shareUrl: string | null;
  shortCode: string | null;
  shortUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function useGraphShare(
  graphId: string,
  title: string,
  defaultQueries: object[],
) {
  // ─── State ─────────────────────────────────────────────────────────────────

  const state = ref<GraphShareState | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const isShared = computed(() => state.value?.isPublic === true);
  const publicToken = computed(() => state.value?.publicToken ?? null);
  const shortCode = computed(() => state.value?.shortCode ?? null);

  const _origin = typeof window !== "undefined" ? window.location.origin : "";

  /** Full public URL (48-char token) */
  const shareUrl = computed(() => {
    if (!state.value?.publicToken || !state.value.isPublic) return null;
    return `${_origin}/public/graphs/${state.value.publicToken}`;
  });

  /** Short URL (8-char code → /s/:code) */
  const shortUrl = computed(() => {
    if (!state.value?.shortCode || !state.value.isPublic) return null;
    return `${_origin}/s/${state.value.shortCode}`;
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** iamClient already returns response.data — no extra unwrapping needed */
  function unwrap(data: any): GraphShareState | null {
    if (!data) return null;
    // Guard against accidental double-wrapping ({ data: {...} })
    const raw = data?.data && typeof data.data === "object" ? data.data : data;
    if (typeof raw?.graphId === "string") return raw as GraphShareState;
    return null;
  }

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  async function fetchState() {
    loading.value = true;
    error.value = null;
    try {
      const data = await iamClient.get<any>(`/graphs/share/${graphId}`);
      state.value = unwrap(data);
    } catch (e: any) {
      // 404 means "never shared" — not an error
      if (e?.response?.status === 404) {
        state.value = null;
      } else {
        error.value = e?.message ?? "Failed to load share state";
      }
    } finally {
      loading.value = false;
    }
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function share(expiresAt?: Date) {
    loading.value = true;
    error.value = null;
    try {
      const payload: any = { title, defaultQueries };
      if (expiresAt) payload.expiresAt = expiresAt.toISOString();
      const data = await iamClient.post<any>(`/graphs/share/${graphId}`, payload);
      const result = unwrap(data);
      if (result) {
        state.value = result;
      } else {
        error.value = "Unexpected response from server.";
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? e?.message ?? "Failed to share graph";
      // Do NOT wipe state — preserve previous share state on error
    } finally {
      loading.value = false;
    }
  }

  async function unshare() {
    loading.value = true;
    error.value = null;
    try {
      await iamClient.delete(`/graphs/share/${graphId}`);
      // Patch local state immediately — don't need a full refetch
      if (state.value) {
        state.value = {
          ...state.value,
          isPublic: false,
          publicToken: null,
          shareUrl: null,
          shortCode: null,
          shortUrl: null,
        };
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? e?.message ?? "Failed to unshare graph";
    } finally {
      loading.value = false;
    }
  }

  async function regenerate() {
    loading.value = true;
    error.value = null;
    try {
      const data = await iamClient.post<any>(`/graphs/share/${graphId}/regenerate`, {});
      const result = unwrap(data);
      if (result) state.value = result;
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? e?.message ?? "Failed to regenerate token";
    } finally {
      loading.value = false;
    }
  }

  async function copyLink(useShort = false) {
    const url = useShort ? shortUrl.value : shareUrl.value;
    if (!url) return false;
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Init ──────────────────────────────────────────────────────────────────

  onMounted(fetchState);

  return {
    // State
    state,
    isShared,
    publicToken,
    shareUrl,
    shortCode,
    shortUrl,
    loading,
    error,

    // Actions
    share,
    unshare,
    regenerate,
    copyLink,
    fetchState,
  };
}
