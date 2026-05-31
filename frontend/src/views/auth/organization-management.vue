<script setup lang="ts">
/**
 * Organization Management View
 * Requirements: 13.4, 13.5, 13.6, 13.7, 13.9, 13.12
 */
import { ref, computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import { iamClient } from "@/api/iam";
import { useAuthStore } from "@/store";

interface OrgMember {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isOrganizationCreator: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
}

interface ApiKey {
  id: string;
  name: string;
  keyHint: string;
  keyType: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

interface Organization {
  id: string;
  name: string;
  creatorUserId: string;
}

const authStore = useAuthStore();

const org = ref<Organization | null>(null);
const members = ref<OrgMember[]>([]);
const apiKeys = ref<ApiKey[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const activeTab = ref<"members" | "settings" | "api-keys">("members");

// Settings edit state (Requirement 13.6, 13.7)
const editingSettings = ref(false);
const orgNameEdit = ref("");
const savingSettings = ref(false);

// Invite state (Requirement 13.4, 13.5)
const showInvite = ref(false);
const inviteEmail = ref("");
const inviteRole = ref("developer");
const inviting = ref(false);
const inviteError = ref<string | null>(null);

// API key rotation state (Requirement 13.9)
const rotatingKeyId = ref<string | null>(null);
const newKeySecret = ref<string | null>(null);

const isCreator = computed(
  () => org.value?.creatorUserId === authStore.user?.id,
);
const isAdmin = computed(
  () =>
    authStore.hasRole("administrator") ||
    authStore.hasRole("super_administrator"),
);

const ROLE_OPTIONS = [
  { label: "Administrator (Tier 2)", value: "administrator" },
  { label: "Developer (Tier 3)", value: "developer" },
  { label: "Viewer (Tier 4)", value: "viewer" },
  { label: "Demo (Tier 5)", value: "demo" },
];

const ROLE_COLORS: Record<string, string> = {
  super_administrator: "#f59e0b",
  administrator: "#8b5cf6",
  developer: "#3b82f6",
  viewer: "#10b981",
  demo: "#6b7280",
};

async function loadOrganization() {
  if (!authStore.organizationId) return;
  isLoading.value = true;
  error.value = null;
  try {
    const [orgData, membersData, keysData] = await Promise.all([
      iamClient.get<Organization>(`/organizations/${authStore.organizationId}`),
      iamClient.get<OrgMember[]>(
        `/organizations/${authStore.organizationId}/members`,
      ),
      iamClient.get<ApiKey[]>(
        `/organizations/${authStore.organizationId}/api-keys`,
      ),
    ]);
    org.value = orgData;
    members.value = membersData;
    apiKeys.value = keysData;
    orgNameEdit.value = orgData.name;
  } catch (err: unknown) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      e.response?.data?.message || e.message || "Failed to load organization";
  } finally {
    isLoading.value = false;
  }
}

// Update org settings — creator only (Requirement 13.6, 13.7)
async function saveSettings() {
  if (!org.value || !isCreator.value) return;
  savingSettings.value = true;
  try {
    await iamClient.patch(`/organizations/${org.value.id}`, {
      name: orgNameEdit.value.trim(),
    });
    org.value.name = orgNameEdit.value.trim();
    editingSettings.value = false;
  } catch (err: unknown) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      e.response?.data?.message || e.message || "Failed to save settings";
  } finally {
    savingSettings.value = false;
  }
}

// Invite member — admin only (Requirement 13.4, 13.5)
async function inviteMember() {
  if (!org.value || !isAdmin.value) return;
  inviteError.value = null;
  if (!inviteEmail.value.trim()) {
    inviteError.value = "Email is required";
    return;
  }
  inviting.value = true;
  try {
    const newMember = await iamClient.post<OrgMember>(
      `/organizations/${org.value.id}/invite`,
      {
        email: inviteEmail.value.trim(),
        role: inviteRole.value,
      },
    );
    members.value.push(newMember);
    showInvite.value = false;
    inviteEmail.value = "";
    inviteRole.value = "developer";
  } catch (err: unknown) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    inviteError.value =
      e.response?.data?.message || e.message || "Failed to invite member";
  } finally {
    inviting.value = false;
  }
}

// Rotate API key (Requirement 13.9)
async function rotateApiKey(keyId: string) {
  if (!org.value) return;
  rotatingKeyId.value = keyId;
  newKeySecret.value = null;
  try {
    const result = await iamClient.post<{ secret: string }>(
      `/organizations/${org.value.id}/api-keys/${keyId}/rotate`,
    );
    newKeySecret.value = result.secret;
  } catch (err: unknown) {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      e.response?.data?.message || e.message || "Failed to rotate API key";
  } finally {
    rotatingKeyId.value = null;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getRoleLabel(role: string): string {
  return (
    ROLE_OPTIONS.find((r) => r.value === role)?.label.split(" (")[0] ?? role
  );
}

function copyNewKeySecret() {
  if (newKeySecret.value) navigator.clipboard.writeText(newKeySecret.value);
}

function copyOrgId() {
  navigator.clipboard.writeText(org.value?.id || "");
}

onMounted(loadOrganization);
</script>

<template>
  <div class="org-management">
    <div class="page-header">
      <div class="header-left">
        <Icon icon="carbon:enterprise" :width="28" :height="28" class="header-icon" aria-hidden="true" />
        <div>
          <h1 class="page-title">{{ org?.name || "Organization" }}</h1>
          <p class="page-subtitle">
            Manage your organization, members, and API keys
          </p>
        </div>
      </div>
      <n-button :loading="isLoading" @click="loadOrganization">
        <template #icon>
          <Icon icon="mdi:refresh" />
        </template>
        Refresh
      </n-button>
    </div>

    <n-alert v-if="error" type="error" :show-icon="true" closable aria-live="assertive" @close="error = null">
      {{ error }}
    </n-alert>

    <!-- Tabs -->
    <n-tabs v-model:value="activeTab" type="line" animated>
      <!-- Members tab (Requirements 13.4, 13.5, 13.12) -->
      <n-tab-pane name="members" tab="Members">
        <div class="tab-content">
          <div class="tab-actions">
            <span class="member-count">{{ members.length }} member{{
              members.length !== 1 ? "s" : ""
            }}</span>
            <n-button v-if="isAdmin" type="primary" size="small" @click="showInvite = true">
              <template #icon>
                <Icon icon="mdi:account-plus" />
              </template>
              Invite Member
            </n-button>
          </div>

          <!-- Invite form -->
          <div v-if="showInvite" class="invite-form">
            <h3 class="invite-title">Invite New Member</h3>
            <n-alert v-if="inviteError" type="error" :show-icon="true" size="small" aria-live="assertive">
              {{ inviteError
              }}
            </n-alert>
            <div class="invite-fields">
              <div class="form-group">
                <label for="invite-email" class="form-label">Email</label>
                <n-input
                  id="invite-email" v-model:value="inviteEmail" placeholder="member@example.com" size="small"
                  :disabled="inviting" @input="inviteError = null"
                />
              </div>
              <div class="form-group">
                <label for="invite-role" class="form-label">Role (5-tier RBAC)</label>
                <n-select
                  id="invite-role" v-model:value="inviteRole" :options="ROLE_OPTIONS" size="small"
                  :disabled="inviting"
                />
              </div>
            </div>
            <div class="invite-actions">
              <n-button type="primary" size="small" :loading="inviting" @click="inviteMember">Send Invite</n-button>
              <n-button
                size="small" @click="
                  showInvite = false;
                  inviteError = null;
                "
              >
                Cancel
              </n-button>
            </div>
          </div>

          <!-- Members list -->
          <div v-if="isLoading && !members.length" class="skeleton-list">
            <div v-for="i in 4" :key="i" class="skeleton-row" aria-hidden="true" />
          </div>
          <div v-else class="members-list" role="list" aria-label="Organization members">
            <div v-for="member in members" :key="member.id" class="member-row" role="listitem">
              <div
                class="member-avatar" :style="{
                  backgroundColor: ROLE_COLORS[member.role] || '#6b7280',
                }" aria-hidden="true"
              >
                {{
                  (member.firstName?.[0] || member.username[0]).toUpperCase()
                }}
              </div>
              <div class="member-info">
                <div class="member-name-row">
                  <span class="member-name">{{ member.firstName }} {{ member.lastName }}</span>
                  <span v-if="member.isOrganizationCreator" class="creator-badge">Creator</span>
                  <span v-if="!member.isActive" class="inactive-badge">Inactive</span>
                </div>
                <span class="member-email">{{ member.email }}</span>
              </div>
              <div class="member-role">
                <span
                  class="role-badge" :style="{
                    backgroundColor: `${ROLE_COLORS[member.role]}20`,
                    color: ROLE_COLORS[member.role],
                  }"
                >
                  {{ getRoleLabel(member.role) }}
                </span>
              </div>
              <span class="member-last-login">{{
                formatDate(member.lastLoginAt)
              }}</span>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <!-- API Keys tab (Requirement 13.9) -->
      <n-tab-pane name="api-keys" tab="API Keys">
        <div class="tab-content">
          <!-- New key secret reveal -->
          <n-alert v-if="newKeySecret" type="warning" :show-icon="true" closable @close="newKeySecret = null">
            <template #header>New API Key Secret — Save it now</template>
            <div class="new-secret-display">
              <code class="secret-value">{{ newKeySecret }}</code>
              <n-button size="tiny" @click="copyNewKeySecret">Copy</n-button>
            </div>
            <p class="secret-warning">This secret will not be shown again.</p>
          </n-alert>

          <div v-if="isLoading && !apiKeys.length" class="skeleton-list">
            <div v-for="i in 2" :key="i" class="skeleton-row" aria-hidden="true" />
          </div>
          <div v-else class="api-keys-list" role="list" aria-label="API keys">
            <div v-for="key in apiKeys" :key="key.id" class="api-key-row" role="listitem">
              <div class="key-info">
                <div class="key-name-row">
                  <span class="key-name">{{ key.name }}</span>
                  <span class="key-type-badge">{{ key.keyType }}</span>
                  <span v-if="!key.isActive" class="inactive-badge">Revoked</span>
                </div>
                <div class="key-meta">
                  <span class="meta-item">
                    <Icon icon="mdi:key-outline" :width="14" :height="14" aria-hidden="true" />
                    {{ key.keyHint }}…
                  </span>
                  <span class="meta-item">
                    <Icon icon="mdi:calendar-outline" :width="14" :height="14" aria-hidden="true" />
                    Created {{ formatDate(key.createdAt) }}
                  </span>
                  <span class="meta-item">
                    <Icon icon="mdi:clock-outline" :width="14" :height="14" aria-hidden="true" />
                    Last used {{ formatDate(key.lastUsedAt) }}
                  </span>
                </div>
              </div>
              <n-button
                v-if="key.isActive && isAdmin" size="small" ghost :loading="rotatingKeyId === key.id"
                :aria-label="`Rotate ${key.name}`" @click="rotateApiKey(key.id)"
              >
                <template #icon>
                  <Icon icon="mdi:rotate-right" />
                </template>
                Rotate
              </n-button>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <!-- Settings tab (Requirements 13.6, 13.7) -->
      <n-tab-pane name="settings" tab="Settings">
        <div class="tab-content">
          <div v-if="!isCreator" class="permission-notice">
            <Icon icon="mdi:lock-outline" :width="20" :height="20" aria-hidden="true" />
            <span>Only the organization creator can modify settings.</span>
          </div>

          <div v-else class="settings-form">
            <div class="form-group">
              <label for="org-name" class="form-label">Organization Name</label>
              <div class="settings-field-row">
                <n-input
                  id="org-name" v-model:value="orgNameEdit" :disabled="!editingSettings || savingSettings"
                  size="large" aria-required="true"
                />
                <template v-if="editingSettings">
                  <n-button type="primary" :loading="savingSettings" @click="saveSettings">Save</n-button>
                  <n-button
                    :disabled="savingSettings" @click="
                      editingSettings = false;
                      orgNameEdit = org?.name || '';
                    "
                  >
                    Cancel
                  </n-button>
                </template>
                <n-button v-else @click="editingSettings = true">
                  <template #icon>
                    <Icon icon="mdi:pencil-outline" />
                  </template>
                  Edit
                </n-button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Organization ID</label>
              <div class="readonly-field">
                <code>{{ org?.id }}</code>
                <n-button size="tiny" aria-label="Copy organization ID" @click="copyOrgId">
                  <template #icon>
                    <Icon icon="mdi:content-copy" />
                  </template>
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>
