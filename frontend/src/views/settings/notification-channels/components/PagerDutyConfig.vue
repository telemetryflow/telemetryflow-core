<script setup lang="ts">
import { Icon } from "@iconify/vue";

export interface PagerDutyConfigModel {
  integrationKey: string;
  severity: "critical" | "error" | "warning" | "info";
  dedupKey: string;
}

const severityOptions = [
  { label: "Critical", value: "critical" },
  { label: "Error", value: "error" },
  { label: "Warning", value: "warning" },
  { label: "Info", value: "info" },
];

const props = defineProps<{ modelValue: PagerDutyConfigModel }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: PagerDutyConfigModel): void;
}>();

function update(partial: Partial<PagerDutyConfigModel>) {
  emit("update:modelValue", { ...props.modelValue, ...partial });
}
</script>

<template>
  <n-form-item label="Integration Key">
    <n-input
      :value="modelValue.integrationKey"
      type="password"
      placeholder="Events API v2 Integration Key"
      @update:value="update({ integrationKey: $event })"
    >
      <template #suffix><Icon icon="carbon:locked" /></template>
    </n-input>
  </n-form-item>
  <n-form-item label="Default Severity">
    <n-select
      :value="modelValue.severity"
      :options="severityOptions"
      @update:value="update({ severity: $event })"
    />
  </n-form-item>
  <n-form-item label="Dedup Key (optional)">
    <n-input
      :value="modelValue.dedupKey"
      placeholder="Custom deduplication key"
      @update:value="update({ dedupKey: $event })"
    />
  </n-form-item>
</template>
