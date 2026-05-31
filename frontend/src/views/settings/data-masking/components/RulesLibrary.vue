<template>
  <div class="rules-library">
    <div class="section">
      <!-- ── Single-row section header (matches API Keys / IAM design) ─────────── -->
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:template" class="section-icon" />
          <span>Rules Library</span>
          <n-tag :bordered="false" size="small" type="default">
            {{ filteredTemplates.length }} template{{
              filteredTemplates.length !== 1 ? "s" : ""
            }}
          </n-tag>
          <n-tag :bordered="false" size="small" type="info">
            {{ totalRuleCount }} rules
          </n-tag>
        </div>

        <div class="table-actions">
          <n-input
            v-model:value="searchQuery"
            placeholder="Search templates…"
            size="small"
            clearable
            class="search-input"
          >
            <template #prefix><Icon icon="carbon:search" /></template>
          </n-input>

          <n-select
            v-model:value="activeFramework"
            :options="frameworkOptions"
            :render-label="renderFrameworkLabel"
            :render-tag="renderFrameworkTag"
            placeholder="All frameworks"
            clearable
            size="small"
            style="width: 168px"
          />

          <n-button
            v-if="searchQuery || activeFramework"
            size="small"
            ghost
            @click="clearFilters"
          >
            <template #icon><Icon icon="carbon:reset" /></template>
            Reset
          </n-button>

          <n-button-group size="small">
            <n-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
            >
              <template #icon><Icon icon="carbon:grid" /></template>
              Grid
            </n-button>
            <n-button
              :type="viewMode === 'table' ? 'primary' : 'default'"
              @click="viewMode = 'table'"
            >
              <template #icon><Icon icon="carbon:list" /></template>
              Table
            </n-button>
            <n-button secondary @click="handleExportCSV">
              <template #icon><Icon icon="carbon:download" /></template>
              CSV
            </n-button>
            <n-button secondary @click="handleExportJSON">
              <template #icon><Icon icon="carbon:json-reference" /></template>
              JSON
            </n-button>
          </n-button-group>
        </div>
      </div>

      <!-- ── Grid View ─────────────────────────────────────────────────────────── -->
      <div v-if="viewMode === 'grid'" class="template-grid">
        <!-- Empty state -->
        <div v-if="filteredTemplates.length === 0" class="grid-empty">
          <Icon icon="carbon:policy" class="empty-icon" />
          <p>No templates found</p>
          <span>Adjust your search or framework filter.</span>
        </div>

        <!-- Cards -->
        <div v-for="tpl in pagedTemplates" :key="tpl.id" class="template-card">
          <!-- Top row: icon + menu -->
          <div class="tc-top">
            <div
              class="tc-icon-box"
              :style="{
                background: (getFrameworkMeta(tpl.framework)?.color ?? '#6366f1') + '20',
                color: getFrameworkMeta(tpl.framework)?.color ?? '#6366f1',
              }"
            >
              <Icon
                :icon="getFrameworkMeta(tpl.framework)?.icon ?? 'carbon:policy'"
                style="font-size: 20px"
              />
            </div>
            <n-dropdown
              trigger="click"
              :options="[
                { label: 'View Spec', key: 'view', disabled: !tpl.referenceUrl, icon: () => h(Icon, { icon: 'carbon:launch' }) },
                { type: 'divider', key: 'd1' },
                { label: 'Use Template', key: 'use', disabled: !canWrite, icon: () => h(Icon, { icon: 'carbon:add' }) },
              ]"
              @select="(key) => { if (key === 'view' && tpl.referenceUrl) openUrl(tpl.referenceUrl); if (key === 'use') emit('use-template', tpl); }"
            >
              <n-button text size="small" class="tc-menu-btn">
                <template #icon><Icon icon="carbon:overflow-menu-vertical" style="font-size:18px" /></template>
              </n-button>
            </n-dropdown>
          </div>

          <!-- Title + description -->
          <div class="tc-name">{{ tpl.name }}</div>
          <div class="tc-desc">{{ tpl.description }}</div>

          <!-- Meta row: rules count + default status -->
          <div class="tc-meta-row">
            <span class="tc-rules-count">
              <Icon icon="carbon:filter" style="font-size:12px;vertical-align:middle;margin-right:3px" />
              {{ tpl.rules.length }} rule{{ tpl.rules.length !== 1 ? 's' : '' }}
            </span>
            <n-tag :bordered="false" size="tiny" :type="tpl.defaultEnabled ? 'success' : 'warning'">
              {{ tpl.defaultEnabled ? 'Enabled' : 'Disabled' }}
            </n-tag>
          </div>

          <!-- Regulation tags -->
          <div class="tc-regs">
            <n-tag
              v-for="reg in tpl.regulations.slice(0, 3)"
              :key="reg"
              :bordered="false"
              size="tiny"
              :type="regTagType(reg)"
            >
              {{ reg }}
            </n-tag>
            <n-tag
              v-if="tpl.regulations.length > 3"
              :bordered="false"
              size="tiny"
              type="default"
            >
              +{{ tpl.regulations.length - 3 }}
            </n-tag>
            <span v-if="tpl.regulations.length === 0" class="tc-no-regs">No regulations</span>
          </div>
        </div>
      </div>

      <!-- Grid pagination -->
      <div
        v-if="viewMode === 'grid' && filteredTemplates.length > gridPageSize"
        class="grid-pagination"
      >
        <n-pagination
          v-model:page="gridPage"
          :page-count="gridPageCount"
          :page-slot="5"
          size="small"
          show-quick-jumper
        />
      </div>

      <!-- ── Table View ─────────────────────────────────────────────────────────── -->
      <div v-if="viewMode === 'table'" class="table-content">
        <DataTable
          :columns="columns"
          :data="filteredTemplates"
          row-key="id"
          :pagination="tablePagination"
          :striped="true"
          :single-line="false"
          :scroll-x="1200"
          size="small"
          empty-icon="carbon:policy"
          empty-title="No templates found"
          empty-description="Adjust your search or framework filter to find templates."
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from "vue";
import {
  NInput,
  NSelect,
  NButton,
  NButtonGroup,
  NTag,
  NSpace,
  NPagination,
  NDropdown,
} from "naive-ui";
import type { DataTableColumn } from "naive-ui";
import { Icon } from "@iconify/vue";
import DataTable from "@/components/common/DataTable.vue";
import RuleExpandRow from "./RuleExpandRow.vue";
import { usePagination } from "@/composables/usePagination";
import { exportToCSV, exportToJSON, getExportFilename } from "@/utils";
import {
  getAllTemplates,
  searchTemplates,
} from "@/utils/telemetry/pii-masking/rules-library";
import type { MaskingPolicyTemplate } from "@/utils/telemetry/pii-masking/rules-library";
import {
  MaskingFramework,
  FrameworkDisplayConfigs,
} from "@/utils/telemetry/pii-masking/rules-library";

const props = defineProps<{ canWrite: boolean }>();
const emit = defineEmits<{
  "use-template": [template: MaskingPolicyTemplate];
}>();

// ─── View mode ─────────────────────────────────────────────────────────────────
const viewMode = ref<"table" | "grid">("table");

// ─── Pagination — table ─────────────────────────────────────────────────────────
const { paginationConfig } = usePagination(10);
const tablePagination = computed(() => ({
  ...paginationConfig.value,
  itemCount: filteredTemplates.value.length,
}));

// ─── Pagination — grid ─────────────────────────────────────────────────────────
const gridPage = ref(1);
const gridPageSize = 12;

const gridPageCount = computed(() =>
  Math.max(1, Math.ceil(filteredTemplates.value.length / gridPageSize)),
);
const pagedTemplates = computed(() => {
  const start = (gridPage.value - 1) * gridPageSize;
  return filteredTemplates.value.slice(start, start + gridPageSize);
});

// ─── State ─────────────────────────────────────────────────────────────────────
const searchQuery = ref("");
const activeFramework = ref<MaskingFramework | null>(null);

// ─── Framework select options ──────────────────────────────────────────────────
const frameworkOptions = FrameworkDisplayConfigs.map((f) => ({
  label: f.name,
  value: f.id,
}));

function openUrl(url: string) {
  window.open(url, "_blank");
}

function renderFrameworkLabel(option: { label: string; value: string }) {
  const meta = getFrameworkMeta(option.value as MaskingFramework);
  return h("div", { style: "display:inline-flex;align-items:center;gap:6px;line-height:1" }, [
    h(Icon, { icon: meta?.icon ?? "carbon:policy", style: `color:${meta?.color ?? "#6366f1"};font-size:14px;flex-shrink:0` }),
    h("span", option.label),
  ]);
}

function renderFrameworkTag({ option, handleClose }: { option: { label?: string | ((option: any, selected: boolean) => any); value?: string | number }; handleClose: () => void }) {
  const labelStr = typeof option.label === "string" ? option.label : String(option.value ?? "");
  const meta = getFrameworkMeta(option.value as MaskingFramework);
  return h("div", {
    style: "display:inline-flex;align-items:center;gap:5px;padding:0 4px;max-width:140px",
    onClick: (e: MouseEvent) => e.stopPropagation(),
  }, [
    h(Icon, { icon: meta?.icon ?? "carbon:policy", style: `color:${meta?.color ?? "#6366f1"};font-size:13px;flex-shrink:0` }),
    h("span", { style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, labelStr),
  ]);
}

// ─── Filtered templates ────────────────────────────────────────────────────────
const filteredTemplates = computed<MaskingPolicyTemplate[]>(() => {
  let list = searchQuery.value
    ? searchTemplates(searchQuery.value)
    : getAllTemplates();
  if (activeFramework.value)
    list = list.filter((t) => t.framework === activeFramework.value);
  return list;
});

const totalRuleCount = computed(() =>
  filteredTemplates.value.reduce((s, t) => s + t.rules.length, 0),
);

// ─── Export ────────────────────────────────────────────────────────────────────
function handleExportCSV() {
  if (!filteredTemplates.value.length) return;
  const rows = filteredTemplates.value.map((t) => ({
    name: t.name,
    framework: t.framework,
    rules: t.rules.length,
    defaultEnabled: t.defaultEnabled,
    regulations: t.regulations.join("; "),
  }));
  exportToCSV(rows, getExportFilename("pii-masking-rules-library"), [
    { key: "name", title: "Template" },
    { key: "framework", title: "Framework" },
    { key: "rules", title: "Rules" },
    { key: "defaultEnabled", title: "Default Enabled" },
    { key: "regulations", title: "Regulations" },
  ]);
}

function handleExportJSON() {
  if (!filteredTemplates.value.length) return;
  exportToJSON(
    filteredTemplates.value,
    getExportFilename("pii-masking-rules-library"),
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getFrameworkMeta(id: MaskingFramework) {
  return FrameworkDisplayConfigs.find((f) => f.id === id);
}

// Deterministic tag type per regulation name (cycles through palette)
const REG_TAG_TYPES = [
  "info",
  "success",
  "warning",
  "error",
  "default",
] as const;
type TagType = (typeof REG_TAG_TYPES)[number];
function regTagType(reg: string): TagType {
  let h = 0;
  for (const c of reg) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return REG_TAG_TYPES[h % REG_TAG_TYPES.length];
}

// ─── Expand render ─────────────────────────────────────────────────────────────
function renderExpand(row: MaskingPolicyTemplate) {
  return h(RuleExpandRow, { rules: row.rules });
}

// ─── Table columns ─────────────────────────────────────────────────────────────
const columns = computed<DataTableColumn<MaskingPolicyTemplate>[]>(() => [
  { type: "expand", expandable: () => true, renderExpand },

  {
    key: "name",
    title: "Template",
    minWidth: 280,
    ellipsis: false,
    sorter: (a, b) => a.name.localeCompare(b.name),
    defaultSortOrder: "ascend",
    render(row) {
      const meta = getFrameworkMeta(row.framework)
      return h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "2px 0" } }, [
        h("div", {
          style: {
            flexShrink: 0,
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: (meta?.color ?? "#6366f1") + "15",
            color: meta?.color ?? "#6366f1",
          },
        }, [
          h(Icon, { icon: meta?.icon ?? "carbon:policy", style: "font-size:20px" }),
        ]),
        h("div", { style: { display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, whiteSpace: "normal", wordBreak: "break-word" } }, [
          h("span", { style: { fontSize: "14px", fontWeight: 500 } }, row.name),
          h("span", { style: { fontSize: "11px", fontWeight: 400, opacity: 0.55 } }, row.description ?? ""),
        ]),
      ]);
    },
  },

  {
    key: "framework",
    title: "Framework",
    width: 150,
    align: "center",
    sorter: (a, b) => a.framework.localeCompare(b.framework),
    render(row) {
      const meta = getFrameworkMeta(row.framework);
      return h("div", {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "2px 8px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 600,
          whiteSpace: "nowrap",
          background: (meta?.color ?? "#6366f1") + "18",
          color: meta?.color ?? "#6366f1",
        },
      }, [
        h(Icon, { icon: meta?.icon ?? "carbon:policy", style: "font-size:13px;flex-shrink:0;vertical-align:middle" }),
        h("span", meta?.name ?? row.framework),
      ]);
    },
  },

  {
    key: "rulesCount",
    title: "Rules",
    width: 72,
    align: "center",
    sorter: (a, b) => a.rules.length - b.rules.length,
    render(row) {
      return h(
        NTag,
        { bordered: false, size: "small", type: "info" },
        { default: () => String(row.rules.length) },
      );
    },
  },

  {
    key: "defaultEnabled",
    title: "Default",
    width: 100,
    align: "center",
    render(row) {
      return h(
        NTag,
        {
          bordered: false,
          size: "small",
          type: row.defaultEnabled ? "success" : "warning",
        },
        { default: () => (row.defaultEnabled ? "Enabled" : "Disabled") },
      );
    },
  },

  {
    key: "regulations",
    title: "Regulations",
    minWidth: 220,
    ellipsis: false,
    render(row) {
      const shown = row.regulations.slice(0, 3);
      const extras = row.regulations.length - 3;
      return h(
        NSpace,
        { size: [4, 4], wrap: true },
        {
          default: () => [
            ...shown.map((r: string) =>
              h(
                NTag,
                { bordered: false, size: "tiny", key: r, type: regTagType(r) },
                { default: () => r },
              ),
            ),
            extras > 0
              ? h(
                  NTag,
                  { bordered: false, size: "tiny", type: "default" },
                  { default: () => `+${extras}` },
                )
              : null,
          ],
        },
      );
    },
  },

  {
    key: "actions",
    title: "Actions",
    width: 80,
    align: "center",
    render(row) {
      const options = [
        {
          label: "View Spec",
          key: "view",
          disabled: !row.referenceUrl,
          icon: () => h(Icon, { icon: "carbon:launch", style: "font-size:14px" }),
        },
        { type: "divider", key: "d1" },
        {
          label: "Use Template",
          key: "use",
          disabled: !props.canWrite,
          icon: () => h(Icon, { icon: "carbon:add", style: "font-size:14px" }),
        },
      ];
      return h(NDropdown, {
        options,
        trigger: "click",
        onSelect: (key: string) => {
          if (key === "view" && row.referenceUrl)
            window.open(row.referenceUrl, "_blank");
          if (key === "use") emit("use-template", row);
        },
      }, {
        default: () => h(NButton, { text: true, size: "small" }, {
          icon: () => h(Icon, { icon: "carbon:overflow-menu-vertical", style: "font-size:18px" }),
        }),
      });
    },
  },
]);

function clearFilters() {
  searchQuery.value = "";
  activeFramework.value = null;
  gridPage.value = 1;
}
</script>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";

.rules-library {
  display: flex;
  flex-direction: column;
}

/* ── Grid View ── */
.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;

  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px) { grid-template-columns: 1fr; padding: 12px; gap: 12px; }
}

.template-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: var(--n-color-modal);
  border: 2px solid rgba(128, 128, 128, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: var(--n-primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}

/* top row: icon + menu */
.tc-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;
}

.tc-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tc-menu-btn {
  opacity: 0.5;
  transition: opacity 0.15s;
  .template-card:hover & { opacity: 1; }
}

.tc-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary-color, #6366f1);
  line-height: 1.3;
  word-break: break-word;
  white-space: normal;
}

.tc-desc {
  font-size: 12px;
  color: var(--text-color-3);
  line-height: 1.5;
  word-break: break-word;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.tc-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.tc-rules-count {
  font-size: 12px;
  color: var(--text-color-3);
}

.tc-regs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.tc-no-regs {
  font-size: 11px;
  color: var(--text-color-3);
  font-style: italic;
}

.grid-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px 24px;
  color: var(--text-color-3);

  .empty-icon {
    font-size: 40px;
    margin-bottom: 10px;
    opacity: 0.4;
  }
  p {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px;
  }
  span {
    font-size: 12px;
  }
}

.grid-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--n-border-color);
}

/* ── Template cell ── */
.cell-template {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 0;
}

.tpl-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tpl-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.tpl-name {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  white-space: normal;
  word-break: break-word;
}

.tpl-desc {
  font-size: 11px;
  opacity: 0.55;
  line-height: 1.4;
  white-space: normal;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Framework badge ── */
.fw-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}


/* expand panel styles are inline in renderExpand (h() nodes rendered by
   Naive UI don't receive the scoped data-v attribute, so class-based
   scoped rules cannot reach them) */
</style>
