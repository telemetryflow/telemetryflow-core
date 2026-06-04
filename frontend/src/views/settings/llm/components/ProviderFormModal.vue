<script setup lang="ts">
/**
 * LLM Provider Form Modal - Vertical Tabs Style
 * BYOLLM (Bring Your Own LLM) Configuration
 */

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
  NDivider,
  NTag,
  NSpin,
  useMessage,
} from 'naive-ui';
import type { FormInst } from 'naive-ui';
import type { LLMProvider, CreateLLMProviderRequest } from '@/api/llm-config';
import { llmConfigApi } from '@/api/llm-config';
import { brandDefaults } from '@/config';
import '../custom-llm-icons';

const props = defineProps<{
  show: boolean;
  provider?: LLMProvider | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'save', data: CreateLLMProviderRequest): void;
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);

// ==================== FORM TABS ====================

type FormTab = 'general' | 'authentication' | 'parameters' | 'advanced' | 'test';

const activeTab = ref<FormTab>('general');

const formTabs: { label: string; value: FormTab; icon: string }[] = [
  { label: 'General', value: 'general', icon: 'carbon:settings' },
  { label: 'Authentication', value: 'authentication', icon: 'carbon:password' },
  { label: 'Parameters', value: 'parameters', icon: 'carbon:settings-adjust' },
  { label: 'Advanced', value: 'advanced', icon: 'carbon:settings-services' },
  { label: 'Test', value: 'test', icon: 'carbon:connection-signal' },
];

const tabDescriptions: Record<FormTab, string> = {
  general: 'Basic provider settings including type, name, and model',
  authentication: 'API key and endpoint configuration',
  parameters: 'Model parameters like temperature and max tokens',
  advanced: 'Advanced settings and default configuration',
  test: 'Validate API key and test connection to the provider',
};

// ==================== FORM DATA ====================

const form = ref<CreateLLMProviderRequest>({
  name: '',
  displayName: '',
  provider: 'anthropic',
  modelId: '',
  apiKey: '',
  apiEndpoint: '',
  enabled: true,
  isDefault: false,
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1.0,
});

const providerTypeOptions = [
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

// ==================== TEST STATE ====================

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const testStatus = ref<TestStatus>('idle');
const testMessage = ref('');
const testLatencyMs = ref(0);

// Whether the test tab can perform a test
const canTest = computed(() => {
  if (isEditMode.value) {
    // Edit: can test stored key (no new key required) OR new key if entered
    return true;
  }
  // Create: must have an API key entered
  return !!form.value.apiKey?.trim();
});

const testKeySource = computed(() => {
  if (isEditMode.value && form.value.apiKey?.trim()) return 'new-key';
  if (isEditMode.value) return 'stored';
  return 'form';
});

const testKeyHint = computed(() => {
  if (testKeySource.value === 'stored') {
    return props.provider?.apiKey || '(stored, encrypted)';
  }
  const k = form.value.apiKey || '';
  if (!k) return '(not entered)';
  return k.substring(0, 5) + '...' + k.slice(-4);
});

async function handleTest() {
  if (!canTest.value) {
    message.warning('Enter an API key in the Authentication tab before testing');
    activeTab.value = 'authentication';
    return;
  }

  testStatus.value = 'testing';
  testMessage.value = '';
  testLatencyMs.value = 0;
  const t0 = Date.now();

  try {
    let result: { success: boolean; message: string };

    if (testKeySource.value === 'stored' && props.provider?.id) {
      // Edit mode, test the stored (encrypted) key
      result = await llmConfigApi.testConnection(props.provider.id);
    } else {
      // Create mode or edit with a new key entered
      result = await llmConfigApi.testKey({
        providerType: form.value.provider,
        apiKey: form.value.apiKey!,
        baseUrl: form.value.apiEndpoint || undefined,
      });
    }

    testLatencyMs.value = Date.now() - t0;
    testStatus.value = result.success ? 'success' : 'error';
    testMessage.value = result.message;
  } catch (err: unknown) {
    testLatencyMs.value = Date.now() - t0;
    testStatus.value = 'error';
    testMessage.value = err instanceof Error ? err.message : 'Connection test failed';
  }
}

function resetTestState() {
  testStatus.value = 'idle';
  testMessage.value = '';
  testLatencyMs.value = 0;
}

// ==================== VALIDATION ====================

const formRules = {
  displayName: [{ required: true, message: 'Display name is required', trigger: 'blur' }],
  modelId: [{ required: true, message: 'Model ID is required', trigger: 'blur' }],
};

// ==================== WATCH FOR EDIT MODE ====================

const isEditMode = computed(() => !!props.provider);
const modalTitle = computed(() => (isEditMode.value ? 'Edit LLM Provider' : 'Add LLM Provider'));

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      activeTab.value = 'general';
      resetTestState();
      if (props.provider) {
        // Edit mode - populate form
        form.value = {
          name: props.provider.name || '',
          displayName: props.provider.displayName,
          provider: props.provider.provider,
          modelId: props.provider.modelId,
          apiKey: '', // Don't populate for security
          apiEndpoint: props.provider.apiEndpoint || '',
          enabled: props.provider.enabled,
          isDefault: props.provider.isDefault,
          maxTokens: props.provider.maxTokens || 4096,
          temperature: props.provider.temperature || 0.7,
          topP: props.provider.topP || 1.0,
        };
      } else {
        // Create mode - reset form
        form.value = {
          name: '',
          displayName: '',
          provider: 'anthropic',
          modelId: '',
          apiKey: '',
          apiEndpoint: '',
          enabled: true,
          isDefault: false,
          maxTokens: 4096,
          temperature: 0.7,
          topP: 1.0,
        };
      }
    }
  }
);

// Reset test when API key or provider changes
watch(() => [form.value.apiKey, form.value.provider, form.value.apiEndpoint], () => {
  if (testStatus.value !== 'idle') resetTestState();
});

// ==================== ACTIONS ====================

function closeModal() {
  emit('update:show', false);
}

async function handleSave() {
  try {
    await formRef.value?.validate();
  } catch {
    message.warning('Please fill in all required fields');
    activeTab.value = 'general';
    return;
  }

  // Auto-generate name from displayName if not provided
  if (!form.value.name) {
    form.value.name = form.value.displayName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  // In edit mode, omit apiKey from payload if user left the new-key field empty
  const payload = { ...form.value };
  if (isEditMode.value && !payload.apiKey) {
    delete payload.apiKey;
  }

  emit('save', payload);
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="modalTitle"
    :style="{ maxWidth: '860px', width: '95vw' }"
    :mask-closable="false"
    @update:show="$emit('update:show', $event)"
  >
    <div class="provider-form-content">
      <!-- Left Side: Vertical Tabs -->
      <div class="form-tabs">
        <div
          v-for="tab in formTabs"
          :key="tab.value"
          class="form-tab-item"
          :class="{ active: activeTab === tab.value, 'test-tab': tab.value === 'test' }"
          @click="activeTab = tab.value"
        >
          <Icon
            :icon="tab.icon"
            class="tab-icon"
          />
          <span class="tab-label">{{ tab.label }}</span>
          <!-- Status dot on Test tab -->
          <span
            v-if="tab.value === 'test' && testStatus !== 'idle'"
            class="test-dot"
            :class="testStatus"
          />
        </div>
        <div class="tab-description">
          <p>{{ tabDescriptions[activeTab] }}</p>
        </div>
      </div>

      <!-- Right Side: Form Content -->
      <div class="form-content">
        <div class="form-box">
          <NForm
            ref="formRef"
            :model="form"
            :rules="formRules"
            label-placement="top"
          >
            <!-- General Tab -->
            <template v-if="activeTab === 'general'">
              <NFormItem
                label="Provider Type"
                path="provider"
              >
                <NSelect
                  v-model:value="form.provider"
                  :options="providerTypeOptions"
                  :disabled="isEditMode"
                />
                <template
                  v-if="isEditMode"
                  #feedback
                >
                  <span class="form-hint">Provider type cannot be changed after creation</span>
                </template>
              </NFormItem>

              <NFormItem
                label="Display Name"
                path="displayName"
                required
              >
                <NInput
                  v-model:value="form.displayName"
                  placeholder="e.g., Claude Sonnet 4"
                />
              </NFormItem>

              <NFormItem
                label="Model ID"
                path="modelId"
                required
              >
                <NInput
                  v-model:value="form.modelId"
                  placeholder="e.g., claude-sonnet-4-6"
                />
                <template #feedback>
                  <span class="form-hint">The specific model identifier from your provider</span>
                </template>
              </NFormItem>

              <NFormItem label="Internal Name (Optional)">
                <NInput
                  v-model:value="form.name"
                  placeholder="Auto-generated from display name"
                />
                <template #feedback>
                  <span class="form-hint">Unique identifier for API usage (auto-generated if empty)</span>
                </template>
              </NFormItem>
            </template>

            <!-- Authentication Tab -->
            <template v-if="activeTab === 'authentication'">
              <!-- Edit mode: show current masked key hint -->
              <template v-if="isEditMode && props.provider?.apiKey">
                <NFormItem label="Current API Key">
                  <NInput
                    :value="props.provider.apiKey"
                    type="password"
                    readonly
                    :input-props="{ style: 'cursor: default; opacity: 0.7;' }"
                  >
                    <template #suffix>
                      <Icon
                        icon="carbon:locked"
                        style="color: var(--n-text-color-3); font-size: 14px;"
                      />
                    </template>
                  </NInput>
                  <template #feedback>
                    <span class="form-hint">Stored key (masked). Enter a new key below to replace it.</span>
                  </template>
                </NFormItem>

                <NFormItem label="New API Key (optional)">
                  <NInput
                    v-model:value="form.apiKey"
                    type="password"
                    show-password-on="click"
                    placeholder="Leave empty to keep existing key"
                    clearable
                  />
                  <template #feedback>
                    <span class="form-hint">Only fill in to replace the current API key</span>
                  </template>
                </NFormItem>
              </template>

              <!-- Create mode: standard API key input -->
              <template v-else>
                <NFormItem label="API Key">
                  <NInput
                    v-model:value="form.apiKey"
                    type="password"
                    show-password-on="click"
                    placeholder="Enter your API key"
                  />
                  <template #feedback>
                    <span class="form-hint">Your provider's API authentication key</span>
                  </template>
                </NFormItem>
              </template>

              <NFormItem label="API Endpoint (Optional)">
                <NInput
                  v-model:value="form.apiEndpoint"
                  :placeholder="brandDefaults.exampleUrl('api', '/v1')"
                />
                <template #feedback>
                  <span class="form-hint">Custom endpoint URL (leave empty for default)</span>
                </template>
              </NFormItem>

              <div class="info-box">
                <Icon
                  icon="carbon:information"
                  class="info-icon"
                />
                <div class="info-content">
                  <strong>Security Note:</strong> API keys are encrypted and stored securely. They are never exposed in
                  logs or responses.
                </div>
              </div>
            </template>

            <!-- Parameters Tab -->
            <template v-if="activeTab === 'parameters'">
              <NFormItem label="Max Tokens">
                <NInputNumber
                  v-model:value="form.maxTokens"
                  :min="1"
                  :max="100000"
                  style="width: 100%"
                >
                  <template #suffix>
                    tokens
                  </template>
                </NInputNumber>
                <template #feedback>
                  <span class="form-hint">Maximum number of tokens to generate (1-100000)</span>
                </template>
              </NFormItem>

              <NFormItem label="Temperature">
                <NInputNumber
                  v-model:value="form.temperature"
                  :min="0"
                  :max="2"
                  :step="0.1"
                  style="width: 100%"
                >
                  <template #suffix>
                    {{ form.temperature }}
                  </template>
                </NInputNumber>
                <template #feedback>
                  <span class="form-hint">Controls randomness: 0 = focused, 2 = creative (0.0-2.0)</span>
                </template>
              </NFormItem>

              <NFormItem label="Top P">
                <NInputNumber
                  v-model:value="form.topP"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  style="width: 100%"
                >
                  <template #suffix>
                    {{ form.topP }}
                  </template>
                </NInputNumber>
                <template #feedback>
                  <span class="form-hint">Nucleus sampling threshold (0.0-1.0)</span>
                </template>
              </NFormItem>

              <div class="info-box">
                <Icon
                  icon="carbon:information"
                  class="info-icon"
                />
                <div class="info-content">
                  <strong>Recommended Settings:</strong>
                  <ul>
                    <li>Code generation: temp=0.2, top_p=0.95</li>
                    <li>Creative writing: temp=0.8, top_p=0.95</li>
                    <li>Analysis: temp=0.5, top_p=1.0</li>
                  </ul>
                </div>
              </div>
            </template>

            <!-- Advanced Tab -->
            <template v-if="activeTab === 'advanced'">
              <NFormItem label="Enable Provider">
                <div class="checkbox-wrapper">
                  <NCheckbox v-model:checked="form.enabled">
                    Enable this provider for use in AI Assistant
                  </NCheckbox>
                </div>
                <template #feedback>
                  <span class="form-hint">Disabled providers won't be available for selection</span>
                </template>
              </NFormItem>

              <NDivider style="margin: 16px 0">
                Default Configuration
              </NDivider>

              <NFormItem label="Set as Default">
                <div class="checkbox-wrapper">
                  <NCheckbox v-model:checked="form.isDefault">
                    Use this provider as the default for AI Assistant
                  </NCheckbox>
                </div>
                <template #feedback>
                  <span class="form-hint">The default provider is used when no specific provider is selected</span>
                </template>
              </NFormItem>

              <div class="info-box warning">
                <Icon
                  icon="carbon:warning"
                  class="info-icon"
                />
                <div class="info-content">
                  <strong>Note:</strong> Setting this as default will remove the default flag from other providers.
                </div>
              </div>
            </template>

            <!-- ===== TEST TAB ===== -->
            <template v-if="activeTab === 'test'">
              <!-- Provider summary -->
              <div class="test-summary">
                <div class="test-summary-row">
                  <span class="test-summary-label">Provider</span>
                  <NTag
                    size="small"
                    :bordered="false"
                    type="info"
                  >
                    {{ form.provider }}
                  </NTag>
                </div>
                <div class="test-summary-row">
                  <span class="test-summary-label">Model</span>
                  <span class="test-summary-value">{{ form.modelId || '—' }}</span>
                </div>
                <div class="test-summary-row">
                  <span class="test-summary-label">API Key</span>
                  <span class="test-summary-value key-hint">{{ testKeyHint }}</span>
                </div>
                <div
                  v-if="form.apiEndpoint"
                  class="test-summary-row"
                >
                  <span class="test-summary-label">Endpoint</span>
                  <span class="test-summary-value">{{ form.apiEndpoint }}</span>
                </div>
                <div
                  v-if="isEditMode && testKeySource === 'new-key'"
                  class="test-summary-row"
                >
                  <span class="test-summary-label">Key Source</span>
                  <NTag
                    size="small"
                    :bordered="false"
                    type="warning"
                  >
                    New (unsaved)
                  </NTag>
                </div>
                <div
                  v-if="isEditMode && testKeySource === 'stored'"
                  class="test-summary-row"
                >
                  <span class="test-summary-label">Key Source</span>
                  <NTag
                    size="small"
                    :bordered="false"
                    type="default"
                  >
                    Stored (encrypted)
                  </NTag>
                </div>
              </div>

              <!-- Warning if create mode and no key entered -->
              <div
                v-if="!canTest"
                class="info-box warning"
                style="margin-bottom: 16px;"
              >
                <Icon
                  icon="carbon:warning"
                  class="info-icon"
                />
                <div class="info-content">
                  <strong>API Key required</strong> — go to the Authentication tab and enter your key before testing.
                </div>
              </div>

              <!-- Test button -->
              <NButton
                type="primary"
                :loading="testStatus === 'testing'"
                :disabled="!canTest || testStatus === 'testing'"
                style="width: 100%; height: 44px;"
                @click="handleTest"
              >
                <template #icon>
                  <NSpin
                    v-if="testStatus === 'testing'"
                    size="small"
                  />
                  <Icon
                    v-else
                    icon="carbon:connection-signal"
                  />
                </template>
                {{ testStatus === 'testing' ? 'Testing connection...' : 'Test Connection' }}
              </NButton>

              <!-- Result panel -->
              <div
                v-if="testStatus === 'success'"
                class="test-result success"
              >
                <div class="test-result-header">
                  <Icon
                    icon="carbon:checkmark-filled"
                    class="result-icon"
                  />
                  <span class="result-title">Connection Successful</span>
                  <NTag
                    v-if="testLatencyMs"
                    size="small"
                    :bordered="false"
                    type="success"
                  >
                    {{ testLatencyMs }}ms
                  </NTag>
                </div>
                <p class="result-message">
                  {{ testMessage }}
                </p>
              </div>

              <div
                v-else-if="testStatus === 'error'"
                class="test-result error"
              >
                <div class="test-result-header">
                  <Icon
                    icon="carbon:close-filled"
                    class="result-icon"
                  />
                  <span class="result-title">Connection Failed</span>
                  <NTag
                    v-if="testLatencyMs"
                    size="small"
                    :bordered="false"
                    type="error"
                  >
                    {{ testLatencyMs }}ms
                  </NTag>
                </div>
                <p class="result-message">
                  {{ testMessage }}
                </p>
              </div>

              <!-- Notes -->
              <div
                class="info-box"
                style="margin-top: 16px;"
              >
                <Icon
                  icon="carbon:information"
                  class="info-icon"
                />
                <div class="info-content">
                  <strong>How testing works</strong>
                  <ul>
                    <li>Sends a minimal 1-token request to verify authentication</li>
                    <li>Rate limit errors still mean the key is valid</li>
                    <li>For Ollama: verifies the endpoint is reachable</li>
                    <li>Testing does not save any changes to the provider</li>
                  </ul>
                </div>
              </div>
            </template>
          </NForm>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer tfo-modal-footer">
        <NButton
          type="primary"
          ghost
          @click="closeModal"
        >
          <template #icon>
            <Icon icon="carbon:close" />
          </template>
          Cancel
        </NButton>
        <NButton
          type="primary"
          ghost
          :disabled="!canTest || testStatus === 'testing'"
          style="margin-right: auto;"
          @click="activeTab = 'test'; handleTest()"
        >
          <template #icon>
            <Icon icon="carbon:connection-signal" />
          </template>
          Test
        </NButton>
        <NButton
          type="primary"
          @click="handleSave"
        >
          <template #icon>
            <Icon icon="carbon:save" />
          </template>
          {{ isEditMode ? 'Save Changes' : 'Create Provider' }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.provider-form-content {
  display: flex;
  gap: 16px;
  max-height: calc(75vh - 120px);
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
  color: var(--n-text-color-3);
  position: relative;

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--n-text-color);
  }

  &.active {
    background: rgba(99, 102, 241, 0.15);
    color: var(--n-primary-color);

    .tab-icon {
      color: var(--n-primary-color);
    }
  }

  &.test-tab.active {
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;

    .tab-icon {
      color: #10b981;
    }
  }

  .tab-icon {
    font-size: 18px;
    transition: color 0.2s ease;
  }

  .tab-label {
    white-space: nowrap;
    flex: 1;
  }
}

.test-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.testing {
    background: #f59e0b;
    animation: pulse 1s ease-in-out infinite;
  }

  &.success {
    background: #10b981;
  }

  &.error {
    background: #ef4444;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.tab-description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color);

  p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--n-text-color-3);
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

  :deep(.n-input) {

    .n-input__input-el,
    .n-input__placeholder {
      font-size: 14px;
    }
  }
}

.form-hint {
  font-size: 11px;
  color: var(--n-text-color-3);
  margin-top: 4px;
}

.checkbox-wrapper {
  height: 34px;
  display: flex;
  align-items: center;
}

// ===== TEST TAB STYLES =====

.test-summary {
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: var(--n-action-color);
}

.test-summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;

  & + & {
    border-top: 1px solid rgba(0, 0, 0, 0.04);

    :root.dark & {
      border-color: rgba(255, 255, 255, 0.05);
    }
  }
}

.test-summary-label {
  font-size: 12px;
  color: var(--n-text-color-3);
  font-weight: 500;
  min-width: 80px;
}

.test-summary-value {
  font-size: 13px;
  color: var(--n-text-color);

  &.key-hint {
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.06);
    padding: 2px 8px;
    border-radius: 4px;

    :root.dark & {
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

.test-result {
  border-radius: 8px;
  padding: 14px 16px;
  margin-top: 16px;

  &.success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);

    .result-icon { color: #10b981; }
    .result-title { color: #10b981; }
  }

  &.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);

    .result-icon { color: #ef4444; }
    .result-title { color: #ef4444; }
  }
}

.test-result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .result-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .result-title {
    font-weight: 600;
    font-size: 14px;
    flex: 1;
  }
}

.result-message {
  margin: 0;
  font-size: 13px;
  color: var(--n-text-color-2);
  line-height: 1.5;
  padding-left: 28px;
}

// ===== INFO BOX =====

.info-box {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px;
  margin-top: 16px;
  font-size: 13px;

  &.warning {
    background: rgba(245, 158, 11, 0.1);

    .info-icon {
      color: #f59e0b;
    }
  }

  .info-icon {
    font-size: 20px;
    color: var(--n-primary-color);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .info-content {
    flex: 1;
    color: var(--n-text-color-2);
    line-height: 1.6;

    strong {
      display: block;
      margin-bottom: 4px;
      color: var(--n-text-color);
    }

    ul {
      margin: 8px 0 0 0;
      padding-left: 20px;

      li {
        margin: 4px 0;
      }
    }
  }
}

// ===== FOOTER =====

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 15px;
  border-top: 1px solid var(--n-border-color);

  :deep(.n-button) {
    height: 36px !important;
    line-height: 34px;
    padding: 0 20px !important;
    box-sizing: border-box;
  }
}

// ===== RESPONSIVE =====

@media (max-width: 768px) {
  .provider-form-content {
    flex-direction: column;
    max-height: calc(80vh - 120px);
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
    min-width: calc(33% - 4px);

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
    flex-wrap: wrap;
    gap: 8px;

    :deep(.n-button) {
      flex: 1;
      min-width: 100px;
    }
  }
}
</style>

<style lang="scss">
// Dark mode fixes (unscoped)
:root.dark {
  .provider-form-content {
    .form-content {

      .n-input,
      .n-input-number {
        --n-color: rgba(255, 255, 255, 0.08) !important;
        --n-color-focus: rgba(255, 255, 255, 0.12) !important;
        background-color: rgba(255, 255, 255, 0.08) !important;
      }

      .n-input:focus-within,
      .n-input-number:focus-within {
        background-color: rgba(255, 255, 255, 0.12) !important;
      }
    }
  }
}
</style>
