<script setup lang="ts">
import { ref, computed, watch, nextTick, h } from 'vue';
import { Icon } from '@iconify/vue';
import type { SelectOption } from 'naive-ui';
import {
  NModal, NCard, NForm, NFormItem, NSelect, NInputNumber,
  NCheckbox, NDivider, NButton, NInput, NAlert,
} from 'naive-ui';
import { getChannelIcon } from '@/utils';
import { useLineNumberedEditor } from '@/composables';
import { useAlertsStore } from '@/store';
import type { AlertRule, AlertSeverity, AlertCondition } from '@/types';


interface Props {
  show: boolean;
  rule?: AlertRule | null;       // null/undefined = create, AlertRule = edit
  initialQuery?: string;         // pre-fill TFQL query (e.g. from log pattern)
  initialName?: string;          // pre-fill rule name
  initialDescription?: string;   // pre-fill description
}

const props = withDefaults(defineProps<Props>(), {
  rule: null,
  initialQuery: '',
  initialName: '',
  initialDescription: '',
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  'saved': [];
  'save': [payload: { name: string; query: string; condition: AlertCondition; severity: AlertSeverity; duration: string; description?: string; useDefaultChannels: boolean; channelIds?: string[] }];
}>();

const alertsStore = useAlertsStore();
const activeRuleTab = ref<'basic' | 'query' | 'condition' | 'settings'>('basic');

const ruleForm = ref({
  name: '',
  query: '',
  operator: 'gt' as AlertCondition['operator'],
  threshold: 0,
  duration: '5m',
  severity: 'warning' as AlertSeverity,
  description: '',
  useDefaultChannels: true,
  channelIds: [] as string[],
});

const queryContent = computed(() => ruleForm.value.query);
const { lineCount: queryLineCount } = useLineNumberedEditor(queryContent);

// Channel options sourced from alertsStore (fetched by parent on mount via fetchChannels())
const channelOptions = computed(() =>
  alertsStore.notificationChannels.map((c: any) => ({
    label: c.enabled
      ? `${c.name} (${(c.type || 'unknown').toUpperCase()})`
      : `${c.name} (${(c.type || 'unknown').toUpperCase()}) — disabled`,
    value: c.id,
    icon: getChannelIcon(c.type),
    disabled: !c.enabled,
  }))
);

function renderChannelLabel(option: SelectOption & { icon?: string }) {
  return h('div', { style: 'display: flex; align-items: center; gap: 8px' }, [
    option.icon ? h(Icon, { icon: option.icon, width: 16, height: 16 }) : null,
    h('span', null, option.label as string),
  ]);
}

const operatorOptions = [
  { label: '> (greater than)', value: 'gt' },
  { label: '>= (greater than or equal)', value: 'gte' },
  { label: '< (less than)', value: 'lt' },
  { label: '<= (less than or equal)', value: 'lte' },
  { label: '== (equal)', value: 'eq' },
  { label: '!= (not equal)', value: 'neq' },
];

const severityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
];

const durationOptions = [
  { label: '1 minute', value: '1m' },
  { label: '5 minutes', value: '5m' },
  { label: '10 minutes', value: '10m' },
  { label: '15 minutes', value: '15m' },
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
];

function formatDurationLabel(duration: string): string {
  const labels: Record<string, string> = {
    '1m': '1 minute', '5m': '5 minutes', '10m': '10 minutes',
    '15m': '15 minutes', '30m': '30 minutes', '1h': '1 hour',
  };
  return labels[duration] || duration;
}

function getOperatorSymbol(op: string): string {
  const symbols: Record<string, string> = {
    gt: '>', gte: '>=', lt: '<', lte: '<=', eq: '==', neq: '!=',
  };
  return symbols[op] || op;
}

// Reset form when modal opens — flush:'post' ensures props are fully updated first
watch(() => props.show, async (visible) => {
  if (!visible) return;
  // nextTick guarantees all parent prop updates have been committed
  await nextTick();
  activeRuleTab.value = 'basic';

  if (props.rule) {
    // Edit mode
    ruleForm.value = {
      name: props.rule.name || '',
      query: props.rule.query || '',
      operator: props.rule.condition?.operator || 'gt',
      threshold: props.rule.condition?.threshold || 0,
      duration: props.rule.duration || '5m',
      severity: props.rule.severity || 'warning',
      description: props.rule.description || '',
      useDefaultChannels: props.rule.useDefaultChannels !== false,
      channelIds: props.rule.channelIds || [],
    };
  } else {
    // Create mode — optionally pre-fill from log pattern
    ruleForm.value = {
      name: props.initialName || '',
      query: props.initialQuery || '',
      operator: 'gt',
      threshold: 0,
      duration: '5m',
      severity: 'warning',
      description: props.initialDescription || '',
      useDefaultChannels: true,
      channelIds: [],
    };
  }
}, { flush: 'post' });

function close() {
  emit('update:show', false);
}

function saveRule() {
  if (!ruleForm.value.name?.trim() || !ruleForm.value.query?.trim()) return;

  const condition: AlertCondition = {
    operator: ruleForm.value.operator,
    threshold: ruleForm.value.threshold,
  };

  const payload = {
    name: ruleForm.value.name.trim(),
    query: ruleForm.value.query.trim(),
    condition,
    severity: ruleForm.value.severity,
    duration: ruleForm.value.duration,
    description: ruleForm.value.description?.trim() || undefined,
    useDefaultChannels: ruleForm.value.useDefaultChannels,
    channelIds: ruleForm.value.useDefaultChannels ? undefined : ruleForm.value.channelIds,
  };

  // Emit to parent — parent decides which store/API to use (alertsStore for rules page, logsStore for logs context)
  emit('save', payload);
  emit('saved');
  close();
}
</script>

<template>
  <n-modal
    :show="show"
    :mask-closable="false"
    :close-on-esc="false"
    style="max-width: 800px; width: 85%"
    @update:show="(val) => emit('update:show', val)"
  >
    <n-card
      :title="rule ? 'Edit Alert Rule' : 'Create Alert Rule'"
      :bordered="false"
      size="small"
      closable
      @close="close"
    >
      <div class="rule-modal-content">
        <!-- Left Side: Vertical Tabs -->
        <div class="rule-tabs">
          <div
            class="rule-tab-item"
            :class="{ active: activeRuleTab === 'basic' }"
            @click="activeRuleTab = 'basic'"
          >
            <Icon icon="carbon:information" class="tab-icon" />
            <span class="tab-label">Basic Info</span>
          </div>
          <div
            class="rule-tab-item"
            :class="{ active: activeRuleTab === 'query' }"
            @click="activeRuleTab = 'query'"
          >
            <Icon icon="carbon:query" class="tab-icon" />
            <span class="tab-label">Query</span>
          </div>
          <div
            class="rule-tab-item"
            :class="{ active: activeRuleTab === 'condition' }"
            @click="activeRuleTab = 'condition'"
          >
            <Icon icon="carbon:warning-alt" class="tab-icon" />
            <span class="tab-label">Condition</span>
          </div>
          <div
            class="rule-tab-item"
            :class="{ active: activeRuleTab === 'settings' }"
            @click="activeRuleTab = 'settings'"
          >
            <Icon icon="carbon:settings" class="tab-icon" />
            <span class="tab-label">Settings</span>
          </div>
        </div>

        <!-- Right Side: Form Content -->
        <div class="rule-form">
          <n-form label-placement="top">
            <!-- Basic Info Tab -->
            <div v-show="activeRuleTab === 'basic'">
              <n-form-item label="Rule Name" path="name" required>
                <n-input
                  v-model:value="ruleForm.name"
                  placeholder="e.g., High Error Rate"
                  size="medium"
                />
              </n-form-item>
              <n-form-item label="Description (Optional)">
                <n-input
                  v-model:value="ruleForm.description"
                  type="textarea"
                  placeholder="Brief description of this rule..."
                  :autosize="{ minRows: 3, maxRows: 5 }"
                  size="medium"
                />
              </n-form-item>
            </div>

            <!-- Query Tab -->
            <div v-show="activeRuleTab === 'query'">
              <n-form-item label="Query" path="query" required>
                <div class="line-numbered-editor-wrapper size-medium">
                  <div class="line-numbered-editor-numbers">
                    <span
                      v-for="lineNum in queryLineCount"
                      :key="`qln-${lineNum}`"
                      class="line-number"
                    >
                      {{ lineNum }}
                    </span>
                  </div>
                  <textarea
                    v-model="ruleForm.query"
                    class="line-numbered-editor-textarea"
                    placeholder="Enter TFQL or PromQL query..."
                    rows="8"
                  />
                </div>
                <template #feedback>
                  <span style="font-size: 12px; color: var(--n-text-color-3);">
                    Enter a valid TFQL or PromQL query to monitor logs/metrics
                  </span>
                </template>
              </n-form-item>
            </div>

            <!-- Condition Tab -->
            <div v-show="activeRuleTab === 'condition'">
              <n-form-item label="Condition">
                <div class="condition-box">
                  <div class="condition-header">
                    <Icon icon="carbon:warning-alt" class="condition-icon" />
                    <span>Trigger alert when</span>
                  </div>
                  <div class="condition-grid">
                    <div class="condition-field">
                      <label class="condition-label">Metric</label>
                      <n-select
                        :value="'query_result'"
                        :options="[{ label: 'Query Result', value: 'query_result' }]"
                        disabled
                        size="medium"
                      />
                    </div>
                    <div class="condition-field">
                      <label class="condition-label">Operator</label>
                      <n-select
                        v-model:value="ruleForm.operator"
                        :options="operatorOptions"
                        size="medium"
                        placeholder="Select operator"
                      />
                    </div>
                    <div class="condition-field">
                      <label class="condition-label">Threshold</label>
                      <n-input-number
                        v-model:value="ruleForm.threshold"
                        :min="0"
                        size="medium"
                        placeholder="Enter value"
                        style="width: 100%"
                      />
                    </div>
                    <div class="condition-field">
                      <label class="condition-label">For Duration</label>
                      <n-select
                        v-model:value="ruleForm.duration"
                        :options="durationOptions"
                        size="medium"
                        placeholder="Select duration"
                      />
                    </div>
                  </div>
                  <div class="condition-preview">
                    <Icon icon="carbon:information" />
                    <span>
                      Alert fires when query result is
                      <strong>{{ getOperatorSymbol(ruleForm.operator) }} {{ ruleForm.threshold }}</strong>
                      for <strong>{{ formatDurationLabel(ruleForm.duration) }}</strong>
                    </span>
                  </div>
                </div>
              </n-form-item>
            </div>

            <!-- Settings Tab -->
            <div v-show="activeRuleTab === 'settings'">
              <n-form-item label="Severity" path="severity">
                <n-select
                  v-model:value="ruleForm.severity"
                  :options="severityOptions"
                  size="medium"
                  placeholder="Select severity level"
                />
              </n-form-item>

              <n-divider style="margin: 16px 0">Notifications</n-divider>

              <n-form-item label="Notification Channels">
                <div class="channels-assignment">
                  <n-checkbox v-model:checked="ruleForm.useDefaultChannels" size="medium">
                    Use global default channels
                  </n-checkbox>
                  <template v-if="!ruleForm.useDefaultChannels">
                    <template v-if="channelOptions.length > 0">
                      <n-select
                        v-model:value="ruleForm.channelIds"
                        :options="channelOptions"
                        :render-label="renderChannelLabel"
                        multiple
                        placeholder="Select notification channels..."
                        size="medium"
                        style="margin-top: 12px"
                      />
                    </template>
                    <n-alert v-else type="warning" :show-icon="true" style="margin-top: 12px">
                      Belum ada notification channel. Buat channel terlebih dahulu di
                      <strong>Settings → Notification Channels</strong>,
                      atau gunakan "Use global default channels".
                    </n-alert>
                  </template>
                </div>
              </n-form-item>
            </div>
          </n-form>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer tfo-modal-footer">
          <n-button type="primary" ghost @click="close">
            <template #icon>
              <Icon icon="carbon:close" />
            </template>
            Cancel
          </n-button>
          <n-button
            type="primary"
            :disabled="!ruleForm.name?.trim() || !ruleForm.query?.trim()"
            @click="saveRule"
          >
            <template #icon>
              <Icon icon="carbon:save" />
            </template>
            {{ rule ? 'Save Changes' : 'Create Rule' }}
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped lang="scss">
.rule-modal-content {
  display: flex;
  gap: 0;
  min-height: 320px;
  max-height: 480px;
}

.rule-tabs {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--n-border-color);
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rule-tab-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--n-text-color-3);
  background: transparent;
  margin: 0 8px;
  border-radius: 8px;

  .tab-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .tab-label {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--n-text-color);
  }

  &.active {
    background: rgba(99, 102, 241, 0.15);
    color: var(--n-primary-color);

    .tab-icon { color: var(--n-primary-color); }
    .tab-label { font-weight: 600; }
  }
}

.rule-form {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  max-height: 480px;

  :deep(.n-form-item) { margin-bottom: 16px; }
  :deep(.n-form-item-label) { font-weight: 600; font-size: 13px; }
}

// Line-numbered editor
.line-numbered-editor-wrapper {
  display: flex;
  width: 100%;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: var(--n-color);

  &:focus-within {
    border-color: var(--n-primary-color);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }
}

.line-numbered-editor-numbers {
  display: flex;
  flex-direction: column;
  padding: 8px 6px;
  background: var(--n-color-popover);
  border-right: 1px solid var(--n-border-color);
  min-width: 36px;
  text-align: right;
  user-select: none;
}

.line-number {
  color: var(--n-text-color-3);
  font-size: 12px;
  line-height: 1.6;
}

.line-numbered-editor-textarea {
  flex: 1;
  padding: 8px 10px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--n-text-color);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

// Condition Box
.condition-box {
  width: 100%;
  background: var(--n-color-popover);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.condition-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.08);
  border-bottom: 1px solid var(--n-border-color);
  font-weight: 500;
  font-size: 0.875rem;
}

.condition-icon { color: #3b82f6; font-size: 18px; }

.condition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px;
}

.condition-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.condition-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.condition-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(34, 197, 94, 0.08);
  border-top: 1px solid var(--n-border-color);
  font-size: 0.8125rem;
  color: var(--n-text-color-2);

  strong { color: var(--n-text-color); font-weight: 600; }
}

// Channels
.channels-assignment {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.no-channels-hint {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--n-text-color-3);
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(100, 116, 139, 0.05);
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
}

// Footer
.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 15px;
  border-top: 1px solid var(--n-border-color);

  :deep(.n-button) {
    min-width: 130px;
    height: 36px !important;
    box-sizing: border-box;
  }
}

@media (max-width: 768px) {
  .rule-modal-content {
    flex-direction: column;
    max-height: 60vh;
  }

  .rule-tabs {
    width: 100%;
    flex-direction: row;
    border-right: none;
    border-bottom: 1px solid var(--n-border-color);
    padding: 8px;
    gap: 4px;
    overflow-x: auto;
  }

  .rule-tab-item {
    margin: 0;
    padding: 8px 12px;
    flex-shrink: 0;
  }

  .rule-form { max-height: calc(60vh - 100px); }

  .condition-grid { grid-template-columns: 1fr; gap: 12px; }

  .modal-footer {
    flex-direction: column;
    gap: 8px;
    :deep(.n-button) { width: 100%; }
  }
}
</style>
