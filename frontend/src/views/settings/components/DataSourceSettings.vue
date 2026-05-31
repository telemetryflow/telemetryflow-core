<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useAppStore } from "@/store";

const appStore = useAppStore();

const httpEndpoint = ref(appStore.collectorConfig.httpEndpoint);
const grpcEndpoint = ref(appStore.collectorConfig.grpcEndpoint);
const wsEndpoint = ref(appStore.collectorConfig.wsEndpoint);
const streamingEnabled = ref(appStore.collectorConfig.streaming);
const refreshInterval = ref(appStore.collectorConfig.refreshInterval / 1000);

const isSaved = ref(false);
const isTesting = ref(false);

// Computed status label and type based on backend response
const statusLabel = computed(() => {
  const status = appStore.collectorStatus;
  if (!status) return "Unknown";
  if (status.collectorReachable && status.dataFlowing) return "Connected";
  if (status.collectorReachable && !status.dataFlowing) return "Collector OK · No Data";
  if (!status.collectorReachable && status.dataFlowing) return "Data Flowing · Collector Unreachable";
  if (status.connected) return "Connected";
  return "Disconnected";
});

const statusType = computed<"success" | "warning" | "error" | "default">(() => {
  const status = appStore.collectorStatus;
  if (!status) return "default";
  if (status.collectorReachable && status.dataFlowing) return "success";
  if (status.collectorReachable && !status.dataFlowing) return "warning";
  if (!status.collectorReachable && status.dataFlowing) return "warning";
  if (status.connected) return "success";
  return "error";
});

function saveSettings() {
  appStore.updateCollectorConfig({
    httpEndpoint: httpEndpoint.value,
    grpcEndpoint: grpcEndpoint.value,
    wsEndpoint: wsEndpoint.value,
    streaming: streamingEnabled.value,
    refreshInterval: refreshInterval.value * 1000,
  });

  isSaved.value = true;
  setTimeout(() => {
    isSaved.value = false;
  }, 2000);
}

function resetSettings() {
  httpEndpoint.value = "http://localhost:4318";
  grpcEndpoint.value = "http://localhost:4317";
  wsEndpoint.value = "ws://localhost:4319";
  streamingEnabled.value = true;
  refreshInterval.value = 5;
}

async function testConnection() {
  isTesting.value = true;
  try {
    await appStore.checkCollectorStatus();
  } finally {
    isTesting.value = false;
  }
}
</script>

<template>
  <n-card title="Data Source" size="small" class="card-datasource">
    <template #header-extra>
      <n-tag :type="statusType" round>
        {{ statusLabel }}
      </n-tag>
    </template>

    <n-form label-placement="left" label-width="140">
      <n-form-item label="HTTP Endpoint">
        <n-input v-model:value="httpEndpoint" placeholder="http://localhost:4318">
          <template #prefix>
            <Icon icon="carbon:http" />
          </template>
        </n-input>
      </n-form-item>

      <n-form-item label="gRPC Endpoint">
        <n-input v-model:value="grpcEndpoint" placeholder="http://localhost:4317">
          <template #prefix>
            <Icon icon="carbon:api" />
          </template>
        </n-input>
      </n-form-item>

      <n-form-item label="WebSocket URL">
        <n-input v-model:value="wsEndpoint" placeholder="ws://localhost:4319">
          <template #prefix>
            <Icon icon="carbon:connect" />
          </template>
        </n-input>
      </n-form-item>

      <n-form-item label="Enable Streaming">
        <n-switch v-model:value="streamingEnabled" />
      </n-form-item>

      <n-form-item label="Refresh Interval">
        <n-input-number v-model:value="refreshInterval" :min="1" :max="300">
          <template #suffix>seconds</template>
        </n-input-number>
      </n-form-item>
    </n-form>

    <div class="form-actions">
      <n-button type="primary" ghost :loading="isTesting" @click="testConnection">
        <template #icon>
          <Icon icon="carbon:connection-signal" />
        </template>
        Test Connection
      </n-button>
      <n-button type="primary" ghost @click="resetSettings">
        <template #icon>
          <Icon icon="carbon:reset" />
        </template>
        Reset to Defaults
      </n-button>
      <n-button type="primary" @click="saveSettings">
        <template #icon>
          <Icon icon="carbon:save" />
        </template>
        {{ isSaved ? "Saved!" : "Save Settings" }}
      </n-button>
    </div>
  </n-card>
</template>

<style scoped lang="scss">
.card-datasource {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.n-card__content) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px 24px !important;
  }

  :deep(.n-form) {
    max-width: 100%;
  }

  :deep(.n-form-item) {
    margin-bottom: 16px;
  }

  :deep(.n-form-item-label) {
    min-width: 140px;
    text-align: right;
    padding-right: 12px;
  }

  :deep(.n-input__input-el) {
    padding-left: 8px !important;
  }

  .form-actions {
    margin-top: auto;
    flex-shrink: 0;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color);
}
</style>