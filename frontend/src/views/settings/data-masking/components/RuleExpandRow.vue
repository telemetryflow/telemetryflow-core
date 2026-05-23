<template>
  <div class="rule-expand">
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:list-checked" class="section-icon" />
          <span>Rules</span>
          <n-tag :bordered="false" size="small" type="info">
            {{ rules.length }} {{ rules.length === 1 ? 'rule' : 'rules' }}
          </n-tag>
        </div>
      </div>

      <div class="table-content">
        <DataTable
          :columns="columns"
          :data="rules"
          row-key="id"
          :single-line="false"
          :bordered="false"
          :bottom-bordered="false"
          size="small"
          :pagination="pagination"
          empty-icon="carbon:list-checked"
          empty-title="No rules"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from "vue";
import { NTag } from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/common/DataTable.vue";
import { usePagination } from "@/composables/usePagination";
import { MatchType } from "@/types/data-masking";
import type { MaskingRule } from "@/types/data-masking";

const props = defineProps<{ rules: MaskingRule[] }>();

const { paginationConfig } = usePagination(5);
const pagination = computed(() => ({
  ...paginationConfig.value,
  itemCount: props.rules.length,
  showSizePicker: false,
}));

const TARGET_LABELS: Record<string, string> = {
  all: "All",
  body: "Body",
  resource_attributes: "Resource Attrs",
  log_attributes: "Log Attrs",
  span_attributes: "Span Attrs",
  metadata: "Metadata",
};

const MASK_ICONS: Record<string, string> = {
  REDACT: "carbon:edit-off",
  HASH: "carbon:password",
  REPLACE: "carbon:renew",
  TRUNCATE: "carbon:cut",
};

const MASK_TYPES: Record<string, "default" | "error" | "warning" | "info" | "success"> = {
  REDACT: "error",
  HASH: "info",
  REPLACE: "warning",
  TRUNCATE: "default",
};

const columns = computed<DataTableColumns<MaskingRule>>(() => [
  {
    key: "priority",
    title: "#",
    width: 52,
    align: "center",
    render: (row, i) =>
      h("span", { class: "priority-badge" }, String(row.priority ?? i + 1)),
  },
  {
    key: "name",
    title: "Rule Name",
    minWidth: 200,
    ellipsis: false,
    render: (row) =>
      h("div", { style: { display: "flex", flexDirection: "column", gap: "2px", whiteSpace: "normal", wordBreak: "break-word" } }, [
        h("span", { style: { fontSize: "14px", fontWeight: 600 } }, row.name),
        row.description ? h("span", { style: { fontSize: "11px", fontWeight: 400, opacity: 0.55 } }, row.description) : null,
      ]),
  },
  {
    key: "targetField",
    title: "Target",
    width: 120,
    align: "center",
    render: (row) =>
      h(NTag, { bordered: false, size: "tiny" }, {
        default: () => h("span", { style: { fontWeight: 600 } }, TARGET_LABELS[row.targetField] ?? row.targetField),
      }),
  },
  {
    key: "matchType",
    title: "Match",
    width: 90,
    align: "center",
    render: (row) =>
      h(NTag, { bordered: false, size: "tiny", type: "info" }, {
        default: () => h("span", { style: { fontWeight: 600 } }, row.matchType.toUpperCase()),
      }),
  },
  {
    key: "pattern",
    title: "Pattern",
    minWidth: 180,
    ellipsis: false,
    render: (row) =>
      h("code", { class: "pattern-code" },
        row.matchType === MatchType.BUILTIN
          ? (row.builtinPattern ?? "—")
          : (row.customPattern ?? "—"),
      ),
  },
  {
    key: "maskType",
    title: "Mask Type",
    width: 120,
    align: "center",
    render: (row) =>
      h(NTag, {
        bordered: false,
        size: "tiny",
        type: MASK_TYPES[row.maskType] ?? "default",
      }, {
        default: () => h("span", { style: { fontWeight: 600 } }, row.maskType),
        icon: () => h(Icon, { icon: MASK_ICONS[row.maskType] ?? "carbon:filter", style: "font-size:11px" }),
      }),
  },
  {
    key: "enabled",
    title: "Status",
    width: 100,
    align: "center",
    render: (row) =>
      h(NTag, {
        bordered: false,
        size: "tiny",
        type: row.enabled ? "success" : "default",
      }, { default: () => h("span", { style: { fontWeight: 600 } }, row.enabled ? "On" : "Off") }),
  },
]);
</script>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";

// ── Outer wrapper ───────────────────────────────────────────────────────────
.rule-expand {
  @include k8s-theme-vars;
  padding: 12px 16px 14px;
  background: var(--n-color-modal);
  border-top: 1px solid var(--k8s-border-color);
}

// ── Constrain the DataTable to match TFO standard ───────────────────────────
.table-content {
  // #-column is only 52px — override the DataTable first-col 240px min-width
  :deep(.n-data-table-th:first-child),
  :deep(.n-data-table-td:first-child) {
    min-width: 52px !important;
    white-space: nowrap !important;
    word-break: normal !important;
    overflow: hidden !important;

    * {
      white-space: nowrap !important;
      word-break: normal !important;
      overflow: hidden !important;
      text-overflow: unset !important;
    }
  }

  // Rule Name (second col) — allow word wrap
  :deep(.n-data-table-th:nth-child(2)),
  :deep(.n-data-table-td:nth-child(2)) {
    white-space: normal !important;
    word-break: break-word !important;
    overflow: visible !important;
    min-width: 160px !important;
  }

    // Compact rows for sub-table context
  :deep(.n-data-table-th) {
    padding: 8px 10px;
    font-size: 0.7rem;
  }

  :deep(.n-data-table-td) {
    padding: 7px 10px;
    font-size: 0.8rem;
  }

  // Suppress parent-row highlight — sub-table rows have no expand triggers
  :deep(.n-data-table-tr:has(.n-data-table-expand-trigger) > .n-data-table-td) {
    background: transparent !important;
    font-weight: 400 !important;
  }
}

// ── Cell renderers ───────────────────────────────────────────────────────────
.priority-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--k8s-table-label-bg);
  color: var(--k8s-table-label-text);
  font-size: 10px;
  font-weight: 600;
  border: 1px solid var(--k8s-border-color);
}

.rule-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rule-name {
  font-size: 14px;
  font-weight: 600;
}

.rule-desc {
  font-size: 11px;
  opacity: 0.55;
  line-height: 1.3;
  white-space: normal;
}

.pattern-code {
  display: inline-block;
  white-space: nowrap;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  padding: 2px 6px;
  background: var(--k8s-table-label-bg);
  border: 1px solid var(--k8s-border-color);
  border-radius: 4px;
  color: var(--n-text-color);
}
</style>
