<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NCheckbox,
  NButton,
  NSlider,
  NText,
  useMessage,
} from 'naive-ui';
import type { FormInst } from 'naive-ui';
import type { LLMProvider, CreateLLMProviderRequest } from '@/api/llm-config';
import { brandDefaults } from '@/config';
import './custom-llm-icons';

const props = defineProps<{
  show: boolean;
  provider?: LLMProvider | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'save', data: CreateLLMProviderRequest | Partial<LLMProvider>): void;
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);

// ==================== FORM TABS ====================

type FormTab = 'general' | 'authentication' | 'parameters' | 'advanced';

const activeTab = ref<FormTab>('general');

const formTabs: { label: string; value: FormTab; icon: string }[] = [
  { label: 'General', value: 'general', icon: 'carbon:settings' },
  { label: 'Authentication', value: 'authentication', icon: 'carbon:password' },
  { label: 'Parameters', value: 'parameters', icon: 'carbon:settings-adjust' },
  { label: 'Advanced', value: 'advanced', icon: 'carbon:advanced' },
];

const tabDescriptions: Record<FormTab, string> = {
  general: 'Basic provider information including type, name, and model',
  authentication: 'API credentials and endpoint configuration',
  parameters: 'Model parameters like temperature, tokens, and top-p',
  advanced: 'Advanced settings and default configuration',
};

// ==================== PROVIDER OPTIONS ====================

const providerTypeOptions = [
  { label: 'Anthropic Claude', value: 'anthropic', icon: 'simple-icons:anthropic' },
  { label: 'OpenAI GPT', value: 'openai', icon: 'simple-icons:openai' },
  { label: 'Google Gemini', value: 'google', icon: 'simple-icons:google' },
  { label: 'DeepSeek', value: 'deepseek', icon: 'simple-icons:deepseek' },
  { label: 'Qwen (Alibaba)', value: 'qwen', icon: 'simple-icons:qwen' },
  { label: 'Ollama (Local)', value: 'ollama', icon: 'simple-icons:ollama' },
  { label: 'Mistral AI', value: 'mistral', icon: 'simple-icons:mistralai' },
  { label: 'xAI Grok', value: 'grok', icon: 'logos:grok-icon' },
  { label: 'Kimi (Moonshot)', value: 'kimi', icon: 'simple-icons:moonshotai' },
  { label: 'GLM (Z.ai)', value: 'zhipu', icon: 'custom:zai' },
  { label: 'MiMo (Xiaomi)', value: 'mimo', icon: 'custom:mimo' },
  { label: 'Custom', value: 'custom', icon: 'carbon:settings' },
];

const modelPresets: Record<string, string[]> = {
  anthropic: ['claude-opus-4-7', 'claude-opus-4-6', 'claude-sonnet-4-6', 'claude-sonnet-4-5-20250929', 'claude-haiku-4-5'],
  openai: ['gpt-5.5', 'gpt-5', 'gpt-4.1', 'gpt-4.1-mini', 'o3', 'gpt-4o'],
  google: ['gemini-3', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  deepseek: ['deepseek-v4-pro', 'deepseek-chat', 'deepseek-v3.2', 'deepseek-reasoner'],
  qwen: ['qwen3-max', 'qwen3-235b-a22b', 'qwen3-32b', 'qwen-max', 'qwen2.5-72b-instruct'],
  ollama: ['llama4:maverick-17b', 'gemma4:26b', 'qwen3:32b', 'deepseek-r1:70b', 'llama3.3:70b', 'phi4:14b'],
  mistral: ['mistral-medium-2508', 'mistral-large-2411', 'mistral-small-2506', 'codestral-2508'],
  grok: ['grok-4.20-0309-reasoning', 'grok-4.20-0309-non-reasoning', 'grok-4-1-fast-reasoning', 'grok-3'],
  kimi: ['kimi-k2.6', 'kimi-k2.5', 'moonshot-v1-128k', 'moonshot-v1-32k'],
  zhipu: ['glm-5.1', 'glm-5', 'glm-4.7', 'glm-4.5', 'glm-4-flash'],
  mimo: ['mimo-v2-pro', 'mimo-v2-flash', 'mimo-v2-omni', 'mimo-7b'],
  custom: [],
};

// ==================== FORM DATA ====================

const form = ref<{
  // General
  name: string;
  displayName: string;
  provider: string;
  modelId: string;

  // Authentication
  apiKey: string;
  apiEndpoint: string;

  // Parameters
  maxTokens: number;
  temperature: number;
  topP: number;

  // Advanced
  enabled: boolean;
  isDefault: boolean;
}>({
  name: '',
  displayName: '',
  provider: 'anthropic',
  modelId: '',
  apiKey: '',
  apiEndpoint: '',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1.0,
  enabled: true,
  isDefault: false,
});

const modelOptions = computed(() => {
  const presets = modelPresets[form.value.provider] || [];
  return presets.map(m => ({ label: m, value: m }));
});

const isEditMode = computed(() => !!props.provider);
const modalTitle = computed(() => isEditMode.value ? 'Edit LLM Provider' : 'Add LLM Provider');

// ==================== WATCHERS ====================

watch(() => props.show, (show) => {
  if (show) {
    if (props.provider) {
      // Edit mode
      form.value = {
        name: props.provider.name || '',
        displayName: props.provider.displayName,
        provider: props.provider.provider,
        modelId: props.provider.modelId,
        apiKey: '',
        apiEndpoint: props.provider.apiEndpoint || '',
        maxTokens: props.provider.maxTokens || 4096,
        temperature: props.provider.temperature || 0.7,
        topP: props.provider.topP || 1.0,
        enabled: props.provider.enabled,
        isDefault: props.provider.isDefault,
      };
    } else {
      // Create mode
      form.value = {
        name: '',
        displayName: '',
        provider: 'anthropic',
        modelId: '',
        apiKey: '',
        apiEndpoint: '',
        maxTokens: 4096,
        temperature: 0.7,
        topP: 1.0,
        enabled: true,
        isDefault: false,
      };
    }
    activeTab.value = 'general';
  }
});

watch(() => form.value.provider, () => {
  // Reset model when provider changes
  form.value.modelId = '';
});

// ==================== METHODS ====================

function handleClose() {
  emit('update:show', false);
}

async function handleSave() {
  try {
    await formRef.value?.validate();
  } catch {
    message.warning('Please fill in all required fields');
    return;
  }

  if (!form.value.displayName || !form.value.modelId) {
    message.warning('Display name and model ID are required');
    return;
  }

  emit('save', form.value);
}

function handleTabChange(tab: FormTab) {
  activeTab.value = tab;
}
</script>

<template>
  <n-modal
    :show="show" :mask-closable="false" preset="card" :title="modalTitle" class="provider-form-modal"
    style="width: 900px; max-width: 95vw" @update:show="handleClose"
  >
    <div class="modal-content">
      <!-- Vertical Tabs -->
      <div class="vertical-tabs">
        <div
          v-for="tab in formTabs" :key="tab.value" class="tab-item" :class="{ active: activeTab === tab.value }"
          @click="handleTabChange(tab.value)"
        >
          <Icon :icon="tab.icon" class="tab-icon" />
          <span class="tab-label">{{ tab.label }}</span>
        </div>
      </div>

      <!-- Form Content -->
      <div class="form-content">
        <div class="tab-description">
          <Icon icon="carbon:information" />
          <span>{{ tabDescriptions[activeTab] }}</span>
        </div>

        <n-form ref="formRef" :model="form" label-placement="top" label-width="120">
          <!-- General Tab -->
          <div v-show="activeTab === 'general'" class="tab-panel">
            <n-form-item label="Provider Type" required>
              <n-select v-model:value="form.provider" :options="providerTypeOptions" :disabled="isEditMode" />
            </n-form-item>

            <n-form-item label="Display Name" required>
              <n-input v-model:value="form.displayName" placeholder="e.g., My Claude Provider" />
            </n-form-item>

            <n-form-item label="Model ID" required>
              <n-select
                v-if="modelOptions.length > 0" v-model:value="form.modelId" :options="modelOptions" filterable
                tag placeholder="Select or enter model ID"
              />
              <n-input v-else v-model:value="form.modelId" placeholder="e.g., claude-sonnet-4-20250514" />
            </n-form-item>

            <n-form-item label="Internal Name (Optional)">
              <n-input v-model:value="form.name" placeholder="Auto-generated if empty" />
              <template #feedback>
                <n-text depth="3" style="font-size: 12px">
                  Used for internal identification. Leave empty to auto-generate.
                </n-text>
              </template>
            </n-form-item>
          </div>

          <!-- Authentication Tab -->
          <div v-show="activeTab === 'authentication'" class="tab-panel">
            <n-form-item label="API Key" :required="form.provider !== 'ollama'">
              <n-input
                v-model:value="form.apiKey" type="password" show-password-on="click"
                :placeholder="isEditMode ? 'Leave empty to keep current key' : 'Enter API key'"
              />
              <template #feedback>
                <n-text depth="3" style="font-size: 12px">
                  Your API key is encrypted and stored securely.
                </n-text>
              </template>
            </n-form-item>

            <n-form-item label="API Endpoint (Optional)">
              <n-input v-model:value="form.apiEndpoint" :placeholder="brandDefaults.exampleUrl('api', '/v1')" />
              <template #feedback>
                <n-text depth="3" style="font-size: 12px">
                  Custom endpoint for self-hosted or proxy services. Leave empty for default.
                </n-text>
              </template>
            </n-form-item>

            <div v-if="form.provider === 'ollama'" class="info-box">
              <Icon icon="carbon:information" />
              <div>
                <strong>Ollama Local Setup</strong>
                <p>For local Ollama, use endpoint: <code>http://localhost:11434</code></p>
                <p>No API key required for local instances.</p>
              </div>
            </div>
          </div>

          <!-- Parameters Tab -->
          <div v-show="activeTab === 'parameters'" class="tab-panel">
            <n-form-item label="Max Tokens">
              <n-input-number v-model:value="form.maxTokens" :min="1" :max="100000" :step="256" style="width: 100%" />
              <template #feedback>
                <n-text depth="3" style="font-size: 12px">
                  Maximum number of tokens in the response (1-100000)
                </n-text>
              </template>
            </n-form-item>

            <n-form-item label="Temperature">
              <div class="slider-container">
                <n-slider
                  v-model:value="form.temperature" :min="0" :max="2" :step="0.1"
                  :marks="{ 0: 'Precise', 1: 'Balanced', 2: 'Creative' }"
                />
                <div class="slider-value">{{ form.temperature }}</div>
              </div>
              <template #feedback>
                <n-text depth="3" style="font-size: 12px">
                  Controls randomness: 0 = deterministic, 2 = very creative
                </n-text>
              </template>
            </n-form-item>

            <n-form-item label="Top P (Nucleus Sampling)">
              <div class="slider-container">
                <n-slider
                  v-model:value="form.topP" :min="0" :max="1" :step="0.05"
                  :marks="{ 0: '0', 0.5: '0.5', 1: '1' }"
                />
                <div class="slider-value">{{ form.topP }}</div>
              </div>
              <template #feedback>
                <n-text depth="3" style="font-size: 12px">
                  Controls diversity: lower = more focused, higher = more diverse
                </n-text>
              </template>
            </n-form-item>
          </div>

          <!-- Advanced Tab -->
          <div v-show="activeTab === 'advanced'" class="tab-panel">
            <n-form-item>
              <n-checkbox v-model:checked="form.enabled">
                Enable this provider
              </n-checkbox>
              <template #feedback>
                <n-text depth="3" style="font-size: 12px">
                  Disabled providers won't be available for selection in the chatbot
                </n-text>
              </template>
            </n-form-item>

            <n-form-item>
              <n-checkbox v-model:checked="form.isDefault">
                Set as default provider
              </n-checkbox>
              <template #feedback>
                <n-text depth="3" style="font-size: 12px">
                  The default provider is automatically selected in the chatbot
                </n-text>
              </template>
            </n-form-item>

            <div class="info-box">
              <Icon icon="carbon:information" />
              <div>
                <strong>Provider Configuration</strong>
                <p>After saving, you can test the connection from the main page.</p>
                <p>Make sure your API key has the necessary permissions.</p>
              </div>
            </div>
          </div>
        </n-form>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer tfo-modal-footer">
        <n-button @click="handleClose">Cancel</n-button>
        <n-button type="primary" @click="handleSave">
          {{ isEditMode ? 'Save Changes' : 'Create Provider' }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
.provider-form-modal {
  :deep(.n-card__content) {
    padding: 0;
  }
}

.modal-content {
  display: flex;
  min-height: 500px;
}

.vertical-tabs {
  width: 200px;
  border-right: 1px solid var(--n-border-color);
  padding: 16px 0;
  flex-shrink: 0;

  :root:not(.dark) & {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  :root.dark & {
    background: rgba(255, 255, 255, 0.02);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--n-text-color-3);

  &:hover {
    background: rgba(99, 102, 241, 0.1);
    color: var(--n-text-color);
  }

  &.active {
    background: rgba(99, 102, 241, 0.15);
    color: var(--n-primary-color);
    border-right: 3px solid var(--n-primary-color);
    font-weight: 600;

    .tab-icon {
      color: var(--n-primary-color);
    }
  }
}

.tab-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.tab-label {
  font-size: 14px;
}

.form-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  max-height: 600px;
}

.tab-description {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  background: rgba(99, 102, 241, 0.1);
  border-left: 3px solid var(--n-primary-color);
  border-radius: 4px;
  font-size: 13px;
  color: var(--n-text-color-2);

  :deep(svg) {
    font-size: 16px;
    color: var(--n-primary-color);
    flex-shrink: 0;
  }
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slider-container {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;

  :deep(.n-slider) {
    flex: 1;
  }
}

.slider-value {
  min-width: 50px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: var(--n-primary-color);
}

.info-box {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  margin-top: 8px;

  :root.dark & {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
  }

  :deep(svg) {
    font-size: 20px;
    color: #3b82f6;
    flex-shrink: 0;
    margin-top: 2px;
  }

  strong {
    display: block;
    margin-bottom: 8px;
    color: var(--n-text-color);
  }

  p {
    margin: 4px 0;
    font-size: 13px;
    color: var(--n-text-color-2);
  }

  code {
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 12px;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--n-border-color);

  :root:not(.dark) & {
    border-color: #e2e8f0;
  }

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.1);
  }
}

@media (max-width: 768px) {
  .modal-content {
    flex-direction: column;
  }

  .vertical-tabs {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--n-border-color);
    display: flex;
    overflow-x: auto;
    padding: 8px;
  }

  .tab-item {
    flex-direction: column;
    gap: 4px;
    padding: 8px 16px;
    border-right: none;
    border-bottom: 3px solid transparent;

    &.active {
      border-right: none;
      border-bottom-color: var(--n-primary-color);
    }
  }

  .tab-label {
    font-size: 12px;
  }

  .form-content {
    max-height: 400px;
  }
}
</style>