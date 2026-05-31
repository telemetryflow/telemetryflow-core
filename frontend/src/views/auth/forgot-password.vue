<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import { authApi } from "@/api/auth";
import { whiteLabelConfig, getLogo } from "@/config/whitelabel";
import { authInputOverrides } from "@/config";
import headerLogo from "@/assets/favicon-dark.svg";

const router = useRouter();
const message = useMessage();

// Form state
const email = ref("");
const isLoading = ref(false);
const error = ref<string | null>(null);
const emailSent = ref(false);

// Fixed logos
const rightPanelLogo = getLogo(false);

// Form validation
const isFormValid = computed(() => {
  return email.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
});

async function handleSubmit() {
  if (!isFormValid.value) {
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    await authApi.forgotPassword({ email: email.value });
    emailSent.value = true;
    message.success("Password reset email sent successfully!");
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    // Don't reveal if email exists or not for security
    error.value =
      axiosError.response?.data?.message ||
      "An error occurred. Please try again.";
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

function handleResend() {
  emailSent.value = false;
  handleSubmit();
}
</script>

<template>
  <div class="forgot-password-page">
    <!-- Left Panel - Form -->
    <div class="left-panel">
      <div class="form-container">
        <!-- Header -->
        <div class="forgot-header">
          <img :src="headerLogo" :alt="whiteLabelConfig.brandName" class="header-logo" />
          <h1 class="title">Recover Password</h1>
        </div>

        <!-- Success State -->
        <div v-if="emailSent" class="success-container">
          <div class="success-icon">
            <Icon icon="mdi:email-check-outline" :width="64" :height="64" />
          </div>
          <h2 class="success-title">Check Your Email</h2>
          <p class="success-message">
            We've sent a password reset link to <strong>{{ email }}</strong>. Please check your inbox and follow the
            instructions.
          </p>
          <p class="success-hint">
            Didn't receive the email? Check your spam folder or
            <button class="resend-btn" @click="handleResend">
              click here to resend
            </button>.
          </p>
          <n-button type="primary" size="large" block @click="handleBackToLogin">
            Back to Login
          </n-button>
        </div>

        <!-- Form State -->
        <div v-else class="forgot-form">
          <!-- Description -->
          <p class="form-description">
            Forgot your password? Enter your email address and we'll send you a
            link to reset your password.
          </p>

          <!-- Email -->
          <div class="form-group">
            <label class="form-label">Email</label>
            <n-input
              v-model:value="email" placeholder="Enter your email" size="large" :disabled="isLoading"
              :theme-overrides="authInputOverrides" @keypress="handleKeyPress"
            >
              <template #prefix>
                <Icon icon="mdi:email-outline" class="input-icon" />
              </template>
            </n-input>
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
            Send Reset Link
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
