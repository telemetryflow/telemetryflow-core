<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import {
  NModal,
  NAlert,
  NCheckbox,
  NButton,
  NSpace,
} from "naive-ui";
import { copyToClipboard } from "@/utils/clipboard";
import { useMessage } from "naive-ui";

interface Props {
  visible: boolean;
  mode: "create" | "rotate";
  credentials: {
    apiKeyId?: string;
    apiKeySecret: string;
    encryptionKey: string;
  } | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const message = useMessage();
const confirmed = ref(false);

const title = computed(() =>
  props.mode === "create" ? "API Key Created" : "API Key Rotated"
);

function handleCopy(value: string, label: string) {
  copyToClipboard(value);
  message.success(`${label} copied to clipboard`);
}

function handleClose() {
  confirmed.value = false;
  emit("close");
}
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    :title="title"
    :style="{ maxWidth: '560px', width: '95vw' }"
    :mask-closable="false"
    :closable="false"
  >
    <div class="credentials-modal">
      <NAlert type="warning" :show-icon="true" style="margin-bottom: 16px">
        <template #icon>
          <Icon icon="carbon:warning" />
        </template>
        These credentials will not be shown again. Save them now.
      </NAlert>

      <!-- API Key ID (create only) -->
      <div v-if="mode === 'create' && credentials?.apiKeyId" class="cred-field">
        <div class="cred-field__label">API Key ID</div>
        <div class="cred-field__row">
          <code class="cred-field__value">{{ credentials.apiKeyId }}</code>
          <NButton
            size="small"
            quaternary
            @click="handleCopy(credentials!.apiKeyId!, 'API Key ID')"
          >
            <template #icon><Icon icon="carbon:copy" /></template>
          </NButton>
        </div>
      </div>

      <!-- API Key Secret -->
      <div v-if="credentials" class="cred-field">
        <div class="cred-field__label">API Key Secret</div>
        <div class="cred-field__row">
          <code class="cred-field__value">{{ credentials.apiKeySecret }}</code>
          <NButton
            size="small"
            quaternary
            @click="handleCopy(credentials.apiKeySecret, 'API Key Secret')"
          >
            <template #icon><Icon icon="carbon:copy" /></template>
          </NButton>
        </div>
      </div>

      <!-- Encryption Key -->
      <div v-if="credentials" class="cred-field">
        <div class="cred-field__label">Encryption Key</div>
        <div class="cred-field__row">
          <code class="cred-field__value">{{ credentials.encryptionKey }}</code>
          <NButton
            size="small"
            quaternary
            @click="handleCopy(credentials.encryptionKey, 'Encryption Key')"
          >
            <template #icon><Icon icon="carbon:copy" /></template>
          </NButton>
        </div>
      </div>

      <div class="cred-confirm">
        <NCheckbox v-model:checked="confirmed">
          I have saved these credentials
        </NCheckbox>
      </div>
    </div>

    <template #footer>
      <div class="tfo-modal-footer">
        <NButton
          type="primary"
          :disabled="!confirmed"
          @click="handleClose"
        >
          <template #icon><Icon icon="carbon:checkmark" /></template>
          Close
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.credentials-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cred-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--n-text-color-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(128, 128, 128, 0.08);
    border: 1px solid rgba(128, 128, 128, 0.2);
    border-radius: 6px;
    padding: 8px 10px;
  }

  &__value {
    flex: 1;
    font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
    font-size: 12px;
    word-break: break-all;
    color: var(--n-text-color);
  }
}

.cred-confirm {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(128, 128, 128, 0.15);
}
</style>
