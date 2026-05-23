<script setup lang="ts">
import { brandDefaults } from "@/config";

export interface SlackConfigModel {
  webhookUrl: string;
  channel: string;
  username: string;
  iconEmoji: string;
}

const props = defineProps<{ modelValue: SlackConfigModel }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: SlackConfigModel): void;
}>();

function update(partial: Partial<SlackConfigModel>) {
  emit("update:modelValue", { ...props.modelValue, ...partial });
}
</script>

<template>
  <n-form-item label="Webhook URL">
    <n-input
      :value="modelValue.webhookUrl"
      placeholder="https://hooks.slack.com/services/..."
      @update:value="update({ webhookUrl: $event })"
    />
  </n-form-item>
  <n-form-item label="Channel (optional)">
    <n-input
      :value="modelValue.channel"
      placeholder="#alerts"
      @update:value="update({ channel: $event })"
    />
  </n-form-item>
  <div class="form-row">
    <n-form-item label="Bot Username">
      <n-input
        :value="modelValue.username"
        :placeholder="brandDefaults.botName"
        @update:value="update({ username: $event })"
      />
    </n-form-item>
    <n-form-item label="Icon Emoji">
      <n-input
        :value="modelValue.iconEmoji"
        placeholder=":bell:"
        @update:value="update({ iconEmoji: $event })"
      />
    </n-form-item>
  </div>
</template>
