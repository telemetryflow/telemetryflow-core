<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const error = ref<string | null>(null);

onMounted(async () => {
  const accessToken = route.query.access_token as string | undefined;
  const refreshToken = route.query.refresh_token as string | undefined;
  const errorMsg = route.query.error as string | undefined;

  if (errorMsg) {
    error.value = decodeURIComponent(errorMsg);
    setTimeout(() => router.replace("/login"), 3000);
    return;
  }

  if (!accessToken || !refreshToken) {
    error.value = "Missing authentication tokens. Please try again.";
    setTimeout(() => router.replace("/login"), 3000);
    return;
  }

  try {
    authStore.loginWithSSOTokens(accessToken, refreshToken);
    await authStore.refreshUser();
    router.replace("/");
  } catch {
    error.value = "Failed to complete SSO login. Please try again.";
    setTimeout(() => router.replace("/login"), 3000);
  }
});
</script>

<template>
  <div class="sso-callback">
    <div class="callback-card">
      <template v-if="error">
        <div class="callback-icon error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2>Authentication Failed</h2>
        <p class="error-message">{{ error }}</p>
        <p class="redirect-text">Redirecting to login...</p>
      </template>
      <template v-else>
        <div class="callback-icon">
          <svg class="spinner" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
          </svg>
        </div>
        <h2>Completing Sign In</h2>
        <p>Please wait while we verify your identity...</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sso-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--n-body-color, #f5f5f5);
}

.callback-card {
  text-align: center;
  padding: 48px;
  background: var(--n-card-color, #fff);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  max-width: 400px;
}

.callback-card h2 {
  margin: 16px 0 8px;
  font-size: 1.25rem;
  font-weight: 600;
}

.callback-card p {
  color: var(--n-text-color-3, #999);
  font-size: 0.875rem;
  margin: 0;
}

.callback-icon {
  color: var(--n-primary-color, #3b82f6);
}

.callback-icon.error {
  color: #ef4444;
}

.error-message {
  color: #ef4444 !important;
  margin-bottom: 8px !important;
}

.redirect-text {
  font-size: 0.75rem !important;
  margin-top: 12px !important;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
