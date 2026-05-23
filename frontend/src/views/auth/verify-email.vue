<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { authApi } from "@/api/auth";
import { whiteLabelConfig, getLogo } from "@/config/whitelabel";
import headerLogo from "@/assets/favicon-dark.svg";

const route = useRoute();
const router = useRouter();

const isLoading = ref(true);
const isSuccess = ref(false);
const error = ref<string | null>(null);

// Fixed logos
const rightPanelLogo = getLogo(false);

onMounted(async () => {
  const token = route.query.token as string;

  if (!token) {
    error.value = "Invalid verification link. No token provided.";
    isLoading.value = false;
    return;
  }

  try {
    await authApi.verifyEmail({ token });
    isSuccess.value = true;
  } catch (err: unknown) {
    const axiosError = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    if (axiosError.response?.status === 410) {
      error.value =
        "This verification link has expired. Please request a new one.";
    } else if (axiosError.response?.status === 400) {
      error.value = "Invalid verification link. Please request a new one.";
    } else {
      error.value =
        axiosError.response?.data?.message ||
        "Verification failed. Please try again.";
    }
  } finally {
    isLoading.value = false;
  }
});

function handleLogin() {
  router.push("/login");
}

function handleProfileComplete() {
  router.push("/profile/complete");
}

function handleResendVerification() {
  router.push("/register");
}
</script>

<template>
  <div class="verify-email-page">
    <!-- Left Panel -->
    <div class="left-panel">
      <div class="content-container">
        <!-- Header -->
        <div class="page-header">
          <img :src="headerLogo" :alt="whiteLabelConfig.brandName" class="header-logo" />
          <h1 class="title">Email Verification</h1>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="status-content">
          <div class="icon-container loading">
            <n-spin :size="60" />
          </div>
          <h2 class="status-title">Verifying Your Email</h2>
          <p class="status-message">
            Please wait while we verify your email address...
          </p>
        </div>

        <!-- Success State -->
        <div v-else-if="isSuccess" class="status-content">
          <div class="icon-container success">
            <Icon icon="mdi:check-circle" :width="80" :height="80" />
          </div>
          <h2 class="status-title">Email Verified!</h2>
          <p class="status-message">
            Your email has been verified successfully. You can now complete your
            profile setup or login to your account.
          </p>

          <div class="button-group">
            <n-button type="primary" size="large" block @click="handleProfileComplete">
              Complete Profile Setup
            </n-button>
            <n-button size="large" block ghost @click="handleLogin">
              Login Now
            </n-button>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="status-content">
          <div class="icon-container error">
            <Icon icon="mdi:close-circle" :width="80" :height="80" />
          </div>
          <h2 class="status-title">Verification Failed</h2>
          <p class="status-message">{{ error }}</p>

          <div class="button-group">
            <n-button type="primary" size="large" block @click="handleResendVerification">
              Request New Verification
            </n-button>
            <n-button size="large" block ghost @click="handleLogin">
              Back to Login
            </n-button>
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

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="illustration-container">
        <img :src="rightPanelLogo" :alt="whiteLabelConfig.brandName" class="logo-image" />
      </div>
    </div>
  </div>
</template>
