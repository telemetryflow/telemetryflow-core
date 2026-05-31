<script setup lang="ts">
import { Icon } from "@iconify/vue";

export interface OpsGenieConfigModel {
  apiKey: string;
  apiUrl: string;
  priority: "P1" | "P2" | "P3" | "P4" | "P5";
  tags: string;
}

const priorityOptions = [
  { label: "P1 - Critical", value: "P1" },
  { label: "P2 - High", value: "P2" },
  { label: "P3 - Moderate", value: "P3" },
  { label: "P4 - Low", value: "P4" },
  { label: "P5 - Informational", value: "P5" },
];

const props = defineProps<{ modelValue: OpsGenieConfigModel }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: OpsGenieConfigModel): void;
}>();

function update(partial: Partial<OpsGenieConfigModel>) {
  emit("update:modelValue", { ...props.modelValue, ...partial });
}
</script>

<template>
  <n-form-item label="API Key">
    <n-input
      :value="modelValue.apiKey"
      type="password"
      placeholder="OpsGenie API Integration Key"
      @update:value="update({ apiKey: $event })"
    >
      <template #suffix><Icon icon="carbon:locked" /></template>
    </n-input>
  </n-form-item>
  <n-form-item label="API URL">
    <n-input
      :value="modelValue.apiUrl"
      placeholder="https://api.opsgenie.com/v2/alerts"
      @update:value="update({ apiUrl: $event })"
    />
    <template #feedback>
      <span class="form-hint">Use https://api.eu.opsgenie.com/v2/alerts for EU region</span>
    </template>
  </n-form-item>
  <n-form-item label="Priority">
    <n-select
      :value="modelValue.priority"
      :options="priorityOptions"
      @update:value="update({ priority: $event })"
    />
  </n-form-item>
  <n-form-item label="Tags (optional)">
    <n-input
      :value="modelValue.tags"
      placeholder="tag1, tag2, tag3"
      @update:value="update({ tags: $event })"
    />
  </n-form-item>
</template>
