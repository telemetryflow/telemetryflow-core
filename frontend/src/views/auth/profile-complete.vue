<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store";
import { whiteLabelConfig } from "@/config/whitelabel";
import { authInputOverrides } from "@/config";
import headerLogo from "@/assets/favicon-dark.svg";

const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();

// Step state
const currentStep = ref(1);
const totalSteps = 3;

// Step 1: Recovery Email
const recoveryEmail = ref("");
const skipRecoveryEmail = ref(false);

// Step 2: MFA Setup
const mfaEnabled = ref(false);
const mfaSecret = ref("");
const mfaQrCode = ref("");
const mfaCode = ref("");
const mfaBackupCodes = ref<string[]>([]);
const showBackupCodes = ref(false);

// Step 3: Confirmation
const isCompleting = ref(false);

// Loading states
const isLoadingMfa = ref(false);
const isVerifyingMfa = ref(false);
const isSavingRecoveryEmail = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    router.push("/login");
  }
});

// Step progress
const stepProgress = computed(() => (currentStep.value / totalSteps) * 100);

// Step 1: Save recovery email
async function handleSaveRecoveryEmail() {
  if (!recoveryEmail.value && !skipRecoveryEmail.value) return;

  isSavingRecoveryEmail.value = true;
  error.value = null;

  try {
    if (recoveryEmail.value) {
      // API call to save recovery email would go here
      // await userApi.updateRecoveryEmail(recoveryEmail.value);
      message.success("Recovery email saved!");
    }
    currentStep.value = 2;
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    error.value =
      axiosError.response?.data?.message || "Failed to save recovery email";
  } finally {
    isSavingRecoveryEmail.value = false;
  }
}

function handleSkipRecoveryEmail() {
  skipRecoveryEmail.value = true;
  currentStep.value = 2;
}

// Step 2: Setup MFA
async function handleEnableMfa() {
  isLoadingMfa.value = true;
  error.value = null;

  try {
    const response = await authApi.enableMFA();
    mfaSecret.value = response.secret;
    mfaQrCode.value = response.qrCode;
    mfaEnabled.value = true;
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    error.value = axiosError.response?.data?.message || "Failed to enable MFA";
  } finally {
    isLoadingMfa.value = false;
  }
}

async function handleVerifyMfaSetup() {
  if (mfaCode.value.length !== 6) return;

  isVerifyingMfa.value = true;
  error.value = null;

  try {
    const response = await authApi.confirmMFA(mfaCode.value);
    mfaBackupCodes.value = response.backupCodes;
    showBackupCodes.value = true;
    message.success("MFA enabled successfully!");
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    error.value =
      axiosError.response?.data?.message || "Invalid verification code";
    mfaCode.value = "";
  } finally {
    isVerifyingMfa.value = false;
  }
}

function handleContinueAfterMfa() {
  currentStep.value = 3;
}

function handleSkipMfa() {
  currentStep.value = 3;
}

// Step 3: Complete profile
async function handleCompleteProfile() {
  isCompleting.value = true;

  try {
    // Mark profile as complete - API call would go here
    // await userApi.completeProfile();
    message.success("Profile setup complete!");
    router.push("/home");
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    error.value =
      axiosError.response?.data?.message || "Failed to complete profile";
  } finally {
    isCompleting.value = false;
  }
}

function handleGoBack() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function copyBackupCodes() {
  const codes = mfaBackupCodes.value.join("\n");
  navigator.clipboard.writeText(codes);
  message.success("Backup codes copied to clipboard!");
}
</script>

<template>
  <div class="profile-complete-page">
    <div class="content-container">
      <!-- Header -->
      <div class="page-header">
        <img :src="headerLogo" :alt="whiteLabelConfig.brandName" class="header-logo" />
        <div class="header-text">
          <h1 class="title">Complete Your Profile</h1>
          <p class="subtitle">Step {{ currentStep }} of {{ totalSteps }}</p>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${stepProgress}%` }" />
      </div>

      <!-- Step 1: Recovery Email -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="step-icon">
          <Icon icon="mdi:email-plus-outline" :width="48" :height="48" />
        </div>
        <h2 class="step-title">Add Recovery Email</h2>
        <p class="step-description">
          Add a backup email address to help recover your account if you lose
          access.
        </p>

        <div class="form-group">
          <label class="form-label">Recovery Email</label>
          <n-input
            v-model:value="recoveryEmail" placeholder="Enter recovery email" size="large"
            :disabled="isSavingRecoveryEmail" :theme-overrides="authInputOverrides"
          >
            <template #prefix>
              <Icon icon="mdi:email-outline" class="input-icon" />
            </template>
          </n-input>
        </div>

        <n-alert v-if="error" type="error" :show-icon="true" class="error-alert">
          {{ error }}
        </n-alert>

        <div class="button-group">
          <n-button
            type="primary" size="large" block :loading="isSavingRecoveryEmail" :disabled="!recoveryEmail"
            @click="handleSaveRecoveryEmail"
          >
            Save & Continue
          </n-button>
          <n-button size="large" block ghost @click="handleSkipRecoveryEmail">
            Skip for Now
          </n-button>
        </div>
      </div>

      <!-- Step 2: MFA Setup -->
      <div v-else-if="currentStep === 2" class="step-content">
        <!-- Initial MFA prompt -->
        <template v-if="!mfaEnabled">
          <div class="step-icon">
            <Icon icon="mdi:shield-key-outline" :width="48" :height="48" />
          </div>
          <h2 class="step-title">Enable Two-Factor Authentication</h2>
          <p class="step-description">
            Add an extra layer of security to your account with two-factor
            authentication (2FA).
          </p>

          <div class="mfa-benefits">
            <div class="benefit">
              <Icon icon="mdi:check-circle" class="benefit-icon" />
              <span>Protect against unauthorized access</span>
            </div>
            <div class="benefit">
              <Icon icon="mdi:check-circle" class="benefit-icon" />
              <span>Use any authenticator app</span>
            </div>
            <div class="benefit">
              <Icon icon="mdi:check-circle" class="benefit-icon" />
              <span>Backup codes for account recovery</span>
            </div>
          </div>

          <n-alert v-if="error" type="error" :show-icon="true" class="error-alert">
            {{ error }}
          </n-alert>

          <div class="button-group">
            <n-button type="primary" size="large" block :loading="isLoadingMfa" @click="handleEnableMfa">
              Enable 2FA
            </n-button>
            <n-button size="large" block ghost @click="handleSkipMfa">
              Skip for Now
            </n-button>
          </div>
        </template>

        <!-- MFA Setup -->
        <template v-else-if="!showBackupCodes">
          <h2 class="step-title">Scan QR Code</h2>
          <p class="step-description">
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.)
          </p>

          <div class="qr-container">
            <img v-if="mfaQrCode" :src="mfaQrCode" alt="MFA QR Code" class="qr-code" />
            <div v-else class="qr-placeholder">
              <n-spin :size="24" />
            </div>
          </div>

          <div class="manual-entry">
            <p class="manual-label">Or enter this code manually:</p>
            <div class="secret-code">{{ mfaSecret }}</div>
          </div>

          <div class="form-group">
            <label class="form-label">Verification Code</label>
            <n-input
              v-model:value="mfaCode" placeholder="Enter 6-digit code" size="large" maxlength="6"
              :disabled="isVerifyingMfa" :theme-overrides="authInputOverrides"
            />
          </div>

          <n-alert v-if="error" type="error" :show-icon="true" class="error-alert">
            {{ error }}
          </n-alert>

          <div class="button-group">
            <n-button
              type="primary" size="large" block :loading="isVerifyingMfa" :disabled="mfaCode.length !== 6"
              @click="handleVerifyMfaSetup"
            >
              Verify & Enable
            </n-button>
            <n-button size="large" block ghost @click="handleGoBack">
              Go Back
            </n-button>
          </div>
        </template>

        <!-- Backup Codes -->
        <template v-else>
          <div class="step-icon success">
            <Icon icon="mdi:check-circle" :width="48" :height="48" />
          </div>
          <h2 class="step-title">Save Your Backup Codes</h2>
          <p class="step-description">
            Store these codes safely. You can use them to access your account if
            you lose your authenticator.
          </p>

          <div class="backup-codes-container">
            <div class="backup-codes">
              <div v-for="code in mfaBackupCodes" :key="code" class="backup-code">
                {{ code }}
              </div>
            </div>
            <n-button size="small" @click="copyBackupCodes">
              <template #icon>
                <Icon icon="mdi:content-copy" />
              </template>
              Copy All
            </n-button>
          </div>

          <n-alert type="warning" :show-icon="true" class="warning-alert">
            Each code can only be used once. Keep them in a safe place!
          </n-alert>

          <n-button type="primary" size="large" block @click="handleContinueAfterMfa">
            I've Saved My Codes - Continue
          </n-button>
        </template>
      </div>

      <!-- Step 3: Confirmation -->
      <div v-else-if="currentStep === 3" class="step-content">
        <div class="step-icon success">
          <Icon icon="mdi:party-popper" :width="48" :height="48" />
        </div>
        <h2 class="step-title">You're All Set!</h2>
        <p class="step-description">
          Your profile setup is complete. You can now start using
          {{ whiteLabelConfig.brandName }}.
        </p>

        <div class="setup-summary">
          <div class="summary-item">
            <Icon
              :icon="recoveryEmail ? 'mdi:check-circle' : 'mdi:minus-circle'"
              :class="recoveryEmail ? 'success' : 'skipped'"
            />
            <span>Recovery Email</span>
            <span class="status">{{
              recoveryEmail ? "Added" : "Skipped"
            }}</span>
          </div>
          <div class="summary-item">
            <Icon
              :icon="mfaBackupCodes.length > 0
                ? 'mdi:check-circle'
                : 'mdi:minus-circle'
              " :class="mfaBackupCodes.length > 0 ? 'success' : 'skipped'"
            />
            <span>Two-Factor Auth</span>
            <span class="status">{{
              mfaBackupCodes.length > 0 ? "Enabled" : "Skipped"
            }}</span>
          </div>
        </div>

        <n-alert v-if="error" type="error" :show-icon="true" class="error-alert">
          {{ error }}
        </n-alert>

        <n-button type="primary" size="large" block :loading="isCompleting" @click="handleCompleteProfile">
          Go to Dashboard
        </n-button>
      </div>
    </div>
  </div>
</template>
