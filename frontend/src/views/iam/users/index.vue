<script setup lang="ts">
/**
 * IAM User Registration & Management View
 *
 * Features:
 * - List users with search, filter by org/workspace/tenant/status, pagination
 * - Create user (admin) with:
 *   - Cascading org → workspace → tenant selectors
 *   - Role assignment
 *   - Optional email verification toggle
 * - Edit user profile fields
 * - Activate / Deactivate user
 * - Admin password reset
 * - Delete user (soft-delete)
 * - Re-send verification email
 */

import { h, ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { StatPanel } from "@/components/charts";
import {
  NButton,
  NTag,
  NSelect,
  NInput,
  NDataTable,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NSwitch,
  NAlert,
  NText,
  NDropdown,
  NTooltip,
  NDescriptions,
  NDescriptionsItem,
  NScrollbar,
  useMessage,
  useDialog,
} from "naive-ui";
import type {
  FormInst,
  DataTableColumns,
  SelectOption,
  DropdownOption,
  FormRules,
} from "naive-ui";
import { usersApi } from "@/api/users";
import { organizationsApi } from "@/api/organizations";
import { workspacesApi } from "@/api/workspaces";
import { tenantsApi } from "@/api/tenants";
import { rolesApi } from "@/api/roles";
import { permissionsApi } from "@/api/permissions";
import PermissionsModal from "./components/PermissionsModal.vue";
import type { User, Role, Permission, Organization, Workspace, Tenant } from "@/types";
import type { UsersListParams } from "@/api/users";

const router = useRouter();
const message = useMessage();
const dialog = useDialog();

// ==================== STATE ====================

const users = ref<User[]>([]);
const allUsersForStats = ref<User[]>([]);
const organizations = ref<Organization[]>([]);
const workspaces = ref<Workspace[]>([]);
const filteredWorkspaces = ref<Workspace[]>([]);
const tenants = ref<Tenant[]>([]);
const filteredTenants = ref<Tenant[]>([]);
const roles = ref<Role[]>([]);

const loading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);

// Filters
const searchQuery = ref("");
const filterOrgId = ref<string | null>(null);
const filterWorkspaceId = ref<string | null>(null);
const filterTenantId = ref<string | null>(null);
const filterStatus = ref<string | null>(null);

// ==================== PERMISSIONS MODAL STATE ====================

const showPermissionsModal = ref(false);
const permissionsModalRole = ref<Role | null>(null);
const permissionsModalRolePerms = ref<Permission[]>([]);
const allPermissions = ref<Permission[]>([]);
const isLoadingPermissions = ref(false);
const permissionsModalRoleUsers = ref(0);

async function openPermissionsModal(user: User) {
  isLoadingPermissions.value = true;
  showPermissionsModal.value = true;

  try {
    const [rolesData, allPermsData] = await Promise.all([
      usersApi.getRoles(user.id).catch(() => ({ data: [] as Role[] })),
      permissionsApi.list({ limit: 200 }),
    ]);

    const userRolesList = rolesData.data || [];
    allPermissions.value = allPermsData.data || [];

    if (userRolesList.length > 0) {
      const role = userRolesList[0];
      permissionsModalRole.value = role;
      permissionsModalRoleUsers.value = allUsersForStats.value.length;

      // Fetch this role's actual permissions via /roles/:id/permissions
      try {
        const rolePermsData = await rolesApi.getPermissions(role.id);
        permissionsModalRolePerms.value = rolePermsData.data || [];
      } catch {
        // Fallback: try role.permissions if embedded
        permissionsModalRolePerms.value = (role as any).permissions ?? [];
      }
    } else {
      permissionsModalRole.value = null;
      permissionsModalRolePerms.value = [];
      permissionsModalRoleUsers.value = 0;
    }
  } catch (error) {
    console.error("Failed to load permissions:", error);
  } finally {
    isLoadingPermissions.value = false;
  }
}

// ==================== MODAL STATE ====================

type ModalMode = "create" | "edit" | "resetPassword" | "detail";
const showModal = ref(false);
const modalMode = ref<ModalMode>("create");
const modalLoading = ref(false);
const formRef = ref<FormInst | null>(null);
const selectedUser = ref<User | null>(null);

// Create / Edit form
interface UserFormModel {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string | null;
  workspaceId: string | null;
  tenantId: string | null;
  roleId: string | null;
  sendEmailVerification: boolean;
  forcePasswordChange: boolean;
  // Edit-only
  avatar: string;
  timezone: string;
  locale: string;
}

const formModel = ref<UserFormModel>({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  organizationId: null,
  workspaceId: null,
  tenantId: null,
  roleId: null,
  sendEmailVerification: false,
  forcePasswordChange: false,
  avatar: "",
  timezone: "UTC",
  locale: "en-US",
});

// ==================== PASSWORD GENERATOR ====================

const passwordStrength = computed(() => {
  const p = formModel.value.password;
  if (!p) return { score: 0, label: "", color: "" };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[@$!%*?&#^()_\-+=]/.test(p)) score++;
  if (score <= 2) return { score, label: "Weak", color: "#f44336" };
  if (score <= 4) return { score, label: "Fair", color: "#ff9800" };
  if (score === 5) return { score, label: "Good", color: "#4caf50" };
  return { score, label: "Strong", color: "#2196f3" };
});

function secureRandomIndex(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error("secureRandomIndex requires a positive integer max");
  }
  const cryptoObj = window.crypto;
  const array = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let value = 0;
  do {
    cryptoObj.getRandomValues(array);
    value = array[0];
  } while (value >= limit);
  return value % max;
}

function generatePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@$!%*?&#";
  const all = upper + lower + digits + special;
  const pwd = [
    upper[secureRandomIndex(upper.length)],
    upper[secureRandomIndex(upper.length)],
    lower[secureRandomIndex(lower.length)],
    lower[secureRandomIndex(lower.length)],
    digits[secureRandomIndex(digits.length)],
    digits[secureRandomIndex(digits.length)],
    special[secureRandomIndex(special.length)],
    special[secureRandomIndex(special.length)],
  ];
  for (let i = 0; i < 4; i++) {
    pwd.push(all[secureRandomIndex(all.length)]);
  }
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  formModel.value.password = pwd.join("");
}

// Password reset form
const resetPasswordForm = ref({ password: "", confirm: "" });

// Form-level cascading workspace/tenant options
const modalWorkspaces = ref<Workspace[]>([]);
const modalTenants = ref<Tenant[]>([]);
const loadingModalWorkspaces = ref(false);
const loadingModalTenants = ref(false);

// ==================== FORM RULES ====================

const createRules: FormRules = {
  email: [
    { required: true, message: "Email is required", trigger: "blur" },
    { type: "email", message: "Enter a valid email", trigger: "blur" },
  ],
  password: [
    { required: true, message: "Password is required", trigger: "blur" },
    { min: 8, message: "Minimum 8 characters", trigger: "blur" },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
      message:
        "Must include uppercase, lowercase, number and special character",
      trigger: "blur",
    },
  ],
  firstName: [
    { required: true, message: "First name is required", trigger: "blur" },
  ],
  lastName: [
    { required: true, message: "Last name is required", trigger: "blur" },
  ],
};

const editRules: FormRules = {
  firstName: [
    { required: true, message: "First name is required", trigger: "blur" },
  ],
  lastName: [
    { required: true, message: "Last name is required", trigger: "blur" },
  ],
};

const resetPasswordRules: FormRules = {
  password: [
    { required: true, message: "Password is required", trigger: "blur" },
    { min: 8, message: "Minimum 8 characters", trigger: "blur" },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
      message:
        "Must include uppercase, lowercase, number and special character",
      trigger: "blur",
    },
  ],
  confirm: [
    { required: true, message: "Please confirm password", trigger: "blur" },
    {
      validator: (_rule: unknown, value: string) => {
        if (value !== resetPasswordForm.value.password) {
          return new Error("Passwords do not match");
        }
        return true;
      },
      trigger: "blur",
    },
  ],
};

// ==================== SELECT OPTIONS ====================

const statusOptions: SelectOption[] = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const timezoneOptions: SelectOption[] = [
  { label: "UTC", value: "UTC" },
  { label: "Asia/Jakarta", value: "Asia/Jakarta" },
  { label: "Asia/Singapore", value: "Asia/Singapore" },
  { label: "America/New_York", value: "America/New_York" },
  { label: "America/Los_Angeles", value: "America/Los_Angeles" },
  { label: "Europe/London", value: "Europe/London" },
  { label: "Europe/Berlin", value: "Europe/Berlin" },
];

const localeOptions: SelectOption[] = [
  { label: "English (US)", value: "en-US" },
  { label: "Bahasa Indonesia", value: "id-ID" },
  { label: "English (UK)", value: "en-GB" },
  { label: "German", value: "de-DE" },
];

const orgOptions = computed<SelectOption[]>(() => [
  { label: "All Organizations", value: "all" },
  ...organizations.value.map((o) => ({ label: o.name, value: o.id })),
]);

const workspaceFilterOptions = computed<SelectOption[]>(() => {
  const ws =
    filterOrgId.value && filterOrgId.value !== "all"
      ? workspaces.value.filter((w) => w.organizationId === filterOrgId.value)
      : workspaces.value;
  return [
    { label: "All Workspaces", value: "all" },
    ...ws.map((w) => ({ label: w.name, value: w.id })),
  ];
});

const tenantFilterOptions = computed<SelectOption[]>(() => {
  const ts =
    filterWorkspaceId.value && filterWorkspaceId.value !== "all"
      ? tenants.value.filter((t) => t.workspaceId === filterWorkspaceId.value)
      : tenants.value;
  return [
    { label: "All Tenants", value: "all" },
    ...ts.map((t) => ({ label: t.name, value: t.id })),
  ];
});

const modalOrgOptions = computed<SelectOption[]>(() => [
  { label: "— None —", value: null as unknown as string },
  ...organizations.value.map((o) => ({ label: o.name, value: o.id })),
]);

const modalWorkspaceOptions = computed<SelectOption[]>(() => [
  { label: "— None —", value: null as unknown as string },
  ...modalWorkspaces.value.map((w) => ({ label: w.name, value: w.id })),
]);

const modalTenantOptions = computed<SelectOption[]>(() => [
  { label: "— None —", value: null as unknown as string },
  ...modalTenants.value.map((t) => ({ label: t.name, value: t.id })),
]);

const roleOptions = computed<SelectOption[]>(() =>
  roles.value.map((r) => ({ label: r.name, value: r.id })),
);

// ==================== VERTICAL TAB STATE ====================

const createActiveTab = ref<"personal" | "security" | "organization">(
  "personal",
);
const createFormTabs = [
  { label: "Personal Info", value: "personal", icon: "carbon:user-profile" },
  { label: "Account Security", value: "security", icon: "carbon:locked" },
  { label: "Organization", value: "organization", icon: "carbon:enterprise" },
] as const;
const createTabDescriptions: Record<string, string> = {
  personal: "Set the user's display name and login username.",
  security:
    "Set login email, generate a strong password, configure email verification and password reset policy.",
  organization:
    "Optionally assign the user to an organization, workspace, tenant and role.",
};

const editActiveTab = ref<"profile" | "preferences" | "roles">("profile");
const editFormTabs = [
  { label: "Profile", value: "profile", icon: "carbon:user-profile" },
  { label: "Preferences", value: "preferences", icon: "carbon:settings" },
  { label: "Roles", value: "roles", icon: "carbon:user-role" },
] as const;
const editTabDescriptions: Record<string, string> = {
  profile: "Update the user's name and avatar.",
  preferences: "Set timezone and locale for the user account.",
  roles: "Assign or revoke roles for this user.",
};

// Edit modal role management
const editUserRoles = ref<Role[]>([]);
const editLoadingRoles = ref(false);

async function loadEditUserRoles(userId: string) {
  editLoadingRoles.value = true;
  try {
    const data = await usersApi.getRoles(userId).catch(() => ({ data: [] as Role[] }));
    editUserRoles.value = data.data || [];
  } finally {
    editLoadingRoles.value = false;
  }
}

async function editAssignRole(roleId: string) {
  if (!selectedUser.value) return;
  try {
    await usersApi.assignRole(selectedUser.value.id, roleId);
    await loadEditUserRoles(selectedUser.value.id);
    message.success("Role assigned");
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "Failed to assign role");
  }
}

async function editRevokeRole(roleId: string) {
  if (!selectedUser.value) return;
  try {
    await usersApi.revokeRole(selectedUser.value.id, roleId);
    await loadEditUserRoles(selectedUser.value.id);
    message.success("Role revoked");
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "Failed to revoke role");
  }
}

// ==================== STATISTICS ====================

const activeCount = computed(
  () => allUsersForStats.value.filter((u) => u.isActive).length,
);
const verifiedCount = computed(
  () => allUsersForStats.value.filter((u) => u.emailVerified).length,
);
const unverifiedCount = computed(
  () => allUsersForStats.value.filter((u) => !u.emailVerified).length,
);

// ==================== FETCH ====================

async function fetchAll() {
  loading.value = true;
  try {
    const params: UsersListParams = {
      page: page.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      organizationId:
        filterOrgId.value && filterOrgId.value !== "all"
          ? filterOrgId.value
          : undefined,
      workspaceId:
        filterWorkspaceId.value && filterWorkspaceId.value !== "all"
          ? filterWorkspaceId.value
          : undefined,
      tenantId:
        filterTenantId.value && filterTenantId.value !== "all"
          ? filterTenantId.value
          : undefined,
      isActive:
        filterStatus.value === "true"
          ? true
          : filterStatus.value === "false"
            ? false
            : undefined,
    };
    const [usersResult, allUsersResult, orgsResult, wsResult, tenantsResult, rolesResult] =
      await Promise.allSettled([
        usersApi.list(params),
        usersApi.list({ limit: 10000 }),
        organizationsApi.list({ limit: 200 }),
        workspacesApi.list({ limit: 200 }),
        tenantsApi.list({ limit: 200 }),
        rolesApi.list(),
      ]);

    if (usersResult.status === "fulfilled") {
      users.value = usersResult.value.data;
      total.value = usersResult.value.total;
      totalPages.value = usersResult.value.totalPages;
    }
    if (allUsersResult.status === "fulfilled") {
      allUsersForStats.value = allUsersResult.value.data;
    }
    if (orgsResult.status === "fulfilled")
      organizations.value = orgsResult.value.data;
    if (wsResult.status === "fulfilled") workspaces.value = wsResult.value.data;
    if (tenantsResult.status === "fulfilled")
      tenants.value = tenantsResult.value.data;
    if (rolesResult.status === "fulfilled")
      roles.value = (rolesResult.value as { data: Role[] }).data;
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "Failed to load users");
  } finally {
    loading.value = false;
  }
}

async function loadModalWorkspaces(orgId: string | null) {
  modalWorkspaces.value = [];
  formModel.value.workspaceId = null;
  formModel.value.tenantId = null;
  modalTenants.value = [];
  if (!orgId) return;
  loadingModalWorkspaces.value = true;
  try {
    const res = await workspacesApi.list({ organizationId: orgId, limit: 200 });
    modalWorkspaces.value = res.data;
  } finally {
    loadingModalWorkspaces.value = false;
  }
}

async function loadModalTenants(wsId: string | null) {
  modalTenants.value = [];
  formModel.value.tenantId = null;
  if (!wsId) return;
  loadingModalTenants.value = true;
  try {
    const res = await tenantsApi.list({ workspaceId: wsId, limit: 200 });
    modalTenants.value = res.data;
  } finally {
    loadingModalTenants.value = false;
  }
}

// ==================== WATCHERS ====================

watch(searchQuery, () => {
  page.value = 1;
  fetchAll();
});
watch([filterOrgId, filterWorkspaceId, filterTenantId, filterStatus], () => {
  page.value = 1;
  fetchAll();
});

// Reset dependent filters when parent changes
watch(filterOrgId, () => {
  filterWorkspaceId.value = null;
  filterTenantId.value = null;
});
watch(filterWorkspaceId, () => {
  filterTenantId.value = null;
});

// ==================== MODALS ====================

function openCreateModal() {
  modalMode.value = "create";
  createActiveTab.value = "personal";
  formModel.value = {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    organizationId: null,
    workspaceId: null,
    tenantId: null,
    roleId: null,
    sendEmailVerification: false,
    forcePasswordChange: false,
    avatar: "",
    timezone: "UTC",
    locale: "en-US",
  };
  modalWorkspaces.value = [];
  modalTenants.value = [];
  showModal.value = true;
}

function openEditModal(user: User) {
  selectedUser.value = user;
  modalMode.value = "edit";
  editActiveTab.value = "profile";
  formModel.value = {
    email: user.email,
    password: "",
    firstName: user.firstName,
    lastName: user.lastName,
    organizationId: user.organizationId ?? null,
    workspaceId: null,
    tenantId: user.tenantId ?? null,
    roleId: null,
    sendEmailVerification: false,
    forcePasswordChange: false,
    avatar: user.avatar ?? "",
    timezone: user.timezone,
    locale: user.locale,
  };
  showModal.value = true;
  loadEditUserRoles(user.id);
}

function openResetPasswordModal(user: User) {
  selectedUser.value = user;
  modalMode.value = "resetPassword";
  resetPasswordForm.value = { password: "", confirm: "" };
  showModal.value = true;
}

function openDetailModal(user: User) {
  router.push({ name: "IAMUserDetail", params: { id: user.id } });
}

function closeModal() {
  showModal.value = false;
  selectedUser.value = null;
}

// ==================== CRUD ACTIONS ====================

async function submitCreate() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  modalLoading.value = true;
  try {
    await usersApi.create({
      username: formModel.value.email.split("@")[0],
      email: formModel.value.email,
      password: formModel.value.password,
      firstName: formModel.value.firstName,
      lastName: formModel.value.lastName,
      organizationId: formModel.value.organizationId ?? undefined,
      workspaceId: formModel.value.workspaceId ?? undefined,
      tenantId: formModel.value.tenantId ?? undefined,
      roleId: formModel.value.roleId ?? undefined,
      sendEmailVerification: formModel.value.sendEmailVerification,
      forcePasswordChange: formModel.value.forcePasswordChange,
    } as any);
    message.success(
      formModel.value.sendEmailVerification
        ? "User created. Verification email sent."
        : "User created successfully.",
    );
    closeModal();
    fetchAll();
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "Failed to create user");
  } finally {
    modalLoading.value = false;
  }
}

async function submitEdit() {
  if (!selectedUser.value) return;
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  modalLoading.value = true;
  try {
    await usersApi.update(selectedUser.value.id, {
      firstName: formModel.value.firstName,
      lastName: formModel.value.lastName,
      avatar: formModel.value.avatar || undefined,
      timezone: formModel.value.timezone,
      locale: formModel.value.locale,
    });
    message.success("User updated successfully.");
    closeModal();
    fetchAll();
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "Failed to update user");
  } finally {
    modalLoading.value = false;
  }
}

async function submitResetPassword() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (!selectedUser.value) return;
  modalLoading.value = true;
  try {
    await usersApi.resetPassword(
      selectedUser.value.id,
      resetPasswordForm.value.password,
    );
    message.success("Password reset successfully.");
    closeModal();
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "Failed to reset password");
  } finally {
    modalLoading.value = false;
  }
}

async function toggleActive(user: User) {
  try {
    if (user.isActive) {
      await usersApi.deactivate(user.id);
      message.success(`User ${user.email} deactivated.`);
    } else {
      await usersApi.activate(user.id);
      message.success(`User ${user.email} activated.`);
    }
    fetchAll();
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : "Failed to update status");
  }
}

async function confirmDelete(user: User) {
  dialog.warning({
    title: "Delete User",
    content: `Are you sure you want to delete ${user.firstName} ${user.lastName} (${user.email})? This action cannot be undone.`,
    positiveText: "Delete",
    negativeText: "Cancel",
    onPositiveClick: async () => {
      try {
        await usersApi.delete(user.id);
        message.success("User deleted.");
        fetchAll();
      } catch (e: unknown) {
        message.error(e instanceof Error ? e.message : "Failed to delete user");
      }
    },
  });
}

async function sendVerificationEmail(user: User) {
  try {
    await usersApi.sendVerificationEmail(user.id);
    message.success(`Verification email sent to ${user.email}`);
  } catch (e: unknown) {
    message.error(
      e instanceof Error ? e.message : "Failed to send verification email",
    );
  }
}

// ==================== ROW ACTIONS ====================

function getRowActions(user: User): DropdownOption[] {
  return [
    {
      label: "View Details",
      key: "detail",
      icon: () => h(Icon, { icon: "carbon:magnify" }),
    },
    { type: "divider", key: "d1" },
    {
      label: "Edit Profile",
      key: "edit",
      icon: () => h(Icon, { icon: "carbon:edit" }),
    },
    {
      label: "Reset Password",
      key: "resetPassword",
      icon: () => h(Icon, { icon: "carbon:password" }),
    },
    {
      label: "Permission",
      key: "permission",
      icon: () => h(Icon, { icon: "carbon:license" }),
    },
    { type: "divider", key: "d1" },
    {
      label: user.isActive ? "Deactivate" : "Activate",
      key: "toggleActive",
      icon: () =>
        h(Icon, {
          icon: user.isActive ? "carbon:user-x-ray" : "carbon:user-follow",
        }),
    },
    ...(!user.emailVerified
      ? [
          {
            label: "Send Verification Email",
            key: "sendVerification",
            icon: () => h(Icon, { icon: "carbon:email" }),
          },
        ]
      : []),
    { type: "divider", key: "d2" },
    {
      label: "Delete User",
      key: "delete",
      icon: () => h(Icon, { icon: "carbon:trash-can" }),
      props: { style: "color: #f44336" },
    },
  ];
}

function handleRowAction(key: string, user: User) {
  switch (key) {
    case "detail":
      openDetailModal(user);
      break;
    case "edit":
      openEditModal(user);
      break;
    case "resetPassword":
      openResetPasswordModal(user);
      break;
    case "permission":
      openPermissionsModal(user);
      break;
    case "toggleActive":
      toggleActive(user);
      break;
    case "sendVerification":
      sendVerificationEmail(user);
      break;
    case "delete":
      confirmDelete(user);
      break;
  }
}

// ==================== TABLE COLUMNS ====================

const columns = computed<DataTableColumns<User>>(() => [
  {
    title: "User",
    key: "user",
    minWidth: 200,
    render: (row) =>
      h("div", { class: "flex items-center gap-3" }, [
        h(
          "div",
          {
            class:
              "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0",
            style: { background: getAvatarColor(row.firstName) },
          },
          row.firstName.charAt(0).toUpperCase() +
            row.lastName.charAt(0).toUpperCase(),
        ),
        h("div", {}, [
          h(
            "div",
            { class: "font-medium text-sm" },
            `${row.firstName} ${row.lastName}`,
          ),
          h("div", { class: "text-xs text-gray-400" }, row.email),
        ]),
      ]),
  },
  {
    title: "Status",
    key: "status",
    width: 140,
    render: (row) =>
      h("div", { class: "flex flex-col gap-1" }, [
        h(
          NTag,
          { size: "small", type: row.isActive ? "success" : "default" },
          { default: () => (row.isActive ? "Active" : "Inactive") },
        ),
        row.emailVerified
          ? h(
              NTag,
              { size: "small", type: "info" },
              { default: () => "Verified" },
            )
          : h(
              NTag,
              { size: "small", type: "warning" },
              { default: () => "Unverified" },
            ),
      ]),
  },
  {
    title: "Organization",
    key: "organizationId",
    width: 160,
    render: (row) => {
      const org = organizations.value.find((o) => o.id === row.organizationId);
      if (!org) return h("span", { class: "text-gray-400 text-xs" }, "—");
      const orgIdx = organizations.value.indexOf(org);
      const orgColors: Array<"info" | "success" | "warning" | "error" | "primary"> = ["info", "success", "warning", "error", "primary"];
      return h(
        NTag,
        { size: "small", bordered: false, type: orgColors[orgIdx % orgColors.length] },
        {
          default: () => org.name,
          icon: () => h(Icon, { icon: "carbon:enterprise", style: "font-size: 12px" }),
        },
      );
    },
  },
  {
    title: "Tenant",
    key: "tenantId",
    width: 160,
    render: (row) => {
      const tenant = tenants.value.find((t) => t.id === row.tenantId);
      if (!tenant) return h("span", { class: "text-gray-400 text-xs" }, "—");
      const tenantIdx = tenants.value.indexOf(tenant);
      const tenantColors: Array<"info" | "success" | "warning" | "error" | "primary"> = ["success", "warning", "info", "primary", "error"];
      return h(
        NTag,
        { size: "small", bordered: false, type: tenantColors[tenantIdx % tenantColors.length] },
        {
          default: () => tenant.name,
          icon: () => h(Icon, { icon: "carbon:group", style: "font-size: 12px" }),
        },
      );
    },
  },
  {
    title: "Created",
    key: "createdAt",
    width: 180,
    render: (row) => {
      if (!row.createdAt) return h("span", {}, "—");
      const d = new Date(row.createdAt);
      const pad = (n: number) => String(n).padStart(2, "0");
      const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      return h("span", { style: { fontSize: "12px", fontFamily: "monospace" } }, str);
    },
  },
  {
    title: "Actions",
    key: "actions",
    width: 80,
    align: "center",
    render: (row) =>
      h(
        NDropdown,
        {
          options: getRowActions(row),
          trigger: "click",
          onSelect: (key: string) => handleRowAction(key, row),
        },
        {
          default: () =>
            h(
              NButton,
              { quaternary: true, circle: true, size: "small" },
              {
                default: () =>
                  h(Icon, { icon: "carbon:overflow-menu-vertical", width: 16 }),
              },
            ),
        },
      ),
  },
]);

// ==================== HELPERS ====================

function getAvatarColor(name: string): string {
  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f97316",
    "#10b981",
    "#0ea5e9",
    "#f59e0b",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function getOrgName(id?: string) {
  return id ? (organizations.value.find((o) => o.id === id)?.name ?? id) : "—";
}

function getTenantName(id?: string) {
  return id ? (tenants.value.find((t) => t.id === id)?.name ?? id) : "—";
}

function handlePageChange(p: number) {
  page.value = p;
  fetchAll();
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  page.value = 1;
  fetchAll();
}

const modalTitle = computed(() => {
  switch (modalMode.value) {
    case "create":
      return "Register New User";
    case "edit":
      return `Edit User — ${selectedUser.value?.firstName} ${selectedUser.value?.lastName}`;
    case "resetPassword":
      return `Reset Password — ${selectedUser.value?.email}`;
    case "detail":
      return "User Details";
    default:
      return "";
  }
});

// ==================== LIFECYCLE ====================

onMounted(fetchAll);
</script>

<template>
  <div class="iam-users-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-title-row">
          <Icon icon="carbon:group" class="page-title-icon" />
          <h1 class="page-title">User Management</h1>
        </div>
        <p class="page-subtitle">
          Register, manage and assign users to organizations, workspaces and
          tenants.
        </p>
      </div>
      <NButton type="primary" @click="openCreateModal">
        <template #icon><Icon icon="carbon:user-follow" /></template>
        Register User
      </NButton>
    </div>

    <!-- Stat Panels -->
    <div class="stats-row">
      <StatPanel
        size="small"
        icon="carbon:group"
        color="primary"
        value-color="#6366f1"
        title="Total Users"
        :value="total"
        :show-compact="false"
      />
      <StatPanel
        size="small"
        icon="carbon:checkmark-filled"
        color="success"
        value-color="#22c55e"
        title="Active"
        :value="activeCount"
        :show-compact="false"
      />
      <StatPanel
        size="small"
        icon="carbon:email"
        color="info"
        value-color="#0ea5e9"
        title="Verified"
        :value="verifiedCount"
        :show-compact="false"
      />
      <StatPanel
        size="small"
        icon="carbon:warning-alt"
        color="warning"
        value-color="#f59e0b"
        title="Unverified"
        :value="unverifiedCount"
        :show-compact="false"
      />
    </div>

    <!-- Filters -->
    <div class="section">
      <div class="section-header filters-header">
        <NInput
          v-model:value="searchQuery"
          placeholder="Search by name or email..."
          clearable
          class="search-input"
        >
          <template #prefix><Icon icon="carbon:search" /></template>
        </NInput>
        <NSelect
          v-model:value="filterOrgId"
          :options="orgOptions"
          placeholder="Organization"
          clearable
          class="filter-select"
        />
        <NSelect
          v-model:value="filterWorkspaceId"
          :options="workspaceFilterOptions"
          placeholder="Workspace"
          clearable
          :disabled="!filterOrgId || filterOrgId === 'all'"
          class="filter-select"
        />
        <NSelect
          v-model:value="filterTenantId"
          :options="tenantFilterOptions"
          placeholder="Tenant"
          clearable
          :disabled="!filterWorkspaceId || filterWorkspaceId === 'all'"
          class="filter-select"
        />
        <NSelect
          v-model:value="filterStatus"
          :options="statusOptions"
          placeholder="Status"
          clearable
          class="status-select"
        />
        <NButton quaternary @click="fetchAll">
          <template #icon><Icon icon="carbon:refresh" /></template>
        </NButton>
      </div>
    </div>

    <!-- Table -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:user-multiple" class="section-icon" />
          <span>Registered Users</span>
          <NTag :bordered="false" size="small" type="info">
            <strong>{{ total }}</strong>&nbsp;users
          </NTag>
        </div>
        <div class="table-actions">
          <NTag v-if="activeCount > 0" :bordered="false" size="small" type="success">
            {{ activeCount }} active
          </NTag>
        </div>
      </div>
      <div class="table-content">
        <NDataTable
          :columns="columns"
          :data="users"
          :loading="loading"
          size="small"
          :row-key="(row: User) => row.id"
          remote
          :pagination="{
            page,
            pageSize: 10,
            itemCount: total,
            pageSizes: [10, 20, 50, 100],
            showSizePicker: true,
            onChange: handlePageChange,
            onUpdatePageSize: handlePageSizeChange,
          }"
          :scroll-x="900"
        />
      </div>
    </div>

    <!-- ==================== MODAL ==================== -->
    <NModal
      v-model:show="showModal"
      :title="modalTitle"
      preset="card"
      :style="{
        width: modalMode === 'create' || modalMode === 'edit' ? '760px' : '520px',
        maxHeight: '88vh',
      }"
      @close="closeModal"
    >
      <!-- CREATE USER: vertical tabs -->
      <template v-if="modalMode === 'create'">
        <NForm
          ref="formRef"
          :model="formModel"
          :rules="createRules"
          label-placement="top"
          require-mark-placement="right-hanging"
        >
          <div class="um-modal-content">
            <div class="um-tabs">
              <div
                v-for="tab in createFormTabs"
                :key="tab.value"
                class="um-tab-item"
                :class="{ active: createActiveTab === tab.value }"
                @click="createActiveTab = tab.value"
              >
                <Icon :icon="tab.icon" class="tab-icon" />
                <span class="tab-label">{{ tab.label }}</span>
              </div>
              <div class="tab-hint">
                <p>{{ createTabDescriptions[createActiveTab] }}</p>
              </div>
            </div>
            <NScrollbar class="um-form">
              <div class="form-box">
                <!-- Personal Info -->
                <div v-show="createActiveTab === 'personal'">
                  <div class="form-row">
                    <NFormItem label="First Name" path="firstName">
                      <NInput
                        v-model:value="formModel.firstName"
                        placeholder="John"
                      />
                    </NFormItem>
                    <NFormItem label="Last Name" path="lastName">
                      <NInput
                        v-model:value="formModel.lastName"
                        placeholder="Doe"
                      />
                    </NFormItem>
                  </div>
                </div>

                <!-- Account Security -->
                <div v-show="createActiveTab === 'security'">
                  <NFormItem label="Email" path="email">
                    <NInput
                      v-model:value="formModel.email"
                      placeholder="john.doe@example.com"
                    />
                  </NFormItem>
                  <NFormItem label="Password" path="password">
                    <NInput
                      v-model:value="formModel.password"
                      type="password"
                      show-password-on="click"
                      placeholder="Min 8 chars, mixed case + number + symbol"
                    >
                      <template #suffix>
                        <NTooltip trigger="hover">
                          <template #trigger>
                            <Icon
                              icon="carbon:generate"
                              class="generate-icon"
                              @click.stop="generatePassword"
                            />
                          </template>
                          Generate strong password
                        </NTooltip>
                      </template>
                    </NInput>
                  </NFormItem>
                  <div v-if="formModel.password" class="password-strength">
                    <div class="strength-bar">
                      <div
                        class="strength-fill"
                        :style="{
                          width: `${(passwordStrength.score / 6) * 100}%`,
                          background: passwordStrength.color,
                        }"
                      />
                    </div>
                    <span
                      class="strength-label"
                      :style="{ color: passwordStrength.color }"
                    >
                      {{ passwordStrength.label }}
                    </span>
                  </div>
                  <NDivider style="margin: 12px 0 8px" />
                  <NFormItem label="Verification">
                    <div class="toggle-row">
                      <NSwitch
                        v-model:value="formModel.sendEmailVerification"
                      />
                      <div class="toggle-text">
                        <span class="toggle-title">Send Verification Email</span>
                        <span class="toggle-desc">{{
                          formModel.sendEmailVerification
                            ? "A verification email will be sent on account creation."
                            : "Account is created without email verification."
                        }}</span>
                      </div>
                    </div>
                  </NFormItem>
                  <NFormItem label="Password Policy">
                    <div class="toggle-row">
                      <NSwitch v-model:value="formModel.forcePasswordChange" />
                      <div class="toggle-text">
                        <span class="toggle-title">Force Password Reset on First Login</span>
                        <span class="toggle-desc">{{
                          formModel.forcePasswordChange
                            ? "User must set a new password before accessing the platform."
                            : "User can log in with the provided password."
                        }}</span>
                      </div>
                    </div>
                  </NFormItem>
                </div>

                <!-- Organization -->
                <div v-show="createActiveTab === 'organization'">
                  <NFormItem label="Organization">
                    <NSelect
                      v-model:value="formModel.organizationId"
                      :options="modalOrgOptions"
                      placeholder="Select organization"
                      clearable
                      @update:value="loadModalWorkspaces"
                    />
                  </NFormItem>
                  <NFormItem label="Workspace">
                    <NSelect
                      v-model:value="formModel.workspaceId"
                      :options="modalWorkspaceOptions"
                      placeholder="Select workspace"
                      clearable
                      :loading="loadingModalWorkspaces"
                      :disabled="!formModel.organizationId"
                      @update:value="loadModalTenants"
                    />
                  </NFormItem>
                  <NFormItem label="Tenant">
                    <NSelect
                      v-model:value="formModel.tenantId"
                      :options="modalTenantOptions"
                      placeholder="Select tenant"
                      clearable
                      :loading="loadingModalTenants"
                      :disabled="!formModel.workspaceId"
                    />
                  </NFormItem>
                  <NFormItem label="Role">
                    <NSelect
                      v-model:value="formModel.roleId"
                      :options="roleOptions"
                      placeholder="Viewer (default)"
                      clearable
                    />
                  </NFormItem>
                </div>
              </div>
            </NScrollbar>
          </div>
        </NForm>
      </template>

      <!-- EDIT USER: vertical tabs -->
      <template v-else-if="modalMode === 'edit'">
        <NForm
          ref="formRef"
          :model="formModel"
          :rules="editRules"
          label-placement="top"
        >
          <div class="um-modal-content">
            <div class="um-tabs">
              <div
                v-for="tab in editFormTabs"
                :key="tab.value"
                class="um-tab-item"
                :class="{ active: editActiveTab === tab.value }"
                @click="editActiveTab = tab.value"
              >
                <Icon :icon="tab.icon" class="tab-icon" />
                <span class="tab-label">{{ tab.label }}</span>
              </div>
              <div class="tab-hint">
                <p>{{ editTabDescriptions[editActiveTab] }}</p>
              </div>
            </div>
            <NScrollbar class="um-form">
              <div class="form-box">
                <!-- Profile -->
                <div v-show="editActiveTab === 'profile'">
                  <NFormItem label="Email">
                    <NInput :value="formModel.email" disabled />
                  </NFormItem>
                  <div class="form-row">
                    <NFormItem label="First Name" path="firstName">
                      <NInput v-model:value="formModel.firstName" />
                    </NFormItem>
                    <NFormItem label="Last Name" path="lastName">
                      <NInput v-model:value="formModel.lastName" />
                    </NFormItem>
                  </div>
                  <NFormItem label="Avatar URL">
                    <NInput
                      v-model:value="formModel.avatar"
                      placeholder="https://..."
                    />
                  </NFormItem>
                </div>

                <!-- Preferences -->
                <div v-show="editActiveTab === 'preferences'">
                  <div class="form-row">
                    <NFormItem label="Timezone">
                      <NSelect
                        v-model:value="formModel.timezone"
                        :options="timezoneOptions"
                      />
                    </NFormItem>
                    <NFormItem label="Locale">
                      <NSelect
                        v-model:value="formModel.locale"
                        :options="localeOptions"
                      />
                    </NFormItem>
                  </div>
                </div>

                <!-- Roles -->
                <div v-show="editActiveTab === 'roles'">
                  <n-spin :show="editLoadingRoles" size="small">
                    <!-- Assigned Roles -->
                    <div class="edit-roles-section">
                      <div class="edit-roles-section-header">
                        <Icon icon="carbon:checkmark-filled" style="color: #22c55e;" />
                        <span>Assigned Roles</span>
                        <NTag :bordered="false" size="small" type="success" round>{{ editUserRoles.length }}</NTag>
                      </div>
                      <div v-if="editUserRoles.length > 0" class="edit-roles-list">
                        <div v-for="role in editUserRoles" :key="role.id" class="edit-role-card assigned">
                          <div class="edit-role-icon" :style="{ background: role.isSystem ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }">
                            <Icon :icon="role.isSystem ? 'carbon:locked' : 'carbon:user-role'" />
                          </div>
                          <div class="edit-role-info">
                            <div class="edit-role-name">
                              {{ role.name }}
                              <NTag v-if="role.isSystem" size="small" type="info" :bordered="false">System</NTag>
                            </div>
                            <div v-if="role.description" class="edit-role-desc">{{ role.description }}</div>
                          </div>
                          <NButton size="small" type="error" ghost @click="editRevokeRole(role.id)">
                            <template #icon><Icon icon="carbon:subtract" /></template>
                            Revoke
                          </NButton>
                        </div>
                      </div>
                      <div v-else class="edit-roles-empty">No roles assigned</div>
                    </div>

                    <!-- Available Roles -->
                    <div class="edit-roles-section" style="margin-top: 16px;">
                      <div class="edit-roles-section-header">
                        <Icon icon="carbon:add-filled" style="color: #3b82f6;" />
                        <span>Available Roles</span>
                        <NTag :bordered="false" size="small" type="info" round>{{ roles.filter((r) => !editUserRoles.some((ur) => ur.id === r.id)).length }}</NTag>
                      </div>
                      <div class="edit-roles-list">
                        <div
                          v-for="role in roles.filter((r) => !editUserRoles.some((ur) => ur.id === r.id))"
                          :key="role.id"
                          class="edit-role-card available"
                        >
                          <div class="edit-role-icon" style="background: linear-gradient(135deg, #94a3b8, #64748b);">
                            <Icon icon="carbon:locked" />
                          </div>
                          <div class="edit-role-info">
                            <div class="edit-role-name">
                              {{ role.name }}
                              <NTag v-if="role.isSystem" size="small" type="info" :bordered="false">System</NTag>
                            </div>
                            <div v-if="role.description" class="edit-role-desc">{{ role.description }}</div>
                          </div>
                          <NButton size="small" type="primary" @click="editAssignRole(role.id)">
                            <template #icon><Icon icon="carbon:add" /></template>
                            Assign
                          </NButton>
                        </div>
                      </div>
                    </div>
                  </n-spin>
                </div>
              </div>
            </NScrollbar>
          </div>
        </NForm>
      </template>

      <!-- RESET PASSWORD FORM -->
      <template v-else-if="modalMode === 'resetPassword'">
        <NForm
          ref="formRef"
          :model="resetPasswordForm"
          :rules="resetPasswordRules"
          label-placement="top"
        >
          <NAlert type="warning" class="mb-4" :show-icon="true">
            You are resetting the password for
            <strong>{{ selectedUser?.email }}</strong>. The user will be required to change their password on next login.
          </NAlert>
          <NFormItem label="New Password" path="password">
            <NInput
              v-model:value="resetPasswordForm.password"
              type="password"
              show-password-on="click"
            />
          </NFormItem>
          <NFormItem label="Confirm Password" path="confirm">
            <NInput
              v-model:value="resetPasswordForm.confirm"
              type="password"
              show-password-on="click"
            />
          </NFormItem>
        </NForm>
      </template>

      <!-- USER DETAIL: moved to drawer below -->

      <!-- MODAL FOOTER -->
      <template #footer>
        <div class="tfo-modal-footer">
          <template v-if="modalMode === 'create'">
            <NButton @click="closeModal">Cancel</NButton>
            <NButton
              type="primary"
              :loading="modalLoading"
              @click="submitCreate"
            >
              <template #icon><Icon icon="carbon:user-follow" /></template>
              Create User
            </NButton>
          </template>
          <template v-else-if="modalMode === 'edit'">
            <NButton @click="closeModal">Cancel</NButton>
            <NButton type="primary" :loading="modalLoading" @click="submitEdit">
              Save Changes
            </NButton>
          </template>
          <template v-else-if="modalMode === 'resetPassword'">
            <NButton @click="closeModal">Cancel</NButton>
            <NButton
              type="primary"
              :loading="modalLoading"
              @click="submitResetPassword"
            >
              Reset Password
            </NButton>
          </template>
          <!-- detail footer moved to drawer -->
        </div>
      </template>
    </NModal>

    <!-- Permissions Modal -->
    <PermissionsModal
      v-model:show="showPermissionsModal"
      :role="permissionsModalRole"
      :permissions="permissionsModalRolePerms"
      :all-permissions="allPermissions"
      :is-loading="isLoadingPermissions"
      :role-users="permissionsModalRoleUsers"
    />
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/tfo-table-styles.scss";

// ─── Edit Roles Tab ─────────────────────────────────────────────────────────
.edit-roles-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);

  :deep(svg) { font-size: 16px; }
}

.edit-roles-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-role-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  transition: all 0.2s;

  &.assigned {
    background: rgba(34, 197, 94, 0.04);
    border-color: rgba(34, 197, 94, 0.3);
  }

  &.available {
    background: var(--n-card-color);
  }

  &:hover {
    border-color: var(--primary-color);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }
}

.edit-role-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.edit-role-info {
  flex: 1;
  min-width: 0;
}

.edit-role-name {
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.edit-role-desc {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-roles-empty {
  text-align: center;
  padding: 24px 0;
  color: var(--n-text-color-3);
  font-size: 0.8125rem;
}

.iam-users-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.page-title-icon {
  font-size: 22px;
  color: var(--n-text-color-3);
  flex-shrink: 0;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--n-text-color);
}

.page-subtitle {
  font-size: 0.875rem;
  margin: 0;
  color: var(--n-text-color-3);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.filters-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
}

.search-input {
  flex: 1;
  min-width: 160px;
}

.filter-select {
  width: 160px;
}

.status-select {
  width: 130px;
}

// ── Channel-style Modal ───────────────────────────────────────────────────────
.um-modal-content {
  display: flex;
  gap: 16px;
  max-height: calc(80vh - 120px);
  overflow: hidden;
}

.um-tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  max-width: 200px;
  border-right: 1px solid var(--n-border-color);
  padding-right: 16px;
}

.um-tab-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--n-text-color-3);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    color: var(--n-text-color);
  }

  &.active {
    background: rgba(99, 102, 241, 0.15);
    color: var(--n-primary-color);

    .tab-icon {
      color: var(--n-primary-color);
    }
  }

  .tab-icon {
    font-size: 20px;
    flex-shrink: 0;
    transition: color 0.2s ease;
  }

  .tab-label {
    white-space: nowrap;
  }
}

.tab-hint {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color);

  p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--n-text-color-3);
    line-height: 1.5;
  }
}

.um-form {
  flex: 1;
  min-width: 0;

  .form-box {
    background: var(--n-action-color);
    border: 1px solid var(--n-border-color);
    border-radius: 8px;
    padding: 16px;
  }
}

.form-row {
  display: flex;
  gap: 12px;

  > :deep(.n-form-item) {
    flex: 1;
    min-width: 0;
  }
}

.toggle-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  .n-switch {
    margin-top: 2px;
    flex-shrink: 0;
  }
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--n-text-color);
}

.toggle-desc {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  line-height: 1.4;
}

.generate-icon {
  font-size: 16px;
  cursor: pointer;
  color: var(--n-text-color-3);
  transition: color 0.2s;

  &:hover {
    color: var(--n-primary-color);
  }
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: -8px;
  margin-bottom: 8px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--n-border-color);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition:
    width 0.3s ease,
    background 0.3s ease;
}

.strength-label {
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 44px;
  text-align: right;
}

.tfo-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}


</style>
