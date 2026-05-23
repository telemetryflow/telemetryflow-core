<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import type { QueryTemplate, SignalSource } from "@/utils/query-templates";

interface Props {
  label: string;
  color: string;
  query: string;
  queryType: SignalSource;
  dialect: "tfql" | "promql";
  legend: string;
  legendFormat?: string;
  seriesKey?: string;
  enabled: boolean;
  loading: boolean;
  error: string | null;
  templateSuggestions?: QueryTemplate[];
}

const props = withDefaults(defineProps<Props>(), {
  templateSuggestions: () => [],
});

const emit = defineEmits<{
  (e: "update:query", value: string): void;
  (e: "update:queryType", value: SignalSource): void;
  (e: "update:dialect", value: "tfql" | "promql"): void;
  (e: "update:legend", value: string): void;
  (e: "toggle"): void;
  (e: "run"): void;
  (e: "remove"): void;
  (e: "duplicate"): void;
  (e: "select-template", templateId: string): void;
}>();

const queryTypeOptions = [
  { label: "Metric", value: "metric" as const },
  { label: "Log", value: "log" as const },
  { label: "Trace", value: "trace" as const },
];

const dialectOptions = [
  { label: "TFQL", value: "tfql" as const },
  { label: "PromQL", value: "promql" as const },
];

const templateOptions = computed(() =>
  props.templateSuggestions.map((t) => ({
    label: t.name,
    value: t.id,
    description: t.description,
  })),
);

const placeholderText = computed(() => {
  if (props.dialect === "promql") {
    return props.queryType === "metric"
      ? 'rate(http_requests_total{service_name="api-gateway"}[5m])'
      : 'count_over_time({service_name="api-gateway"}[5m])';
  }
  switch (props.queryType) {
    case "metric":
      return "FETCH metrics WHERE metric_name = 'http_requests_total' TIMERANGE LAST 1h AGGREGATE rate(value) INTERVAL 1m GROUP BY service_name";
    case "log":
      return "FETCH logs WHERE service_name = 'api-gateway' TIMERANGE LAST 1h AGGREGATE count(*) INTERVAL 5m GROUP BY severity_text";
    case "trace":
      return "FETCH traces WHERE service_name = 'api-gateway' TIMERANGE LAST 1h LIMIT 500";
    default:
      return "Enter query...";
  }
});

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    emit("run");
  }
}

function handleTemplateSelect(templateId: string) {
  emit("select-template", templateId);
}
</script>

<template>
  <div
    class="query-row"
    :class="{ disabled: !enabled, 'has-error': !!error }"
    :style="{ borderColor: enabled ? color : 'var(--n-text-color-disabled)' }"
  >
    <!-- Row Header: Label badge + controls -->
    <div class="row-header">
      <div class="row-left">
        <n-tooltip>
          <template #trigger>
            <button
              class="label-badge"
              :style="{
                backgroundColor: enabled
                  ? color
                  : 'var(--n-text-color-disabled)',
                opacity: enabled ? 1 : 0.5,
              }"
              @click="$emit('toggle')"
            >
              {{ label }}
            </button>
          </template>
          {{ enabled ? "Click to disable" : "Click to enable" }}
        </n-tooltip>

        <n-select
          :value="queryType"
          :options="queryTypeOptions"
          size="tiny"
          style="width: 90px"
          @update:value="(v: SignalSource) => $emit('update:queryType', v)"
        />

        <n-button-group size="tiny">
          <n-button
            v-for="d in dialectOptions"
            :key="d.value"
            :type="dialect === d.value ? 'primary' : 'default'"
            :ghost="dialect !== d.value"
            @click="$emit('update:dialect', d.value)"
          >
            {{ d.label }}
          </n-button>
        </n-button-group>

        <n-dropdown
          v-if="templateOptions.length > 0"
          :options="templateOptions"
          trigger="click"
          @select="handleTemplateSelect"
        >
          <n-button quaternary size="tiny">
            <template #icon>
              <Icon icon="carbon:template" :width="14" />
            </template>
            Templates
          </n-button>
        </n-dropdown>
      </div>

      <div class="row-actions">
        <n-tooltip>
          <template #trigger>
            <n-button
              quaternary
              size="tiny"
              :loading="loading"
              @click="$emit('run')"
            >
              <template #icon>
                <Icon icon="carbon:play-filled-alt" :width="14" />
              </template>
            </n-button>
          </template>
          Run query (Ctrl+Enter)
        </n-tooltip>

        <n-tooltip>
          <template #trigger>
            <n-button quaternary size="tiny" @click="$emit('duplicate')">
              <template #icon>
                <Icon icon="carbon:copy" :width="14" />
              </template>
            </n-button>
          </template>
          Duplicate query
        </n-tooltip>

        <n-tooltip>
          <template #trigger>
            <n-button quaternary size="tiny" @click="$emit('remove')">
              <template #icon>
                <Icon icon="carbon:trash-can" :width="14" />
              </template>
            </n-button>
          </template>
          Remove query
        </n-tooltip>
      </div>
    </div>

    <!-- Query Textarea -->
    <div class="query-input-wrapper">
      <n-input
        :value="query"
        type="textarea"
        :placeholder="placeholderText"
        :rows="2"
        :disabled="!enabled"
        class="query-textarea"
        @update:value="(v: string) => $emit('update:query', v)"
        @keydown="handleKeydown"
      />
    </div>

    <!-- Row Footer: Legend + status -->
    <div class="row-footer">
      <div class="legend-input">
        <span class="footer-label">Legend:</span>
        <n-input
          :value="legend"
          size="tiny"
          :placeholder="legendFormat || 'auto ({{label}})'"
          style="width: 220px"
          :disabled="!enabled"
          @update:value="(v: string) => $emit('update:legend', v)"
        />
        <span v-if="seriesKey" class="series-key-hint">
          <Icon icon="carbon:tag" :width="10" :height="10" />
          {{ seriesKey }}
        </span>
      </div>

      <div class="status-indicator">
        <n-spin v-if="loading" :size="12" />
        <template v-else-if="error">
          <n-tooltip>
            <template #trigger>
              <Icon
                icon="carbon:warning-alt"
                :width="14"
                class="status-error"
              />
            </template>
            {{ error }}
          </n-tooltip>
        </template>
        <Icon
          v-else-if="query.trim()"
          icon="carbon:checkmark"
          :width="14"
          class="status-ok"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.query-row {
  padding: 8px 10px;
  background: var(--n-color);
  border: 1.5px solid;
  border-radius: 6px;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease;

  &.disabled {
    opacity: 0.5;
  }

  &.has-error {
    border-color: var(--n-error-color);
  }
}

.row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 6px;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.label-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.1);
  }
}

.query-input-wrapper {
  margin-bottom: 6px;

  .query-textarea {
    :deep(.n-input__textarea-el) {
      font-family:
        "SF Mono", Monaco, "Cascadia Code", "Courier New", monospace !important;
      font-size: 13px !important;
      line-height: 1.5 !important;
    }

    :deep(.n-input-wrapper) {
      background: var(--n-action-color);
    }
  }
}

.row-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.legend-input {
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-label {
  font-size: 11px;
  color: var(--n-text-color-3);
  white-space: nowrap;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.series-key-hint {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(59, 130, 246, 0.08);
  color: var(--n-text-color-3);
  font-family: "SF Mono", Monaco, monospace;
  white-space: nowrap;
}

.status-error {
  color: var(--n-error-color);
}

.status-ok {
  color: var(--n-success-color);
}
</style>
