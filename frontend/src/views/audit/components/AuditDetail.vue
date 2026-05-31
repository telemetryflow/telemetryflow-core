<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import {
  NButton,
  NTag,
  NDrawer,
  NDrawerContent,
  NCollapse,
  NCollapseItem,
  NTooltip,
  NTime,
} from "naive-ui";
import { StatPanel } from "@/components/charts";
import { useRawJsonView } from "@/composables/useRawJsonView";
import type { AuditLog, AuditEventType, AuditResult } from "@/types/audit";
import { AUDIT_EVENT_TYPES, AUDIT_RESULTS, getActionLabel, formatAuditUserName } from "@/types/audit";

const props = defineProps<{
  show: boolean;
  log: AuditLog | null;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
}>();

const logRef = computed(() => props.log);
const { jsonLines: selectedLogJsonLines, copyJson: copyLogJson } = useRawJsonView(logRef);

// ==================== HELPERS ====================

function getEventTypeTagType(eventType: AuditEventType): "info" | "warning" | "success" | "default" {
  const colorMap: Record<string, "info" | "warning" | "success" | "default"> = {
    info: "info", warning: "warning", success: "success", default: "default",
  };
  return colorMap[AUDIT_EVENT_TYPES[eventType]?.color] || "default";
}

function getResultTagType(result: AuditResult): "success" | "error" | "warning" {
  const colorMap: Record<string, "success" | "error" | "warning"> = {
    success: "success", error: "error", warning: "warning",
  };
  return colorMap[AUDIT_RESULTS[result]?.color] || "warning";
}

const resultStatusConfig: Record<string, { color: string; bg: string; borderColor: string; icon: string }> = {
  success: { color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)", borderColor: "rgba(34, 197, 94, 0.2)", icon: "carbon:checkmark-filled" },
  failure: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.2)", icon: "carbon:error-filled" },
  error:   { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.2)", icon: "carbon:error-filled" },
  denied:  { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.2)", icon: "carbon:warning-filled" },
};

function getResultStatus(result: string) {
  return resultStatusConfig[result.toLowerCase()] || resultStatusConfig.success;
}

// ==================== DETAIL STATS ====================

const detailStats = computed(() => {
  if (!props.log) return [];
  const log = props.log;

  const eventTypeColor =
    AUDIT_EVENT_TYPES[log.eventType]?.color === "info" ? "#3b82f6" :
    AUDIT_EVENT_TYPES[log.eventType]?.color === "warning" ? "#f59e0b" :
    AUDIT_EVENT_TYPES[log.eventType]?.color === "success" ? "#22c55e" : "#64748b";

  const resultColor =
    AUDIT_RESULTS[log.result]?.color === "success" ? "#22c55e" :
    AUDIT_RESULTS[log.result]?.color === "error" ? "#ef4444" : "#f59e0b";

  return [
    {
      size: "small" as const,
      icon: "carbon:event",
      iconColor: eventTypeColor,
      color: (AUDIT_EVENT_TYPES[log.eventType]?.color === "info" ? "info" :
        AUDIT_EVENT_TYPES[log.eventType]?.color === "warning" ? "warning" :
        AUDIT_EVENT_TYPES[log.eventType]?.color === "success" ? "success" : "default") as any,
      valueColor: eventTypeColor,
      title: "Event Type",
      value: AUDIT_EVENT_TYPES[log.eventType]?.label || log.eventType,
      showCompact: false,
    },
    {
      size: "small" as const,
      icon: log.result === "SUCCESS" ? "carbon:checkmark-filled" :
        log.result === "FAILURE" ? "carbon:error-filled" : "carbon:warning-filled",
      iconColor: resultColor,
      color: (AUDIT_RESULTS[log.result]?.color === "success" ? "success" :
        AUDIT_RESULTS[log.result]?.color === "error" ? "error" : "warning") as any,
      valueColor: resultColor,
      title: "Status",
      value: AUDIT_RESULTS[log.result]?.label || log.result,
      showCompact: false,
    },
    {
      size: "small" as const,
      icon: "carbon:cube",
      iconColor: "#3b82f6",
      color: "info" as const,
      valueColor: "#3b82f6",
      title: "Resource",
      value: log.resource,
      showCompact: false,
    },
    {
      size: "small" as const,
      icon: "carbon:timer",
      iconColor: "#8b5cf6",
      color: "purple" as const,
      valueColor: "#8b5cf6",
      title: "Duration",
      value: log.durationMs !== undefined ? `${log.durationMs}ms` : "N/A",
      showCompact: false,
    },
  ];
});
</script>

<template>
  <NDrawer :show="show" :width="550" placement="right" @update:show="emit('update:show', $event)">
    <NDrawerContent v-if="log">
      <template #header>
        <div class="drawer-header">
          <Icon icon="carbon:document-tasks" class="drawer-header-icon" />
          <span>Audit Log Details</span>
        </div>
      </template>
      <template #footer>
        <div class="drawer-footer">
          <NButton type="primary" ghost @click="emit('update:show', false)">
            <template #icon>
              <Icon icon="carbon:close" />
            </template>
            Close
          </NButton>
        </div>
      </template>

      <!-- Stats Row -->
      <div class="drawer-stats-row">
        <StatPanel v-for="(config, index) in detailStats" :key="`detail-stat-${index}`" v-bind="config" />
      </div>

      <!-- Status Banner -->
      <div
        class="status-banner" :style="{
          backgroundColor: getResultStatus(log.result).bg,
          color: getResultStatus(log.result).color,
          borderColor: getResultStatus(log.result).borderColor,
        }"
      >
        <Icon :icon="getResultStatus(log.result).icon" />
        <span>
          <strong>{{ (AUDIT_RESULTS[log.result]?.label || log.result).toUpperCase() }}</strong>
          - {{ getActionLabel(log.action) }}
        </span>
      </div>

      <div class="detail-content">
        <!-- Event Information -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:information" />
            <span>Event Information</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr><td class="info-label">ID</td><td class="info-value"><code>{{ log.id }}</code></td></tr>
              <tr>
                <td class="info-label">Timestamp</td>
                <td class="info-value"><NTime :time="log.timestamp" format="yyyy-MM-dd HH:mm:ss" /></td>
              </tr>
              <tr>
                <td class="info-label">Event Type</td>
                <td class="info-value">
                  <NTag :type="getEventTypeTagType(log.eventType)" size="small">
                    {{ AUDIT_EVENT_TYPES[log.eventType]?.label }}
                  </NTag>
                </td>
              </tr>
              <tr><td class="info-label">Action</td><td class="info-value"><code>{{ log.action }}</code></td></tr>
              <tr>
                <td class="info-label">Result</td>
                <td class="info-value">
                  <NTag :type="getResultTagType(log.result)" size="small">
                    {{ AUDIT_RESULTS[log.result]?.label }}
                  </NTag>
                </td>
              </tr>
              <tr v-if="log.durationMs !== undefined">
                <td class="info-label">Duration</td>
                <td class="info-value"><code>{{ log.durationMs }}ms</code></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- User Information -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:user" />
            <span>User Information</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr><td class="info-label">User</td><td class="info-value">{{ formatAuditUserName(log) }}</td></tr>
              <tr><td class="info-label">Email</td><td class="info-value"><code>{{ log.userEmail }}</code></td></tr>
              <tr><td class="info-label">Organization ID</td><td class="info-value"><code>{{ log.organizationId || '-' }}</code></td></tr>
              <tr><td class="info-label">Organization Name</td><td class="info-value">{{ log.organizationName || '-' }}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Resource Information -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:cube" />
            <span>Resource</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr><td class="info-label">Resource</td><td class="info-value"><code>{{ log.resource }}</code></td></tr>
              <tr><td class="info-label">Resource ID</td><td class="info-value"><code>{{ log.resourceId || '-' }}</code></td></tr>
            </tbody>
          </table>
        </div>

        <!-- Error Message -->
        <div v-if="log.errorMessage" class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:error" />
            <span>Error</span>
          </div>
          <div class="message-box error">
            <code>{{ log.errorMessage }}</code>
          </div>
        </div>

        <!-- Request Information -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:network-4" />
            <span>Request Information</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr><td class="info-label">IP Address</td><td class="info-value"><code>{{ log.ipAddress || '-' }}</code></td></tr>
              <tr><td class="info-label">Request Path</td><td class="info-value"><code>{{ log.requestPath || '-' }}</code></td></tr>
              <tr>
                <td class="info-label">User Agent</td>
                <td class="info-value" style="word-break:break-all;font-size:0.75rem">{{ log.userAgent || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tracing -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:connect" />
            <span>Tracing</span>
          </div>
          <table class="info-table">
            <tbody>
              <tr><td class="info-label">Session ID</td><td class="info-value"><code>{{ log.sessionId || '-' }}</code></td></tr>
              <tr><td class="info-label">Correlation ID</td><td class="info-value"><code>{{ log.correlationId || '-' }}</code></td></tr>
            </tbody>
          </table>
        </div>

        <!-- Metadata -->
        <div v-if="log.metadata" class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:json" />
            <span>Metadata</span>
          </div>
          <div class="message-box">
            <code>{{ JSON.stringify(log.metadata, null, 2) }}</code>
          </div>
        </div>

        <!-- Raw JSON -->
        <div class="detail-section">
          <div class="section-label">
            <Icon icon="carbon:code" />
            <span>Raw Audit Log (JSON)</span>
          </div>
          <NCollapse class="raw-json-collapse">
            <NCollapseItem name="raw">
              <template #header>
                <div class="collapse-header-with-copy">
                  <span>View Raw JSON</span>
                </div>
              </template>
              <template #header-extra>
                <NTooltip>
                  <template #trigger>
                    <NButton size="tiny" quaternary @click.stop="copyLogJson">
                      <template #icon>
                        <Icon icon="carbon:copy" />
                      </template>
                    </NButton>
                  </template>
                  Copy JSON
                </NTooltip>
              </template>
              <div class="json-code-wrapper">
                <div class="json-with-lines">
                  <div class="line-numbers">
                    <span v-for="(_, idx) in selectedLogJsonLines.lines" :key="`ln-${idx}`" class="line-number">
                      {{ idx + 1 }}
                    </span>
                  </div>
                  <pre class="json-highlight"><code><span
                    v-for="(line, idx) in selectedLogJsonLines.lines"
                    :key="`jl-${idx}`" class="json-line" v-html="line + '\n'"
                  /></code></pre>
                </div>
              </div>
            </NCollapseItem>
          </NCollapse>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped lang="scss">
// Drawer responsive
:deep(.n-drawer) { max-width: 100vw !important; }

@media (max-width: 768px) {
  :deep(.n-drawer) { width: 100vw !important; }
}

.drawer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.drawer-header-icon {
  font-size: 20px;
  color: var(--n-primary-color);
}

.drawer-stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 5px;
  border-top: 1px solid var(--n-border-color);

  :deep(.n-button) {
    width: 120px;
    min-width: 100px;
    height: 36px !important;
    line-height: 34px;
    padding: 0 !important;
    box-sizing: border-box;
  }
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 20px;
  border: 1px solid;

  :deep(svg) { font-size: 18px; }
}

.detail-content { margin-top: 4px; }

.detail-section {
  margin-top: 24px;
  &:first-child { margin-top: 0; }
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--n-text-color-3);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  :deep(svg) { font-size: 16px; }
}

.info-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  overflow: hidden;

  tr:not(:last-child) td { border-bottom: 1px solid var(--k8s-border-color); }

  td { padding: 10px 12px; }

  .info-label {
    font-weight: 500;
    color: var(--n-text-color-3);
    font-size: 0.8125rem;
    width: 160px;
    min-width: 120px;
    background: rgba(100, 116, 139, 0.1);

    :root.dark & { background: rgba(51, 65, 85, 0.4); }
  }

  .info-value {
    color: var(--n-text-color);
    font-size: 0.8125rem;

    code {
      font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
      font-size: 0.8125rem;
      background: transparent;
      padding: 0;
      border: none;
    }
  }
}

.message-box {
  background: #f1f5f9;
  border: 1px solid var(--k8s-border-color);
  border-radius: 6px;
  padding: 10px 12px;

  :root.dark & { background: #1e293b; }

  &.error {
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.2);

    :root.dark & { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); }
  }

  code {
    font-family: "SF Mono", Monaco, "Courier New", monospace;
    font-size: 0.75rem;
    line-height: 1.5;
    color: #334155;
    word-break: break-word;
    white-space: pre-wrap;
    display: block;

    :root.dark & { color: #e2e8f0; }
  }
}

.raw-json-collapse {
  :deep(.n-collapse-item) {
    .n-collapse-item__header {
      padding: 10px 14px;
      background: rgba(128, 128, 128, 0.1);
      border: 1px solid rgba(128, 128, 128, 0.3);
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.875rem;

      &:hover { background: rgba(128, 128, 128, 0.15); }
    }

    &.n-collapse-item--active .n-collapse-item__header {
      border-radius: 8px 8px 0 0;
      border-bottom: none;
    }

    .n-collapse-item__content-wrapper .n-collapse-item__content-inner { padding: 0; }
  }
}

.collapse-header-with-copy {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
