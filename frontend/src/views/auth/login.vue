<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore, useAppStore } from "@/store";
import { config, ssoConfig, authInputOverrides } from "@/config";
import { whiteLabelConfig, getLogo } from "@/config/whitelabel";
import { DEFAULT_USERS } from "@/api/auth";
import { ssoApi } from "@/api/sso";
import headerLogo from "@/assets/favicon-dark.svg";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const appStore = useAppStore();
const isDark = computed(() => appStore.isDarkMode);

// ─── Form state ───────────────────────────────────────────────────────────────
const identifier = ref("");
const password = ref("");
const showPassword = ref(false);
const rememberMe = ref(false);

// ─── Field-level validation errors (Requirement 3.6) ─────────────────────────
const fieldErrors = ref<{ identifier?: string; password?: string }>({});

// ─── SSO / OAuth loading (unified) ────────────────────────────────────────────
const ssoLoading = ref<string | null>(null);
const ssoError = ref<string | null>(null);

// ─── Dev quick-login ──────────────────────────────────────────────────────────
const showDemoHint = ref(true);
const selectedUser = ref<string | null>(null);

// ─── Computed ─────────────────────────────────────────────────────────────────
const sessionExpired = computed(() => route.query.expired === "true");
const rightPanelLogo = computed(() => getLogo(isDark.value));

/** Maps account_deactivated error code to friendly message (Requirement 14.8) */
const isAccountDeactivated = computed(
  () => authStore.loginError === "account_deactivated",
);
const generalError = computed(() => {
  if (!authStore.loginError || isAccountDeactivated.value) return null;
  return authStore.loginError;
});

const hasAnySSOEnabled = computed(
  () =>
    ssoConfig.google ||
    ssoConfig.github ||
    ssoConfig.microsoft ||
    ssoConfig.apple ||
    ssoConfig.slack ||
    ssoConfig.cognito,
);

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(): boolean {
  fieldErrors.value = {};
  if (!identifier.value.trim())
    fieldErrors.value.identifier = "Username or email is required";
  if (!password.value) fieldErrors.value.password = "Password is required";
  return Object.keys(fieldErrors.value).length === 0;
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function handleLogin() {
  authStore.clearError();
  ssoError.value = null;
  if (!validate()) return;

  const success = await authStore.login(
    identifier.value.trim(),
    password.value,
  );

  if (authStore.isMfaRequired) {
    router.push({
      path: "/mfa-verify",
      query: { session: authStore.mfaSession ?? undefined },
    });
    return;
  }
  if (success) {
    const redirectPath = (route.query.redirect as string) || "/home";
    router.push(redirectPath);
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === "Enter") handleLogin();
}

// ─── SSO / OAuth — unified handler (Requirement 1.3 & 1.4) ───────────────────
const SSO_PROVIDER_IDS: Record<string, string> = {
  google: "sso-google",
  github: "sso-github",
  microsoft: "sso-microsoft",
  apple: "sso-apple",
  slack: "sso-slack",
  cognito: "sso-cognito",
};

async function handleSSOLogin(provider: string) {
  authStore.clearError();
  ssoError.value = null;
  ssoLoading.value = provider;
  try {
    const response = await ssoApi.initiateSSO({
      providerId: SSO_PROVIDER_IDS[provider],
      redirectUrl: `${window.location.origin}/auth/sso/callback`,
    });
    window.location.href = response.authorizationUrl;
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    ssoError.value =
      err.response?.data?.message ||
      err.message ||
      `Failed to initiate ${provider} login`;
    ssoLoading.value = null;
  }
}

// ─── Dev quick-fill ───────────────────────────────────────────────────────────
function getTierColor(tier: number): string {
  const colors: Record<number, string> = {
    1: "#f59e0b",
    2: "#8b5cf6",
    3: "#3b82f6",
    4: "#10b981",
    5: "#6b7280",
  };
  return colors[tier] || "#6b7280";
}

function fillCredentials(userKey: "administrator" | "demo") {
  const user = DEFAULT_USERS[userKey];
  selectedUser.value = userKey;
  identifier.value = user.email;
  password.value = user.password;
}
</script>

<template>
  <div class="login-page">
    <!-- Left Panel -->
    <div class="left-panel">
      <div class="form-container">
        <!-- Header -->
        <div class="login-header">
          <img :src="headerLogo" :alt="whiteLabelConfig.brandName" class="header-logo" />
          <h1 class="title">{{ whiteLabelConfig.brandName }}</h1>
        </div>

        <div class="login-form-wrapper">
          <div class="divider"><span>Login with Credentials</span></div>

          <!-- Session expired alert -->
          <n-alert v-if="sessionExpired" type="warning" :show-icon="true">
            Your session has expired. Please login again.
          </n-alert>

          <!-- Dev quick-login (hidden in production) -->
          <div v-if="showDemoHint && !config.isProduction" class="quick-login-section">
            <div class="quick-login-header">
              <span class="quick-login-title">Quick Login</span>
              <Icon icon="carbon:close" class="quick-login-close" @click="showDemoHint = false" />
            </div>
            <div class="quick-login-buttons">
              <button
                v-for="userKey in ['administrator', 'demo'] as const" :key="userKey" type="button"
                class="quick-login-btn" :class="{ active: selectedUser === userKey }" @click="fillCredentials(userKey)"
              >
                <div class="quick-login-btn-content">
                  <div
                    class="quick-login-icon" :style="{
                      backgroundColor: getTierColor(
                        DEFAULT_USERS[userKey].tier,
                      ),
                    }"
                  >
                    <Icon
                      :icon="userKey === 'administrator'
                        ? 'carbon:user-admin'
                        : 'carbon:demo'
                      " :width="20" :height="20"
                    />
                  </div>
                  <div class="quick-login-info">
                    <span class="quick-login-name">{{
                      userKey === "administrator" ? "Administrator" : "Demo"
                    }}</span>
                    <span class="quick-login-desc">{{
                      DEFAULT_USERS[userKey].description
                    }}</span>
                  </div>
                  <span
                    class="tier-badge" :style="{
                      backgroundColor: getTierColor(
                        DEFAULT_USERS[userKey].tier,
                      ),
                    }"
                  >
                    Tier {{ DEFAULT_USERS[userKey].tier }}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <!-- Account deactivated error (Requirement 14.8) -->
          <n-alert v-if="isAccountDeactivated" type="error" :show-icon="true" aria-live="assertive">
            <template #header>Account Deactivated</template>
            Your account has been deactivated. Please contact your administrator
            or raise a support ticket.
          </n-alert>

          <!-- General login error -->
          <n-alert v-else-if="generalError" type="error" :show-icon="true" aria-live="assertive">
            {{ generalError }}
          </n-alert>

          <!-- SSO error -->
          <n-alert v-if="ssoError" type="error" :show-icon="true" aria-live="assertive">
            {{ ssoError }}
          </n-alert>

          <!-- Username / Email (Requirement 1.1) -->
          <div class="form-group">
            <label for="login-identifier" class="form-label">Username / Email</label>
            <n-input
              id="login-identifier" v-model:value="identifier" placeholder="Type your username or email"
              size="large" :disabled="authStore.isLoading" :status="fieldErrors.identifier ? 'error' : undefined"
              :theme-overrides="authInputOverrides" autocomplete="username" aria-required="true"
              :aria-describedby="fieldErrors.identifier ? 'identifier-error' : undefined"
              @keypress="handleKeyPress" @input="fieldErrors.identifier = undefined"
            />
            <span v-if="fieldErrors.identifier" id="identifier-error" class="field-error" role="alert">
              <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
              {{ fieldErrors.identifier }}
            </span>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="login-password" class="form-label">Password</label>
            <n-input
              id="login-password" v-model:value="password" :type="showPassword ? 'text' : 'password'"
              placeholder="Type your password" size="large" :disabled="authStore.isLoading"
              :status="fieldErrors.password ? 'error' : undefined" :theme-overrides="authInputOverrides"
              autocomplete="current-password" aria-required="true"
              :aria-describedby="fieldErrors.password ? 'password-error' : undefined"
              @keypress="handleKeyPress" @input="fieldErrors.password = undefined"
            >
              <template #suffix>
                <Icon
                  :icon="showPassword ? 'mdi:lock-open-outline' : 'mdi:lock-outline'
                  " class="password-toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  role="button" tabindex="0" @click="showPassword = !showPassword"
                  @keypress.enter="showPassword = !showPassword"
                />
              </template>
            </n-input>
            <span v-if="fieldErrors.password" id="password-error" class="field-error" role="alert">
              <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
              {{ fieldErrors.password }}
            </span>
          </div>

          <!-- Login button -->
          <n-button
            type="primary" size="large" block :loading="authStore.isLoading && !ssoLoading"
            :disabled="authStore.isLoading" aria-label="Login" @click="handleLogin"
          >
            {{ authStore.isLoading && !ssoLoading ? "Logging in…" : "Login" }}
          </n-button>

          <!-- Remember & Forgot -->
          <div class="form-options">
            <n-checkbox v-model:checked="rememberMe" size="small">Keep me logged in</n-checkbox>
            <router-link to="/forgot-password" class="forgot-link">Forgot your password?</router-link>
          </div>

          <!-- SSO / OAuth section — unified (Requirement 1.3 & 1.4) -->
          <template v-if="hasAnySSOEnabled">
            <div class="divider"><span>Or continue with</span></div>
            <div class="sso-buttons" role="group" aria-label="SSO and OAuth providers">
              <button
                v-if="ssoConfig.google" class="oauth-btn" type="button"
                :disabled="authStore.isLoading || !!ssoLoading" :aria-busy="ssoLoading === 'google'"
                aria-label="Login with Google" @click="handleSSOLogin('google')"
              >
                <n-spin v-if="ssoLoading === 'google'" :size="18" />
                <Icon v-else icon="logos:google-icon" :width="20" :height="20" aria-hidden="true" />
                <span>{{ ssoLoading === "google" ? "Redirecting…" : "Google" }}</span>
              </button>
              <button
                v-if="ssoConfig.github" class="oauth-btn" type="button"
                :disabled="authStore.isLoading || !!ssoLoading" :aria-busy="ssoLoading === 'github'"
                aria-label="Login with GitHub" @click="handleSSOLogin('github')"
              >
                <n-spin v-if="ssoLoading === 'github'" :size="18" />
                <Icon v-else icon="mdi:github" :width="20" :height="20" aria-hidden="true" />
                <span>{{ ssoLoading === "github" ? "Redirecting…" : "GitHub" }}</span>
              </button>
              <button
                v-if="ssoConfig.microsoft" class="oauth-btn" type="button"
                :disabled="authStore.isLoading || !!ssoLoading" :aria-busy="ssoLoading === 'microsoft'"
                aria-label="Login with Microsoft" @click="handleSSOLogin('microsoft')"
              >
                <n-spin v-if="ssoLoading === 'microsoft'" :size="18" />
                <Icon v-else icon="logos:microsoft-icon" :width="20" :height="20" aria-hidden="true" />
                <span>{{ ssoLoading === "microsoft" ? "Redirecting…" : "Microsoft" }}</span>
              </button>
              <button
                v-if="ssoConfig.apple" class="oauth-btn" type="button"
                :disabled="authStore.isLoading || !!ssoLoading" :aria-busy="ssoLoading === 'apple'"
                aria-label="Login with Apple" @click="handleSSOLogin('apple')"
              >
                <n-spin v-if="ssoLoading === 'apple'" :size="18" />
                <Icon v-else icon="logos:apple" :width="20" :height="20" aria-hidden="true" />
                <span>{{ ssoLoading === "apple" ? "Redirecting…" : "Apple" }}</span>
              </button>
              <button
                v-if="ssoConfig.slack" class="oauth-btn" type="button"
                :disabled="authStore.isLoading || !!ssoLoading" :aria-busy="ssoLoading === 'slack'"
                aria-label="Login with Slack" @click="handleSSOLogin('slack')"
              >
                <n-spin v-if="ssoLoading === 'slack'" :size="18" />
                <Icon v-else icon="logos:slack-icon" :width="20" :height="20" aria-hidden="true" />
                <span>{{ ssoLoading === "slack" ? "Redirecting…" : "Slack" }}</span>
              </button>
              <button
                v-if="ssoConfig.cognito" class="oauth-btn" type="button"
                :disabled="authStore.isLoading || !!ssoLoading" :aria-busy="ssoLoading === 'cognito'"
                aria-label="Login with AWS Cognito" @click="handleSSOLogin('cognito')"
              >
                <n-spin v-if="ssoLoading === 'cognito'" :size="18" />
                <Icon v-else icon="logos:aws-cognito" :width="20" :height="20" aria-hidden="true" />
                <span>{{ ssoLoading === "cognito" ? "Redirecting…" : "AWS Cognito" }}</span>
              </button>
            </div>
          </template>

          <!-- Register link -->
          <div class="register-link-container">
            <span class="register-text">Don't have an account?</span>
            <router-link to="/register" class="register-link">Create one</router-link>
          </div>
        </div>

        <div class="login-footer">
          <p class="footer-text">
            <strong>{{ whiteLabelConfig.brandName }}</strong><br />
            {{ whiteLabelConfig.brandTagline }}
          </p>
        </div>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="right-panel" :style="{ background: isDark ? '#111827' : '#f3f4f6' }">
      <div class="illustration-container">
        <img :src="rightPanelLogo" :alt="whiteLabelConfig.brandName" class="logo-image" />
      </div>
    </div>
  </div>
</template>
