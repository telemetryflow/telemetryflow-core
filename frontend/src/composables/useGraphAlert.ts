/**
 * useGraphAlert — per-graph alert integration composable
 *
 * Manages the alert rule linked to a specific graph registry ID:
 *  - Fetches the existing AlertRule (identified by labels.graphId)
 *  - Exposes `alertEnabled` reactive state with toggle
 *  - Exposes available notification channels for selection
 *  - Creates or updates the AlertRule on demand (toggle ON / channel change)
 *  - Auto-captures the graph's defaultQueries as the alert queryString
 *
 * Usage:
 *   const { alertEnabled, toggleAlert, channels, selectedChannelIds, ... }
 *     = useGraphAlert("INF10001", "CPU Usage", definition.defaultQueries)
 */
import { ref, computed, onMounted } from "vue";
import { alertingApi } from "@/api/alerting";
import type { LogAlertRule } from "@/types";
import type { GraphDefaultQuery } from "@/constants/graphs/types";

export interface GraphAlertChannel {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

export function useGraphAlert(
  graphId: string,
  graphTitle: string,
  defaultQueries: GraphDefaultQuery[] = [],
) {
  // ─── State ─────────────────────────────────────────────────────────────────

  const rule = ref<LogAlertRule | null>(null);
  const loadingRule = ref(false);
  const savingAlert = ref(false);
  const alertError = ref<string | null>(null);

  const channels = ref<GraphAlertChannel[]>([]);
  const loadingChannels = ref(false);

  /** IDs of channels selected for this graph's alert rule */
  const selectedChannelIds = ref<string[]>([]);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const alertEnabled = computed(() => rule.value?.enabled === true);
  const hasRule = computed(() => rule.value !== null);
  const ruleId = computed(() => rule.value?.id ?? null);

  /** Primary query from the graph definition (first non-"none" dialect) */
  const primaryQuery = computed(
    () => defaultQueries.find((q) => q.dialect !== "none") ?? defaultQueries[0] ?? null,
  );

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  async function fetchRule() {
    loadingRule.value = true;
    try {
      rule.value = await alertingApi.getByGraphId(graphId);
      if (rule.value) {
        selectedChannelIds.value = rule.value.channelIds ?? [];
      }
    } finally {
      loadingRule.value = false;
    }
  }

  async function fetchChannels() {
    loadingChannels.value = true;
    try {
      channels.value = await alertingApi.listNotificationChannels();
    } finally {
      loadingChannels.value = false;
    }
  }

  // ─── Build rule payload from graph definition ──────────────────────────────

  /**
   * Construct the query + condition payload from the graph's defaultQueries.
   * The backend requires at least one condition; we derive it from the query.
   */
  function buildRulePayload() {
    const q = primaryQuery.value;

    // Map graph dialect to backend queryLanguage
    const queryLanguage = q
      ? q.dialect === "promql"
        ? "promql"
        : q.dialect === "tfql"
          ? "tfql"
          : q.dialect === "clickhouse"
            ? "sql"
            : "condition"
      : "condition";

    const queryString = q?.expression ?? "";

    // Derive condition metric: use graphId so the backend can correlate it
    // Operator ">=0" always fires → user configures threshold on alerts page
    const conditions = [
      {
        metric: graphId,
        aggregation: "avg",
        operator: ">=",
        threshold: 0,
        duration: "5m",
      },
    ];

    return { queryLanguage, queryString, conditions };
  }

  // ─── Toggle alert ON / OFF ─────────────────────────────────────────────────

  async function toggleAlert(): Promise<boolean> {
    savingAlert.value = true;
    alertError.value = null;
    try {
      if (!hasRule.value) {
        // No rule yet → create it with the graph's queries captured
        const { queryLanguage, queryString, conditions } = buildRulePayload();
        const created = await alertingApi.createRuleForGraph(
          graphId,
          graphTitle,
          selectedChannelIds.value,
          { queryLanguage, queryString, conditions },
        );
        if (!created) {
          alertError.value = "Failed to create alert rule. Check backend logs.";
          return false;
        }
        rule.value = created;
        // Enable immediately if channels are already selected
        if (selectedChannelIds.value.length > 0) {
          await alertingApi.enableRule(created.id);
          rule.value = { ...rule.value, enabled: true };
        }
      } else if (alertEnabled.value) {
        // Currently ON → disable
        await alertingApi.disableRule(ruleId.value!);
        if (rule.value) rule.value = { ...rule.value, enabled: false };
      } else {
        // Currently OFF → enable
        await alertingApi.enableRule(ruleId.value!);
        if (rule.value) rule.value = { ...rule.value, enabled: true };
      }
      return true;
    } catch (e: any) {
      alertError.value = e?.message ?? "Toggle failed";
      return false;
    } finally {
      savingAlert.value = false;
    }
  }

  // ─── Apply notification channels ───────────────────────────────────────────

  /** Returns true on success, false on failure (caller should keep modal open) */
  async function applyChannels(channelIds: string[]): Promise<boolean> {
    savingAlert.value = true;
    alertError.value = null;
    try {
      if (!hasRule.value) {
        // Create + enable with chosen channels, capturing graph queries
        const { queryLanguage, queryString, conditions } = buildRulePayload();
        const created = await alertingApi.createRuleForGraph(
          graphId,
          graphTitle,
          channelIds,
          { queryLanguage, queryString, conditions },
        );
        if (!created) {
          alertError.value = "Failed to create alert rule. Please try again.";
          return false;
        }
        rule.value = created;
        await alertingApi.enableRule(created.id);
        rule.value = { ...rule.value, enabled: true };
      } else {
        // Update existing rule channels
        const updated = await alertingApi.updateRule(ruleId.value!, {
          notificationChannels: channelIds.map((id) => ({
            channelId: id,
            sendOnResolve: true,
          })),
        });
        if (!updated) {
          alertError.value = "Failed to update notification channels.";
          return false;
        }
        if (rule.value) rule.value = { ...rule.value, channelIds };
        // Enable the rule if it was off
        if (!alertEnabled.value) {
          await alertingApi.enableRule(ruleId.value!);
          if (rule.value) rule.value = { ...rule.value, enabled: true };
        }
      }
      // Persist channel selection only on success
      selectedChannelIds.value = channelIds;
      return true;
    } catch (e: any) {
      alertError.value = e?.message ?? "Failed to apply channels";
      return false;
    } finally {
      savingAlert.value = false;
    }
  }

  // ─── Init ──────────────────────────────────────────────────────────────────

  onMounted(() => {
    fetchRule();
    fetchChannels();
  });

  return {
    // State
    rule,
    alertEnabled,
    hasRule,
    ruleId,
    primaryQuery,
    loadingRule,
    savingAlert,
    alertError,

    // Channels
    channels,
    loadingChannels,
    selectedChannelIds,

    // Actions
    toggleAlert,
    applyChannels,
    fetchRule,
    fetchChannels,
  };
}
