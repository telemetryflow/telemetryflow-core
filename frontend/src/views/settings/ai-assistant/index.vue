<script setup lang="ts">
/**
 * AI Assistant Settings View
 * TASK-11: Frontend view for BYOLLM AI Insights module
 *
 * Features:
 * - List all LLM providers
 * - Create/Edit/Delete providers
 * - Set default provider
 * - Validate API keys
 * - Configure model settings
 */

import { h, ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import {
  NButton,
  NTag,
  NSelect,
  NInput,
  NDataTable,
  NCard,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NSwitch,
  NSlider,
  NInputNumber,
  NAlert,
  NText,
  NTime,
  NTooltip,
  NPopconfirm,
  NEmpty,
  useMessage,
} from "naive-ui";
import type { FormInst, DataTableColumns, FormRules } from "naive-ui";
import { useLLMStore } from "@/store";
import { storeToRefs } from "pinia";
import { usePagination } from "@/composables/usePagination";
import type {
  LLMProvider,
  ProviderType,
  CreateLLMProviderRequest,
  UpdateLLMProviderRequest,
} from "@/types/llm";
import { PROVIDER_TYPES, DEFAULT_MODELS } from "@/types/llm";

const message = useMessage();
const llmStore = useLLMStore();

const { providers, providersLoading } = storeToRefs(llmStore);
const { paginationConfig } = usePagination(10);

// ==================== FETCH ====================

onMounted(async () => {
  await llmStore.loadProviders({ pageSize: 100 });
  await llmStore.loadDefaultProvider();
});

// ==================== COLUMNS ====================

const columns = computed<DataTableColumns<LLMProvider>>(() => [
  {
    title: "Provider",
    key: "name",
    width: 250,
    sorter: (a, b) => a.name.localeCompare(b.name),
    defaultSortOrder: "ascend" as const,
    render(row) {
      const typeInfo = PROVIDER_TYPES[row.providerType];
      return h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "12px" } },
        [
          h(
            "div",
            {
              style: {
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: typeInfo?.color + "20",
              },
            },
            [
              h(Icon, {
                icon: typeInfo?.icon || "mdi:robot",
                style: { color: typeInfo?.color, fontSize: "18px" },
              }),
            ],
          ),
          h("div", { style: { display: "flex", flexDirection: "column" } }, [
            h(
              "div",
              { style: { display: "flex", alignItems: "center", gap: "8px" } },
              [
                h(NText, { strong: true }, { default: () => row.name }),
                row.isDefault
                  ? h(
                      NTag,
                      { type: "primary", size: "small" },
                      { default: () => "Default" },
                    )
                  : null,
              ],
            ),
            h(
              NText,
              { depth: 3, style: "font-size: 12px" },
              { default: () => typeInfo?.label },
            ),
          ]),
        ],
      );
    },
  },
  {
    title: "Model",
    key: "modelId",
    width: 200,
    align: "center",
    sorter: (a, b) => a.modelId.localeCompare(b.modelId),
    render(row) {
      return h(NText, { code: true }, { default: () => row.modelId });
    },
  },
  {
    title: "API Key",
    key: "apiKeyHint",
    width: 150,
    sorter: (a, b) => (a.apiKeyHint || "").localeCompare(b.apiKeyHint || ""),
    render(row) {
      return h(NText, { depth: 3 }, { default: () => row.apiKeyHint });
    },
  },
  {
    title: "Status",
    key: "isActive",
    width: 100,
    align: "center",
    sorter: (a, b) => Number(a.isActive) - Number(b.isActive),
    render(row) {
      return h(
        NTag,
        { type: row.isActive ? "success" : "default", size: "small" },
        { default: () => (row.isActive ? "Active" : "Inactive") },
      );
    },
  },
  {
    title: "Usage",
    key: "usageCount",
    width: 100,
    sorter: (a, b) => a.usageCount - b.usageCount,
    render(row) {
      return h(NText, null, { default: () => row.usageCount.toLocaleString() });
    },
  },
  {
    title: "Last Used",
    key: "lastUsedAt",
    width: 150,
    sorter: (a, b) => (a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0) - (b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0),
    render(row) {
      if (!row.lastUsedAt)
        return h(NText, { depth: 3 }, { default: () => "Never" });
      return h(NTime, {
        time: new Date(row.lastUsedAt),
        format: "yyyy-MM-dd HH:mm",
      });
    },
  },
  {
    title: "Actions",
    key: "actions",
    width: 150,
    fixed: "right" as const,
    render(row) {
      return h(NSpace, { size: 4 }, () => [
        !row.isDefault &&
          h(
            NTooltip,
            { trigger: "hover" },
            {
              trigger: () =>
                h(
                  NButton,
                  {
                    size: "small",
                    quaternary: true,
                    onClick: () => handleSetDefault(row),
                  },
                  { icon: () => h(Icon, { icon: "carbon:star" }) },
                ),
              default: () => "Set as Default",
            },
          ),
        h(
          NTooltip,
          { trigger: "hover" },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: "small",
                  quaternary: true,
                  onClick: () => handleValidate(row),
                },
                { icon: () => h(Icon, { icon: "carbon:checkmark-outline" }) },
              ),
            default: () => "Validate API Key",
          },
        ),
        h(
          NTooltip,
          { trigger: "hover" },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: "small",
                  quaternary: true,
                  onClick: () => openEditModal(row),
                },
                { icon: () => h(Icon, { icon: "carbon:edit" }) },
              ),
            default: () => "Edit",
          },
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: "small",
                  quaternary: true,
                  type: "error",
                },
                { icon: () => h(Icon, { icon: "carbon:trash-can" }) },
              ),
            default: () => "Delete this provider?",
          },
        ),
      ]);
    },
  },
]);

// ==================== CREATE MODAL ====================

const showCreateModal = ref(false);
const createFormRef = ref<FormInst | null>(null);
const createLoading = ref(false);

const createForm = ref<CreateLLMProviderRequest>({
  name: "",
  providerType: "claude",
  apiKey: "",
  modelId: "claude-sonnet-4-20250514",
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  isDefault: false,
});

const createRules: FormRules = {
  name: [{ required: true, message: "Name is required", trigger: "blur" }],
  providerType: [{ required: true, message: "Provider type is required" }],
  apiKey: [{ required: true, message: "API key is required", trigger: "blur" }],
  modelId: [{ required: true, message: "Model is required" }],
  baseUrl: [
    {
      validator: (_rule, value) => {
        if (createForm.value.providerType === "custom" && !value) {
          return new Error("Base URL is required for custom providers");
        }
        return true;
      },
      trigger: "blur",
    },
  ],
};

const providerTypeOptions = computed(() =>
  Object.entries(PROVIDER_TYPES).map(([key, val]) => ({
    label: val.label,
    value: key as ProviderType,
  })),
);

const modelOptions = computed(() => {
  const models = DEFAULT_MODELS[createForm.value.providerType] || [];
  return models.map((m) => ({ label: m.name, value: m.id }));
});

const editModelOptions = computed(() => {
  if (!editingProvider.value) return [];
  const models = DEFAULT_MODELS[editingProvider.value.providerType] || [];
  return models.map((m) => ({ label: m.name, value: m.id }));
});

function openCreateModal() {
  createForm.value = {
    name: "",
    providerType: "claude",
    apiKey: "",
    modelId: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    isDefault: providers.value.length === 0,
  };
  showCreateModal.value = true;
}

function handleProviderTypeChange(type: ProviderType) {
  const models = DEFAULT_MODELS[type];
  createForm.value.providerType = type;
  createForm.value.modelId = models?.[0]?.id || "";
  createForm.value.baseUrl = undefined;
}

async function handleCreate() {
  try {
    await createFormRef.value?.validate();
  } catch {
    return;
  }

  createLoading.value = true;
  try {
    await llmStore.createProvider(createForm.value);
    message.success("Provider created successfully");
    showCreateModal.value = false;
  } catch (e) {
    message.error(e instanceof Error ? e.message : "Failed to create provider");
  } finally {
    createLoading.value = false;
  }
}

// ==================== EDIT MODAL ====================

const showEditModal = ref(false);
const editFormRef = ref<FormInst | null>(null);
const editLoading = ref(false);
const editingProvider = ref<LLMProvider | null>(null);

const editForm = ref<UpdateLLMProviderRequest>({
  name: "",
  modelId: "",
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
});

function openEditModal(provider: LLMProvider) {
  editingProvider.value = provider;
  editForm.value = {
    name: provider.name,
    modelId: provider.modelId,
    baseUrl: provider.baseUrl,
    temperature: provider.modelConfig.temperature,
    maxTokens: provider.modelConfig.maxTokens,
    topP: provider.modelConfig.topP,
    isActive: provider.isActive,
  };
  showEditModal.value = true;
}

async function handleEdit() {
  if (!editingProvider.value) return;

  try {
    await editFormRef.value?.validate();
  } catch {
    return;
  }

  editLoading.value = true;
  try {
    await llmStore.updateProvider(editingProvider.value.id, editForm.value);
    message.success("Provider updated successfully");
    showEditModal.value = false;
  } catch (e) {
    message.error(e instanceof Error ? e.message : "Failed to update provider");
  } finally {
    editLoading.value = false;
  }
}

// ==================== ACTIONS ====================

async function handleSetDefault(provider: LLMProvider) {
  try {
    await llmStore.setDefaultProvider(provider.id);
    message.success(`${provider.name} is now the default provider`);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "Failed to set default");
  }
}

const validatingId = ref<string | null>(null);

async function handleValidate(provider: LLMProvider) {
  validatingId.value = provider.id;
  try {
    const result = await llmStore.validateProvider(provider.id);
    if (result.valid) {
      message.success("API key is valid");
    } else {
      message.error(result.message || "API key validation failed");
    }
  } finally {
    validatingId.value = null;
  }
}

async function handleDelete(provider: LLMProvider) {
  try {
    await llmStore.deleteProvider(provider.id);
    message.success("Provider deleted");
  } catch (e) {
    message.error(e instanceof Error ? e.message : "Failed to delete provider");
  }
}
</script>

<template>
  <div class="ai-assistant-view">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="carbon:machine-learning-model" class="title-icon" />
          AI Assistant
        </h1>
        <span class="page-subtitle">Configure LLM providers for AI-powered observability insights</span>
      </div>
      <div class="header-right">
        <NButton type="primary" @click="openCreateModal">
          <template #icon>
            <Icon icon="carbon:add" />
          </template>
          Add Provider
        </NButton>
      </div>
    </div>

    <!-- Info Alert -->
    <NAlert type="info" class="mb-4" :show-icon="true">
      <template #header>Bring Your Own LLM</template>
      Configure your preferred LLM provider to enable AI-powered insights. Your
      API keys are encrypted and stored securely. The AI Assistant can analyze
      logs, metrics, traces, and alerts to provide actionable recommendations.
    </NAlert>

    <!-- Empty State -->
    <NCard
      v-if="providers.length === 0 && !providersLoading"
      class="empty-card"
    >
      <NEmpty description="No LLM providers configured">
        <template #extra>
          <NButton type="primary" @click="openCreateModal">
            Add Your First Provider
          </NButton>
        </template>
      </NEmpty>
    </NCard>

    <!-- Providers Table -->
    <NCard v-else class="table-card">
      <NDataTable
        :columns="columns"
        :data="providers"
        :loading="providersLoading"
        :scroll-x="1200"
        :row-key="(row: LLMProvider) => row.id"
        :pagination="{ ...paginationConfig, itemCount: providers.length }"
        striped
      />
    </NCard>

    <!-- Create Modal -->
    <NModal
      v-model:show="showCreateModal"
      preset="card"
      title="Add LLM Provider"
      style="width: 650px"
    >
      <NForm
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-placement="left"
        label-width="130"
      >
        <NFormItem label="Name" path="name">
          <NInput
            v-model:value="createForm.name"
            placeholder="My Claude Provider"
          />
        </NFormItem>

        <NFormItem label="Provider Type" path="providerType">
          <NSelect
            :value="createForm.providerType"
            :options="providerTypeOptions"
            @update:value="handleProviderTypeChange"
          />
        </NFormItem>

        <NFormItem label="API Key" path="apiKey">
          <NInput
            v-model:value="createForm.apiKey"
            type="password"
            show-password-on="click"
            placeholder="sk-..."
          />
        </NFormItem>

        <NFormItem
          v-if="createForm.providerType === 'custom'"
          label="Base URL"
          path="baseUrl"
        >
          <NInput
            v-model:value="createForm.baseUrl"
            placeholder="https://api.custom-llm.com/v1"
          />
        </NFormItem>

        <NFormItem label="Model" path="modelId">
          <NSelect
            v-if="modelOptions.length > 0"
            v-model:value="createForm.modelId"
            :options="modelOptions"
          />
          <NInput
            v-else
            v-model:value="createForm.modelId"
            placeholder="Enter model ID"
          />
        </NFormItem>

        <NFormItem label="Temperature">
          <div class="slider-container">
            <NSlider
              v-model:value="createForm.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              :tooltip="true"
            />
            <div class="slider-labels">
              <span>Precise (0)</span>
              <span>{{ createForm.temperature }}</span>
              <span>Creative (2)</span>
            </div>
          </div>
        </NFormItem>

        <NFormItem label="Max Tokens">
          <NInputNumber
            v-model:value="createForm.maxTokens"
            :min="100"
            :max="128000"
            style="width: 200px"
          />
        </NFormItem>

        <NFormItem label="Top P">
          <NSlider
            v-model:value="createForm.topP"
            :min="0"
            :max="1"
            :step="0.05"
            style="width: 200px"
          />
        </NFormItem>

        <NFormItem label="Set as Default">
          <NSwitch v-model:value="createForm.isDefault" />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="tfo-modal-footer">
          <NButton type="primary" ghost @click="showCreateModal = false">Cancel</NButton>
          <NButton type="primary" :loading="createLoading" @click="handleCreate">
            Add Provider
          </NButton>
        </div>
      </template>
    </NModal>

    <!-- Edit Modal -->
    <NModal
      v-model:show="showEditModal"
      preset="card"
      title="Edit LLM Provider"
      style="width: 650px"
    >
      <NForm
        ref="editFormRef"
        :model="editForm"
        label-placement="left"
        label-width="130"
      >
        <NFormItem label="Name">
          <NInput v-model:value="editForm.name" />
        </NFormItem>

        <NFormItem label="New API Key">
          <NInput
            v-model:value="editForm.apiKey"
            type="password"
            show-password-on="click"
            placeholder="Leave empty to keep current key"
          />
        </NFormItem>

        <NFormItem
          v-if="editingProvider?.providerType === 'custom'"
          label="Base URL"
        >
          <NInput v-model:value="editForm.baseUrl" />
        </NFormItem>

        <NFormItem label="Model">
          <NSelect
            v-if="editModelOptions.length > 0"
            v-model:value="editForm.modelId"
            :options="editModelOptions"
          />
          <NInput v-else v-model:value="editForm.modelId" />
        </NFormItem>

        <NFormItem label="Temperature">
          <div class="slider-container">
            <NSlider
              v-model:value="editForm.temperature"
              :min="0"
              :max="2"
              :step="0.1"
            />
            <div class="slider-labels">
              <span>Precise (0)</span>
              <span>{{ editForm.temperature }}</span>
              <span>Creative (2)</span>
            </div>
          </div>
        </NFormItem>

        <NFormItem label="Max Tokens">
          <NInputNumber
            v-model:value="editForm.maxTokens"
            :min="100"
            :max="128000"
            style="width: 200px"
          />
        </NFormItem>

        <NFormItem label="Active">
          <NSwitch v-model:value="editForm.isActive" />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="tfo-modal-footer">
          <NButton type="primary" ghost @click="showEditModal = false">Cancel</NButton>
          <NButton type="primary" :loading="editLoading" @click="handleEdit">
            Save Changes
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
/* ==================== RESPONSIVE BREAKPOINTS ==================== */
/* Mobile: max-width 768px, Tablet: max-width 1024px */

.ai-assistant-view {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
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

.mb-4 {
  margin-bottom: 16px;
}

.empty-card {
  padding: 48px;
}

.table-card {
  margin-bottom: 24px;
}

.w-full {
  width: 100%;
}

.slider-container {
  width: 100%;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 4px;
}

/* ==================== TABLET STYLES (max-width: 1024px) ==================== */
@media (max-width: 1024px) {
  .ai-assistant-view {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 22px;
  }

  .title-icon {
    font-size: 24px;
  }
}

/* ==================== MOBILE STYLES (max-width: 768px) ==================== */
@media (max-width: 768px) {
  .ai-assistant-view {
    padding: 16px 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .header-left {
    width: 100%;
  }

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

  .mb-4 {
    margin-bottom: 12px;
  }

  .empty-card {
    padding: 32px 16px;
  }

  /* Alert responsive */
  :deep(.n-alert) {
    font-size: 13px;
  }

  :deep(.n-alert .n-alert-header) {
    font-size: 14px;
  }

  /* Table card adjustments */
  .table-card :deep(.n-data-table-wrapper) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table-card :deep(.n-data-table-base-table) {
    min-width: 900px;
  }
}

/* ==================== SMALL MOBILE (max-width: 480px) ==================== */
@media (max-width: 480px) {
  .ai-assistant-view {
    padding: 12px 8px;
  }

  .page-title {
    font-size: 18px;
  }

  .title-icon {
    font-size: 20px;
  }

  .empty-card {
    padding: 24px 12px;
  }
}

/* ==================== MODAL RESPONSIVE STYLES ==================== */
:deep(.n-modal) {
  max-width: 95vw !important;
  margin: 16px auto;
}

@media (max-width: 768px) {
  :deep(.n-modal[style*="width: 650px"]) {
    width: 95vw !important;
    max-width: 95vw !important;
  }

  :deep(.n-modal .n-form) {
    max-width: 100%;
  }

  :deep(.n-modal .n-form-item) {
    flex-direction: column !important;
  }

  :deep(.n-modal .n-form-item-label) {
    width: 100% !important;
    text-align: left !important;
    padding-bottom: 4px !important;
  }

  :deep(.n-modal .n-form-item-blank) {
    width: 100% !important;
  }

  :deep(.n-modal .n-space) {
    flex-wrap: wrap !important;
    gap: 8px !important;
  }

  /* Slider controls responsive */
  :deep(.n-modal .n-slider) {
    width: 100% !important;
  }

  /* Input number responsive */
  :deep(.n-modal .n-input-number) {
    width: 100% !important;
  }

  /* Temperature slider helper text */
  :deep(.n-modal .flex.justify-between) {
    font-size: 11px;
  }
}
</style>
