<script setup lang="ts">
import { Icon } from "@iconify/vue";

export interface TelegramConfigModel {
  botToken: string;
  chatId: string;
  parseMode: "HTML" | "Markdown" | "MarkdownV2";
  disableNotification: boolean;
}

const parseModeOptions = [
  { label: "HTML", value: "HTML" },
  { label: "Markdown", value: "Markdown" },
  { label: "MarkdownV2", value: "MarkdownV2" },
];

const props = defineProps<{ modelValue: TelegramConfigModel }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: TelegramConfigModel): void;
}>();

function update(partial: Partial<TelegramConfigModel>) {
  emit("update:modelValue", { ...props.modelValue, ...partial });
}
</script>

<template>
  <n-form-item label="Bot Token">
    <n-input
      :value="modelValue.botToken"
      type="password"
      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
      @update:value="update({ botToken: $event })"
    >
      <template #suffix><Icon icon="carbon:locked" /></template>
    </n-input>
  </n-form-item>
  <n-form-item label="Chat ID">
    <n-input
      :value="modelValue.chatId"
      placeholder="-1001234567890"
      @update:value="update({ chatId: $event })"
    />
  </n-form-item>
  <div class="form-row">
    <n-form-item label="Parse Mode">
      <n-select
        :value="modelValue.parseMode"
        :options="parseModeOptions"
        @update:value="update({ parseMode: $event })"
      />
    </n-form-item>
    <n-form-item label="Silent Notification">
      <n-switch
        :value="modelValue.disableNotification"
        @update:value="update({ disableNotification: $event })"
      />
    </n-form-item>
  </div>
</template>
