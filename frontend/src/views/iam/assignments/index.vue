<script setup lang="ts">
import { ref, onMounted, computed, h } from "vue";
import { Icon } from "@iconify/vue";
import { useMessage, useDialog, NTag } from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { usersApi } from "@/api/users";
import { rolesApi } from "@/api/roles";
import type { User, Role } from "@/types";
import { StatPanel } from "@/components/charts";
import { usePagination } from "@/composables/usePagination";
import {
  UserActionsDropdown,
  RoleManagementModal,
  UserDetailsModal,
  UserEditModal,
} from "./components";

const message = useMessage();
const dialog = useDialog();

const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const isLoading = ref(false);
const searchQuery = ref("");
const filterStatus = ref<"all" | "active" | "inactive">("all");

// Role Management Modal
const showRoleModal = ref(false);
const selectedUser = ref<User | null>(null);

// User Details Modal
const showDetailsModal = ref(false);
const selectedDetailsUser = ref<User | null>(null);

// User Edit Modal
const showEditModal = ref(false);
const selectedEditUser = ref<User | null>(null);

// Pagination
const { currentPage, pageSize } = usePagination(10);

// Stats
const totalUsers = computed(() => users.value.length);
const activeUsers = computed(
  () => users.value.filter((u) => u.isActive).length,
);
const totalRoles = computed(() => roles.value.length);
const avgRolesPerUser = computed(() => {
  if (users.value.length === 0) return 0;
  return 3;
});

// Filtered users
const filteredUsers = computed(() => {
  let result = users.value;

  // Filter by status
  if (filterStatus.value !== "all") {
    result = result.filter((u) =>
      filterStatus.value === "active" ? u.isActive : !u.isActive,
    );
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        u.firstName?.toLowerCase().includes(query) ||
        u.lastName?.toLowerCase().includes(query),
    );
  }

  return result;
});

const paginationConfig = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100, 200, 500],
  onChange: (page: number) => {
    currentPage.value = page;
  },
  onUpdatePageSize: (newPageSize: number) => {
    pageSize.value = newPageSize;
    currentPage.value = 1;
  },
  prefix: ({ itemCount }: { itemCount: number | undefined }) =>
    `${itemCount ?? 0} Items`,
}));

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

// Action handlers
function handleManageRoles(user: User) {
  selectedUser.value = user;
  showRoleModal.value = true;
}

function handleViewDetails(user: User) {
  selectedDetailsUser.value = user;
  showDetailsModal.value = true;
}

function handleEditUser(user: User) {
  selectedEditUser.value = user;
  showEditModal.value = true;
}

function handleEditSuccess() {
  loadData();
}

function handleDeleteUser(user: User) {
  dialog.warning({
    title: "Delete User",
    content: `Are you sure you want to delete "${user.email}"?`,
    positiveText: "Delete",
    negativeText: "Cancel",
    onPositiveClick: async () => {
      try {
        await usersApi.delete(user.id);
        message.success("User deleted successfully");
        await loadData();
      } catch (error) {
        console.error("Failed to delete user:", error);
        message.error("Failed to delete user");
      }
    },
  });
}

// Table columns
const columns = computed<DataTableColumns<User>>(() => [
  {
    title: "User",
    key: "user",
    width: 280,
    sorter: (a, b) => {
      const nameA =
        `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.email;
      const nameB =
        `${b.firstName || ""} ${b.lastName || ""}`.trim() || b.email;
      return nameA.localeCompare(nameB);
    },
    render: (row) => {
      const initials = getUserInitials(row);
      const fullName = `${row.firstName || ""} ${row.lastName || ""}`.trim();

      return h("div", { class: "user-cell" }, [
        h(
          "div",
          {
            class: "user-avatar-wrapper",
            style: {
              background: getAvatarGradient(row.email),
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "600",
              fontSize: "14px",
              flexShrink: "0",
            },
          },
          initials,
        ),
        h("div", { class: "user-info" }, [
          h("div", { class: "user-name" }, fullName || row.email),
          h("div", { class: "user-email" }, row.email),
        ]),
      ]);
    },
  },
  {
    title: "First Name",
    key: "firstName",
    width: 140,
    sorter: (a, b) => (a.firstName || "").localeCompare(b.firstName || ""),
    render: (row) =>
      h("span", { style: "font-size: 13px" }, row.firstName || "—"),
  },
  {
    title: "Last Name",
    key: "lastName",
    width: 140,
    sorter: (a, b) => (a.lastName || "").localeCompare(b.lastName || ""),
    render: (row) =>
      h("span", { style: "font-size: 13px" }, row.lastName || "—"),
  },
  {
    title: "Assigned Roles",
    key: "roles",
    width: 200,
    render: (row) => {
      // Mock data - in real app, you'd fetch this
      const mockRoles = ["Admin", "Editor"];

      return h(
        "div",
        { style: "display: flex; gap: 4px; flex-wrap: wrap" },
        mockRoles.map((role) =>
          h(
            NTag,
            {
              size: "small",
              type: "info",
              bordered: false,
              round: true,
            },
            () => role,
          ),
        ),
      );
    },
  },
  {
    title: "Status",
    key: "isActive",
    width: 100,
    align: "center",
    sorter: (a, b) => Number(b.isActive) - Number(a.isActive),
    render: (row) =>
      h(
        NTag,
        {
          type: row.isActive ? "success" : "default",
          size: "small",
          bordered: false,
          round: true,
        },
        () => (row.isActive ? "Active" : "Inactive"),
      ),
  },
  {
    title: "Actions",
    key: "actions",
    width: 80,
    align: "center",
    fixed: "right",
    render: (row) => {
      return h(UserActionsDropdown, {
        user: row,
        onManageRoles: handleManageRoles,
        onViewDetails: handleViewDetails,
        onEdit: handleEditUser,
        onDelete: handleDeleteUser,
      });
    },
  },
]);

async function loadData() {
  isLoading.value = true;
  try {
    const [usersData, rolesData] = await Promise.all([
      usersApi.list({ limit: 100 }),
      rolesApi.list({ includeSystem: true }),
    ]);
    users.value = usersData.data || [];
    roles.value = rolesData.data || [];
  } catch (error) {
    console.error("Failed to load data:", error);
    message.error("Failed to load data");
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="rbac-assignments-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <Icon icon="carbon:user-role" class="title-icon" />
          User Role Assignments
        </h2>
        <p class="page-subtitle">
          Assign and manage roles for users in your organization
        </p>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <StatPanel
        title="Total Users"
        :value="totalUsers"
        icon="carbon:user-multiple"
        color="primary"
        value-color="#3b82f6"
        size="small"
      />
      <StatPanel
        title="Active Users"
        :value="activeUsers"
        icon="carbon:checkmark-filled"
        color="success"
        value-color="#10b981"
        size="small"
      />
      <StatPanel
        title="Total Roles"
        :value="totalRoles"
        icon="carbon:user-role"
        color="purple"
        value-color="#8b5cf6"
        size="small"
      />
      <StatPanel
        title="Avg Roles/User"
        :value="avgRolesPerUser.toFixed(1)"
        icon="carbon:chart-average"
        color="warning"
        value-color="#f59e0b"
        size="small"
        :is-string="true"
      />
    </div>

    <!-- Filters -->
    <n-card class="filters-card">
      <div class="filters-bar">
        <n-input
          v-model:value="searchQuery"
          placeholder="Search users by name or email..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <Icon icon="carbon:search" />
          </template>
        </n-input>

        <n-select
          v-model:value="filterStatus"
          :options="[
            { label: 'All Status', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]"
          style="width: 150px"
        />
      </div>
    </n-card>

    <!-- Data Table Section -->
    <div class="section">
      <!-- Section Header -->
      <div class="section-header">
        <div class="section-title">
          <Icon icon="carbon:user-multiple" class="section-icon" />
          <span>Users</span>
          <n-tag :bordered="false" type="info" size="small" round>
            {{ filteredUsers.length }} users
          </n-tag>
        </div>
      </div>

      <!-- Table Content -->
      <div class="table-content">
        <n-data-table
          class="tfo-datatable"
          :columns="columns"
          :data="filteredUsers"
          :loading="isLoading"
          :scroll-x="1000"
          :pagination="paginationConfig"
          :bordered="false"
          :single-line="false"
          striped
          size="small"
        />
      </div>
    </div>

    <!-- Role Management Modal -->
    <RoleManagementModal
      v-model:show="showRoleModal"
      :user="selectedUser"
      :all-roles="roles"
    />

    <!-- User Details Modal -->
    <UserDetailsModal
      v-model:show="showDetailsModal"
      :user="selectedDetailsUser"
    />

    <!-- User Edit Modal -->
    <UserEditModal
      v-model:show="showEditModal"
      :user="selectedEditUser"
      @success="handleEditSuccess"
    />
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/tfo-variables.scss";
@import "@/styles/tfo-table-styles.scss";

.rbac-assignments-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: var(--n-text-color);
  }

  .title-icon {
    font-size: 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: var(--n-text-color-3);
    margin: 0;
  }
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filters-card {
  .filters-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    .search-input {
      flex: 1;
      min-width: 300px;
    }
  }
}

:deep(.user-cell) {
  display: flex;
  align-items: center;
  gap: 12px;
}

:deep(.user-info) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .user-name {
    font-weight: 500;
    font-size: 14px;
  }

  .user-email {
    font-size: 12px;
    color: var(--n-text-color-3);
  }
}

@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    .search-input {
      min-width: 100%;
    }
  }
}
</style>
