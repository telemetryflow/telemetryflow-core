<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useMessage, useDialog } from 'naive-ui';
import { useAuthStore } from '@/store';
import { profileApi } from '@/api/profile';

const authStore = useAuthStore();
const message = useMessage();
const dialog = useDialog();

// Edit mode
const isEditing = ref(false);
const isSaving = ref(false);
const isUploadingAvatar = ref(false);
const isDragging = ref(false);

// Form state
const firstName = ref('');
const lastName = ref('');
const username = ref('');
const email = ref('');
const timezone = ref('UTC');
const locale = ref('en');
const avatar = ref<string | null>(null);

// File input ref
const fileInputRef = ref<HTMLInputElement | null>(null);

// Timezone options
const timezoneOptions = [
  { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
  { label: 'Asia/Jakarta (WIB)', value: 'Asia/Jakarta' },
  { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'Europe/London (GMT)', value: 'Europe/London' },
  { label: 'Europe/Berlin (CET)', value: 'Europe/Berlin' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Australia/Sydney (AEDT)', value: 'Australia/Sydney' },
];

// Locale options
const localeOptions = [
  { label: 'English (US)', value: 'en' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Chinese (Simplified)', value: 'zh-CN' },
];

// Load user data
onMounted(() => {
  loadUserData();
});

function loadUserData() {
  const user = authStore.currentUser;
  if (user) {
    firstName.value = user.firstName || '';
    lastName.value = user.lastName || '';
    username.value = user.username || '';
    email.value = user.email || '';
    avatar.value = user.avatar || null;
  }
}

const displayName = computed(() => {
  return `${firstName.value} ${lastName.value}`.trim() || email.value;
});

const initials = computed(() => {
  const f = firstName.value.charAt(0).toUpperCase();
  const l = lastName.value.charAt(0).toUpperCase();
  return f + l || email.value.charAt(0).toUpperCase();
});

function handleEdit() {
  isEditing.value = true;
}

function handleCancel() {
  loadUserData();
  isEditing.value = false;
}

async function handleSave() {
  isSaving.value = true;

  try {
    await profileApi.updateProfile({
      firstName: firstName.value,
      lastName: lastName.value,
      timezone: timezone.value,
      locale: locale.value,
    });

    await authStore.refreshUser();
    message.success('Profile updated successfully!');
    isEditing.value = false;
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Failed to update profile');
  } finally {
    isSaving.value = false;
  }
}

async function handleSavePreferences() {
  isSaving.value = true;

  try {
    await profileApi.updateProfile({
      timezone: timezone.value,
      locale: locale.value,
    });

    await authStore.refreshUser();
    message.success('Preferences updated successfully!');
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Failed to update preferences');
  } finally {
    isSaving.value = false;
  }
}

function handleAvatarUpload() {
  fileInputRef.value?.click();
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  await processFile(file);

  // Reset file input
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function handleDeleteAvatar() {
  dialog.warning({
    title: 'Delete Avatar',
    content: 'Are you sure you want to remove your avatar?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await profileApi.deleteAvatar();
        avatar.value = null;
        await authStore.refreshUser();
        message.success('Avatar removed successfully!');
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        message.error(axiosError.response?.data?.message || 'Failed to delete avatar');
      }
    },
  });
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    processFile(file);
  }
}

async function processFile(file: File) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    message.error('Please select an image file');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    message.error('Image size must be less than 5MB');
    return;
  }

  isUploadingAvatar.value = true;

  try {
    const response = await profileApi.uploadAvatar(file);
    avatar.value = response.avatarUrl;
    await authStore.refreshUser();
    message.success('Avatar updated successfully!');
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } };
    message.error(axiosError.response?.data?.message || 'Failed to upload avatar');
  } finally {
    isUploadingAvatar.value = false;
  }
}
</script>

<template>
  <div class="profile-page">
    <!-- Hidden file input for avatar upload -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none;"
      @change="onFileSelected"
    />

    <!-- Hero Section with Avatar -->
    <div class="profile-hero">
      <div class="hero-background" />
      <div class="hero-content">
        <div class="avatar-wrapper">
          <n-spin :show="isUploadingAvatar" size="small">
            <div class="avatar-container-large">
              <n-avatar v-if="avatar" :src="avatar" :size="120" round class="avatar-main" />
              <n-avatar v-else :size="120" round class="avatar-initials-large">
                {{ initials }}
              </n-avatar>
              <button class="avatar-edit-btn-large" :disabled="isUploadingAvatar" @click="handleAvatarUpload">
                <Icon icon="carbon:camera" :width="20" :height="20" />
              </button>
            </div>
          </n-spin>
        </div>
        <div class="hero-info">
          <h1 class="hero-name">{{ displayName }}</h1>
          <p class="hero-email">{{ email }}</p>
          <div class="hero-badges">
            <div class="badge-item verified">
              <Icon icon="carbon:checkmark-filled" :width="14" :height="14" />
              <span>Verified</span>
            </div>
            <div v-for="role in authStore.userRoles" :key="role" class="badge-item admin">
              <Icon icon="carbon:user-role" :width="14" :height="14" />
              <span>{{ role }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="profile-content">
      <!-- Personal Information Card -->
      <div class="info-card personal-info">
        <div class="card-header-custom">
          <div class="card-icon-wrapper purple">
            <Icon icon="carbon:user-avatar" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Personal Information</h3>
            <p class="card-subtitle">Update your personal details</p>
          </div>
          <n-button v-if="!isEditing" text class="edit-btn" @click="handleEdit">
            <template #icon>
              <Icon icon="carbon:edit" :width="18" :height="18" />
            </template>
            Edit
          </n-button>
        </div>

        <div class="card-content">
          <div class="form-grid-modern">
            <div class="form-field">
              <label class="field-label">
                <Icon icon="carbon:user" :width="16" :height="16" />
                First Name
              </label>
              <n-input 
                v-model:value="firstName" 
                placeholder="Enter first name" 
                :disabled="!isEditing"
                size="large"
              />
            </div>
            <div class="form-field">
              <label class="field-label">
                <Icon icon="carbon:user" :width="16" :height="16" />
                Last Name
              </label>
              <n-input 
                v-model:value="lastName" 
                placeholder="Enter last name" 
                :disabled="!isEditing"
                size="large"
              />
            </div>
            <div class="form-field">
              <label class="field-label">
                <Icon icon="carbon:user-identification" :width="16" :height="16" />
                Username
              </label>
              <n-input 
                v-model:value="username" 
                placeholder="Enter username" 
                :disabled="!isEditing"
                size="large"
              />
            </div>
            <div class="form-field">
              <label class="field-label">
                <Icon icon="carbon:email" :width="16" :height="16" />
                Email Address
              </label>
              <n-input 
                v-model:value="email" 
                placeholder="Email" 
                disabled
                size="large"
              >
                <template #suffix>
                  <n-tag type="info" size="small" :bordered="false">Cannot change</n-tag>
                </template>
              </n-input>
            </div>
          </div>

          <div v-if="isEditing" class="form-actions-modern">
            <n-button size="large" @click="handleCancel">Cancel</n-button>
            <n-button type="primary" size="large" :loading="isSaving" @click="handleSave">
              <template #icon>
                <Icon icon="carbon:checkmark" />
              </template>
              Save Changes
            </n-button>
          </div>
        </div>
      </div>

      <!-- Preferences Card -->
      <div class="info-card preferences">
        <div class="card-header-custom">
          <div class="card-icon-wrapper pink">
            <Icon icon="carbon:settings" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Preferences</h3>
            <p class="card-subtitle">Customize your experience</p>
          </div>
        </div>

        <div class="card-content">
          <div class="form-grid-modern">
            <div class="form-field">
              <label class="field-label">
                <Icon icon="carbon:time" :width="16" :height="16" />
                Timezone
              </label>
              <n-select 
                v-model:value="timezone" 
                :options="timezoneOptions" 
                placeholder="Select timezone"
                size="large"
              />
            </div>
            <div class="form-field">
              <label class="field-label">
                <Icon icon="carbon:language" :width="16" :height="16" />
                Language
              </label>
              <n-select 
                v-model:value="locale" 
                :options="localeOptions" 
                placeholder="Select language"
                size="large"
              />
            </div>
          </div>

          <div class="form-actions-modern">
            <n-button type="primary" size="large" :loading="isSaving" @click="handleSavePreferences">
              <template #icon>
                <Icon icon="carbon:save" />
              </template>
              Save Preferences
            </n-button>
          </div>
        </div>
      </div>

      <!-- Account Info Card -->
      <div class="info-card account-info">
        <div class="card-header-custom">
          <div class="card-icon-wrapper blue">
            <Icon icon="carbon:information" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Account Information</h3>
            <p class="card-subtitle">View your account details</p>
          </div>
        </div>

        <div class="card-content">
          <div class="info-list">
            <div class="info-row">
              <div class="info-label-modern">
                <Icon icon="carbon:id" :width="18" :height="18" />
                <span>Account ID</span>
              </div>
              <div class="info-value-modern mono">{{ authStore.currentUser?.id }}</div>
            </div>
            <div class="info-row">
              <div class="info-label-modern">
                <Icon icon="carbon:enterprise" :width="18" :height="18" />
                <span>Organization</span>
              </div>
              <div class="info-value-modern">
                <n-tag
                  v-if="authStore.currentUser?.organizationId"
                  type="success"
                  size="medium"
                  :bordered="false"
                  class="org-tag"
                >
                  {{ authStore.currentUser?.organizationId }}
                </n-tag>
                <span v-else class="not-assigned">Not assigned</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label-modern">
                <Icon icon="carbon:user-role" :width="18" :height="18" />
                <span>Roles</span>
              </div>
              <div class="info-value-modern">
                <n-tag 
                  v-for="role in authStore.userRoles" 
                  :key="role" 
                  size="medium" 
                  class="role-tag-modern"
                  type="info"
                  :bordered="false"
                >
                  {{ role }}
                </n-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Avatar Actions Card -->
      <div class="info-card avatar-actions">
        <div class="card-header-custom">
          <div class="card-icon-wrapper green">
            <Icon icon="carbon:image" :width="24" :height="24" />
          </div>
          <div class="card-header-text">
            <h3 class="card-title">Profile Picture</h3>
            <p class="card-subtitle">Upload or remove your avatar</p>
          </div>
        </div>

        <div class="card-content">
          <!-- Drag & Drop Area -->
          <div 
            class="dropzone"
            :class="{ 'is-dragging': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="handleAvatarUpload"
          >
            <div class="dropzone-content">
              <Icon icon="carbon:cloud-upload" :width="48" :height="48" class="dropzone-icon" />
              <p class="dropzone-title">Drag & drop your photo here</p>
              <p class="dropzone-subtitle">or click to browse</p>
              <div class="dropzone-formats">
                <span class="format-badge">JPG</span>
                <span class="format-badge">PNG</span>
                <span class="format-badge">GIF</span>
                <span class="format-badge">WEBP</span>
              </div>
            </div>
          </div>

          <div class="avatar-actions-grid">
            <n-button size="large" :loading="isUploadingAvatar" @click="handleAvatarUpload">
              <template #icon>
                <Icon icon="carbon:upload" />
              </template>
              Upload Photo
            </n-button>
            <n-button v-if="avatar" size="large" type="error" ghost @click="handleDeleteAvatar">
              <template #icon>
                <Icon icon="carbon:trash-can" />
              </template>
              Remove Photo
            </n-button>
          </div>
          <p class="avatar-hint">
            <Icon icon="carbon:information" :width="14" :height="14" />
            Recommended: Square image, at least 400x400px, max 5MB
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  background: var(--n-color);
}

// Hero Section
.profile-hero {
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
  height: 240px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to bottom, transparent, var(--n-color));
  }

  :root.dark & {
    background: linear-gradient(135deg, #4c51bf 0%, #553c9a 100%);
  }
}

.hero-content {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
}

.avatar-wrapper {
  flex-shrink: 0;
}

.avatar-container-large {
  position: relative;
  display: inline-block;
}

.avatar-main {
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.avatar-initials-large {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  font-size: 3rem;
  font-weight: 700;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.avatar-edit-btn-large {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 3px solid white;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.hero-info {
  flex: 1;
  color: white;
}

.hero-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
}

.hero-email {
  font-size: 1rem;
  margin: 0 0 16px 0;
  opacity: 0.95;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.hero-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
}

.badge-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &.verified {
    background: rgba(34, 197, 94, 0.25);
    border: 1px solid rgba(34, 197, 94, 0.4);
  }

  &.admin {
    background: rgba(99, 102, 241, 0.25);
    border: 1px solid rgba(99, 102, 241, 0.4);
  }
}

// Main Content
.profile-content {
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

// Info Cards
.info-card {
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

  &.personal-info {
    grid-column: 1 / -1;
  }

  &.preferences {
    grid-column: 1 / -1;
  }

  &.account-info {
    grid-column: 1 / 2;
  }

  &.avatar-actions {
    grid-column: 2 / 3;
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
    flex-wrap: wrap;
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

  &.purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.pink {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.green {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }
}

.card-header-text {
  flex: 1;
  min-width: 0;
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

.edit-btn {
  flex-shrink: 0;
  color: var(--n-primary-color);
  font-weight: 500;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
}

.card-content {
  padding: 24px;

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
}

// Form Styles
.form-grid-modern {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.form-field {
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

.form-actions-modern {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--n-border-color);

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
}

// Info List
.info-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  min-height: 80px;
  background: transparent;
  border-radius: 16px;
  border: 2.5px solid rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  overflow: hidden;

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

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 16px;
    min-height: auto;
  }
}

.info-label-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 140px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--n-text-color-2);

  @media (max-width: 768px) {
    flex: none;
  }
}

.info-value-modern {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  color: var(--n-text-color);
  word-break: break-all;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  &.mono {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
    font-size: 0.8125rem;
    background: rgba(0, 0, 0, 0.05);
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    display: inline-block;
    width: fit-content;

    :root.dark & {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }
  }
}

.not-assigned {
  color: var(--n-text-color-3);
  font-style: italic;
}

.org-tag {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%) !important;
  color: white !important;
  font-weight: 600;
  padding: 4px 12px;
  box-shadow: 0 2px 8px rgba(67, 233, 123, 0.3);
  max-width: 100%;

  :deep(.n-tag__content) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
    font-size: 0.8rem;
  }
}

.role-tag-modern {
  margin-right: 6px;
  margin-bottom: 6px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

// Avatar Actions
.avatar-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.avatar-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 12px;
  background: var(--n-color);
  border-radius: 8px;
  font-size: 0.8125rem;
  color: var(--n-text-color-3);
  border: 1px solid var(--n-border-color);
}

// Dropzone
.dropzone {
  position: relative;
  padding: 40px 20px;
  border: 3px dashed rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  background: var(--n-color);
  cursor: pointer;
  transition: all 0.3s ease;

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.03);
  }

  &:hover {
    border-color: var(--n-primary-color);
    background: var(--n-primary-color-hover);
    transform: translateY(-2px);

    .dropzone-icon {
      transform: scale(1.1);
      color: var(--n-primary-color);
    }
  }

  &.is-dragging {
    border-color: var(--n-primary-color);
    background: var(--n-primary-color-hover);
    border-style: solid;

    .dropzone-icon {
      transform: scale(1.2);
      color: var(--n-primary-color);
    }
  }
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  pointer-events: none;
}

.dropzone-icon {
  color: var(--n-text-color-3);
  transition: all 0.3s ease;
}

.dropzone-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--n-text-color);
  margin: 0;
}

.dropzone-subtitle {
  font-size: 0.875rem;
  color: var(--n-text-color-3);
  margin: 0;
}

.dropzone-formats {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.format-badge {
  padding: 4px 10px;
  background: var(--n-primary-color);
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>