<template>
  <div class="data-masking-view">
    <!-- ─── Page Header ────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="carbon:locked" class="title-icon" />
          PII Data Masking
        </h1>
        <span class="page-subtitle">
          Define policies to automatically redact, hash, or replace sensitive
          data in log records at ingestion time — before data reaches
          ClickHouse.
        </span>
      </div>
      <div class="header-right">
        <n-button
          v-if="canWrite"
          type="primary"
          :disabled="store.loading"
          @click="openCreateModal"
        >
          <template #icon><Icon icon="carbon:add" /></template>
          New Policy
        </n-button>
      </div>
    </div>

    <!-- ─── Stat Panels ───────────────────────────────────────────────── -->
    <div class="stats-grid">
      <StatPanel
        v-for="(config, i) in statCards"
        :key="`stat-${i}`"
        size="small"
        :show-compact="true"
        v-bind="config"
      />
    </div>

    <!-- ─── Error ─────────────────────────────────────────────────────── -->
    <n-alert
      v-if="store.error"
      type="error"
      closable
      class="error-alert"
      @close="store.clearError()"
    >
      {{ store.error }}
    </n-alert>

    <!-- ─── Tabs ──────────────────────────────────────────────────────── -->
    <n-tabs v-model:value="activeTab" type="segment" animated class="main-tabs">
      <n-tab-pane name="my-policies">
        <template #tab>
          <span class="tab-label">
            <Icon icon="carbon:policy" />
            My Policies
          </span>
        </template>
      </n-tab-pane>
      <n-tab-pane name="rules-library">
        <template #tab>
          <span class="tab-label">
            <Icon icon="carbon:template" />
            Rules Library
            <n-tag :bordered="false" size="tiny" type="info" class="tab-badge">{{ totalTemplateCount }}</n-tag>
          </span>
        </template>
      </n-tab-pane>
    </n-tabs>

    <!-- ─── Rules Library panel ──────────────────────────────────────── -->
    <div v-if="activeTab === 'rules-library'" class="section">
      <RulesLibrary :can-write="canWrite" @use-template="handleUseTemplate" />
    </div>

    <!-- ─── Section Header + Filters ─────────────────────────────────── -->
    <div v-if="activeTab === 'my-policies'" class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:policy" class="section-icon" />
          <span>Policy List</span>
          <n-tag :bordered="false" size="small" type="info">
            {{ store.total }} {{ store.total === 1 ? "policy" : "policies" }}
          </n-tag>
        </div>

        <div class="table-actions">
          <n-input
            v-model:value="searchQuery"
            placeholder="Search policies..."
            size="small"
            clearable
            class="search-input"
            @input="debouncedSearch"
            @keyup.enter="handleFilterChange"
          >
            <template #prefix><Icon icon="carbon:search" /></template>
          </n-input>

          <n-select
            v-model:value="filterEnabled"
            :options="enabledOptions"
            placeholder="All statuses"
            size="small"
            clearable
            style="width: 140px"
            @update:value="handleFilterChange"
          />

          <n-button size="small" ghost @click="handleResetFilters">
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
            <n-button secondary @click="exportCSV">
              <template #icon>
                <Icon icon="carbon:document-download" />
              </template>
              CSV
            </n-button>
            <n-button secondary @click="exportJSON">
              <template #icon><Icon icon="carbon:json" /></template>
              JSON
            </n-button>
          </n-button-group>
        </div>
      </div>

      <!-- ── Grid View ─────────────────────────────────────────────────── -->
      <n-spin :show="store.loading">
        <template v-if="viewMode === 'grid'">
          <div
            v-if="store.policies.length === 0 && !store.loading"
            class="empty-state"
          >
            <Icon icon="carbon:locked" width="64" style="opacity: 0.3" />
            <h3>No masking policies yet</h3>
            <p>
              Create your first PII masking policy to automatically protect
              sensitive data in logs.
            </p>
            <n-button v-if="canWrite" type="primary" @click="openCreateModal">
              Create Policy
            </n-button>
          </div>

          <div v-else class="policy-grid">
            <PolicyCard
              v-for="policy in store.policies"
              :key="policy.id"
              :policy="policy"
              :saving="store.saving"
              :can-write="canWrite"
              :can-delete="canDelete"
              :can-manage="canManage"
              @toggle="handleToggle"
              @edit="openEditModal"
              @delete="handleDelete"
              @test="openTestPanel"
            />
          </div>
        </template>

        <!-- ── Table View ───────────────────────────────────────────────── -->
        <template v-if="viewMode === 'table'">
          <div class="section-content table-content">
            <DataTable
              :columns="tableColumns"
              :data="store.policies"
              :loading="store.loading"
              :pagination="tablePagination"
              row-key="id"
              :bordered="false"
              :single-line="false"
              size="small"
              :scroll-x="900"
            />
          </div>
        </template>

        <!-- Pagination (grid view only) -->
        <div
          v-if="viewMode === 'grid' && store.totalPages > 1"
          class="pagination-bar"
        >
          <n-pagination
            v-model:page="store.page"
            :page-count="store.totalPages"
            :page-size="store.pageSize"
            :item-count="store.total"
            show-quick-jumper
            @update:page="handlePageChange"
          />
        </div>
      </n-spin>
    </div>

    <!-- ─── Create / Edit Modal ──────────────────────────────────────── -->
    <PolicyFormModal
      v-if="showModal"
      :policy="editingPolicy"
      :template="templateToApply"
      :builtin-patterns="store.builtinPatterns"
      :saving="store.saving"
      @submit="handleModalSubmit"
      @close="closeModal"
      @test-rule="handleTestRuleFromModal"
    />

    <!-- ─── Test Panel Drawer ────────────────────────────────────────── -->
    <n-drawer v-model:show="showTestPanel" width="520" placement="right">
      <n-drawer-content :native-scrollbar="false">
        <template #header>
          <div class="drawer-header">
            <Icon icon="carbon:play" class="drawer-header-icon" />
            <div class="drawer-header-text">
              <span class="drawer-header-title">Test Rule</span>
              <span v-if="testingPolicy" class="drawer-header-subtitle">{{ testingPolicy.name }}</span>
            </div>
          </div>
        </template>

        <TestRulePanel
          v-if="testingPolicy"
          :policy="testingPolicy"
          :builtin-patterns="store.builtinPatterns"
          :testing="store.testing"
          :do-test="store.testRule"
        />

        <template #footer>
          <div class="drawer-footer">
            <n-button @click="showTestPanel = false">
              <template #icon><Icon icon="carbon:close" /></template>
              Close
            </n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted, defineAsyncComponent } from "vue";
import {
  NButton,
  NInput,
  NSelect,
  NAlert,
  NSpin,
  NPagination,
  NDrawer,
  NDrawerContent,
  NTag,
  NTime,
  NButtonGroup,
  NDropdown,
  NText,
  NTabs,
  NTabPane,
  useMessage,
  useDialog,
} from "naive-ui";
import type { DataTableColumns, DropdownOption } from "naive-ui";
import { Icon } from "@iconify/vue";
import { StatPanel } from "@/components/charts";
import { useStatPanelsFromRegistry } from "@/composables/useStatPanelsFromRegistry";
import { useDataMaskingStore } from "@/store/data-masking";
import { usePermission } from "@/composables/usePermission";
import { exportToCSV, exportToJSON, getExportFilename } from "@/utils/export";
import type { MaskingPolicy, TestRuleRequest } from "@/types/data-masking";
import { getTotalTemplateCount as _getTotalTemplateCount } from "@/utils/telemetry/pii-masking/rules-library";
import type { MaskingPolicyTemplate } from "@/utils/telemetry/pii-masking/rules-library";
import DataTable from "@/components/common/DataTable.vue";

const PolicyCard = defineAsyncComponent(
  () => import("./components/PolicyCard.vue"),
);
const PolicyFormModal = defineAsyncComponent(
  () => import("./components/PolicyFormModal.vue"),
);
const TestRulePanel = defineAsyncComponent(
  () => import("./components/TestRulePanel.vue"),
);
const RulesLibrary = defineAsyncComponent(
  () => import("./components/RulesLibrary.vue"),
);

const store = useDataMaskingStore();
const message = useMessage();
const dialog = useDialog();
const { can } = usePermission();

// ─── Permissions ─────────────────────────────────────────────────────────────
const canWrite = computed(() => can("data-masking:write"));
const canDelete = computed(() => can("data-masking:delete"));
const canManage = computed(() => can("data-masking:manage"));

// ─── Stat panels from registry ───────────────────────────────────────────────
const statCards = useStatPanelsFromRegistry(
  ["DMS20001", "DMS20002", "DMS20003", "DMS20004"],
  {
    DMS20001: computed(() => store.total),
    DMS20002: computed(() => store.enabledPolicies.length),
    DMS20003: computed(() => store.disabledPolicies.length),
    DMS20004: computed(() => store.totalActiveRules),
  },
);

// ─── Active tab ──────────────────────────────────────────────────────────────
const activeTab = ref<"my-policies" | "rules-library">("my-policies");
const totalTemplateCount = _getTotalTemplateCount();

// ─── View mode ───────────────────────────────────────────────────────────────
const viewMode = ref<"grid" | "table">("grid");

// ─── Filters ─────────────────────────────────────────────────────────────────
const searchQuery = ref("");
const filterEnabled = ref<string | null>(null);

const enabledOptions = [
  { label: "Active", value: "true" },
  { label: "Disabled", value: "false" },
];

// ─── Modal state ─────────────────────────────────────────────────────────────
const showModal = ref(false);
const editingPolicy = ref<MaskingPolicy | null>(null);
const templateToApply = ref<MaskingPolicyTemplate | null>(null);

// ─── Test panel state ─────────────────────────────────────────────────────────
const showTestPanel = ref(false);
const testingPolicy = ref<MaskingPolicy | null>(null);

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([store.fetchPolicies(), store.fetchBuiltinPatterns()]);
});

// ─── Handlers ────────────────────────────────────────────────────────────────
let searchTimeout: ReturnType<typeof setTimeout>;
function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(handleFilterChange, 350);
}

function handleFilterChange() {
  store.fetchPolicies({
    search: searchQuery.value || undefined,
    enabled:
      filterEnabled.value !== null ? filterEnabled.value === "true" : undefined,
  });
}

function handleResetFilters() {
  searchQuery.value = "";
  filterEnabled.value = null;
  store.fetchPolicies();
}

function handlePageChange(p: number) {
  store.setPage(p);
  store.fetchPolicies({
    search: searchQuery.value || undefined,
    enabled:
      filterEnabled.value !== null ? filterEnabled.value === "true" : undefined,
  });
}

function openCreateModal() {
  editingPolicy.value = null;
  showModal.value = true;
}

function handleUseTemplate(template: MaskingPolicyTemplate) {
  // Pre-populate the create modal with template rules; switch to My Policies tab
  editingPolicy.value = null;
  showModal.value = true;
  activeTab.value = "my-policies";
  // The PolicyFormModal receives the initial data via the policy prop being null.
  // We pass the template via a dedicated ref that PolicyFormModal reads.
  templateToApply.value = template;
}

function openEditModal(policy: MaskingPolicy) {
  editingPolicy.value = policy;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingPolicy.value = null;
  templateToApply.value = null;
}

async function handleModalSubmit(payload: any) {
  let result: MaskingPolicy | null;
  if (editingPolicy.value) {
    result = await store.updatePolicy(editingPolicy.value.id, payload);
    if (result) message.success("Policy updated");
  } else {
    result = await store.createPolicy(payload);
    if (result) message.success("Policy created");
  }
  if (result) closeModal();
}

async function handleToggle(id: string, enabled: boolean) {
  const ok = await store.togglePolicy(id, enabled);
  if (ok) message.success(enabled ? "Policy enabled" : "Policy disabled");
  else message.error(store.error ?? "Failed to toggle policy");
}

function handleDelete(policy: MaskingPolicy) {
  dialog.warning({
    title: "Delete Policy",
    content: `Delete "${policy.name}"? This cannot be undone and will immediately stop masking for rules in this policy.`,
    positiveText: "Delete",
    negativeText: "Cancel",
    onPositiveClick: async () => {
      const ok = await store.deletePolicy(policy.id);
      if (ok) message.success("Policy deleted");
      else message.error(store.error ?? "Failed to delete policy");
    },
  });
}

function openTestPanel(policy: MaskingPolicy) {
  testingPolicy.value = policy;
  showTestPanel.value = true;
}

async function handleTestRuleFromModal(payload: TestRuleRequest) {
  return store.testRule(payload);
}

// ─── Export ──────────────────────────────────────────────────────────────────
function exportCSV() {
  const data = store.policies.map((p) => ({
    name: p.name,
    description: p.description ?? "",
    status: p.enabled ? "Active" : "Disabled",
    total_rules: p.ruleCount,
    active_rules: p.activeRuleCount,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }));
  exportToCSV(data, getExportFilename("data-masking"));
}

function exportJSON() {
  exportToJSON(store.policies, getExportFilename("data-masking"));
}

// ─── Table columns ────────────────────────────────────────────────────────────
function getRowActions(row: MaskingPolicy): DropdownOption[] {
  const actions: DropdownOption[] = [];
  if (canWrite.value) {
    actions.push({
      label: "Edit",
      key: "edit",
      icon: () => h(Icon, { icon: "carbon:edit" }),
    });
  }
  actions.push({
    label: "Test Rules",
    key: "test",
    icon: () => h(Icon, { icon: "carbon:play" }),
  });
  if (canManage.value) {
    actions.push({
      label: row.enabled ? "Disable" : "Enable",
      key: row.enabled ? "disable" : "enable",
      icon: () =>
        h(Icon, { icon: row.enabled ? "carbon:pause" : "carbon:play-filled" }),
    });
  }
  if (canDelete.value) {
    actions.push({ type: "divider", key: "d1" });
    actions.push({
      label: "Delete",
      key: "delete",
      icon: () => h(Icon, { icon: "carbon:trash-can" }),
    });
  }
  return actions;
}

function handleRowAction(key: string, row: MaskingPolicy) {
  if (key === "edit") openEditModal(row);
  if (key === "test") openTestPanel(row);
  if (key === "enable") handleToggle(row.id, true);
  if (key === "disable") handleToggle(row.id, false);
  if (key === "delete") handleDelete(row);
}

const tableColumns = computed<DataTableColumns<MaskingPolicy>>(() => [
  {
    title: "Name",
    key: "name",
    minWidth: 240,
    sorter: (a, b) => a.name.localeCompare(b.name),
    render: (row) =>
      h("div", {}, [
        h(
          NText,
          { strong: true, style: "display:block;font-size:14px" },
          { default: () => row.name },
        ),
        row.description
          ? h(
              NText,
              {
                depth: 3,
                style:
                  "display:block;font-size:12px;margin-top:2px;white-space:normal;word-break:break-word",
              },
              { default: () => row.description },
            )
          : null,
      ]),
  },
  {
    title: "Status",
    key: "enabled",
    width: 120,
    align: "center",
    sorter: (a, b) => Number(b.enabled) - Number(a.enabled),
    render: (row) =>
      h(
        NTag,
        {
          type: row.enabled ? "success" : "warning",
          size: "small",
          bordered: false,
        },
        { default: () => (row.enabled ? "Active" : "Disabled") },
      ),
  },
  {
    title: "Total Rules",
    key: "ruleCount",
    width: 120,
    align: "center",
    sorter: (a, b) => a.ruleCount - b.ruleCount,
  },
  {
    title: "Active Rules",
    key: "activeRuleCount",
    width: 115,
    align: "center",
    sorter: (a, b) => a.activeRuleCount - b.activeRuleCount,
    render: (row) =>
      h(
        NTag,
        {
          type: row.activeRuleCount > 0 ? "info" : "default",
          size: "small",
          bordered: false,
        },
        { default: () => String(row.activeRuleCount) },
      ),
  },
  {
    title: "Created",
    key: "createdAt",
    width: 200,
    align: "center",
    sorter: (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    render: (row) =>
      h(NTime, { time: new Date(row.createdAt), format: "yyyy-MM-dd HH:mm:ss" }),
  },
  {
    title: "Actions",
    key: "actions",
    width: 120,
    align: "center",
    fixed: "right",
    render: (row) =>
      h(
        NDropdown,
        {
          trigger: "click",
          options: getRowActions(row),
          onSelect: (key: string) => handleRowAction(key, row),
        },
        {
          default: () =>
            h(
              NButton,
              { size: "small", quaternary: true },
              {
                icon: () => h(Icon, { icon: "carbon:overflow-menu-vertical" }),
              },
            ),
        },
      ),
  },
]);

const tablePagination = computed(() => ({
  page: store.page,
  pageSize: store.pageSize,
  itemCount: store.total,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100, 200, 500],
  onChange: (page: number) => handlePageChange(page),
  onUpdatePageSize: (size: number) => {
    store.pageSize = size;
    store.setPage(1);
    store.fetchPolicies();
  },
}));
</script>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";

.data-masking-view {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.title-icon {
  font-size: 28px;
  color: var(--primary-color);
}

.page-subtitle {
  color: var(--text-color-3);
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ── Stat panels grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 540px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* ── Error ── */
.error-alert {
  margin-bottom: 16px;
}

.search-input {
  width: 220px;
}

/* ── Table content ── */
.section-content.table-content {
  :deep(.n-data-table-th) {
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    padding: 10px 14px;
  }

  :deep(.n-data-table-td) {
    padding: 10px 14px;
    font-size: 0.875rem;
    vertical-align: top;
  }

  // Name column: allow word-wrap for description
  :deep(.n-data-table-th:first-child),
  :deep(.n-data-table-td:first-child) {
    white-space: normal !important;
    word-break: break-word !important;
    overflow: visible !important;
  }
}

/* ── Policy grid (grid view) ── */
.policy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 16px;
  padding: 16px;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 16px;
  text-align: center;
  opacity: 0.7;

  h3 {
    margin: 0;
    font-size: 18px;
  }

  p {
    margin: 0;
    max-width: 400px;
    font-size: 14px;
    opacity: 0.75;
  }
}

/* ── Pagination ── */
.pagination-bar {
  display: flex;
  justify-content: center;
  padding: 16px;
  border-top: 1px solid var(--n-border-color);
}

@media (max-width: 1024px) {
  .data-masking-view {
    padding: 20px 16px;
  }
  .page-title {
    font-size: 22px;
  }
  .title-icon {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .data-masking-view {
    padding: 16px 12px;
  }
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
  .header-left,
  .header-right {
    width: 100%;
  }
  .header-right :deep(.n-button) {
    width: 100%;
  }
  .page-title {
    font-size: 20px;
    gap: 8px;
  }
  .title-icon {
    font-size: 22px;
  }
  .page-subtitle {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .data-masking-view {
    padding: 12px 8px;
  }
  .page-title {
    font-size: 18px;
  }
  .title-icon {
    font-size: 20px;
  }
}

/* ── Tabs ── */
.main-tabs {
  :deep(.n-tabs-rail) {
    background: rgba(128, 128, 128, 0.1);
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 8px;
    padding: 4px;
  }

  :deep(.n-tabs-tab) {
    font-weight: 700 !important;
  }
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tab-badge {
  margin-left: 2px;
}

/* ── Test Rule Drawer ── */
.drawer-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.drawer-header-icon {
  font-size: 18px;
  color: var(--n-primary-color);
  flex-shrink: 0;
}

.drawer-header-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.drawer-header-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.drawer-header-subtitle {
  font-size: 12px;
  opacity: 0.55;
  line-height: 1.3;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
