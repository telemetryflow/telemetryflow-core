<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useMessage, useDialog } from 'naive-ui';
import { authApi } from '@/api/auth';
import { profileApi } from '@/api/profile';
import { useAuthStore } from '@/store';

const message = useMessage();
const dialog = useDialog();
const authStore = useAuthStore();

// State
const isChangingPassword = ref(false);
const isMfaEnabled = ref(false);
const isLoadingMfa = ref(false);
const showMfaSetup = ref(false);
const mfaQrCode = ref('');
const mfaSecret = ref('');
const mfaVerifyCode = ref('');
const backupCodes = ref<string[]>([]);
const showBackupCodes = ref(false);

// Password change form
const currentPassword = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const isUpdatingPassword = ref(false);

// Recovery email
const recoveryEmail = ref('');
const isUpdatingRecoveryEmail = ref(false);

onMounted(() => {
  const user = authStore.currentUser;
  if (user) {
    isMfaEnabled.value = (user as unknown as { mfaEnabled?: boolean }).mfaEnabled ?? false;
  }
});

// Password change
function handleChangePassword() {
  isChangingPassword.value = true;
}

function handleCancelPasswordChange() {
  isChangingPassword.value = false;
  currentPassword.value = '';
  newPassword.value = '';
  confirmNewPassword.value = '';
}

async function handleSubmitPasswordChange() {
  if (newPassword.value !== confirmNewPassword.value) {
    message.error('Passwords do not match');
    return;
  }

  if (newPassword.value.length < 8) {
    message.error('Password must be at least 8 characters');
    return;
  }

  isUpdatingPassword.value = true;

  try {
    await profileApi.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    message.success('Password changed successfully!');
    handleCancelPasswordChange();
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Failed to change password');
  } finally {
    isUpdatingPassword.value = false;
  }
}

// MFA setup
async function handleEnableMfa() {
  isLoadingMfa.value = true;

  try {
    const response = await authApi.enableMFA();
    mfaQrCode.value = response.qrCode;
    mfaSecret.value = response.secret;
    showMfaSetup.value = true;
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Failed to enable MFA');
  } finally {
    isLoadingMfa.value = false;
  }
}

async function handleVerifyMfaSetup() {
  if (mfaVerifyCode.value.length !== 6) {
    message.error('Please enter a valid 6-digit code');
    return;
  }

  isLoadingMfa.value = true;

  try {
    const response = await authApi.confirmMFA(mfaVerifyCode.value);
    backupCodes.value = response.backupCodes;
    showBackupCodes.value = true;
    isMfaEnabled.value = true;
    showMfaSetup.value = false;
    message.success('Two-factor authentication enabled!');
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Invalid verification code');
  } finally {
    isLoadingMfa.value = false;
    mfaVerifyCode.value = '';
  }
}

function handleCancelMfaSetup() {
  showMfaSetup.value = false;
  mfaQrCode.value = '';
  mfaSecret.value = '';
  mfaVerifyCode.value = '';
}

function handleDisableMfa() {
  dialog.warning({
    title: 'Disable Two-Factor Authentication',
    content: 'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
    positiveText: 'Disable',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        isMfaEnabled.value = false;
        message.success('Two-factor authentication disabled');
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        message.error(axiosError.response?.data?.message || 'Failed to disable MFA');
      }
    },
  });
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  message.success('Copied!');
}

function copyBackupCodes() {
  const codes = backupCodes.value.join('\n');
  navigator.clipboard.writeText(codes);
  message.success('Backup codes copied to clipboard!');
}

function handleCloseBackupCodes() {
  showBackupCodes.value = false;
  backupCodes.value = [];
}

// Recovery email
async function handleSaveRecoveryEmail() {
  if (!recoveryEmail.value) return;

  isUpdatingRecoveryEmail.value = true;

  try {
    await profileApi.updateRecoveryEmail({
      recoveryEmail: recoveryEmail.value,
    });
    message.success('Recovery email updated!');
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Failed to update recovery email');
  } finally {
    isUpdatingRecoveryEmail.value = false;
  }
}
</script>

<template>
  <div class="security-page">
    <!-- Hero Section -->
    <div class="security-hero">
      <div class="hero-background" />
      <div class="hero-content">
        <div class="hero-icon">
          <Icon icon="carbon:security" :width="48" :height="48" />
        </div>
        <div class="hero-text">
          <h1 class="hero-title">Security</h1>
          <p class="hero-subtitle">Manage your account security and authentication methods</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="security-content">
      <!-- Password Card -->
      <div class="security-card password-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper red">
            <Icon icon="carbon:password" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Password</h3>
            <p class="card-subtitle">Change your account password</p>
          </div>
        </div>

        <div class="card-content">
          <div v-if="!isChangingPassword" class="password-info">
            <p class="info-text">
              <Icon icon="carbon:information" :width="16" :height="16" />
              It's recommended to change your password regularly for better security
            </p>
            <n-button type="primary" size="large" block @click="handleChangePassword">
              <template #icon>
                <Icon icon="carbon:edit" />
              </template>
              Change Password
            </n-button>
          </div>

          <div v-else class="password-form">
            <div class="form-field-security">
              <label class="field-label">
                <Icon icon="carbon:locked" :width="16" :height="16" />
                <span>Current Password</span>
              </label>
              <n-input 
                v-model:value="currentPassword" 
                type="password" 
                placeholder="Enter current password"
                size="large"
                show-password-on="click" 
              />
            </div>
            <div class="form-field-security">
              <label class="field-label">
                <Icon icon="carbon:password" :width="16" :height="16" />
                <span>New Password</span>
              </label>
              <n-input 
                v-model:value="newPassword" 
                type="password" 
                placeholder="Enter new password"
                size="large"
                show-password-on="click" 
              />
            </div>
            <div class="form-field-security">
              <label class="field-label">
                <Icon icon="carbon:checkmark" :width="16" :height="16" />
                <span>Confirm New Password</span>
              </label>
              <n-input 
                v-model:value="confirmNewPassword" 
                type="password" 
                placeholder="Confirm new password"
                size="large"
                show-password-on="click" 
              />
            </div>
            <div class="form-actions-security">
              <n-button size="large" @click="handleCancelPasswordChange">Cancel</n-button>
              <n-button type="primary" size="large" :loading="isUpdatingPassword" @click="handleSubmitPasswordChange">
                Update Password
              </n-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Two-Factor Authentication Card -->
      <div class="security-card mfa-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper blue">
            <Icon icon="carbon:security-services" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Two-Factor Authentication</h3>
            <p class="card-subtitle">Add an extra layer of security</p>
          </div>
          <n-tag 
            :type="isMfaEnabled ? 'success' : 'default'" 
            size="large" 
            :bordered="false"
            round
          >
            {{ isMfaEnabled ? 'Enabled' : 'Disabled' }}
          </n-tag>
        </div>

        <div class="card-content">
          <div v-if="!showMfaSetup && !showBackupCodes" class="mfa-section">
            <p class="info-text">
              <Icon icon="carbon:information" :width="16" :height="16" />
              Two-factor authentication adds an extra layer of security by requiring a code from your phone
            </p>

            <div v-if="isMfaEnabled" class="mfa-enabled-status">
              <div class="status-badge success">
                <Icon icon="carbon:checkmark-filled" :width="20" :height="20" />
                <span>Two-factor authentication is active</span>
              </div>
              <n-button type="error" ghost size="large" block @click="handleDisableMfa">
                Disable 2FA
              </n-button>
            </div>
            <div v-else class="mfa-action-wrapper">
              <n-button type="primary" size="large" block :loading="isLoadingMfa" @click="handleEnableMfa">
                <template #icon>
                  <Icon icon="carbon:security" />
                </template>
                Enable 2FA
              </n-button>
            </div>
          </div>

          <!-- MFA Setup -->
          <div v-else-if="showMfaSetup" class="mfa-setup">
            <div class="setup-steps">
              <!-- Step Indicator -->
              <div class="step-indicator">
                <div class="step active">
                  <div class="step-number">1</div>
                  <span class="step-label">Install App</span>
                </div>
                <div class="step-divider" />
                <div class="step active">
                  <div class="step-number">2</div>
                  <span class="step-label">Scan Code</span>
                </div>
                <div class="step-divider" />
                <div class="step">
                  <div class="step-number">3</div>
                  <span class="step-label">Verify</span>
                </div>
              </div>

              <!-- Instructions -->
              <n-alert type="info" :show-icon="true" class="setup-instructions">
                <template #header>
                  <strong>Setup Instructions</strong>
                </template>
                <ol class="instruction-list">
                  <li>
                    Download an authenticator app if you don't have one:
                    <ul class="app-list">
                      <li><strong>Google Authenticator</strong> (iOS/Android)</li>
                      <li><strong>Microsoft Authenticator</strong> (iOS/Android)</li>
                      <li><strong>Authy</strong> (iOS/Android/Desktop)</li>
                    </ul>
                  </li>
                  <li>Open your authenticator app and scan the QR code below</li>
                  <li>Enter the 6-digit code from your app to complete setup</li>
                </ol>
              </n-alert>

              <h4 class="setup-title">Scan QR Code</h4>
              <p class="setup-description">
                Point your authenticator app's camera at this QR code
              </p>

              <div class="qr-container">
                <div v-if="isLoadingMfa" class="qr-loading">
                  <n-spin size="large" />
                  <p>Generating QR code...</p>
                </div>
                <img v-else-if="mfaQrCode" :src="mfaQrCode" alt="MFA QR Code" class="qr-code" />
              </div>

              <div class="manual-entry">
                <p class="manual-label">
                  <Icon icon="carbon:information" :width="14" :height="14" />
                  Can't scan? Enter this code manually in your app:
                </p>
                <n-input :value="mfaSecret" readonly size="large">
                  <template #suffix>
                    <n-button text @click="copyToClipboard(mfaSecret)">
                      <Icon icon="carbon:copy" />
                    </n-button>
                  </template>
                </n-input>
              </div>

              <div class="form-field-security">
                <label class="field-label">
                  <Icon icon="carbon:password" :width="16" :height="16" />
                  <span>Verification Code</span>
                </label>
                <n-input 
                  v-model:value="mfaVerifyCode" 
                  placeholder="Enter 6-digit code from your app" 
                  maxlength="6"
                  size="large"
                  :status="mfaVerifyCode.length === 6 ? 'success' : undefined"
                >
                  <template #suffix>
                    <Icon 
                      v-if="mfaVerifyCode.length === 6" 
                      icon="carbon:checkmark-filled" 
                      :width="20" 
                      :height="20" 
                      style="color: var(--n-success-color);"
                    />
                  </template>
                </n-input>
                <p class="field-hint">
                  <Icon icon="carbon:time" :width="14" :height="14" />
                  Codes refresh every 30 seconds
                </p>
              </div>

              <div class="form-actions-security">
                <n-button size="large" @click="handleCancelMfaSetup">Cancel</n-button>
                <n-button 
                  type="primary" 
                  size="large" 
                  :loading="isLoadingMfa" 
                  :disabled="mfaVerifyCode.length !== 6"
                  @click="handleVerifyMfaSetup"
                >
                  <template #icon>
                    <Icon icon="carbon:checkmark" />
                  </template>
                  Verify & Enable
                </n-button>
              </div>
            </div>
          </div>

          <!-- Backup Codes -->
          <div v-else-if="showBackupCodes" class="backup-codes-section">
            <h4 class="setup-title">Save Your Backup Codes</h4>
            <p class="setup-description">
              Store these codes safely. You can use them to access your account if you lose your authenticator.
            </p>

            <div class="backup-codes-container">
              <div class="backup-codes-grid">
                <div v-for="code in backupCodes" :key="code" class="backup-code">
                  {{ code }}
                </div>
              </div>
              <n-button size="medium" @click="copyBackupCodes">
                <template #icon>
                  <Icon icon="carbon:copy" />
                </template>
                Copy All Codes
              </n-button>
            </div>

            <n-alert type="warning" :show-icon="true" style="margin-bottom: 16px;">
              Each code can only be used once. Keep them in a safe place!
            </n-alert>

            <n-button type="primary" size="large" block @click="handleCloseBackupCodes">
              I've Saved My Codes
            </n-button>
          </div>
        </div>
      </div>

      <!-- Recovery Email Card -->
      <div class="security-card recovery-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper green">
            <Icon icon="carbon:email" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Recovery Email</h3>
            <p class="card-subtitle">Backup email for account recovery</p>
          </div>
        </div>

        <div class="card-content">
          <div class="recovery-section">
            <p class="info-text">
              <Icon icon="carbon:information" :width="16" :height="16" />
              Add a backup email address to help recover your account if you lose access
            </p>

            <div class="form-field-security">
              <label class="field-label">
                <Icon icon="carbon:email" :width="16" :height="16" />
                <span>Recovery Email Address</span>
              </label>
              <div class="input-with-button">
                <n-input 
                  v-model:value="recoveryEmail" 
                  placeholder="Enter recovery email"
                  size="large"
                />
                <n-button 
                  type="primary" 
                  size="large"
                  :loading="isUpdatingRecoveryEmail" 
                  :disabled="!recoveryEmail"
                  @click="handleSaveRecoveryEmail"
                >
                  Save
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Sessions Link Card -->
      <div class="security-card sessions-link-card">
        <div class="card-header-custom">
          <div class="card-icon-wrapper purple">
            <Icon icon="carbon:devices" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Active Sessions</h3>
            <p class="card-subtitle">Manage your active devices</p>
          </div>
        </div>

        <div class="card-content">
          <div class="sessions-section">
            <p class="info-text">
              <Icon icon="carbon:information" :width="16" :height="16" />
              View and manage your active sessions across different devices and browsers
            </p>

            <router-link to="/account/sessions" class="sessions-link">
              <n-button type="primary" size="large" block>
                <template #icon>
                  <Icon icon="carbon:arrow-right" />
                </template>
                View Active Sessions
              </n-button>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.security-page {
  min-height: 100vh;
  background: var(--n-color);
}

// Hero Section
.security-hero {
  position: relative;
  padding: 40px 24px 60px;
  margin-bottom: 24px;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 24px 16px 40px;
    margin-bottom: 16px;
  }
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to bottom, transparent, var(--n-color));
  }

  :root.dark & {
    background: linear-gradient(135deg, #d8365e 0%, #e8b923 100%);
  }
}

.hero-content {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
}

.hero-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 64px;
    height: 64px;
  }
}

.hero-text {
  flex: 1;
  color: white;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
}

.hero-subtitle {
  font-size: 1rem;
  margin: 0;
  opacity: 0.95;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

// Main Content
.security-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 40px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    padding: 0 16px 24px;
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

// Security Cards
.security-card {
  background: var(--n-card-color);
  border-radius: 16px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.15);
  }

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
    border-color: rgba(0, 0, 0, 0.12);

    :root.dark & {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 255, 255, 0.2);
    }
  }

  &.password-card {
    grid-column: 1 / 2;
  }

  &.mfa-card {
    grid-column: 2 / 3;
  }

  &.recovery-card {
    grid-column: 1 / 2;
  }

  &.sessions-link-card {
    grid-column: 2 / 3;
  }

  @media (max-width: 768px) {
    &.password-card,
    &.mfa-card,
    &.recovery-card,
    &.sessions-link-card {
      grid-column: 1 / -1;
    }
  }
}

.card-header-custom {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid var(--n-border-color);

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
}

.card-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &.red {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.green {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }

  &.purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}

.card-header-text {
  flex: 1;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--n-text-color);
}

.card-subtitle {
  font-size: 0.8125rem;
  color: var(--n-text-color-3);
  margin: 0;
}

.card-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 240px;

  @media (max-width: 768px) {
    padding: 20px 16px;
    min-height: auto;
  }
}

// Info Text
.info-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-2);
  font-size: 0.875rem;
  margin: 0 0 20px 0;
  padding: 12px 16px;
  background: var(--n-color-embedded);
  border-radius: 8px;
  min-height: 48px;
}

// Password Section
.password-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  justify-content: space-between;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// Form Fields
.form-field-security {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: transparent;
  border-radius: 16px;
  border: 2.5px solid rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.2);
    background: transparent;
  }

  &:hover {
    border-color: var(--n-primary-color);
    background: rgba(0, 0, 0, 0.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    :root.dark & {
      background: rgba(255, 255, 255, 0.03);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }

  &:focus-within {
    border-color: var(--n-primary-color);
    background: rgba(0, 0, 0, 0.02);
    box-shadow: 0 0 0 3px rgba(24, 160, 251, 0.1);

    :root.dark & {
      background: rgba(255, 255, 255, 0.03);
    }
  }
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--n-text-color-2);
}

.form-actions-security {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
}

// MFA Section
.mfa-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  justify-content: space-between;
}

.mfa-action-wrapper {
  margin-top: auto;
}

.mfa-enabled-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
}

.status-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;

  &.success {
    background: rgba(24, 160, 88, 0.1);
    color: var(--n-success-color);
  }
}

// Recovery Section
.recovery-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  justify-content: space-between;
}

// Sessions Section
.sessions-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  justify-content: space-between;
}

// MFA Setup
.mfa-setup,
.backup-codes-section {
  .setup-steps {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: var(--n-color-embedded);
  border-radius: 12px;
  margin-bottom: 8px;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
  transition: opacity 0.3s ease;

  &.active {
    opacity: 1;
  }
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--n-border-color);
  color: var(--n-text-color-3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;

  .step.active & {
    background: var(--n-primary-color);
    color: white;
    box-shadow: 0 2px 8px rgba(24, 160, 251, 0.3);
  }
}

.step-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--n-text-color-3);
  white-space: nowrap;

  .step.active & {
    color: var(--n-text-color);
    font-weight: 600;
  }
}

.step-divider {
  width: 40px;
  height: 2px;
  background: var(--n-border-color);
  margin: 0 4px;

  @media (max-width: 768px) {
    width: 24px;
  }
}

.setup-instructions {
  margin: 0;
}

.instruction-list {
  margin: 8px 0 0 0;
  padding-left: 20px;
  color: var(--n-text-color-2);
  font-size: 0.875rem;
  line-height: 1.6;

  li {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.app-list {
  margin: 4px 0 0 0;
  padding-left: 20px;
  list-style-type: disc;

  li {
    margin-bottom: 4px;
  }
}

.setup-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--n-text-color);
}

.setup-description {
  color: var(--n-text-color-2);
  font-size: 0.875rem;
  margin: 0;
}

.qr-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: var(--n-color-embedded);
  border-radius: 12px;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: var(--n-text-color-2);
  font-size: 0.875rem;
}

.qr-code {
  width: 200px;
  height: 200px;
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.manual-entry {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.manual-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--n-text-color-3);
  font-size: 0.8125rem;
  margin: 0;
}

.field-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--n-text-color-3);
  font-size: 0.75rem;
  margin: 4px 0 0 0;
  font-style: italic;
}

// Backup Codes
.backup-codes-container {
  background: var(--n-color-embedded);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.backup-codes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.backup-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  background: var(--n-card-color);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--n-border-color);
}

// Input with Button
.input-with-button {
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
}

.sessions-link {
  text-decoration: none;
  display: block;
  margin-top: auto;
}
</style>
