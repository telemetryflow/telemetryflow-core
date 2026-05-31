<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@/store";
import { whiteLabelConfig, getLogo } from "@/config/whitelabel";
import { authInputOverrides } from "@/config";
import headerLogo from "@/assets/favicon-dark.svg";

const router = useRouter();
const authStore = useAuthStore();
const rightPanelLogo = getLogo(false);

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);
const success = ref(false);

const fieldErrors = ref<{
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}>({});

const passwordStrength = computed(() => {
  const pwd = newPassword.value;
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score: 25, label: "Weak", color: "#ef4444" };
  if (score <= 4) return { score: 50, label: "Fair", color: "#f59e0b" };
  if (score <= 5) return { score: 75, label: "Good", color: "#10b981" };
  return { score: 100, label: "Strong", color: "#22c55e" };
});

const passwordRequirementErrors = computed(() => {
  const errors: string[] = [];
  const pwd = newPassword.value;
  if (pwd && pwd.length < 8) errors.push("At least 8 characters");
  if (pwd && !/[a-z]/.test(pwd)) errors.push("One lowercase letter");
  if (pwd && !/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
  if (pwd && !/[0-9]/.test(pwd)) errors.push("One number");
  if (pwd && !/[^a-zA-Z0-9]/.test(pwd)) errors.push("One special character");
  return errors;
});

function validate(): boolean {
  fieldErrors.value = {};
  if (!currentPassword.value)
    fieldErrors.value.currentPassword = "Current password is required";
  if (!newPassword.value) {
    fieldErrors.value.newPassword = "New password is required";
  } else if (passwordRequirementErrors.value.length > 0) {
    fieldErrors.value.newPassword = "Password does not meet requirements";
  } else if (newPassword.value === currentPassword.value) {
    fieldErrors.value.newPassword =
      "New password must differ from current password";
  }
  if (!confirmPassword.value) {
    fieldErrors.value.confirmPassword = "Please confirm your new password";
  } else if (newPassword.value !== confirmPassword.value) {
    fieldErrors.value.confirmPassword = "Passwords do not match";
  }
  return Object.keys(fieldErrors.value).length === 0;
}

async function handleSubmit() {
  authStore.clearError();
  if (!validate()) return;
  const ok = await authStore.changePassword(
    currentPassword.value,
    newPassword.value,
  );
  if (ok) success.value = true;
}
</script>

<template>
  <div class="change-password-page">
    <div class="left-panel">
      <div class="form-container">
        <div class="page-header">
          <img :src="headerLogo" :alt="whiteLabelConfig.brandName" class="header-logo" />
          <h1 class="title">Change Password</h1>
        </div>

        <!-- Success state -->
        <div v-if="success" class="success-container">
          <div class="success-icon">
            <Icon icon="mdi:check-circle-outline" :width="64" :height="64" />
          </div>
          <h2 class="success-title">Password Changed</h2>
          <p class="success-message">
            Your password has been updated. All other sessions have been
            invalidated.
          </p>
          <n-button type="primary" size="large" block @click="router.push('/home')">Go to Dashboard</n-button>
        </div>

        <!-- Form -->
        <div v-else class="change-form">
          <div class="divider"><span>Update Your Password</span></div>

          <n-alert v-if="authStore.loginError" type="error" :show-icon="true" aria-live="assertive">
            {{ authStore.loginError }}
          </n-alert>

          <!-- Current password -->
          <div class="form-group">
            <label for="current-password" class="form-label">Current Password</label>
            <n-input
              id="current-password" v-model:value="currentPassword" :type="showCurrent ? 'text' : 'password'"
              placeholder="Enter current password" size="large" :disabled="authStore.isLoading"
              :theme-overrides="authInputOverrides" :status="fieldErrors.currentPassword ? 'error' : undefined"
              autocomplete="current-password"
              aria-required="true" :aria-describedby="fieldErrors.currentPassword
                ? 'current-password-error'
                : undefined
              " @input="fieldErrors.currentPassword = undefined"
            >
              <template #suffix>
                <Icon
                  :icon="showCurrent ? 'mdi:lock-open-outline' : 'mdi:lock-outline'
                  " class="password-toggle" role="button" tabindex="0" @click="showCurrent = !showCurrent"
                  @keypress.enter="showCurrent = !showCurrent"
                />
              </template>
            </n-input>
            <span v-if="fieldErrors.currentPassword" id="current-password-error" class="field-error" role="alert">
              <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
              {{ fieldErrors.currentPassword }}
            </span>
          </div>

          <!-- New password -->
          <div class="form-group">
            <label for="new-password" class="form-label">New Password</label>
            <n-input
              id="new-password" v-model:value="newPassword" :type="showNew ? 'text' : 'password'"
              placeholder="Enter new password" size="large" :disabled="authStore.isLoading"
              :theme-overrides="authInputOverrides" :status="fieldErrors.newPassword ? 'error' : undefined"
              autocomplete="new-password" aria-required="true"
              :aria-describedby="fieldErrors.newPassword ? 'new-password-error' : undefined
              " @input="fieldErrors.newPassword = undefined"
            >
              <template #suffix>
                <Icon
                  :icon="showNew ? 'mdi:lock-open-outline' : 'mdi:lock-outline'" class="password-toggle"
                  role="button" tabindex="0" @click="showNew = !showNew" @keypress.enter="showNew = !showNew"
                />
              </template>
            </n-input>
            <div v-if="newPassword" class="password-strength" aria-live="polite">
              <div
                class="strength-bar" role="progressbar" :aria-valuenow="passwordStrength.score" aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="strength-fill" :style="{
                    width: `${passwordStrength.score}%`,
                    backgroundColor: passwordStrength.color,
                  }"
                />
              </div>
              <span class="strength-label" :style="{ color: passwordStrength.color }">{{ passwordStrength.label
              }}</span>
            </div>
            <div v-if="newPassword && passwordRequirementErrors.length > 0" class="password-requirements">
              <span v-for="err in passwordRequirementErrors" :key="err" class="requirement">
                <Icon icon="mdi:close-circle" class="requirement-icon" aria-hidden="true" />{{ err }}
              </span>
            </div>
            <span v-if="fieldErrors.newPassword" id="new-password-error" class="field-error" role="alert">
              <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
              {{ fieldErrors.newPassword }}
            </span>
          </div>

          <!-- Confirm new password -->
          <div class="form-group">
            <label for="confirm-new-password" class="form-label">Confirm New Password</label>
            <n-input
              id="confirm-new-password" v-model:value="confirmPassword" :type="showConfirm ? 'text' : 'password'"
              placeholder="Confirm new password" size="large" :disabled="authStore.isLoading"
              :theme-overrides="authInputOverrides" :status="fieldErrors.confirmPassword ? 'error' : undefined"
              autocomplete="new-password"
              aria-required="true" :aria-describedby="fieldErrors.confirmPassword
                ? 'confirm-new-password-error'
                : undefined
              " @input="fieldErrors.confirmPassword = undefined"
            >
              <template #suffix>
                <Icon
                  :icon="showConfirm ? 'mdi:lock-open-outline' : 'mdi:lock-outline'
                  " class="password-toggle" role="button" tabindex="0" @click="showConfirm = !showConfirm"
                  @keypress.enter="showConfirm = !showConfirm"
                />
              </template>
            </n-input>
            <span v-if="fieldErrors.confirmPassword" id="confirm-new-password-error" class="field-error" role="alert">
              <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
              {{ fieldErrors.confirmPassword }}
            </span>
          </div>

          <n-button
            type="primary" size="large" block :loading="authStore.isLoading" :disabled="authStore.isLoading"
            @click="handleSubmit"
          >
            {{ authStore.isLoading ? "Updating…" : "Update Password" }}
          </n-button>

          <div class="back-link-container">
            <router-link to="/account/security" class="back-link">
              <Icon icon="mdi:arrow-left" aria-hidden="true" /> Back to Security
              Settings
            </router-link>
          </div>
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
