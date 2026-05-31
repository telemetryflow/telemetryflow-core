<script setup lang="ts">
import { Icon } from "@iconify/vue";

export interface ZoomConfigModel {
  webhookUrl: string;
  authToken: string;
  botJid: string;
  headers: string;
}

const props = defineProps<{ modelValue: ZoomConfigModel }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: ZoomConfigModel): void;
}>();

function update(partial: Partial<ZoomConfigModel>) {
  emit("update:modelValue", { ...props.modelValue, ...partial });
}
</script>

<template>
  <n-form-item label="Webhook URL *">
    <n-input
      :value="modelValue.webhookUrl"
      placeholder="https://integrations.zoom.us/chat/webhooks/incomingwebhook/..."
      @update:value="update({ webhookUrl: $event })"
    />
    <template #feedback>
      <p class="form-hint">
        Zoom Team Chat incoming webhook URL from your Zoom App
      </p>
    </template>
  </n-form-item>

  <n-form-item label="Authorization Token (optional)">
    <n-input
      :value="modelValue.authToken"
      type="password"
      show-password-on="mousedown"
      placeholder="Paste token only — without 'Bearer '"
      @update:value="update({ authToken: $event })"
    >
      <template #suffix><Icon icon="carbon:locked" /></template>
    </n-input>
    <template #feedback>
      <p class="form-hint">
        Sent as <code>Authorization: Bearer {token}</code>. Leave empty if you already set <code>Authorization</code> in Additional Headers.
      </p>
    </template>
  </n-form-item>

  <n-form-item label="Bot JID (optional)">
    <n-input
      :value="modelValue.botJid"
      placeholder="bot@xmpp.zoom.us"
      @update:value="update({ botJid: $event })"
    />
    <template #feedback>
      <p class="form-hint">Robot JID for Chatbot-style messages (rarely needed)</p>
    </template>
  </n-form-item>

  <n-form-item label="Additional Headers (JSON, optional)">
    <n-input
      :value="modelValue.headers"
      type="textarea"
      :autosize="{ minRows: 2, maxRows: 4 }"
      placeholder="{&quot;X-Custom-Header&quot;: &quot;value&quot;}"
      @update:value="update({ headers: $event })"
    />
    <template #feedback>
      <p class="form-hint">
        Extra headers only. <code>Content-Type</code> and <code>Authorization</code> are set automatically — do not duplicate them here.
      </p>
    </template>
  </n-form-item>
</template>
