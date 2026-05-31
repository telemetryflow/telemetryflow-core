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

// ─── Form state ───────────────────────────────────────────────────────────────
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const firstName = ref("");
const lastName = ref("");
const agreeToTerms = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// ─── Field-level validation errors (Requirement 3.6) ─────────────────────────
const fieldErrors = ref<{
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
}>({});

// ─── Post-registration confirmation state (Requirements 13.1, 13.9, 13.11) ───
const registrationComplete = ref(false);
const registeredEmail = ref("");

// ─── Logos ────────────────────────────────────────────────────────────────────
const rightPanelLogo = getLogo(false);

// ─── Password strength ────────────────────────────────────────────────────────
const passwordStrength = computed(() => {
  const pwd = password.value;
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[a-z]/.test(pwd)) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
  if (score <= 2) return { score: 25, label: "Weak", color: "#ef4444" };
  if (score <= 4) return { score: 50, label: "Fair", color: "#f59e0b" };
  if (score <= 5) return { score: 75, label: "Good", color: "#10b981" };
  return { score: 100, label: "Strong", color: "#22c55e" };
});

const passwordRequirementErrors = computed(() => {
  const errors: string[] = [];
  const pwd = password.value;
  if (pwd && pwd.length < 8) errors.push("At least 8 characters");
  if (pwd && !/[a-z]/.test(pwd)) errors.push("One lowercase letter");
  if (pwd && !/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
  if (pwd && !/[0-9]/.test(pwd)) errors.push("One number");
  if (pwd && !/[^a-zA-Z0-9]/.test(pwd)) errors.push("One special character");
  return errors;
});

const passwordsMatch = computed(
  () => !confirmPassword.value || password.value === confirmPassword.value,
);

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(): boolean {
  fieldErrors.value = {};
  if (!username.value.trim())
    fieldErrors.value.username = "Username is required";
  if (!firstName.value.trim())
    fieldErrors.value.firstName = "First name is required";
  if (!lastName.value.trim())
    fieldErrors.value.lastName = "Last name is required";
  if (!email.value.trim()) {
    fieldErrors.value.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    fieldErrors.value.email = "Enter a valid email address";
  }
  if (!password.value) {
    fieldErrors.value.password = "Password is required";
  } else if (passwordRequirementErrors.value.length > 0) {
    fieldErrors.value.password = "Password does not meet requirements";
  }
  if (!confirmPassword.value) {
    fieldErrors.value.confirmPassword = "Please confirm your password";
  } else if (!passwordsMatch.value) {
    fieldErrors.value.confirmPassword = "Passwords do not match";
  }
  return Object.keys(fieldErrors.value).length === 0;
}

// ─── Register ─────────────────────────────────────────────────────────────────
async function handleRegister() {
  if (!agreeToTerms.value) return;
  authStore.clearError();
  if (!validate()) return;

  const success = await authStore.register({
    username: username.value.trim(),
    email: email.value.trim(),
    password: password.value,
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
  });

  if (success) {
    registeredEmail.value = email.value.trim();
    registrationComplete.value = true;
  }
}

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === "Enter") handleRegister();
}

function goToLogin() {
  router.push("/login");
}

function goToVerifyPending() {
  router.push({
    name: "VerifyEmailPending",
    query: { email: registeredEmail.value },
  });
}
</script>

<template>
  <div class="register-page">
    <!-- Left Panel -->
    <div class="left-panel">
      <div class="form-container">
        <!-- Header -->
        <div class="register-header">
          <img :src="headerLogo" :alt="whiteLabelConfig.brandName" class="header-logo" />
          <h1 class="title">Create Account</h1>
        </div>

        <!-- ── Post-registration confirmation (Requirements 13.1, 13.9, 13.11) ── -->
        <div v-if="registrationComplete" class="confirmation-panel">
          <div class="confirmation-icon">
            <Icon icon="mdi:check-circle-outline" :width="64" :height="64" />
          </div>
          <h2 class="confirmation-title">Account Created</h2>
          <p class="confirmation-message">
            A verification email has been sent to
            <strong>{{ registeredEmail }}</strong>. Please verify your email to activate your account.
          </p>

          <!-- Organization auto-creation notice (Requirement 13.1, 13.2) -->
          <n-alert type="info" :show-icon="true" class="org-notice">
            <template #header>Organization Created Automatically</template>
            An organization has been created for you. You are the organization
            creator and have been assigned the Administrator role (Tier 2).
          </n-alert>

          <!-- API key secure storage notice (Requirements 13.9, 13.11) -->
          <n-alert type="warning" :show-icon="true" class="api-key-notice">
            <template #header>Secure Your API Keys</template>
            <p>
              Your default API keys have been created and sent to your email.
              Store them securely — they will not be shown again:
            </p>
            <ul class="api-key-list">
              <li>
                <code>TELEMETRYFLOW_API_KEY_ID</code> — your API key identifier
              </li>
              <li>
                <code>TELEMETRYFLOW_API_KEY_SECRET</code> — your API key secret
              </li>
            </ul>
            <p class="api-key-warning">
              <Icon icon="mdi:alert" class="warning-icon" aria-hidden="true" />
              Never share your API key secret. Rotate it immediately if
              compromised.
            </p>
          </n-alert>

          <n-button type="primary" size="large" block @click="goToVerifyPending">
            Check Verification Email
          </n-button>
          <div class="login-link-container">
            <span class="login-text">Already verified?</span>
            <button class="login-link" type="button" @click="goToLogin">
              Login here
            </button>
          </div>
        </div>

        <!-- ── Registration Form ─────────────────────────────────────────────── -->
        <div v-else class="register-form">
          <div class="divider"><span>Register with Email</span></div>

          <!-- General error -->
          <n-alert v-if="authStore.loginError" type="error" :show-icon="true" aria-live="assertive">
            {{ authStore.loginError }}
          </n-alert>

          <!-- Username -->
          <div class="form-group">
            <label for="reg-username" class="form-label">Username</label>
            <n-input
              id="reg-username" v-model:value="username" placeholder="Choose a username" size="large"
              :disabled="authStore.isLoading" :theme-overrides="authInputOverrides"
              :status="fieldErrors.username ? 'error' : undefined" autocomplete="username" aria-required="true" :aria-describedby="fieldErrors.username ? 'username-error' : undefined
              " @keypress="handleKeyPress" @input="fieldErrors.username = undefined"
            />
            <span v-if="fieldErrors.username" id="username-error" class="field-error" role="alert">
              <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
              {{ fieldErrors.username }}
            </span>
          </div>

          <!-- Name row -->
          <div class="form-row">
            <div class="form-group">
              <label for="reg-firstname" class="form-label">First Name</label>
              <n-input
                id="reg-firstname" v-model:value="firstName" placeholder="First name" size="large"
                :disabled="authStore.isLoading" :theme-overrides="authInputOverrides"
                :status="fieldErrors.firstName ? 'error' : undefined" autocomplete="given-name" aria-required="true" :aria-describedby="fieldErrors.firstName ? 'firstname-error' : undefined
                " @keypress="handleKeyPress" @input="fieldErrors.firstName = undefined"
              />
              <span v-if="fieldErrors.firstName" id="firstname-error" class="field-error" role="alert">
                <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
                {{ fieldErrors.firstName }}
              </span>
            </div>
            <div class="form-group">
              <label for="reg-lastname" class="form-label">Last Name</label>
              <n-input
                id="reg-lastname" v-model:value="lastName" placeholder="Last name" size="large"
                :disabled="authStore.isLoading" :theme-overrides="authInputOverrides"
                :status="fieldErrors.lastName ? 'error' : undefined" autocomplete="family-name" aria-required="true" :aria-describedby="fieldErrors.lastName ? 'lastname-error' : undefined
                " @keypress="handleKeyPress" @input="fieldErrors.lastName = undefined"
              />
              <span v-if="fieldErrors.lastName" id="lastname-error" class="field-error" role="alert">
                <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
                {{ fieldErrors.lastName }}
              </span>
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="reg-email" class="form-label">Email</label>
            <n-input
              id="reg-email" v-model:value="email" placeholder="Enter your email" size="large"
              :disabled="authStore.isLoading" :theme-overrides="authInputOverrides"
              :status="fieldErrors.email ? 'error' : undefined" autocomplete="email" aria-required="true" :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
              @keypress="handleKeyPress" @input="fieldErrors.email = undefined"
            />
            <span v-if="fieldErrors.email" id="email-error" class="field-error" role="alert">
              <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
              {{ fieldErrors.email }}
            </span>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="reg-password" class="form-label">Password</label>
            <n-input
              id="reg-password" v-model:value="password" :type="showPassword ? 'text' : 'password'"
              placeholder="Create a password" size="large" :disabled="authStore.isLoading"
              :theme-overrides="authInputOverrides" :status="fieldErrors.password ? 'error' : undefined"
              autocomplete="new-password" aria-required="true"
              :aria-describedby="fieldErrors.password ? 'password-error' : undefined
              " @keypress="handleKeyPress" @input="fieldErrors.password = undefined"
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

            <!-- Password strength indicator (Requirement 4.6) -->
            <div v-if="password" class="password-strength" aria-live="polite">
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

            <!-- Password requirements -->
            <div v-if="password && passwordRequirementErrors.length > 0" class="password-requirements">
              <span v-for="err in passwordRequirementErrors" :key="err" class="requirement">
                <Icon icon="mdi:close-circle" class="requirement-icon" aria-hidden="true" />
                {{ err }}
              </span>
            </div>

            <span v-if="fieldErrors.password" id="password-error" class="field-error" role="alert">
              <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
              {{ fieldErrors.password }}
            </span>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label for="reg-confirm-password" class="form-label">Confirm Password</label>
            <n-input
              id="reg-confirm-password" v-model:value="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'" placeholder="Confirm your password" size="large"
              :disabled="authStore.isLoading" :theme-overrides="authInputOverrides"
              :status="fieldErrors.confirmPassword ? 'error' : undefined" autocomplete="new-password"
              aria-required="true" :aria-describedby="fieldErrors.confirmPassword
                ? 'confirm-password-error'
                : undefined
              " @keypress="handleKeyPress" @input="fieldErrors.confirmPassword = undefined"
            >
              <template #suffix>
                <Icon
                  :icon="showConfirmPassword
                    ? 'mdi:lock-open-outline'
                    : 'mdi:lock-outline'
                  " class="password-toggle" :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'
                  " role="button" tabindex="0" @click="showConfirmPassword = !showConfirmPassword"
                  @keypress.enter="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </n-input>
            <span v-if="fieldErrors.confirmPassword" id="confirm-password-error" class="field-error" role="alert">
              <Icon icon="mdi:alert-circle-outline" class="field-error-icon" aria-hidden="true" />
              {{ fieldErrors.confirmPassword }}
            </span>
          </div>

          <!-- Terms -->
          <div class="form-options">
            <n-checkbox v-model:checked="agreeToTerms" size="small">
              I agree to the
              <a href="#" class="terms-link">Terms of Service</a> and
              <a href="#" class="terms-link">Privacy Policy</a>
            </n-checkbox>
          </div>

          <!-- Register button -->
          <n-button
            type="primary" size="large" block :loading="authStore.isLoading"
            :disabled="authStore.isLoading || !agreeToTerms" aria-label="Create Account" @click="handleRegister"
          >
            {{ authStore.isLoading ? "Creating account…" : "Create Account" }}
          </n-button>

          <!-- Login link -->
          <div class="login-link-container">
            <span class="login-text">Already have an account?</span>
            <router-link to="/login" class="login-link">Login here</router-link>
          </div>
        </div>

        <div class="register-footer">
          <p class="footer-text">
            <strong>{{ whiteLabelConfig.brandName }}</strong><br />
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
