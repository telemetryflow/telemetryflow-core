<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store";
import { whiteLabelConfig, getLogo } from "@/config/whitelabel";
import { authInputOverrides } from "@/config";
import headerLogo from "@/assets/favicon-dark.svg";

const route = useRoute();
const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();

// OTP input state - 6 digit code
const otpDigits = ref(["", "", "", "", "", ""]);
const otpInputRefs = ref<(HTMLInputElement | null)[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const sessionToken = ref<string | null>(null);
const attemptsRemaining = ref(5);

// Backup code mode (Requirement 7.9)
const useBackupCode = ref(false);
const backupCode = ref("");

// Fixed logos
const rightPanelLogo = getLogo(false);

onMounted(() => {
  sessionToken.value = (route.query.session as string) || null;
  if (!sessionToken.value) {
    router.push("/login");
    return;
  }
  // Focus first input
  setTimeout(() => {
    otpInputRefs.value[0]?.focus();
  }, 100);
});

// Computed OTP code
const otpCode = computed(() => otpDigits.value.join(""));
const isCodeComplete = computed(() => otpCode.value.length === 6);

// Handle input change
function handleInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  // Only allow digits
  if (value && !/^\d$/.test(value)) {
    otpDigits.value[index] = "";
    return;
  }

  otpDigits.value[index] = value;

  // Move to next input
  if (value && index < 5) {
    otpInputRefs.value[index + 1]?.focus();
  }

  // Auto-submit when complete
  if (isCodeComplete.value) {
    handleVerify();
  }
}

// Handle keydown for backspace navigation
function handleKeydown(index: number, event: KeyboardEvent) {
  if (event.key === "Backspace" && !otpDigits.value[index] && index > 0) {
    otpInputRefs.value[index - 1]?.focus();
  }
}

// Handle paste
function handlePaste(event: ClipboardEvent) {
  event.preventDefault();
  const pastedData = event.clipboardData?.getData("text") || "";
  const digits = pastedData.replace(/\D/g, "").slice(0, 6).split("");

  digits.forEach((digit, idx) => {
    if (idx < 6) {
      otpDigits.value[idx] = digit;
    }
  });

  // Focus last filled or first empty
  const focusIndex = Math.min(digits.length, 5);
  otpInputRefs.value[focusIndex]?.focus();

  // Auto-submit if complete
  if (digits.length === 6) {
    setTimeout(() => handleVerify(), 100);
  }
}

function toggleBackupMode() {
  useBackupCode.value = !useBackupCode.value;
  error.value = null;
  backupCode.value = "";
  otpDigits.value = ["", "", "", "", "", ""];
}

async function handleVerify() {
  const code = useBackupCode.value ? backupCode.value.trim() : otpCode.value;
  if (!code || !sessionToken.value) return;
  if (!useBackupCode.value && !isCodeComplete.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    const response = await authApi.verifyMFA({
      code: useBackupCode.value ? backupCode.value.trim() : otpCode.value,
      sessionToken: sessionToken.value,
    });

    // Update auth store with user data
    if (response.user) {
      authStore.setUser(response.user);
    }

    message.success("Authentication successful!");

    // Redirect to dashboard or requested page
    const redirectPath = (route.query.redirect as string) || "/home";
    router.push(redirectPath);
  } catch (err: unknown) {
    const axiosError = err as {
      response?: { data?: { message?: string; attemptsRemaining?: number } };
    };

    attemptsRemaining.value =
      axiosError.response?.data?.attemptsRemaining ??
      attemptsRemaining.value - 1;

    if (attemptsRemaining.value <= 0) {
      error.value = "Too many failed attempts. Please login again.";
      setTimeout(() => router.push("/login"), 3000);
    } else {
      error.value =
        axiosError.response?.data?.message ||
        `Invalid code. ${attemptsRemaining.value} attempts remaining.`;
    }

    // Clear inputs on error
    otpDigits.value = ["", "", "", "", "", ""];
    otpInputRefs.value[0]?.focus();
  } finally {
    isLoading.value = false;
  }
}

function handleCancel() {
  router.push("/login");
}

// Watch for auto-submit when all digits filled
watch(otpCode, (newValue) => {
  if (newValue.length === 6 && !isLoading.value) {
    handleVerify();
  }
});
</script>

<template>
  <div class="mfa-verify-page">
    <!-- Left Panel -->
    <div class="left-panel">
      <div class="content-container">
        <!-- Header -->
        <div class="page-header">
          <img :src="headerLogo" :alt="whiteLabelConfig.brandName" class="header-logo" />
          <h1 class="title">Two-Factor Authentication</h1>
        </div>

        <!-- Content -->
        <div class="mfa-content">
          <div class="icon-container">
            <Icon icon="mdi:shield-key-outline" :width="64" :height="64" />
          </div>

          <h2 class="mfa-title">Enter Verification Code</h2>

          <p class="mfa-message">
            Enter the 6-digit code from your authenticator app to complete
            login.
          </p>

          <!-- Attempts Remaining Indicator -->
          <div v-if="attemptsRemaining < 5" class="attempts-indicator" :class="{ warning: attemptsRemaining <= 2 }">
            <Icon icon="carbon:warning" :width="16" :height="16" />
            <span>{{ attemptsRemaining }}
              {{ attemptsRemaining === 1 ? "attempt" : "attempts" }}
              remaining</span>
          </div>

          <!-- TOTP mode -->
          <template v-if="!useBackupCode">
            <!-- OTP Input -->
            <div class="otp-container" @paste="handlePaste">
              <input
                v-for="(digit, index) in otpDigits" :key="index"
                :ref="(el) => (otpInputRefs[index] = el as HTMLInputElement)" type="text" inputmode="numeric"
                maxlength="1" class="otp-input" :class="{
                  'has-value': digit,
                  error: error,
                  success: isCodeComplete && !error,
                }" :value="digit" :disabled="isLoading" @input="handleInput(index, $event)"
                @keydown="handleKeydown(index, $event)"
              />
            </div>

            <!-- Loading Indicator -->
            <div v-if="isLoading" class="verification-status">
              <n-spin size="small" />
              <span>Verifying code...</span>
            </div>

            <!-- Error Message -->
            <n-alert v-if="error" type="error" :show-icon="true" class="error-alert" aria-live="assertive">
              {{ error }}
            </n-alert>

            <!-- Verify Button -->
            <n-button
              type="primary" size="large" block :loading="isLoading" :disabled="!isCodeComplete"
              @click="handleVerify"
            >
              Verify
            </n-button>

            <!-- Switch to backup code -->
            <button class="switch-mode-btn" type="button" @click="toggleBackupMode">
              Use a backup code instead
            </button>
          </template>

          <!-- Backup code mode (Requirement 7.9) -->
          <template v-else>
            <p class="mfa-message">Enter one of your saved backup codes.</p>

            <div class="form-group">
              <label for="backup-code-input" class="form-label">Backup Code</label>
              <n-input
                id="backup-code-input" v-model:value="backupCode" placeholder="xxxxxxxx" size="large"
                :disabled="isLoading" :theme-overrides="authInputOverrides" :status="error ? 'error' : undefined"
                autocomplete="one-time-code" aria-required="true" @input="error = null"
                @keypress.enter="handleVerify"
              />
            </div>

            <n-alert v-if="error" type="error" :show-icon="true" class="error-alert" aria-live="assertive">
              {{ error }}
            </n-alert>

            <n-button
              type="primary" size="large" block :loading="isLoading" :disabled="!backupCode.trim() || isLoading"
              @click="handleVerify"
            >
              {{ isLoading ? "Verifying…" : "Verify Backup Code" }}
            </n-button>

            <!-- Switch back to TOTP -->
            <button class="switch-mode-btn" type="button" @click="toggleBackupMode">
              Use authenticator app instead
            </button>
          </template>

          <div class="divider">
            <span>Having trouble?</span>
          </div>

          <!-- Help Section -->
          <div class="help-section">
            <n-alert type="info" :show-icon="false" class="help-alert">
              <template #header>
                <div class="help-header">
                  <Icon icon="carbon:help" :width="18" :height="18" />
                  <strong>Troubleshooting Tips</strong>
                </div>
              </template>
              <ul class="help-list">
                <li>Make sure your device's time is synchronized</li>
                <li>Try refreshing the code in your authenticator app</li>
                <li>Check that you're using the correct account</li>
                <li>If you've lost access, use a backup code instead</li>
              </ul>
            </n-alert>
          </div>

          <p class="help-text">
            If you don't have access to your authenticator app or backup codes,
            contact your administrator for help.
          </p>

          <n-button size="large" block ghost @click="handleCancel">
            Cancel and Return to Login
          </n-button>
        </div>

        <!-- Footer -->
        <div class="page-footer">
          <p class="footer-text">
            <strong>{{ whiteLabelConfig.brandName }}</strong>
            <br />
            {{ whiteLabelConfig.brandTagline }}
          </p>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="illustration-container">
        <img :src="rightPanelLogo" :alt="whiteLabelConfig.brandName" class="logo-image" />
      </div>
    </div>
  </div>
</template>
