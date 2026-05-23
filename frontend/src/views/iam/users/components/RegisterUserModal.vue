<template>
  <n-modal
    :show="show"
    preset="card"
    title="Register New User"
    style="width: 820px; max-height: 88vh"
    :mask-closable="false"
    @update:show="close"
  >
    <div class="tfo-modal-layout">
      <!-- ── Left: Vertical Tabs ─────────────────────────────────────────── -->
      <div class="tfo-modal-tabs">
        <div
          v-for="tab in formTabs"
          :key="tab.value"
          class="tfo-modal-tab-item"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          <Icon :icon="tab.icon" class="tfo-modal-tab-icon" />
          <span class="tfo-modal-tab-label">{{ tab.label }}</span>
        </div>
        <div class="tfo-modal-tab-desc">
          <p>{{ tabDescriptions[activeTab] }}</p>
        </div>
      </div>

      <!-- ── Right: Form Content ────────────────────────────────────────── -->
      <div class="tfo-modal-content">
        <n-scrollbar style="max-height: calc(88vh - 180px)">
          <n-form
            ref="formRef"
            :model="createForm"
            :rules="createFormRules"
            label-placement="top"
          >
            <!-- Personal Info Tab -->
            <template v-if="activeTab === 'personal'">
              <div class="tfo-modal-box">
                <n-grid :cols="2" :x-gap="16">
                  <n-gi>
                    <n-form-item label="First Name" path="firstName">
                      <n-input
                        v-model:value="createForm.firstName"
                        placeholder="John"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item label="Last Name" path="lastName">
                      <n-input
                        v-model:value="createForm.lastName"
                        placeholder="Doe"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
                <n-form-item label="Username" path="username">
                  <n-input
                    v-model:value="createForm.username"
                    placeholder="e.g. johndoe (min 3 chars)"
                  />
                </n-form-item>
              </div>
            </template>

            <!-- Account Security Tab -->
            <template v-if="activeTab === 'security'">
              <div class="tfo-modal-box">
                <n-form-item label="Email Address" path="email">
                  <n-input
                    v-model:value="createForm.email"
                    placeholder="john.doe@example.com"
                  />
                </n-form-item>
                <n-form-item label="Password" path="password">
                  <n-input
                    v-model:value="createForm.password"
                    type="password"
                    placeholder="Min 8 chars: uppercase, lowercase, number, special"
                    show-password-on="click"
                  />
                </n-form-item>
                <n-form-item label="Confirm Password" path="confirmPassword">
                  <n-input
                    v-model:value="createForm.confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    show-password-on="click"
                  />
                </n-form-item>
              </div>
            </template>

            <!-- Organization Tab -->
            <template v-if="activeTab === 'organization'">
              <div class="tfo-modal-box">
                <n-form-item label="Region ID" path="regionId">
                  <n-input
                    v-model:value="createForm.regionId"
                    placeholder="e.g. 00000000-0000-4000-a000-000000000001"
                  />
                </n-form-item>
                <n-form-item label="Organization ID">
                  <n-input
                    v-model:value="createForm.organizationId"
                    placeholder="UUID — leave empty to create new org"
                  />
                </n-form-item>
                <n-grid :cols="2" :x-gap="16">
                  <n-gi>
                    <n-form-item label="Workspace ID">
                      <n-input
                        v-model:value="createForm.workspaceId"
                        placeholder="UUID (optional)"
                      />
                    </n-form-item>
                  </n-gi>
                  <n-gi>
                    <n-form-item label="Tenant ID">
                      <n-input
                        v-model:value="createForm.tenantId"
                        placeholder="UUID (optional)"
                      />
                    </n-form-item>
                  </n-gi>
                </n-grid>
                <n-form-item label="Send Verification Email">
                  <div class="verify-row">
                    <n-switch
                      v-model:value="createForm.sendEmailVerification"
                    />
                    <span class="verify-hint">
                      {{
                        createForm.sendEmailVerification
                          ? "A verification email will be sent after registration."
                          : "User will be created without email verification."
                      }}
                    </span>
                  </div>
                </n-form-item>
              </div>
            </template>
          </n-form>
        </n-scrollbar>
      </div>
    </div>

    <template #footer>
      <div class="tfo-modal-footer">
        <n-button @click="close">Cancel</n-button>
        <n-button
          type="primary"
          :loading="isCreating"
          :disabled="!isFormReady"
          @click="handleRegisterUser"
        >
          <template #icon><Icon icon="carbon:user-follow" /></template>
          Register User
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { Icon } from "@iconify/vue";
import {
  useMessage,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  NButton,
  NGrid,
  NGi,
  NScrollbar,
} from "naive-ui";
import { usersApi } from "@/api/users";
import type { FormInst } from "naive-ui";

interface RegisterUserForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  regionId: string;
  organizationId: string;
  workspaceId: string;
  tenantId: string;
  sendEmailVerification: boolean;
}

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{
  "update:show": [value: boolean];
  registered: [];
}>();

const message = useMessage();
const isCreating = ref(false);
const formRef = ref<FormInst | null>(null);

// ── Vertical tab state ─────────────────────────────────────────────────────
const activeTab = ref<"personal" | "security" | "organization">("personal");

const formTabs = [
  { label: "Personal Info", value: "personal", icon: "carbon:user-profile" },
  { label: "Account Security", value: "security", icon: "carbon:locked" },
  { label: "Organization", value: "organization", icon: "carbon:enterprise" },
] as const;

const tabDescriptions: Record<string, string> = {
  personal: "Set the user's display name and login username.",
  security: "Configure email address and a strong password for account access.",
  organization:
    "Optionally assign the user to a region, organization, workspace, and tenant.",
};

// ── Form state ─────────────────────────────────────────────────────────────
const createForm = reactive<RegisterUserForm>({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  regionId: "",
  organizationId: "",
  workspaceId: "",
  tenantId: "",
  sendEmailVerification: true,
});

const createFormRules = {
  username: [
    { required: true, message: "Username is required", trigger: "blur" },
    { min: 3, message: "At least 3 characters", trigger: "blur" },
  ],
  email: [
    { required: true, message: "Email is required", trigger: "blur" },
    {
      type: "email" as const,
      message: "Valid email required",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "Password is required", trigger: "blur" },
    { min: 8, message: "At least 8 characters", trigger: "blur" },
    {
      pattern:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/,
      message: "Must include uppercase, lowercase, number and special char",
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "Please confirm password", trigger: "blur" },
    {
      validator: (_rule: any, value: string) => {
        if (value !== createForm.password)
          return new Error("Passwords do not match");
        return true;
      },
      trigger: "blur",
    },
  ],
  firstName: [{ required: true, message: "Required", trigger: "blur" }],
  lastName: [{ required: true, message: "Required", trigger: "blur" }],
  regionId: [
    { required: true, message: "Region ID is required", trigger: "blur" },
  ],
};

// Basic ready check so the Register button isn't completely disabled without validation
const isFormReady = computed(
  () =>
    createForm.firstName.trim() &&
    createForm.lastName.trim() &&
    createForm.username.trim() &&
    createForm.email.trim() &&
    createForm.password.length >= 8 &&
    createForm.regionId.trim(),
);

function resetForm() {
  Object.assign(createForm, {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    regionId: "",
    organizationId: "",
    workspaceId: "",
    tenantId: "",
    sendEmailVerification: true,
  });
  activeTab.value = "personal";
  formRef.value?.restoreValidation();
}

function close() {
  emit("update:show", false);
}

watch(
  () => props.show,
  (val) => {
    if (val) resetForm();
  },
);

async function handleRegisterUser() {
  try {
    await formRef.value?.validate();
  } catch {
    // Switch to first tab with errors if validation fails on personal/security fields
    const hasPersonal =
      !createForm.firstName || !createForm.lastName || !createForm.username;
    const hasSecurity =
      !createForm.email ||
      !createForm.password ||
      createForm.password !== createForm.confirmPassword;
    if (hasPersonal) {
      activeTab.value = "personal";
      return;
    }
    if (hasSecurity) {
      activeTab.value = "security";
      return;
    }
    return;
  }

  isCreating.value = true;
  try {
    const payload: Record<string, unknown> = {
      username: createForm.username,
      email: createForm.email,
      password: createForm.password,
      firstName: createForm.firstName,
      lastName: createForm.lastName,
      regionId: createForm.regionId,
      sendEmailVerification: createForm.sendEmailVerification,
    };
    if (createForm.organizationId)
      payload.organizationId = createForm.organizationId;
    if (createForm.workspaceId) payload.workspaceId = createForm.workspaceId;
    if (createForm.tenantId) payload.tenantId = createForm.tenantId;

    await usersApi.create(payload as any);
    message.success("User registered successfully");
    emit("registered");
    close();
  } catch (error: any) {
    message.error(error?.response?.data?.message || "Failed to register user");
  } finally {
    isCreating.value = false;
  }
}
</script>

<style scoped>
.verify-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.verify-hint {
  font-size: 12px;
  opacity: 0.6;
  line-height: 1.4;
}
</style>
