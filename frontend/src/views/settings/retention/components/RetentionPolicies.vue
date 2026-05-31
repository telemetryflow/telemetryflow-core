<script setup lang="ts">
import { h, ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import {
  NButton,
  NTag,
  NSelect,
  NSwitch,
  NDataTable,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NText,
  NTime,
  NDropdown,
  useMessage,
  useDialog,
} from "naive-ui";
import type {
  FormInst,
  FormRules,
  DataTableColumns,
  SelectOption,
  DropdownOption,
} from "naive-ui";
import { retentionApi } from "@/api/retention";
import type {
  RetentionPolicy,
  CreateRetentionPolicyRequest,
  UpdateRetentionPolicyRequest,
  DataType,
} from "@/types/retention";
import {
  DATA_TYPES,
  RETENTION_POLICY_STATUS,
  formatRetentionDays,
  getRetentionPolicyStatus,
} from "@/types/retention";

const emit = defineEmits<{
  "stats-updated": [
    stats: {
      totalPolicies: number;
      activePolicies: number;
      customPolicies: number;
      archiveEnabled: number;
    },
  ];
}>();

const message = useMessage();
const dialog = useDialog();

// ==================== DATA ====================

const policies = ref<RetentionPolicy[]>([]);
const loading = ref(false);

const filterDataType = ref<DataType | null>(null);
const filterIncludeDefaults = ref(true);

const dataTypeFilterOptions = [
  { label: "All Data Types", value: null as unknown as string },
  ...Object.entries(DATA_TYPES).map(([key, val]) => ({
    label: val.label,
    value: key as DataType,
  })),
] as SelectOption[];

const dataTypeOptions = Object.entries(DATA_TYPES).map(([key, val]) => ({
  label: val.label,
  value: key as DataType,
}));

// ==================== FETCH ====================

async function fetchPolicies() {
  loading.value = true;
  try {
    policies.value = await retentionApi.listPolicies({
      dataType: filterDataType.value ?? undefined,
      includeDefaults: filterIncludeDefaults.value,
    });
    emit("stats-updated", {
      totalPolicies: policies.value.length,
      activePolicies: policies.value.filter((p) => p.isActive).length,
      customPolicies: policies.value.filter((p) => !p.isDefault).length,
      archiveEnabled: policies.value.filter((p) => p.archiveEnabled).length,
    });
  } catch (error) {
    message.error("Failed to fetch retention policies");
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchPolicies();
}

function handleResetFilters() {
  filterDataType.value = null;
  filterIncludeDefaults.value = true;
  fetchPolicies();
}

onMounted(() => {
  fetchPolicies();
});

// ==================== COLUMNS ====================

const columns = computed<DataTableColumns<RetentionPolicy>>(() => [
  {
    title: "Name",
    key: "name",
    minWidth: 240,
    sorter: (a, b) => a.name.localeCompare(b.name),
    render(row) {
      return h("div", { class: "policy-name-cell" }, [
        h(
          NText,
          {
            strong: true,
            style: "font-size: 14px; font-weight: 600; display: block",
          },
          { default: () => row.name },
        ),
        row.description
          ? h(
              NText,
              {
                depth: 3,
                style: "font-size: 12px; display: block; margin-top: 2px",
              },
              { default: () => row.description },
            )
          : null,
      ]);
    },
  },
  {
    title: "Data Type",
    key: "dataType",
    width: 120,
    sorter: (a, b) => a.dataType.localeCompare(b.dataType),
    render(row) {
      const typeInfo = DATA_TYPES[row.dataType];
      const hexColor = typeInfo?.hexColor || "#64748b";
      return h(
        NTag,
        {
          color: {
            color: `${hexColor}26`,
            borderColor: hexColor,
            textColor: hexColor,
          },
          size: "small",
        },
        {
          icon: () => h(Icon, { icon: typeInfo?.icon || "carbon:document" }),
          default: () => typeInfo?.label || row.dataType,
        },
      );
    },
  },
  {
    title: "Retention",
    key: "retentionDays",
    width: 140,
    sorter: (a, b) => a.retentionDays - b.retentionDays,
    render(row) {
      return h(NText, null, {
        default: () => formatRetentionDays(row.retentionDays),
      });
    },
  },
  {
    title: "Status",
    key: "status",
    width: 120,
    sorter: (a, b) =>
      getRetentionPolicyStatus(a).localeCompare(getRetentionPolicyStatus(b)),
    render(row) {
      const status = getRetentionPolicyStatus(row);
      const statusInfo = RETENTION_POLICY_STATUS[status];
      return h(
        NTag,
        {
          type: statusInfo.color as "success" | "info" | "default",
          size: "small",
        },
        { default: () => statusInfo.label },
      );
    },
  },
  {
    title: "Archive",
    key: "archiveEnabled",
    width: 180,
    sorter: (a, b) => Number(a.archiveEnabled) - Number(b.archiveEnabled),
    render(row) {
      if (!row.archiveEnabled) {
        return h(NText, { depth: 3 }, { default: () => "Disabled" });
      }
      const destination = row.archiveDestination || "Enabled";
      return h(
        NTag,
        { type: "success", size: "small", style: "max-width: 100%;" },
        {
          default: () =>
            h(
              "span",
              {
                style:
                  "display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;",
                title: destination,
              },
              destination,
            ),
        },
      );
    },
  },
  {
    title: "Last Enforced",
    key: "lastEnforcedAt",
    width: 180,
    sorter: (a, b) => (a.lastEnforcedAt || 0) - (b.lastEnforcedAt || 0),
    render(row) {
      if (!row.lastEnforcedAt)
        return h(NText, { depth: 3 }, { default: () => "Never" });
      return h(NTime, { time: row.lastEnforcedAt, type: "relative" });
    },
  },
  {
    title: "Actions",
    key: "actions",
    width: 80,
    align: "center" as const,
    fixed: "right" as const,
    render(row) {
      const isDefault = row.isDefault;

      const options: DropdownOption[] = [
        {
          label: "Edit",
          key: "edit",
          disabled: isDefault,
          icon: () => h(Icon, { icon: "carbon:edit", width: 16, height: 16 }),
        },
        {
          label: row.isActive ? "Deactivate" : "Activate",
          key: row.isActive ? "deactivate" : "activate",
          disabled: isDefault,
          icon: () =>
            h(Icon, {
              icon: row.isActive ? "carbon:pause" : "carbon:play",
              width: 16,
              height: 16,
            }),
        },
        { type: "divider", key: "d1" },
        {
          label: "Delete",
          key: "delete",
          disabled: isDefault,
          icon: () =>
            h(Icon, {
              icon: "carbon:trash-can",
              width: 16,
              height: 16,
              style: "color: #ef4444",
            }),
          props: { style: "color: #ef4444" },
        },
      ];

      function handleActionSelect(key: string) {
        switch (key) {
          case "edit":
            openEditModal(row);
            break;
          case "activate":
            handleActivate(row);
            break;
          case "deactivate":
            handleDeactivate(row);
            break;
          case "delete":
            dialog.warning({
              title: "Delete Policy",
              content: `Delete retention policy "${row.name}"? This cannot be undone.`,
              positiveText: "Delete",
              negativeText: "Cancel",
              onPositiveClick: () => handleDelete(row),
            });
            break;
        }
      }

      return h(
        NDropdown,
        { options, trigger: "click", onSelect: handleActionSelect },
        {
          default: () =>
            h(
              NButton,
              { size: "small", quaternary: true },
              {
                icon: () =>
                  h(Icon, {
                    icon: "carbon:overflow-menu-vertical",
                    width: 16,
                    height: 16,
                  }),
              },
            ),
        },
      );
    },
  },
]);

// ==================== FORM TABS ====================

type RetentionFormTab = "general" | "archive";

const activeCreateTab = ref<RetentionFormTab>("general");
const activeEditTab = ref<RetentionFormTab>("general");

const retentionFormTabs: {
  label: string;
  value: RetentionFormTab;
  icon: string;
}[] = [
  { label: "General", value: "general", icon: "carbon:settings" },
  { label: "Archive", value: "archive", icon: "carbon:archive" },
];

const retentionTabDescriptions: Record<RetentionFormTab, string> = {
  general:
    "Basic policy settings including name, data type, and retention period",
  archive: "Configure archiving options before data deletion",
};

// ==================== CREATE MODAL ====================

const showCreateModal = ref(false);
const createFormRef = ref<FormInst | null>(null);
const createLoading = ref(false);

const createForm = ref<CreateRetentionPolicyRequest>({
  name: "",
  description: "",
  dataType: "logs",
  retentionDays: 30,
  archiveEnabled: false,
  archiveDestination: "",
});

const createRules: FormRules = {
  name: [{ required: true, message: "Name is required", trigger: "blur" }],
  dataType: [
    { required: true, message: "Data type is required", trigger: "blur" },
  ],
  retentionDays: [
    {
      required: true,
      type: "number" as const,
      message: "Retention days is required",
      trigger: "blur",
    },
  ],
};

function openCreateModal() {
  activeCreateTab.value = "general";
  createForm.value = {
    name: "",
    description: "",
    dataType: "logs",
    retentionDays: 30,
    archiveEnabled: false,
    archiveDestination: "",
  };
  showCreateModal.value = true;
}

async function handleCreate() {
  try {
    await createFormRef.value?.validate();
  } catch {
    return;
  }

  createLoading.value = true;
  try {
    await retentionApi.createPolicy(createForm.value);
    message.success("Retention policy created successfully");
    showCreateModal.value = false;
    fetchPolicies();
  } catch (error) {
    message.error("Failed to create retention policy");
    console.error(error);
  } finally {
    createLoading.value = false;
  }
}

// ==================== EDIT MODAL ====================

const showEditModal = ref(false);
const editFormRef = ref<FormInst | null>(null);
const editLoading = ref(false);
const editingPolicy = ref<RetentionPolicy | null>(null);

const editForm = ref<UpdateRetentionPolicyRequest>({
  name: "",
  description: "",
  retentionDays: 30,
  archiveEnabled: false,
  archiveDestination: "",
});

function openEditModal(policy: RetentionPolicy) {
  activeEditTab.value = "general";
  editingPolicy.value = policy;
  editForm.value = {
    name: policy.name,
    description: policy.description,
    retentionDays: policy.retentionDays,
    archiveEnabled: policy.archiveEnabled,
    archiveDestination: policy.archiveDestination,
  };
  showEditModal.value = true;
}

async function handleEdit() {
  if (!editingPolicy.value) return;

  try {
    await editFormRef.value?.validate();
  } catch {
    return;
  }

  editLoading.value = true;
  try {
    await retentionApi.updatePolicy(editingPolicy.value.id, editForm.value);
    message.success("Retention policy updated successfully");
    showEditModal.value = false;
    fetchPolicies();
  } catch (error) {
    message.error("Failed to update retention policy");
    console.error(error);
  } finally {
    editLoading.value = false;
  }
}

// ==================== ACTIONS ====================

async function handleActivate(policy: RetentionPolicy) {
  try {
    await retentionApi.activatePolicy(policy.id);
    message.success("Policy activated");
    fetchPolicies();
  } catch (error) {
    message.error("Failed to activate policy");
    console.error(error);
  }
}

async function handleDeactivate(policy: RetentionPolicy) {
  try {
    await retentionApi.deactivatePolicy(policy.id);
    message.success("Policy deactivated");
    fetchPolicies();
  } catch (error) {
    message.error("Failed to deactivate policy");
    console.error(error);
  }
}

async function handleDelete(policy: RetentionPolicy) {
  try {
    await retentionApi.deletePolicy(policy.id);
    message.success("Policy deleted");
    fetchPolicies();
  } catch (error) {
    message.error("Failed to delete policy");
    console.error(error);
  }
}

defineExpose({ openCreateModal });
</script>

<template>
  <div class="retention-policies">
    <!-- Table Section -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:data-backup" class="section-icon" />
          <span>Retention Policies</span>
          <NTag :bordered="false" size="small" type="info">
            {{ policies.length }} policies
          </NTag>
        </div>
        <div class="table-actions">
          <NSelect
            v-model:value="filterDataType"
            :options="dataTypeFilterOptions"
            placeholder="Data Type"
            size="small"
            class="filter-select-control"
            @update:value="handleSearch"
          />
          <NSpace align="center" :size="6">
            <NSwitch
              v-model:value="filterIncludeDefaults"
              size="small"
              @update:value="handleSearch"
            />
            <NText style="font-size: 0.8125rem">Defaults</NText>
          </NSpace>
          <NButton size="small" ghost @click="handleResetFilters">
            <template #icon>
              <Icon icon="carbon:reset" />
            </template>
            Reset
          </NButton>
          <NButton size="small" ghost @click="fetchPolicies">
            <template #icon>
              <Icon icon="carbon:renew" />
            </template>
            Refresh
          </NButton>
        </div>
      </div>
      <div class="table-content">
        <!-- datatableId: RET30001 -->
        <NDataTable
          :columns="columns"
          :data="policies"
          :loading="loading"
          :pagination="{
            pageSize: 10,
            showSizePicker: true,
            pageSizes: [10, 20, 50, 100, 200, 500],
          }"
          :scroll-x="900"
          :row-key="(row: RetentionPolicy) => row.id"
          :bordered="false"
          striped
          size="small"
        />
      </div>
    </div>

    <!-- Create Modal -->
    <NModal
      v-model:show="showCreateModal"
      preset="card"
      title="Create Retention Policy"
      :style="{ maxWidth: '860px', width: '95vw' }"
      :segmented="{ footer: 'soft' }"
    >
      <div class="retention-form-content">
        <div class="form-tabs">
          <div
            v-for="tab in retentionFormTabs"
            :key="tab.value"
            class="form-tab-item"
            :class="{ active: activeCreateTab === tab.value }"
            @click="activeCreateTab = tab.value"
          >
            <Icon :icon="tab.icon" class="tab-icon" />
            <span class="tab-label">{{ tab.label }}</span>
          </div>
          <div class="tab-description">
            <p>{{ retentionTabDescriptions[activeCreateTab] }}</p>
          </div>
        </div>

        <div class="form-content">
          <div class="form-box">
            <NForm
              ref="createFormRef"
              :model="createForm"
              :rules="createRules"
              label-placement="top"
            >
              <template v-if="activeCreateTab === 'general'">
                <NFormItem label="Name" path="name">
                  <NInput
                    v-model:value="createForm.name"
                    placeholder="Production Logs 90 Days"
                  />
                </NFormItem>
                <NFormItem label="Data Type" path="dataType">
                  <NSelect
                    v-model:value="createForm.dataType"
                    :options="dataTypeOptions"
                  />
                </NFormItem>
                <NFormItem label="Retention Days" path="retentionDays">
                  <NInputNumber
                    v-model:value="createForm.retentionDays"
                    :min="1"
                    :max="3650"
                    style="width: 200px"
                  >
                    <template #suffix>days</template>
                  </NInputNumber>
                </NFormItem>
                <NFormItem label="Description" path="description">
                  <NInput
                    v-model:value="createForm.description"
                    type="textarea"
                    placeholder="Optional description"
                    :autosize="{ minRows: 2, maxRows: 4 }"
                  />
                </NFormItem>
              </template>

              <template v-if="activeCreateTab === 'archive'">
                <p class="section-hint">
                  Configure whether data should be archived to external storage
                  before being deleted
                </p>
                <div class="archive-toggle">
                  <NSwitch v-model:value="createForm.archiveEnabled" />
                  <div class="archive-toggle-text">
                    <NText strong>Enable archiving before deletion</NText>
                    <NText
                      depth="3"
                      style="font-size: 12px; display: block; margin-top: 2px"
                    >
                      When enabled, data will be exported to the specified
                      destination before removal
                    </NText>
                  </div>
                </div>
                <NFormItem
                  v-if="createForm.archiveEnabled"
                  label="Archive Destination"
                  path="archiveDestination"
                  style="margin-top: 16px"
                >
                  <NInput
                    v-model:value="createForm.archiveDestination"
                    placeholder="s3://bucket/path"
                  />
                  <template #feedback>
                    <span class="form-hint">Supports S3, GCS, or Azure Blob storage paths</span>
                  </template>
                </NFormItem>
              </template>
            </NForm>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer tfo-modal-footer">
          <NButton type="primary" ghost @click="showCreateModal = false">
            Cancel
          </NButton>
          <NButton
            type="primary"
            :disabled="!createForm.name.trim()"
            :loading="createLoading"
            @click="handleCreate"
          >
            Create Policy
          </NButton>
        </div>
      </template>
    </NModal>

    <!-- Edit Modal -->
    <NModal
      v-model:show="showEditModal"
      preset="card"
      :style="{ maxWidth: '860px', width: '95vw' }"
      :segmented="{ footer: 'soft' }"
    >
      <template #header>
        <div class="modal-header">
          <Icon icon="carbon:edit" class="modal-header-icon" />
          <div class="modal-header-text">
            <span class="modal-header-title">Edit Retention Policy</span>
            <span v-if="editingPolicy" class="modal-header-subtitle">{{
              editingPolicy.name
            }}</span>
          </div>
        </div>
      </template>

      <div class="retention-form-content">
        <div class="form-tabs">
          <div
            v-for="tab in retentionFormTabs"
            :key="tab.value"
            class="form-tab-item"
            :class="{ active: activeEditTab === tab.value }"
            @click="activeEditTab = tab.value"
          >
            <Icon :icon="tab.icon" class="tab-icon" />
            <span class="tab-label">{{ tab.label }}</span>
          </div>
          <div class="tab-description">
            <p>{{ retentionTabDescriptions[activeEditTab] }}</p>
          </div>
        </div>

        <div class="form-content">
          <div class="form-box">
            <NForm ref="editFormRef" :model="editForm" label-placement="top">
              <template v-if="activeEditTab === 'general'">
                <NFormItem label="Name" path="name">
                  <NInput v-model:value="editForm.name" />
                </NFormItem>
                <NFormItem label="Retention Days" path="retentionDays">
                  <NInputNumber
                    v-model:value="editForm.retentionDays"
                    :min="1"
                    :max="3650"
                    style="width: 200px"
                  >
                    <template #suffix>days</template>
                  </NInputNumber>
                </NFormItem>
                <NFormItem label="Description" path="description">
                  <NInput
                    v-model:value="editForm.description"
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 4 }"
                  />
                </NFormItem>
              </template>

              <template v-if="activeEditTab === 'archive'">
                <p class="section-hint">
                  Configure whether data should be archived to external storage
                  before being deleted
                </p>
                <div class="archive-toggle">
                  <NSwitch v-model:value="editForm.archiveEnabled" />
                  <div class="archive-toggle-text">
                    <NText strong>Enable archiving before deletion</NText>
                    <NText
                      depth="3"
                      style="font-size: 12px; display: block; margin-top: 2px"
                    >
                      When enabled, data will be exported to the specified
                      destination before removal
                    </NText>
                  </div>
                </div>
                <NFormItem
                  v-if="editForm.archiveEnabled"
                  label="Archive Destination"
                  path="archiveDestination"
                  style="margin-top: 16px"
                >
                  <NInput
                    v-model:value="editForm.archiveDestination"
                    placeholder="s3://bucket/path"
                  />
                  <template #feedback>
                    <span class="form-hint">Supports S3, GCS, or Azure Blob storage paths</span>
                  </template>
                </NFormItem>
              </template>
            </NForm>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer tfo-modal-footer">
          <NButton type="primary" ghost @click="showEditModal = false">
            <template #icon>
              <Icon icon="carbon:close" />
            </template>
            Cancel
          </NButton>
          <NButton type="primary" :loading="editLoading" @click="handleEdit">
            <template #icon>
              <Icon icon="carbon:save" />
            </template>
            Save Changes
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";

.retention-policies {
  padding: 0;
}

.policy-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ==================== HEADER CONTROLS ==================== */

.filter-select-control {
  width: 150px;
}

@media (max-width: 768px) {
  .filter-select-control {
    width: 100%;
  }

  .table-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;

    :deep(.n-space) {
      justify-content: space-between;
    }

    :deep(.n-button) {
      flex: 1;
      justify-content: center;
    }
  }
}

/* ==================== VERTICAL TAB FORM LAYOUT ==================== */
.retention-form-content {
  display: flex;
  gap: 16px;
  max-height: calc(60vh - 80px);
  overflow: hidden;
}

.form-tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  max-width: 180px;
  border-right: 1px solid var(--n-border-color);
  padding-right: 16px;
}

.form-tab-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color-3);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--text-color);
  }

  &.active {
    background: rgba(99, 102, 241, 0.15);
    color: var(--primary-color);

    .tab-icon {
      color: var(--primary-color);
    }
  }

  .tab-icon {
    font-size: 18px;
    transition: color 0.2s ease;
  }

  .tab-label {
    white-space: nowrap;
  }
}

.tab-description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color);

  p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-color-3);
    line-height: 1.5;
  }
}

.form-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  .form-box {
    min-width: 300px;
    background: var(--n-action-color);
    border: 1px solid var(--n-border-color);
    border-radius: 8px;
    padding: 16px;
  }

  :deep(.n-form-item) {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.n-form-item-label) {
    font-weight: 500;
    font-size: 13px;
    margin-bottom: 4px;
  }
}

.section-hint {
  margin: 0 0 16px 0;
  font-size: 12px;
  color: var(--text-color-3);
}

.form-hint {
  font-size: 11px;
  color: var(--text-color-3);
  margin-top: 4px;
}

.archive-toggle {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 6px;
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
}

.archive-toggle-text {
  flex: 1;
}

/* ==================== MODAL HEADER & FOOTER ==================== */
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header-icon {
  font-size: 22px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.modal-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-header-title {
  font-size: 16px;
  font-weight: 600;
}

.modal-header-subtitle {
  font-size: 12px;
  color: var(--text-color-3);
  font-weight: 400;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 15px;
  border-top: 1px solid var(--n-border-color);

  :deep(.n-button) {
    width: 160px;
    height: 36px !important;
    line-height: 34px;
    padding: 0 !important;
    box-sizing: border-box;
  }
}

/* ==================== MODAL RESPONSIVE ==================== */
:deep(.n-modal) {
  max-width: 95vw !important;
  margin: 16px auto;
}

@media (max-width: 768px) {
  .retention-form-content {
    flex-direction: column;
    max-height: calc(70vh - 80px);
  }

  .form-tabs {
    flex-direction: row;
    flex-wrap: wrap;
    max-width: 100%;
    min-width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--n-border-color);
    padding-right: 0;
    padding-bottom: 12px;
    gap: 8px;
  }

  .form-tab-item {
    padding: 8px 12px;
    flex: 1;
    justify-content: center;

    .tab-label {
      font-size: 12px;
    }

    .tab-icon {
      font-size: 16px;
    }
  }

  .tab-description {
    display: none;
  }

  .form-content {
    .form-box {
      padding: 12px;
    }
  }

  .modal-footer {
    flex-direction: column-reverse;

    :deep(.n-button) {
      width: 100%;
    }
  }

  :deep(.n-modal .n-form) {
    max-width: 100%;
  }

  :deep(.n-modal .n-input-number) {
    width: 100% !important;
  }
}
</style>

<style lang="scss">
.n-modal.n-card {
  .n-card__footer {
    padding-top: 0 !important;
  }
}
</style>
