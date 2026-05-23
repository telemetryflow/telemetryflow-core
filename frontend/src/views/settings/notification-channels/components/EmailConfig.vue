<script setup lang="ts">
import { watch } from "vue";
import { Icon } from "@iconify/vue";
import { brandDefaults } from "@/config";

export interface EmailConfigModel {
  recipients: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
}

const props = defineProps<{ modelValue: EmailConfigModel }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: EmailConfigModel): void;
}>();

function update(partial: Partial<EmailConfigModel>) {
  emit("update:modelValue", { ...props.modelValue, ...partial });
}

// Auto-update port when SSL/TLS toggled (465 for SSL, 587 for STARTTLS)
watch(
  () => props.modelValue.smtpSecure,
  (secure) => {
    const currentPort = props.modelValue.smtpPort;
    // Only auto-switch between the two standard ports
    if (secure && currentPort === 587) {
      update({ smtpPort: 465 });
    } else if (!secure && currentPort === 465) {
      update({ smtpPort: 587 });
    }
  },
);

</script>

<template>
  <!-- Recipients -->
  <n-form-item label="Recipients *">
    <div style="width: 100%">
      <n-dynamic-tags
        :value="modelValue.recipients"
        @update:value="update({ recipients: $event })"
      />
      <p class="form-hint">Press Enter or Tab to add each email address</p>
    </div>
  </n-form-item>

  <!-- CC -->
  <n-form-item label="CC (optional)">
    <div style="width: 100%">
      <n-dynamic-tags
        :value="modelValue.cc"
        @update:value="update({ cc: $event })"
      />
      <p class="form-hint">Carbon copy recipients</p>
    </div>
  </n-form-item>

  <!-- BCC -->
  <n-form-item label="BCC (optional)">
    <div style="width: 100%">
      <n-dynamic-tags
        :value="modelValue.bcc"
        @update:value="update({ bcc: $event })"
      />
      <p class="form-hint">Blind carbon copy recipients</p>
    </div>
  </n-form-item>

  <!-- Subject -->
  <n-form-item label="Subject (optional)">
    <n-input
      :value="modelValue.subject"
      placeholder="🚨 [{severity}] {alertName} is {status}"
      @update:value="update({ subject: $event })"
    />
    <template #feedback>
      <p class="form-hint" style="margin-top: 4px">
        Variables: {alertName}, {severity}, {status}, {service}, {value}
      </p>
    </template>
  </n-form-item>

  <!-- From Name / From Email -->
  <div class="form-row">
    <n-form-item label="From Name">
      <n-input
        :value="modelValue.fromName"
        :placeholder="brandDefaults.companyName"
        @update:value="update({ fromName: $event })"
      />
    </n-form-item>
    <n-form-item label="From Email">
      <n-input
        :value="modelValue.fromEmail"
        :placeholder="brandDefaults.exampleEmail('alerts')"
        @update:value="update({ fromEmail: $event })"
      />
    </n-form-item>
  </div>

  <n-divider style="margin: 8px 0">SMTP Configuration</n-divider>

  <!-- SMTP Host / Port -->
  <div class="form-row">
    <n-form-item label="SMTP Host">
      <n-input
        :value="modelValue.smtpHost"
        placeholder="smtp.gmail.com"
        @update:value="update({ smtpHost: $event })"
      />
    </n-form-item>
    <n-form-item label="SMTP Port" style="max-width: 120px">
      <n-input-number
        :value="modelValue.smtpPort"
        :min="1"
        :max="65535"
        style="width: 100%"
        @update:value="update({ smtpPort: $event ?? 587 })"
      />
    </n-form-item>
  </div>

  <!-- SMTP Username / Password -->
  <div class="form-row">
    <n-form-item label="SMTP Username">
      <n-input
        :value="modelValue.smtpUser"
        placeholder="username@gmail.com"
        @update:value="update({ smtpUser: $event })"
      />
    </n-form-item>
    <n-form-item label="SMTP Password">
      <n-input
        :value="modelValue.smtpPassword"
        type="password"
        show-password-on="mousedown"
        placeholder="App password"
        @update:value="update({ smtpPassword: $event })"
      >
        <template #suffix><Icon icon="carbon:locked" /></template>
      </n-input>
    </n-form-item>
  </div>

  <!-- Use SSL/TLS -->
  <n-form-item label="Use SSL/TLS">
    <div style="display: flex; align-items: center; gap: 12px">
      <n-switch
        :value="modelValue.smtpSecure"
        @update:value="update({ smtpSecure: $event })"
      />
      <span class="form-hint" style="margin: 0">
        {{
          modelValue.smtpSecure
            ? "SSL/TLS enabled — port 465 recommended"
            : "STARTTLS — port 587 recommended"
        }}
      </span>
    </div>
  </n-form-item>
</template>
