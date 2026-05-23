<script setup lang="ts">
import { brandDefaults } from "@/config";

export interface DiscordConfigModel {
  webhookUrl: string;
  username: string;
  avatarUrl: string;
}

const props = defineProps<{ modelValue: DiscordConfigModel }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: DiscordConfigModel): void;
}>();

function update(partial: Partial<DiscordConfigModel>) {
  emit("update:modelValue", { ...props.modelValue, ...partial });
}
</script>

<template>
  <n-form-item label="Webhook URL">
    <n-input
      :value="modelValue.webhookUrl"
      placeholder="https://discord.com/api/webhooks/..."
      @update:value="update({ webhookUrl: $event })"
    />
  </n-form-item>
  <n-form-item label="Bot Username (optional)">
    <n-input
      :value="modelValue.username"
      :placeholder="brandDefaults.companyName"
      @update:value="update({ username: $event })"
    />
  </n-form-item>
  <n-form-item label="Avatar URL (optional)">
    <n-input
      :value="modelValue.avatarUrl"
      :placeholder="'https://' + brandDefaults.domain + '/avatar.png'"
      @update:value="update({ avatarUrl: $event })"
    />
  </n-form-item>
</template>
