<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  NButton,
  useMessage,
} from "naive-ui";
import type { FormInst } from "naive-ui";
import { usersApi } from "@/api/users";
import type { User } from "@/types";

interface Props {
  show: boolean;
  user: User | null;
}

interface Emits {
  (e: "update:show", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const isLoading = ref(false);

const formData = ref({
  firstName: "",
  lastName: "",
  email: "",
  isActive: true,
});

const rules = {
  firstName: [
    { required: true, message: "First name is required", trigger: "blur" },
  ],
  lastName: [
    { required: true, message: "Last name is required", trigger: "blur" },
  ],
  email: [
    { required: true, message: "Email is required", trigger: "blur" },
    {
      type: "email" as const,
      message: "Invalid email format",
      trigger: "blur",
    },
  ],
};

function getAvatarGradient(email: string): string {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  ];

  const hash = email
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

function getUserInitials(user: User): string {
  const f = user.firstName?.charAt(0) || "";
  const l = user.lastName?.charAt(0) || "";
  return (f + l).toUpperCase() || user.email.charAt(0).toUpperCase();
}

async function handleSubmit() {
  if (!props.user) return;

  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  isLoading.value = true;
  try {
    await usersApi.update(props.user.id, formData.value);
    message.success("User updated successfully");
    emit("success");
    handleClose();
  } catch (error) {
    console.error("Failed to update user:", error);
    message.error("Failed to update user");
  } finally {
    isLoading.value = false;
  }
}

function handleClose() {
  emit("update:show", false);
}

// Watch for modal open to populate form
watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.user) {
      formData.value = {
        firstName: props.user.firstName || "",
        lastName: props.user.lastName || "",
        email: props.user.email,
        isActive: props.user.isActive,
      };
    }
  },
);
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    title="Edit User"
    style="width: 600px; max-width: 90vw"
    :segmented="{ content: 'soft' }"
    @update:show="handleClose"
  >
    <div v-if="user" class="user-edit-content">
      <!-- User Header -->
      <div class="user-header">
        <div
          class="user-avatar-large"
          :style="{ background: getAvatarGradient(user.email) }"
        >
          {{ getUserInitials(user) }}
        </div>
        <div class="user-info">
          <h3 class="user-name">Edit User Information</h3>
          <p class="user-id">
            User ID: <code>{{ user.id }}</code>
          </p>
        </div>
      </div>

      <!-- Edit Form -->
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="top"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="First Name" path="firstName">
          <n-input
            v-model:value="formData.firstName"
            placeholder="Enter first name"
          />
        </n-form-item>

        <n-form-item label="Last Name" path="lastName">
          <n-input
            v-model:value="formData.lastName"
            placeholder="Enter last name"
          />
        </n-form-item>

        <n-form-item label="Email" path="email">
          <n-input
            v-model:value="formData.email"
            placeholder="Enter email address"
          >
            <template #prefix>
              <Icon icon="carbon:email" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item label="Status">
          <div style="display: flex; align-items: center; gap: 12px">
            <n-switch v-model:value="formData.isActive" />
            <span style="font-size: 14px">
              {{ formData.isActive ? "Active" : "Inactive" }}
            </span>
          </div>
        </n-form-item>
      </n-form>
    </div>

    <template #footer>
      <div class="tfo-modal-footer">
        <n-button @click="handleClose">Cancel</n-button>
        <n-button type="primary" :loading="isLoading" @click="handleSubmit">
          <template #icon>
            <Icon icon="carbon:save" />
          </template>
          Save Changes
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
.user-edit-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: rgba(128, 128, 128, 0.05);
  border-radius: 12px;

  .user-avatar-large {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 24px;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .user-info {
    flex: 1;

    .user-name {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .user-id {
      margin: 0;
      font-size: 13px;
      color: var(--n-text-color-3);

      code {
        font-size: 12px;
        background: rgba(128, 128, 128, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
  }
}
</style>
