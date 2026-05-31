<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useMessage } from "naive-ui";
import { authApi } from "@/api/auth";
import { whiteLabelConfig, getLogo } from "@/config/whitelabel";
import headerLogo from "@/assets/favicon-dark.svg";

const route = useRoute();
const router = useRouter();
const message = useMessage();

const email = ref("");
const isResending = ref(false);
const resendCooldown = ref(0);
let cooldownInterval: ReturnType<typeof setInterval> | null = null;

// Fixed logos
const rightPanelLogo = getLogo(false);

onMounted(() => {
  email.value = (route.query.email as string) || "";
  if (!email.value) {
    router.push("/register");
  }
});

async function handleResend() {
  if (resendCooldown.value > 0 || !email.value) return;

  isResending.value = true;

  try {
    await authApi.resendVerification(email.value);
    message.success("Verification email sent!");
    startCooldown();
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    message.error(
      axiosError.response?.data?.message || "Failed to resend email",
    );
  } finally {
    isResending.value = false;
  }
}

function startCooldown() {
  resendCooldown.value = 60;
  cooldownInterval = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0 && cooldownInterval) {
      clearInterval(cooldownInterval);
    }
  }, 1000);
}
</script>

<template>
  <div class="verify-pending-page">
    <!-- Left Panel -->
    <div class="left-panel">
      <div class="content-container">
        <!-- Header -->
        <div class="page-header">
          <img :src="headerLogo" :alt="whiteLabelConfig.brandName" class="header-logo" />
          <h1 class="title">Verify Your Email</h1>
        </div>

        <!-- Content -->
        <div class="pending-content">
          <div class="icon-container">
            <Icon icon="mdi:email-fast-outline" :width="80" :height="80" />
          </div>

          <h2 class="pending-title">Check Your Inbox</h2>

          <p class="pending-message">We've sent a verification email to:</p>
          <p class="email-display">{{ email }}</p>

          <p class="pending-instructions">
            Click the link in the email to verify your account and complete
            registration.
          </p>

          <div class="divider">
            <span>Didn't receive the email?</span>
          </div>

          <ul class="help-list">
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email</li>
            <li>Wait a few minutes and try again</li>
          </ul>

          <n-button
            type="primary" size="large" block :loading="isResending" :disabled="resendCooldown > 0"
            @click="handleResend"
          >
            {{
              resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Verification Email"
            }}
          </n-button>

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

    <!-- Right Panel -->
    <div class="right-panel">
      <div class="illustration-container">
        <img :src="rightPanelLogo" :alt="whiteLabelConfig.brandName" class="logo-image" />
      </div>
    </div>
  </div>
</template>
