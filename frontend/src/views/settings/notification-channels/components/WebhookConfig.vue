<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { brandDefaults } from "@/config";

export interface WebhookConfigModel {
  url: string;
  method: "POST" | "PUT" | "PATCH" | "GET";
  contentType: "json" | "form" | "text";
  authType: "none" | "basic" | "bearer" | "apikey";
  authToken: string;
  basicUsername: string;
  basicPassword: string;
  apiKeyHeader: string;
  apiKeyValue: string;
  signingSecret: string;
  signingHeader: string;
  headers: string;
  bodyTemplate: string;
  retryCount: number;
}

const methodOptions = [
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "PATCH", value: "PATCH" },
  { label: "GET", value: "GET" },
];

const contentTypeOptions = [
  { label: "JSON (application/json)", value: "json" },
  { label: "Form (application/x-www-form-urlencoded)", value: "form" },
  { label: "Plain Text (text/plain)", value: "text" },
];

const authOptions = [
  { label: "None", value: "none" },
  { label: "Bearer Token", value: "bearer" },
  { label: "Basic Auth", value: "basic" },
  { label: "API Key", value: "apikey" },
];

const retryOptions = [
  { label: "No retry", value: 0 },
  { label: "1 retry", value: 1 },
  { label: "2 retries", value: 2 },
  { label: "3 retries", value: 3 },
];

const templateVars = [
  "{{alertName}}", "{{severity}}", "{{status}}", "{{message}}",
  "{{currentValue}}", "{{threshold}}", "{{timestamp}}", "{{fingerprint}}",
];

const props = defineProps<{ modelValue: WebhookConfigModel }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: WebhookConfigModel): void;
}>();

function update(partial: Partial<WebhookConfigModel>) {
  emit("update:modelValue", { ...props.modelValue, ...partial });
}
</script>

<template>
  <!-- URL + Method + Content-Type -->
  <n-form-item label="Webhook URL *">
    <n-input
      :value="modelValue.url"
      :placeholder="brandDefaults.exampleUrl('api', '/webhook')"
      @update:value="update({ url: $event })"
    />
  </n-form-item>

  <div class="form-row">
    <n-form-item label="HTTP Method">
      <n-select
        :value="modelValue.method"
        :options="methodOptions"
        @update:value="update({ method: $event })"
      />
    </n-form-item>
    <n-form-item label="Content-Type">
      <n-select
        :value="modelValue.contentType"
        :options="contentTypeOptions"
        @update:value="update({ contentType: $event })"
      />
    </n-form-item>
  </div>

  <!-- Authentication -->
  <n-divider style="margin: 8px 0">Authentication</n-divider>

  <n-form-item label="Auth Type">
    <n-select
      :value="modelValue.authType"
      :options="authOptions"
      @update:value="update({ authType: $event })"
    />
  </n-form-item>

  <!-- Bearer -->
  <n-form-item v-if="modelValue.authType === 'bearer'" label="Bearer Token">
    <n-input
      :value="modelValue.authToken"
      type="password"
      show-password-on="mousedown"
      placeholder="eyJhbGciOiJIUzI1NiJ9..."
      @update:value="update({ authToken: $event })"
    >
      <template #suffix><Icon icon="carbon:locked" /></template>
    </n-input>
  </n-form-item>

  <!-- Basic Auth -->
  <template v-if="modelValue.authType === 'basic'">
    <div class="form-row">
      <n-form-item label="Username">
        <n-input
          :value="modelValue.basicUsername"
          placeholder="Username"
          @update:value="update({ basicUsername: $event })"
        />
      </n-form-item>
      <n-form-item label="Password">
        <n-input
          :value="modelValue.basicPassword"
          type="password"
          show-password-on="mousedown"
          placeholder="Password"
          @update:value="update({ basicPassword: $event })"
        >
          <template #suffix><Icon icon="carbon:locked" /></template>
        </n-input>
      </n-form-item>
    </div>
  </template>

  <!-- API Key -->
  <template v-if="modelValue.authType === 'apikey'">
    <div class="form-row">
      <n-form-item label="Header Name">
        <n-input
          :value="modelValue.apiKeyHeader"
          placeholder="X-Api-Key"
          @update:value="update({ apiKeyHeader: $event })"
        />
      </n-form-item>
      <n-form-item label="API Key Value">
        <n-input
          :value="modelValue.apiKeyValue"
          type="password"
          show-password-on="mousedown"
          placeholder="your-api-key"
          @update:value="update({ apiKeyValue: $event })"
        >
          <template #suffix><Icon icon="carbon:locked" /></template>
        </n-input>
      </n-form-item>
    </div>
    <p class="form-hint">Sent as: <code>{{ modelValue.apiKeyHeader || "X-Api-Key" }}: {value}</code></p>
  </template>

  <!-- Signing -->
  <n-divider style="margin: 8px 0">Payload Signing (optional)</n-divider>

  <div class="form-row">
    <n-form-item label="HMAC Signing Secret">
      <n-input
        :value="modelValue.signingSecret"
        type="password"
        show-password-on="mousedown"
        placeholder="your-webhook-secret"
        @update:value="update({ signingSecret: $event })"
      >
        <template #suffix><Icon icon="carbon:locked" /></template>
      </n-input>
    </n-form-item>
    <n-form-item label="Signature Header">
      <n-input
        :value="modelValue.signingHeader"
        placeholder="X-Webhook-Signature"
        @update:value="update({ signingHeader: $event })"
      />
    </n-form-item>
  </div>
  <p class="form-hint">
    Signs the payload with HMAC-SHA256. Sent as:
    <code>{{ modelValue.signingHeader || "X-Webhook-Signature" }}: sha256={hash}</code>
  </p>

  <!-- Custom Headers -->
  <n-divider style="margin: 8px 0">Custom Headers</n-divider>

  <n-form-item label="Additional Headers (JSON)">
    <n-input
      :value="modelValue.headers"
      type="textarea"
      placeholder="{&quot;X-Custom-Header&quot;: &quot;value&quot;, &quot;X-Source&quot;: &quot;TelemetryFlow&quot;}"
      :autosize="{ minRows: 2, maxRows: 4 }"
      @update:value="update({ headers: $event })"
    />
  </n-form-item>

  <!-- Body Template -->
  <n-divider style="margin: 8px 0">Request Body</n-divider>

  <n-form-item label="Custom Body Template">
    <n-input
      :value="modelValue.bodyTemplate"
      type="textarea"
      placeholder="{&quot;alert&quot;: &quot;{{alertName}}&quot;, &quot;severity&quot;: &quot;{{severity}}&quot;, &quot;status&quot;: &quot;{{status}}&quot;, &quot;message&quot;: &quot;{{message}}&quot;, &quot;value&quot;: {{currentValue}}, &quot;threshold&quot;: {{threshold}}}"
      :autosize="{ minRows: 4, maxRows: 10 }"
      @update:value="update({ bodyTemplate: $event })"
    />
    <template #feedback>
      <p class="form-hint" style="margin-top: 4px">
        Leave blank to use the default Alertmanager-compatible payload.
        Available variables:
        <n-space :size="4" style="display: inline-flex; flex-wrap: wrap; margin-top: 4px">
          <n-tag
            v-for="v in templateVars"
            :key="v"
            size="small"
            :bordered="false"
            style="font-family: monospace; font-size: 11px; cursor: pointer"
            @click="update({ bodyTemplate: modelValue.bodyTemplate + v })"
          >
            {{ v }}
          </n-tag>
        </n-space>
      </p>
    </template>
  </n-form-item>

  <!-- Advanced -->
  <n-divider style="margin: 8px 0">Advanced</n-divider>

  <n-form-item label="Retry on Failure">
    <n-select
      :value="modelValue.retryCount"
      :options="retryOptions"
      style="max-width: 200px"
      @update:value="update({ retryCount: $event })"
    />
  </n-form-item>
</template>
