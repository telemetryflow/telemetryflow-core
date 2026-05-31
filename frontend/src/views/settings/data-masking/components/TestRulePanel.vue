<template>
  <div class="test-rule-panel">
    <p class="panel-description">
      Test how rules in <strong>{{ policy.name }}</strong> will transform log
      input. Paste a sample log body below to see it masked in real-time.
    </p>

    <!-- Rule selector -->
    <n-form-item label="Rule to test" size="small">
      <n-select
        v-model:value="selectedRuleId"
        :options="ruleOptions"
        placeholder="Test all active rules"
        clearable
      />
    </n-form-item>

    <!-- Sample input -->
    <n-form-item label="Sample log input" size="small">
      <n-input
        v-model:value="sampleInput"
        type="textarea"
        :rows="6"
        placeholder="Paste a sample log message or attribute value here..."
        style="font-family: monospace; font-size: 13px"
      />
    </n-form-item>

    <!-- Quick sample buttons -->
    <div class="sample-buttons">
      <span class="sample-label">Quick samples:</span>
      <n-button
        v-for="sample in QUICK_SAMPLES"
        :key="sample.label"
        size="tiny"
        @click="sampleInput = sample.text"
      >
        {{ sample.label }}
      </n-button>
    </div>

    <n-button
      type="primary"
      block
      :loading="testing"
      :disabled="!sampleInput.trim()"
      @click="runTest"
    >
      <template #icon><Icon icon="carbon:play" /></template>
      Run Test
    </n-button>

    <!-- Result -->
    <div v-if="result" class="test-result">
      <n-divider>Result</n-divider>

      <!-- Original -->
      <div class="result-section">
        <div class="result-section-header">
          <Icon icon="carbon:text-align-left" />
          <span>Original</span>
        </div>
        <div class="summary-box">{{ result.original }}</div>
      </div>

      <!-- Masked -->
      <div class="result-section">
        <div class="result-section-header">
          <Icon icon="carbon:text-align-left" />
          <span>Masked</span>
          <n-tag
            :type="result.changed ? 'success' : 'warning'"
            size="tiny"
          >
            {{ result.changed ? `${result.matchCount} match(es)` : "No match" }}
          </n-tag>
        </div>
        <div
          class="summary-box"
          :class="{ 'summary-box--changed': result.changed }"
        >
          {{ result.masked }}
        </div>
      </div>

      <n-alert
        v-if="!result.changed"
        type="warning"
        :show-icon="false"
        size="small"
      >
        No PII was detected in the sample input. Try adjusting your rule pattern
        or sample text.
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  NFormItem,
  NSelect,
  NInput,
  NButton,
  NDivider,
  NTag,
  NAlert,
} from "naive-ui";
import { Icon } from "@iconify/vue";
import type { MaskingPolicy, TestRuleResponse } from "@/types/data-masking";

const props = defineProps<{
  policy: MaskingPolicy;
  builtinPatterns: any[];
  testing: boolean;
  doTest: (payload: any) => Promise<TestRuleResponse | null>;
}>();

const selectedRuleId = ref<string | null>(null);
const sampleInput = ref("");
const result = ref<TestRuleResponse | null>(null);

const ruleOptions = computed(() =>
  props.policy.rules
    .filter((r) => r.enabled)
    .map((r) => ({
      label: `[P${r.priority}] ${r.name}`,
      value: r.id ?? r.name,
    })),
);

const selectedRule = computed(() => {
  if (!selectedRuleId.value)
    return props.policy.rules.find((r) => r.enabled) ?? null;
  return (
    props.policy.rules.find((r) => (r.id ?? r.name) === selectedRuleId.value) ??
    null
  );
});

async function runTest() {
  if (!sampleInput.value.trim() || !selectedRule.value) return;
  result.value = null;
  const res = await props.doTest({
    rule: selectedRule.value,
    sampleInput: sampleInput.value,
  });
  if (res) result.value = res;
}

const QUICK_SAMPLES = [
  {
    label: "Email",
    text: "User john.doe@example.com has logged in from 10.0.0.1",
  },
  {
    label: "Credit Card",
    text: "Payment processed for card 4532015112830366 amount=$99.99",
  },
  {
    label: "JWT",
    text: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
  },
  { label: "AWS Key", text: "Using credentials: AKIAIOSFODNN7EXAMPLE" },
];
</script>

<style scoped>
.test-rule-panel {
  padding: 4px 0;
}

.panel-description {
  font-size: 13px;
  opacity: 0.7;
  margin: 0 0 16px;
  line-height: 1.5;
}

.sample-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.sample-label {
  font-size: 12px;
  opacity: 0.5;
}

.test-result {
  margin-top: 8px;
}

.result-section {
  margin-bottom: 14px;
}

.result-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--n-text-color-3);
  margin-bottom: 6px;
}

.summary-box {
  padding: 14px 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--n-text-color);
  font-family: "SF Mono", Monaco, "Courier New", monospace;
  white-space: pre-wrap;
  word-break: break-all;

  :root.dark & {
    background: rgba(51, 65, 85, 0.5);
    border-color: #334155;
  }
}

.summary-box--changed {
  border-color: var(--n-color-success) !important;
  color: var(--n-color-success);
}
</style>
