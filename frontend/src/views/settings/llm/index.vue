<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import {
  NButton,
  NButtonGroup,
  NTag,
  NDataTable,
  NCard,
  NText,
  NSwitch,
  NDropdown,
  useMessage,
  useDialog,
} from 'naive-ui';
import type { DataTableColumns, DropdownOption } from 'naive-ui';
import { StatPanel } from '@/components/charts';
import { useStatPanelsFromRegistry } from '@/composables/useStatPanelsFromRegistry';
import ProviderFormModal from './components/ProviderFormModal.vue';
import { llmConfigApi, type LLMProvider, type CreateLLMProviderRequest } from '@/api/llm-config';
import { usePagination } from '@/composables/usePagination';
import { exportToCSV, exportToJSON, getExportFilename } from '@/utils/export';
import { useLLMStore } from '@/store';
import './custom-llm-icons';

const message = useMessage();
const dialog = useDialog();
const llmStore = useLLMStore();

// ==================== DATA ====================

const providers = ref<LLMProvider[]>([]);
const isLoading = ref(false);
const showFormModal = ref(false);
const selectedProvider = ref<LLMProvider | null>(null);
const testingProviderId = ref<string | null>(null);

// Filters
const searchQuery = ref('');
const filterProvider = ref<string | null>(null);
const filterStatus = ref<string | null>(null);

const providerTypeOptions = [
  { label: 'All Providers', value: 'all', icon: 'carbon:ai-status' },
  { label: 'Anthropic Claude', value: 'anthropic', icon: 'simple-icons:anthropic' },
  { label: 'OpenAI GPT', value: 'openai', icon: 'simple-icons:openai' },
  { label: 'Google Gemini', value: 'google', icon: 'simple-icons:google' },
  { label: 'DeepSeek', value: 'deepseek', icon: 'simple-icons:deepseek' },
  { label: 'Qwen', value: 'qwen', icon: 'simple-icons:qwen' },
  { label: 'Ollama', value: 'ollama', icon: 'simple-icons:ollama' },
  { label: 'Mistral AI', value: 'mistral', icon: 'simple-icons:mistralai' },
  { label: 'xAI Grok', value: 'grok', icon: 'logos:grok-icon' },
  { label: 'Kimi (Moonshot)', value: 'kimi', icon: 'simple-icons:moonshotai' },
  { label: 'GLM (Z.ai)', value: 'zhipu', icon: 'custom:zai' },
  { label: 'MiMo (Xiaomi)', value: 'mimo', icon: 'custom:mimo' },
  { label: 'Custom', value: 'custom', icon: 'carbon:settings' },
];

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Enabled', value: 'enabled' },
  { label: 'Disabled', value: 'disabled' },
];

// ==================== COMPUTED ====================

const filteredProviders = computed(() => {
  let result = providers.value;

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        p.displayName.toLowerCase().includes(q) ||
        p.modelId.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q)
    );
  }

  if (filterProvider.value && filterProvider.value !== 'all') {
    result = result.filter((p) => p.provider === filterProvider.value);
  }

  if (filterStatus.value && filterStatus.value !== 'all') {
    const isEnabled = filterStatus.value === 'enabled';
    result = result.filter((p) => p.enabled === isEnabled);
  }

  return result.slice().sort((a, b) => a.displayName.localeCompare(b.displayName));
});

// Pagination — let NDataTable handle slicing internally so itemCount is correct
const { paginationConfig } = usePagination(10);

const tablePagination = computed(() => ({
  ...paginationConfig.value,
  prefix: ({ itemCount }: { itemCount?: number }) => `${itemCount ?? 0} items`,
}));

// Stats
const totalProviders = computed(() => providers.value.length);
const enabledProviders = computed(() => providers.value.filter((p) => p.enabled).length);
const defaultProvider = computed(() => providers.value.find((p) => p.isDefault));
const defaultProviderName = computed(() => defaultProvider.value?.displayName || 'None');
const providerTypes = computed(() => {
  const types = new Set(providers.value.map((p) => p.provider));
  return types.size;
});

// Stat panels from registry (LLM20001-LLM20004)
const statCards = useStatPanelsFromRegistry(
  ['LLM20001', 'LLM20002', 'LLM20003', 'LLM20004'],
  {
    LLM20001: totalProviders,
    LLM20002: enabledProviders,
    LLM20003: defaultProviderName,
    LLM20004: providerTypes,
  },
);

// ==================== FUNCTIONS ====================

function getProviderIcon(provider: string): string {
  const option = providerTypeOptions.find((o) => o.value === provider);
  return option?.icon || 'carbon:ai-status';
}

function getProviderColor(provider: string): { color: string; bg: string } {
  const colors: Record<string, { color: string; bg: string }> = {
    anthropic: { color: '#D97757', bg: 'rgba(217, 119, 87, 0.1)' },
    openai: { color: '#10a37f', bg: 'rgba(16, 163, 127, 0.1)' },
    google: { color: '#4285f4', bg: 'rgba(66, 133, 244, 0.1)' },
    deepseek: { color: '#4D6BFE', bg: 'rgba(77, 107, 254, 0.1)' },
    qwen: { color: '#ff6a00', bg: 'rgba(255, 106, 0, 0.1)' },
    ollama: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    mistral: { color: '#F70000', bg: 'rgba(247, 0, 0, 0.1)' },
    grok: { color: '#000000', bg: 'rgba(0, 0, 0, 0.08)' },
    kimi: { color: '#6C5CE7', bg: 'rgba(108, 92, 231, 0.1)' },
    zhipu: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    mimo: { color: '#FF6900', bg: 'rgba(255, 105, 0, 0.1)' },
    custom: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
  };
  return colors[provider] || { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
}

const statusBadgeColors: Record<string, { bg: string; color: string }> = {
  enabled: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  disabled: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
};

async function loadProviders() {
  isLoading.value = true;
  try {
    const response = await llmConfigApi.list();
    providers.value = response.data || [];
  } catch (error) {
    console.error('Failed to load LLM providers:', error);
    providers.value = [];
    message.error('Failed to load LLM providers. Please check your connection.');
  } finally {
    isLoading.value = false;
  }
}

function openCreateModal() {
  selectedProvider.value = null;
  showFormModal.value = true;
}

function openEditModal(provider: LLMProvider) {
  selectedProvider.value = provider;
  showFormModal.value = true;
}

async function handleSave(data: CreateLLMProviderRequest) {
  try {
    if (selectedProvider.value) {
      // Update existing provider
      await llmConfigApi.update(selectedProvider.value.id, data);
      message.success('LLM provider updated successfully');
    } else {
      // Create new provider
      await llmConfigApi.create(data);
      message.success('LLM provider created successfully');
    }
    showFormModal.value = false;
    await loadProviders();
  } catch (error: any) {
    message.error(error.response?.data?.message || 'Failed to save provider');
  }
}

async function handleDelete(provider: LLMProvider) {
  dialog.warning({
    title: 'Delete LLM Provider',
    content: `Are you sure you want to delete "${provider.displayName}"?`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await llmConfigApi.delete(provider.id);
        message.success('Provider deleted successfully');
        await loadProviders();
      } catch (error) {
        message.error('Failed to delete provider');
      }
    },
  });
}

async function handleToggle(providerId: string) {
  const provider = providers.value.find((p) => p.id === providerId);
  if (!provider) return;

  try {
    await llmConfigApi.update(providerId, { enabled: !provider.enabled });
    await loadProviders();
    llmStore.loadProviders();
    message.success(`Provider ${provider.enabled ? 'disabled' : 'enabled'}`);
  } catch (error) {
    message.error('Failed to update provider');
  }
}

async function handleSetDefault(provider: LLMProvider) {
  try {
    await llmConfigApi.setDefault(provider.id);
    message.success(`${provider.displayName} set as default`);
    await loadProviders();
    llmStore.loadProviders();
  } catch (error) {
    message.error('Failed to set default provider');
  }
}

async function handleTestConnection(provider: LLMProvider) {
  testingProviderId.value = provider.id;
  try {
    const result = await llmConfigApi.testConnection(provider.id);
    if (result.success) {
      message.success(result.message || 'Connection successful');
    } else {
      message.error(result.message || 'Connection failed');
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || 'Connection test failed');
  } finally {
    testingProviderId.value = null;
  }
}

// Export functions
function handleExportCSV() {
  const data = filteredProviders.value.map((p) => ({
    'Display Name': p.displayName,
    Provider: p.provider,
    'Model ID': p.modelId,
    Status: p.enabled ? 'Enabled' : 'Disabled',
    Default: p.isDefault ? 'Yes' : 'No',
    'Max Tokens': p.maxTokens,
    Temperature: p.temperature,
    'Top P': p.topP,
    'Created At': p.createdAt,
  }));

  const filename = getExportFilename('llm-providers');
  exportToCSV(data, filename);
  message.success('Exported to CSV successfully');
}

function handleExportJSON() {
  const filename = getExportFilename('llm-providers');
  exportToJSON(filteredProviders.value, filename);
  message.success('Exported to JSON successfully');
}

// ==================== COLUMNS ====================

const columns = computed<DataTableColumns<LLMProvider>>(() => [
  {
    title: 'Provider',
    key: 'displayName',
    width: 280,
    sorter: (a, b) => a.displayName.localeCompare(b.displayName),
    render(row) {
      const { color, bg } = getProviderColor(row.provider);
      return h('div', { class: 'provider-name-cell', style: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
        h('div', {
          style: {
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: bg,
            flexShrink: '0',
          },
        }, [
          h(Icon, { icon: getProviderIcon(row.provider), width: 16, height: 16, style: { color } }),
        ]),
        h('div', { class: 'provider-cell-info' }, [
          h('div', { style: 'display: flex; align-items: center; gap: 6px' }, [
            h(NText, { strong: true, style: 'font-size: 12px; font-weight: 600' }, { default: () => row.displayName }),
            row.isDefault ? h(NTag, { type: 'warning', size: 'small', bordered: false }, { default: () => 'Default' }) : null,
          ]),
          h(NText, { depth: 3, style: 'font-size: 11px; font-family: monospace' }, { default: () => row.modelId }),
        ]),
      ]);
    },
  },
  {
    title: 'Type',
    key: 'provider',
    width: 140,
    align: 'center',
    sorter: (a, b) => a.provider.localeCompare(b.provider),
    render(row) {
      const { color, bg } = getProviderColor(row.provider);
      return h(
        NTag,
        {
          size: 'small',
          bordered: false,
          style: `color: ${color}; background: ${bg}; font-weight: 700;`,
        },
        {
          default: () => row.provider.toUpperCase(),
          icon: () => h(Icon, { icon: getProviderIcon(row.provider), width: 14, style: `color: ${color}` }),
        }
      );
    },
  },
  {
    title: 'Status',
    key: 'enabled',
    width: 160,
    align: 'center',
    sorter: (a, b) => Number(a.enabled) - Number(b.enabled),
    render(row) {
      const status = row.enabled ? 'enabled' : 'disabled';
      const config = statusBadgeColors[status];
      return h('div', { style: 'display: flex; align-items: center; justify-content: center; gap: 8px' }, [
        h(NSwitch, {
          value: row.enabled,
          size: 'small',
          onUpdateValue: () => handleToggle(row.id),
        }),
        h('span', {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor: config.bg,
            color: config.color,
            textTransform: 'uppercase',
          },
        }, status),
      ]);
    },
  },
  {
    title: 'Default',
    key: 'isDefault',
    width: 100,
    align: 'center',
    sorter: (a, b) => Number(b.isDefault) - Number(a.isDefault),
    render(row) {
      if (row.isDefault) {
        return h(
          NTag,
          {
            type: 'warning',
            size: 'small',
            bordered: false,
            round: true,
          },
          {
            default: () => 'Default',
            icon: () => h(Icon, { icon: 'carbon:star-filled', width: 14 }),
          }
        );
      }
      return h('span', { style: 'color: var(--n-text-color-3); font-size: 12px' }, '—');
    },
  },
  {
    title: 'Max Tokens',
    key: 'maxTokens',
    align: 'center',
    width: 120,
    sorter: (a, b) => (a.maxTokens || 4096) - (b.maxTokens || 4096),
    render(row) {
      return h('span', { style: 'font-weight: 600; font-size: 13px' }, (row.maxTokens || 4096).toLocaleString());
    },
  },
  {
    title: 'Temperature',
    key: 'temperature',
    align: 'center',
    width: 120,
    sorter: (a, b) => (a.temperature || 0.7) - (b.temperature || 0.7),
    render(row) {
      return h('span', { style: 'font-weight: 600; font-size: 13px' }, (row.temperature || 0.7).toFixed(2));
    },
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 80,
    align: 'center',
    fixed: 'right',
    render(row) {
      const options: DropdownOption[] = [
        {
          label: 'Test Connection',
          key: 'test',
          icon: () => h(Icon, { icon: 'carbon:connection-signal', width: 16, height: 16 }),
          disabled: testingProviderId.value === row.id,
        },
        {
          label: 'Set as Default',
          key: 'setDefault',
          disabled: row.isDefault,
          icon: () => h(Icon, { icon: 'carbon:star', width: 16, height: 16 }),
        },
        {
          label: 'Edit',
          key: 'edit',
          icon: () => h(Icon, { icon: 'carbon:edit', width: 16, height: 16 }),
        },
        { type: 'divider', key: 'd1' },
        {
          label: 'Delete',
          key: 'delete',
          icon: () => h(Icon, { icon: 'carbon:trash-can', width: 16, height: 16 }),
          props: { class: 'delete-action' },
        },
      ];

      function handleActionSelect(key: string) {
        switch (key) {
          case 'test':
            handleTestConnection(row);
            break;
          case 'setDefault':
            handleSetDefault(row);
            break;
          case 'edit':
            openEditModal(row);
            break;
          case 'delete':
            handleDelete(row);
            break;
        }
      }

      return h(
        NDropdown,
        { options, trigger: 'click', onSelect: handleActionSelect },
        {
          default: () =>
            h(
              NButton,
              { size: 'small', quaternary: true },
              { icon: () => h(Icon, { icon: 'carbon:overflow-menu-vertical', width: 16, height: 16 }) }
            ),
        }
      );
    },
  },
]);

onMounted(() => {
  loadProviders();
});
</script>

<template>
  <div class="llm-providers-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          AI Assistant (BYOLLM)
        </h2>
        <p class="page-subtitle">
          Bring Your Own LLM - Configure AI models for chatbot
        </p>
      </div>
      <n-button
        type="primary"
        @click="openCreateModal"
      >
        <template #icon>
          <Icon icon="carbon:add" />
        </template>
        Add Provider
      </n-button>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <StatPanel
        v-for="stat in statCards"
        :key="stat.title"
        v-bind="stat"
      />
    </div>

    <!-- Filters -->
    <n-card class="filters-card">
      <div class="filters-row">
        <n-input
          v-model:value="searchQuery"
          placeholder="Search providers..."
          clearable
          style="width: 300px"
        >
          <template #prefix>
            <Icon icon="carbon:search" />
          </template>
        </n-input>
        <n-select
          v-model:value="filterProvider"
          :options="providerTypeOptions"
          placeholder="All Providers"
          clearable
          style="width: 200px"
        />
        <n-select
          v-model:value="filterStatus"
          :options="statusOptions"
          placeholder="All Status"
          clearable
          style="width: 150px"
        />
      </div>
    </n-card>

    <!-- Data Table -->
    <div class="section">
      <!-- Section Header -->
      <div class="section-header">
        <div class="section-title">
          <Icon
            icon="carbon:ai-status"
            class="section-icon"
          />
          <span>LLM Providers</span>
          <n-tag
            :bordered="false"
            type="info"
            size="small"
            round
          >
            {{ totalProviders }} total providers
          </n-tag>
        </div>
        <div class="table-actions">
          <n-button-group size="small">
            <n-button @click="handleExportCSV">
              <template #icon>
                <Icon icon="carbon:document-export" />
              </template>
              CSV
            </n-button>
            <n-button @click="handleExportJSON">
              <template #icon>
                <Icon icon="carbon:document-export" />
              </template>
              JSON
            </n-button>
          </n-button-group>
        </div>
      </div>

      <!-- Table Content -->
      <!-- datatableId: LLM30001 -->
      <div class="table-content">
        <n-data-table
          class="tfo-datatable"
          :columns="columns"
          :data="filteredProviders"
          :loading="isLoading"
          :scroll-x="1200"
          :pagination="tablePagination"
          :bordered="false"
          :single-line="false"
          striped
          size="small"
        />
      </div>
    </div>

    <!-- Form Modal (Create/Edit) -->
    <ProviderFormModal
      v-model:show="showFormModal"
      :provider="selectedProvider"
      @save="handleSave"
    />
  </div>
</template>

<style scoped lang="scss">
@import '@/styles/tfo-variables.scss';
@import '@/styles/tfo-table-styles.scss';

.llm-providers-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .page-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--n-text-color);
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--n-text-color-3);
    margin: 0;
  }
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filters-card {
  .filters-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.provider-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.provider-cell-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

:deep(.n-data-table-td) {
  padding: 6px 16px !important;
}

:deep(.n-data-table-th) {
  padding: 6px 16px !important;
}
</style>