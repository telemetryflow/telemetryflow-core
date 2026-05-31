<script setup lang="ts">
import { brandDefaults } from "@/config";

export interface MSTeamsConfigModel {
  webhookUrl: string;
  title: string;
}

const props = defineProps<{ modelValue: MSTeamsConfigModel }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: MSTeamsConfigModel): void;
}>();

function update(partial: Partial<MSTeamsConfigModel>) {
  emit("update:modelValue", { ...props.modelValue, ...partial });
}
</script>

<template>
  <!-- Migration notice: Office 365 connectors retire April 30, 2026 -->
  <n-alert type="warning" :bordered="false" style="margin-bottom: 12px">
    <template #header>Power Automate Workflow Required</template>
    Office 365 Connector URLs (<code>outlook.office.com/webhook/...</code>) are
    retired as of <strong>April 30, 2026</strong>. Use a
    <strong>Power Automate Workflow</strong> webhook URL instead. In Teams,
    go to a channel → <em>Workflows</em> → <em>Post to a channel when a webhook
      request is received</em>.
  </n-alert>

  <n-form-item label="Webhook URL *">
    <n-input
      :value="modelValue.webhookUrl"
      placeholder="https://prod-XX.westus.logic.azure.com:443/workflows/..."
      @update:value="update({ webhookUrl: $event })"
    />
    <template #feedback>
      <p class="form-hint">
        Power Automate Workflow URL — generated when you create a Teams
        Workflow with the "When a webhook request is received" trigger
      </p>
    </template>
  </n-form-item>

  <n-form-item label="Card Title (optional)">
    <n-input
      :value="modelValue.title"
      :placeholder="brandDefaults.alertTitle"
      @update:value="update({ title: $event })"
    />
  </n-form-item>
</template>
