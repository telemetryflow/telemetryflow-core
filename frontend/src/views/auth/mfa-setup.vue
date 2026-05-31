<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/store";
import { whiteLabelConfig, getLogo } from "@/config/whitelabel";
import { authInputOverrides } from "@/config";
import headerLogo from "@/assets/favicon-dark.svg";

const router = useRouter();
const authStore = useAuthStore();
const rightPanelLogo = getLogo(false);

// ─── State ────────────────────────────────────────────────────────────────────
const step = ref<"setup" | "verify" | "backup" | "done">("setup");
const qrCode = ref("");
const secret = ref("");
const backupCodes = ref<string[]>([]);
const verifyCode = ref("");
const verifyError = ref<string | null>(null);
const backupCopied = ref(false);

// ─── Load MFA setup data (Requirement 7.1, 7.8) ───────────────────────────────
onMounted(async () => {
  const data = await authStore.setupMFA();
  if (data) {
    qrCode.value = data.qrCode;
    secret.value = data.secret;
    backupCodes.value = data.backupCodes ?? [];
  } else {
    router.push("/account/security");
  }
});

// ─── Enable MFA (Requirement 7.2) ────────────────────────────────────────────
async function handleEnable() {
  verifyError.value = null;
  if (!verifyCode.value || verifyCode.value.length !== 6) {
    verifyError.value = "Enter the 6-digit code from your authenticator app";
    return;
  }
  const ok = await authStore.enableMFA(verifyCode.value);
  if (ok) {
    step.value = "backup";
  } else {
    verifyError.value =
      authStore.loginError || "Invalid code. Please try again.";
    verifyCode.value = "";
  }
}

function copySecret() {
  navigator.clipboard.writeText(secret.value);
}

function copyBackupCodes() {
  navigator.clipboard.writeText(backupCodes.value.join("\n"));
  backupCopied.value = true;
  setTimeout(() => (backupCopied.value = false), 2000);
}

function handleDone() {
  router.push("/account/security");
}
</script>

<template>
  <div class="mfa-setup-page">
    <div class="left-panel">
      <div class="content-container">
        <div class="page-header">
          <img :src="headerLogo" :alt="whiteLabelConfig.brandName" class="header-logo" />
          <h1 class="title">Set Up Two-Factor Auth</h1>
        </div>

        <!-- Step indicator -->
        <div class="step-indicator" aria-label="Setup progress">
          <div v-for="(s, i) in ['Scan QR', 'Verify', 'Backup Codes']" :key="s" class="step-item">
            <div
              class="step-dot" :class="{
                active: i === ['setup', 'verify', 'backup'].indexOf(step),
                done: i < ['setup', 'verify', 'backup'].indexOf(step),
              }"
            >
              <Icon v-if="i < ['setup', 'verify', 'backup'].indexOf(step)" icon="mdi:check" :width="14" :height="14" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="step-label">{{ s }}</span>
          </div>
        </div>

        <!-- Step 1: Scan QR (Requirement 7.1) -->
        <div v-if="step === 'setup'" class="step-content">
          <div class="icon-container">
            <Icon icon="mdi:qrcode-scan" :width="48" :height="48" />
          </div>
          <h2 class="step-title">Scan with Authenticator App</h2>
          <p class="step-description">
            Open your authenticator app (Google Authenticator, Authy, etc.) and
            scan the QR code below.
          </p>

          <!-- QR Code display -->
          <div class="qr-container" aria-label="QR code for authenticator app">
            <img v-if="qrCode" :src="qrCode" alt="MFA QR Code" class="qr-image" />
            <div v-else class="qr-loading"><n-spin size="large" /></div>
          </div>

          <!-- Manual entry fallback -->
          <n-alert type="info" :show-icon="false" class="manual-entry">
            <template #header>Can't scan? Enter manually</template>
            <div class="secret-display">
              <code class="secret-code">{{ secret }}</code>
              <button class="copy-btn" type="button" aria-label="Copy secret key" @click="copySecret">
                <Icon icon="mdi:content-copy" :width="16" :height="16" />
              </button>
            </div>
          </n-alert>

          <n-button type="primary" size="large" block :disabled="!qrCode" @click="step = 'verify'">
            I've Scanned the QR Code
          </n-button>
          <div class="back-link-container">
            <router-link to="/account/security" class="back-link">
              <Icon icon="mdi:arrow-left" aria-hidden="true" /> Cancel
            </router-link>
          </div>
        </div>

        <!-- Step 2: Verify code (Requirement 7.2) -->
        <div v-else-if="step === 'verify'" class="step-content">
          <div class="icon-container">
            <Icon icon="mdi:shield-check-outline" :width="48" :height="48" />
          </div>
          <h2 class="step-title">Verify Your Code</h2>
          <p class="step-description">
            Enter the 6-digit code from your authenticator app to confirm setup.
          </p>

          <n-alert v-if="verifyError" type="error" :show-icon="true" aria-live="assertive">{{ verifyError }}</n-alert>

          <div class="form-group">
            <label for="mfa-verify-code" class="form-label">Verification Code</label>
            <n-input
              id="mfa-verify-code" v-model:value="verifyCode" placeholder="000000" size="large" maxlength="6"
              :disabled="authStore.isLoading" :theme-overrides="authInputOverrides"
              :status="verifyError ? 'error' : undefined" inputmode="numeric" autocomplete="one-time-code"
              aria-required="true" @input="verifyError = null" @keypress.enter="handleEnable"
            />
          </div>

          <n-button
            type="primary" size="large" block :loading="authStore.isLoading"
            :disabled="verifyCode.length !== 6 || authStore.isLoading" @click="handleEnable"
          >
            {{ authStore.isLoading ? "Verifying…" : "Enable Two-Factor Auth" }}
          </n-button>
          <div class="back-link-container">
            <button class="back-link" type="button" @click="step = 'setup'">
              <Icon icon="mdi:arrow-left" aria-hidden="true" /> Back
            </button>
          </div>
        </div>

        <!-- Step 3: Backup codes (Requirement 7.8) -->
        <div v-else-if="step === 'backup'" class="step-content">
          <div class="icon-container success">
            <Icon icon="mdi:check-circle-outline" :width="48" :height="48" />
          </div>
          <h2 class="step-title">Save Your Backup Codes</h2>
          <p class="step-description">
            Two-factor authentication is now enabled. Save these backup codes in
            a secure place — each can only be used once.
          </p>

          <n-alert type="warning" :show-icon="true">
            These codes will not be shown again. Store them securely.
          </n-alert>

          <div class="backup-codes-grid" aria-label="Backup codes">
            <code v-for="code in backupCodes" :key="code" class="backup-code">{{
              code
            }}</code>
          </div>

          <n-button size="large" block ghost aria-label="Copy all backup codes" @click="copyBackupCodes">
            <template #icon>
              <Icon :icon="backupCopied ? 'mdi:check' : 'mdi:content-copy'" />
            </template>
            {{ backupCopied ? "Copied!" : "Copy All Codes" }}
          </n-button>

          <n-button type="primary" size="large" block @click="handleDone">
            Done — Go to Security Settings
          </n-button>
        </div>

        <div class="page-footer">
          <p class="footer-text">
            <strong>{{ whiteLabelConfig.brandName }}</strong><br />{{ whiteLabelConfig.brandTagline }}
          </p>
        </div>
      </div>
    </div>

    <div class="right-panel">
      <div class="illustration-container">
        <img :src="rightPanelLogo" :alt="whiteLabelConfig.brandName" class="logo-image" />
      </div>
    </div>
  </div>
</template>
