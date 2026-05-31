<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import { authApi } from "@/api/auth";
import { whiteLabelConfig, getLogo } from "@/config/whitelabel";
import { authInputOverrides } from "@/config";
import headerLogo from "@/assets/favicon-dark.svg";

const router = useRouter();
const route = useRoute();
const message = useMessage();

// Form state
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);
const resetSuccess = ref(false);
const token = ref<string | null>(null);
const tokenInvalid = ref(false);

// Fixed logos
const rightPanelLogo = getLogo(false);

// Get token from URL on mount
onMounted(() => {
  token.value = (route.query.token as string) || null;
  if (!token.value) {
    tokenInvalid.value = true;
  }
});

// Password strength calculation
const passwordStrength = computed(() => {
  const pwd = password.value;
  if (!pwd) return { score: 0, label: "", color: "" };

  let score = 0;

  // Length checks
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;

  // Character type checks
  if (/[a-z]/.test(pwd)) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

  // Score mapping
  if (score <= 2) return { score: 25, label: "Weak", color: "#ef4444" };
  if (score <= 4) return { score: 50, label: "Fair", color: "#f59e0b" };
  if (score <= 5) return { score: 75, label: "Good", color: "#10b981" };
  return { score: 100, label: "Strong", color: "#22c55e" };
});

// Password validation
const passwordErrors = computed(() => {
  const errors: string[] = [];
  const pwd = password.value;

  if (pwd && pwd.length < 8) errors.push("At least 8 characters");
  if (pwd && !/[a-z]/.test(pwd)) errors.push("One lowercase letter");
  if (pwd && !/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
  if (pwd && !/[0-9]/.test(pwd)) errors.push("One number");
  if (pwd && !/[^a-zA-Z0-9]/.test(pwd)) errors.push("One special character");

  return errors;
});

// Confirm password validation
const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return true;
  return password.value === confirmPassword.value;
});

// Form validation
const isFormValid = computed(() => {
  return (
    password.value &&
    confirmPassword.value &&
    passwordsMatch.value &&
    passwordErrors.value.length === 0 &&
    token.value
  );
});

async function handleSubmit() {
  if (!isFormValid.value || !token.value) {
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    await authApi.resetPassword({
      token: token.value,
      password: password.value,
    });
    resetSuccess.value = true;
    message.success("Password reset successfully!");
  } catch (err: unknown) {
    const axiosError = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    if (
      axiosError.response?.status === 400 ||
      axiosError.response?.status === 410
    ) {
      tokenInvalid.value = true;
    } else {
      error.value =
        axiosError.response?.data?.message ||
        "Failed to reset password. Please try again.";
    }
  } finally {
    isLoading.value = false;
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === "Enter" && isFormValid.value) {
    handleSubmit();
  }
}

function handleBackToLogin() {
  router.push("/login");
}

function handleRequestNewLink() {
  router.push("/forgot-password");
}
</script>

<template>
  <div class="reset-password-page">
    <!-- Left Panel - Form -->
    <div class="left-panel">
      <div class="form-container">
        <!-- Header -->
        <div class="reset-header">
          <img :src="headerLogo" :alt="whiteLabelConfig.brandName" class="header-logo" />
          <h1 class="title">Reset Password</h1>
        </div>

        <!-- Invalid Token State -->
        <div v-if="tokenInvalid" class="error-container">
          <div class="error-icon">
            <Icon icon="mdi:link-off" :width="64" :height="64" />
          </div>
          <h2 class="error-title">Invalid or Expired Link</h2>
          <p class="error-message">
            This password reset link is invalid or has expired. Please request a
            new link to reset your password.
          </p>
          <n-button type="primary" size="large" block @click="handleRequestNewLink">
            Request New Link
          </n-button>
          <div class="back-link-container">
            <router-link to="/login" class="back-link">
              <Icon icon="mdi:arrow-left" />
              Back to Login
            </router-link>
          </div>
        </div>

        <!-- Success State -->
        <div v-else-if="resetSuccess" class="success-container">
          <div class="success-icon">
            <Icon icon="mdi:check-circle-outline" :width="64" :height="64" />
          </div>
          <h2 class="success-title">Password Reset!</h2>
          <p class="success-message">
            Your password has been reset successfully. You can now login with
            your new password.
          </p>
          <n-button type="primary" size="large" block @click="handleBackToLogin">
            Login Now
          </n-button>
        </div>

        <!-- Form State -->
        <div v-else class="reset-form">
          <!-- Divider -->
          <div class="divider">
            <span>Create New Password</span>
          </div>

          <!-- Description -->
          <p class="form-description">
            Please enter your new password. Make sure it's strong and unique.
          </p>

          <!-- Password -->
          <div class="form-group">
            <label class="form-label">New Password</label>
            <n-input
              v-model:value="password" :type="showPassword ? 'text' : 'password'"
              placeholder="Enter new password" size="large" :disabled="isLoading"
              :theme-overrides="authInputOverrides" @keypress="handleKeyPress"
            >
              <template #suffix>
                <Icon
                  :icon="showPassword ? 'mdi:lock-open-outline' : 'mdi:lock-outline'
                  " class="password-toggle" @click="showPassword = !showPassword"
                />
              </template>
            </n-input>

            <!-- Password Strength Indicator -->
            <div v-if="password" class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill" :style="{
                    width: `${passwordStrength.score}%`,
                    backgroundColor: passwordStrength.color,
                  }"
                />
              </div>
              <span class="strength-label" :style="{ color: passwordStrength.color }">
                {{ passwordStrength.label }}
              </span>
            </div>

            <!-- Password Requirements -->
            <div v-if="password && passwordErrors.length > 0" class="password-requirements">
              <span v-for="err in passwordErrors" :key="err" class="requirement">
                <Icon icon="mdi:close-circle" class="requirement-icon error" />
                {{ err }}
              </span>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <n-input
              v-model:value="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm new password" size="large" :disabled="isLoading"
              :theme-overrides="authInputOverrides" :status="!passwordsMatch ? 'error' : undefined"
              @keypress="handleKeyPress"
            >
              <template #suffix>
                <Icon
                  :icon="showConfirmPassword
                    ? 'mdi:lock-open-outline'
                    : 'mdi:lock-outline'
                  " class="password-toggle" @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </n-input>
            <span v-if="!passwordsMatch" class="field-error">Passwords do not match</span>
          </div>

          <!-- Error Message -->
          <n-alert v-if="error" type="error" :show-icon="true" class="error-alert">
            {{ error }}
          </n-alert>

          <!-- Submit Button -->
          <n-button
            type="primary" size="large" block :loading="isLoading" :disabled="!isFormValid"
            @click="handleSubmit"
          >
            Reset Password
          </n-button>

          <!-- Back to Login -->
          <div class="back-link-container">
            <router-link to="/login" class="back-link">
              <Icon icon="mdi:arrow-left" />
              Back to Login
            </router-link>
          </div>
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

    <!-- Right Panel - Logo & Illustration -->
    <div class="right-panel">
      <div class="illustration-container">
        <img :src="rightPanelLogo" :alt="whiteLabelConfig.brandName" class="logo-image" />
      </div>
    </div>
  </div>
</template>
