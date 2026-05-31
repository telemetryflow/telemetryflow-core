<template>
  <n-modal
    :show="true"
    preset="card"
    :title="isEdit ? 'Edit Masking Policy' : 'Create Masking Policy'"
    style="width: 920px; max-height: 85vh"
    :mask-closable="!saving"
    @update:show="(v) => !v && $emit('close')"
  >
    <div class="policy-form-layout">
      <!-- ─── Left: Vertical Tabs ──────────────────────────────────────── -->
      <div class="form-tabs">
        <div
          v-for="tab in formTabs"
          :key="tab.value"
          class="form-tab-item"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          <Icon :icon="tab.icon" class="tab-icon" />
          <span class="tab-label">{{ tab.label }}</span>
        </div>
        <div class="tab-description">
          <p>{{ tabDescriptions[activeTab] }}</p>
        </div>
      </div>

      <!-- ─── Right: Form Content ──────────────────────────────────────── -->
      <div class="form-content">
        <n-scrollbar style="max-height: calc(85vh - 180px)">
          <n-form
            ref="formRef"
            :model="form"
            :rules="validationRules"
            label-placement="top"
          >
            <!-- ── General Tab ─────────────────────────────────────────── -->
            <template v-if="activeTab === 'general'">
              <div class="form-box">
                <n-form-item label="Policy Name" path="name">
                  <n-input
                    v-model:value="form.name"
                    placeholder="e.g. Production PII Masking"
                    size="medium"
                  />
                </n-form-item>

                <n-form-item label="Description" path="description">
                  <n-input
                    v-model:value="form.description"
                    type="textarea"
                    :rows="3"
                    placeholder="Describe what sensitive data this policy masks and why"
                  />
                </n-form-item>

                <n-form-item label="Status">
                  <div class="status-row">
                    <n-switch v-model:value="form.enabled">
                      <template #checked>Active</template>
                      <template #unchecked>Disabled</template>
                    </n-switch>
                    <span class="status-hint">
                      {{
                        form.enabled
                          ? "Policy will apply to all ingested logs immediately."
                          : "Policy is saved but will not mask data until enabled."
                      }}
                    </span>
                  </div>
                </n-form-item>
              </div>
            </template>

            <!-- ── Rules Tab ───────────────────────────────────────────── -->
            <template v-if="activeTab === 'rules'">
              <div class="rules-list">
                <div
                  v-for="(rule, idx) in form.rules"
                  :key="rule.id ?? idx"
                  class="rule-row"
                >
                  <!-- Rule header -->
                  <div class="rule-header">
                    <span class="rule-index">#{{ idx + 1 }}</span>
                    <n-input
                      v-model:value="rule.name"
                      placeholder="Rule name"
                      size="small"
                      style="flex: 1"
                    />
                    <n-switch v-model:value="rule.enabled" size="small" />
                    <n-button
                      text
                      size="small"
                      title="Test this rule"
                      @click="testSingleRule(rule)"
                    >
                      <template #icon><Icon icon="carbon:play" /></template>
                    </n-button>
                    <n-button
                      text
                      size="small"
                      type="error"
                      @click="removeRule(idx)"
                    >
                      <template #icon>
                        <Icon icon="carbon:trash-can" />
                      </template>
                    </n-button>
                  </div>

                  <!-- Rule configuration grid -->
                  <n-grid :cols="3" :x-gap="12" class="rule-body">
                    <n-gi>
                      <n-form-item label="Target Field" size="small">
                        <n-select
                          v-model:value="rule.targetField"
                          :options="targetFieldOptions"
                          size="small"
                        />
                      </n-form-item>
                    </n-gi>

                    <n-gi>
                      <n-form-item label="Match Type" size="small">
                        <n-select
                          v-model:value="rule.matchType"
                          :options="matchTypeOptions"
                          size="small"
                        />
                      </n-form-item>
                    </n-gi>

                    <n-gi>
                      <n-form-item label="Mask Type" size="small">
                        <n-select
                          v-model:value="rule.maskType"
                          :options="maskTypeOptions"
                          size="small"
                        />
                      </n-form-item>
                    </n-gi>

                    <!-- Built-in pattern selector -->
                    <n-gi v-if="rule.matchType === 'builtin'">
                      <n-form-item label="Built-in Pattern" size="small">
                        <n-select
                          v-model:value="rule.builtinPattern"
                          :options="builtinPatternOptions"
                          size="small"
                          placeholder="Select pattern"
                        />
                      </n-form-item>
                    </n-gi>

                    <!-- Custom pattern input -->
                    <n-gi
                      v-if="
                        rule.matchType === 'regex' || rule.matchType === 'exact'
                      "
                      :span="2"
                    >
                      <n-form-item
                        :label="
                          rule.matchType === 'regex'
                            ? 'Regex Pattern'
                            : 'Exact String'
                        "
                        size="small"
                      >
                        <n-input
                          v-model:value="rule.customPattern"
                          size="small"
                          :placeholder="
                            rule.matchType === 'regex'
                              ? '\\b[0-9]{16}\\b'
                              : 'exact-string-to-match'
                          "
                          style="font-family: monospace"
                        />
                      </n-form-item>
                    </n-gi>

                    <!-- Attribute key (for key-scoped targets) -->
                    <n-gi
                      v-if="
                        rule.targetField === 'resource_attribute_key' ||
                          rule.targetField === 'log_attribute_key'
                      "
                    >
                      <n-form-item label="Attribute Key" size="small">
                        <n-input
                          v-model:value="rule.fieldKey"
                          size="small"
                          placeholder="e.g. user.email"
                        />
                      </n-form-item>
                    </n-gi>

                    <!-- Replacement text -->
                    <n-gi
                      v-if="
                        rule.maskType === 'REDACT' ||
                          rule.maskType === 'REPLACE'
                      "
                    >
                      <n-form-item label="Replacement Text" size="small">
                        <n-input
                          v-model:value="rule.replacement"
                          size="small"
                          placeholder="[REDACTED]"
                        />
                      </n-form-item>
                    </n-gi>

                    <!-- Truncate length -->
                    <n-gi v-if="rule.maskType === 'TRUNCATE'">
                      <n-form-item label="Keep N Chars" size="small">
                        <n-input-number
                          v-model:value="rule.truncateLength"
                          size="small"
                          :min="1"
                          :max="256"
                          placeholder="4"
                        />
                      </n-form-item>
                    </n-gi>

                    <!-- Priority -->
                    <n-gi>
                      <n-form-item label="Priority" size="small">
                        <n-input-number
                          v-model:value="rule.priority"
                          size="small"
                          :min="0"
                          :max="1000"
                          placeholder="100"
                          style="width: 100%"
                        />
                      </n-form-item>
                    </n-gi>
                  </n-grid>

                  <!-- Inline test result -->
                  <div v-if="ruleTestResults[idx]" class="rule-test-result">
                    <div class="test-row">
                      <span class="test-label">Original:</span>
                      <code class="test-value">{{
                        ruleTestResults[idx]?.original
                      }}</code>
                    </div>
                    <div class="test-row">
                      <span class="test-label">Masked:</span>
                      <code
                        class="test-value"
                        :class="{ changed: ruleTestResults[idx]?.changed }"
                      >{{ ruleTestResults[idx]?.masked }}</code>
                      <n-tag
                        v-if="ruleTestResults[idx]?.changed"
                        type="success"
                        size="tiny"
                      >
                        {{ ruleTestResults[idx]?.matchCount }} match(es)
                      </n-tag>
                      <n-tag v-else type="warning" size="tiny">No match</n-tag>
                    </div>
                  </div>
                </div>

                <!-- Empty rules state -->
                <div v-if="form.rules.length === 0" class="no-rules-hint">
                  <Icon icon="carbon:filter" width="32" style="opacity: 0.3" />
                  <p>No rules yet. Add a rule to define what data to mask.</p>
                </div>

                <n-button dashed block class="add-rule-btn" @click="addRule">
                  <template #icon><Icon icon="carbon:add" /></template>
                  Add Rule
                </n-button>
              </div>
            </template>

            <!-- ── Test Tab ────────────────────────────────────────────── -->
            <template v-if="activeTab === 'test'">
              <div class="form-box">
                <div v-if="form.rules.length === 0" class="test-no-rules">
                  <Icon icon="carbon:filter" width="32" style="opacity: 0.3" />
                  <p>Add rules in the Rules tab first, then test them here.</p>
                </div>
                <template v-else>
                  <n-form-item label="Select Rule to Test">
                    <n-select
                      v-model:value="testSelectedRuleIdx"
                      :options="testRuleOptions"
                      placeholder="Choose a rule to test"
                    />
                  </n-form-item>

                  <n-form-item label="Sample Input">
                    <n-input
                      v-model:value="testInput"
                      type="textarea"
                      :rows="4"
                      placeholder="Paste a sample log line or text that might contain sensitive data..."
                    />
                  </n-form-item>

                  <n-button
                    type="primary"
                    :loading="testLoading"
                    :disabled="
                      testSelectedRuleIdx === null || !testInput.trim()
                    "
                    @click="runTest"
                  >
                    <template #icon><Icon icon="carbon:play" /></template>
                    Run Test
                  </n-button>

                  <!-- Test result -->
                  <div v-if="activeTestResult" class="test-result-panel">
                    <n-divider style="margin: 16px 0 12px" />
                    <div class="test-result-row">
                      <span class="test-result-label">Original</span>
                      <code class="test-result-value">{{
                        activeTestResult.original
                      }}</code>
                    </div>
                    <div class="test-result-row">
                      <span class="test-result-label">Masked</span>
                      <code
                        class="test-result-value"
                        :class="{ 'result-changed': activeTestResult.changed }"
                      >{{ activeTestResult.masked }}</code>
                    </div>
                    <div class="test-result-meta">
                      <n-tag
                        :type="activeTestResult.changed ? 'success' : 'warning'"
                        size="small"
                      >
                        {{
                          activeTestResult.changed
                            ? `${activeTestResult.matchCount} match(es) found`
                            : "No match — data unchanged"
                        }}
                      </n-tag>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </n-form>
        </n-scrollbar>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer tfo-modal-footer">
        <n-button @click="$emit('close')">Cancel</n-button>
        <n-button type="primary" :loading="saving" @click="submit">
          {{ isEdit ? "Save Changes" : "Create Policy" }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NButton,
  NGrid,
  NGi,
  NDivider,
  NTag,
  NScrollbar,
} from "naive-ui";
import { Icon } from "@iconify/vue";
import type {
  MaskingPolicy,
  MaskingRule,
  BuiltinPatternDefinition,
  TestRuleResponse,
} from "@/types/data-masking";
import type { MaskingPolicyTemplate } from "@/utils/telemetry/pii-masking/rules-library";
import {
  TargetField,
  MatchType,
  MaskType,
  BuiltinPattern,
  TARGET_FIELD_LABELS,
  MATCH_TYPE_LABELS,
  MASK_TYPE_LABELS,
  BUILTIN_PATTERN_LABELS,
} from "@/types/data-masking";

const props = defineProps<{
  policy: MaskingPolicy | null;
  template?: MaskingPolicyTemplate | null;
  builtinPatterns: BuiltinPatternDefinition[];
  saving: boolean;
  onTestRule?: (payload: any) => Promise<TestRuleResponse | null>;
}>();

const emit = defineEmits<{
  (e: "submit", payload: any): void;
  (e: "close"): void;
}>();

const isEdit = computed(() => !!props.policy);

// ─── Vertical tab state ──────────────────────────────────────────────────────
const activeTab = ref<"general" | "rules" | "test">("general");

const formTabs = [
  { label: "General", value: "general", icon: "carbon:document-configuration" },
  { label: "Rules", value: "rules", icon: "carbon:filter" },
  { label: "Test", value: "test", icon: "carbon:play" },
] as const;

const tabDescriptions: Record<string, string> = {
  general: "Set the policy name, description, and active status.",
  rules:
    "Define masking rules — choose patterns, targets, and mask types. Click ▶ on a rule to jump to the Test tab.",
  test: "Select a rule and enter sample text to verify masking behavior before saving.",
};

// ─── Form state ──────────────────────────────────────────────────────────────
const formRef = ref();
const form = ref({
  name: props.policy?.name ?? "",
  description: props.policy?.description ?? "",
  enabled: props.policy?.enabled ?? true,
  rules: (props.policy?.rules ?? []).map((r) => ({ ...r })) as MaskingRule[],
});

watch(
  () => props.policy,
  (p) => {
    form.value = {
      name: p?.name ?? "",
      description: p?.description ?? "",
      enabled: p?.enabled ?? true,
      rules: (p?.rules ?? []).map((r) => ({ ...r })) as MaskingRule[],
    };
    activeTab.value = "general";
  },
);

// When a template is applied (create mode only), pre-fill all form fields
watch(
  () => props.template,
  (tpl) => {
    if (!tpl || props.policy) return;
    form.value = {
      name: tpl.name,
      description: tpl.description ?? "",
      enabled: tpl.defaultEnabled,
      rules: tpl.rules.map((r) => ({ ...r, id: uuidv4() })) as MaskingRule[],
    };
    activeTab.value = "general";
  },
  { immediate: true },
);

const validationRules = {
  name: [
    { required: true, message: "Policy name is required", trigger: "blur" },
  ],
};

// ─── Inline rule test results (Rules tab) ────────────────────────────────────
const ruleTestResults = ref<Record<number, TestRuleResponse | null>>({});

// ─── Test tab state ──────────────────────────────────────────────────────────
const testSelectedRuleIdx = ref<number | null>(null);
const testInput = ref("");
const testLoading = ref(false);
const activeTestResult = ref<TestRuleResponse | null>(null);

const testRuleOptions = computed(() =>
  form.value.rules.map((r, idx) => ({
    label: `#${idx + 1} — ${r.name}`,
    value: idx,
  })),
);

/** Called by the play button on each rule row in the Rules tab */
function testSingleRule(rule: MaskingRule) {
  const idx = form.value.rules.indexOf(rule);
  testSelectedRuleIdx.value = idx;
  activeTestResult.value = null;
  activeTab.value = "test";
}

async function runTest() {
  if (testSelectedRuleIdx.value === null || !testInput.value.trim() || !props.onTestRule) return;
  testLoading.value = true;
  try {
    const result = await props.onTestRule({
      rule: form.value.rules[testSelectedRuleIdx.value],
      sampleInput: testInput.value,
    });
    if (result) {
      activeTestResult.value = result;
      // Also store inline in Rules tab
      ruleTestResults.value[testSelectedRuleIdx.value] = result;
    }
  } finally {
    testLoading.value = false;
  }
}

// ─── Rule management ─────────────────────────────────────────────────────────
function addRule() {
  form.value.rules.push({
    id: uuidv4(),
    name: `Rule ${form.value.rules.length + 1}`,
    enabled: true,
    priority: (form.value.rules.length + 1) * 10,
    targetField: TargetField.BODY,
    matchType: MatchType.BUILTIN,
    builtinPattern: BuiltinPattern.EMAIL,
    maskType: MaskType.REDACT,
    replacement: "[REDACTED]",
  });
  // Switch to Rules tab if not already there
  if (activeTab.value !== "rules") activeTab.value = "rules";
}

function removeRule(idx: number) {
  form.value.rules.splice(idx, 1);
  delete ruleTestResults.value[idx];
  if (testSelectedRuleIdx.value === idx) {
    testSelectedRuleIdx.value = null;
    activeTestResult.value = null;
  }
}

// ─── Select options ──────────────────────────────────────────────────────────
const targetFieldOptions = Object.values(TargetField).map((v) => ({
  label: TARGET_FIELD_LABELS[v],
  value: v,
}));

const matchTypeOptions = Object.values(MatchType).map((v) => ({
  label: MATCH_TYPE_LABELS[v],
  value: v,
}));

const maskTypeOptions = Object.values(MaskType).map((v) => ({
  label: MASK_TYPE_LABELS[v],
  value: v,
}));

const builtinPatternOptions = computed(() => {
  if (props.builtinPatterns.length) {
    return props.builtinPatterns.map((p) => ({
      label: BUILTIN_PATTERN_LABELS[p.name as BuiltinPattern] ?? p.name,
      value: p.name,
      title: p.description,
    }));
  }
  return Object.values(BuiltinPattern).map((v) => ({
    label: BUILTIN_PATTERN_LABELS[v],
    value: v,
  }));
});

// ─── Submit ──────────────────────────────────────────────────────────────────
async function submit() {
  try {
    await formRef.value?.validate();
  } catch {
    activeTab.value = "general";
    return;
  }
  emit("submit", {
    name: form.value.name,
    description: form.value.description || undefined,
    enabled: form.value.enabled,
    rules: form.value.rules,
  });
}
</script>

<style scoped>
/* ── Layout ── */
.policy-form-layout {
  display: flex;
  gap: 0;
  min-height: 400px;
}

/* ── Left tab sidebar ── */
.form-tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  max-width: 180px;
  border-right: 1px solid var(--n-border-color);
  padding-right: 16px;
  margin-right: 16px;
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
    flex-shrink: 0;
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

/* ── Right content ── */
.form-content {
  flex: 1;
  min-width: 0;
}

.form-box {
  background: var(--n-action-color);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 16px;

  :deep(.n-form-item) {
    margin-bottom: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

/* ── General tab ── */
.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-hint {
  font-size: 12px;
  opacity: 0.6;
  line-height: 1.4;
}

/* ── Rules tab ── */
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-row {
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 12px;
  background: var(--n-color-base);
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.rule-index {
  font-size: 12px;
  opacity: 0.4;
  font-weight: 600;
  min-width: 20px;
}

.rule-body {
  margin-top: 4px;
}

.no-rules-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
  opacity: 0.6;

  p {
    margin: 0;
    font-size: 13px;
  }
}

.add-rule-btn {
  margin-top: 4px;
}

.rule-test-result {
  margin-top: 10px;
  padding: 10px;
  background: var(--n-color-modal);
  border-radius: 6px;
  font-size: 12px;
}

.test-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.test-label {
  opacity: 0.55;
  min-width: 60px;
}

.test-value {
  font-family: monospace;
  font-size: 12px;
}

.test-value.changed {
  color: var(--n-color-success);
}

/* ── Test tab ── */
.test-no-rules {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  text-align: center;
  opacity: 0.6;

  p {
    margin: 0;
    font-size: 13px;
  }
}

.test-result-panel {
  margin-top: 4px;
}

.test-result-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  align-items: flex-start;
}

.test-result-label {
  min-width: 64px;
  font-size: 12px;
  font-weight: 600;
  opacity: 0.6;
  padding-top: 2px;
}

.test-result-value {
  font-family: monospace;
  font-size: 13px;
  background: var(--n-color-modal);
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
}

.result-changed {
  color: var(--n-color-success);
}

.test-result-meta {
  margin-top: 8px;
}

/* ── Footer ── */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
