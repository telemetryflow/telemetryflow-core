<script setup lang="ts">
import { computed, h, ref, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import type { MenuOption } from "naive-ui";
import { useAppStore, useAuthStore } from "@/store";
import { config } from "@/config";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

const activeKey = computed(() => route.name as string);

const expandedKeys = ref<string[]>([
  "alert",
  "iam",
  "tenancy",
  "system",
  "account",
]);

function renderIcon(icon: string) {
  return () => h(Icon, { icon, width: 20, height: 20 });
}

function renderGroupLabel(label: string) {
  return () =>
    h(
      "span",
      {
        class: "menu-group-label",
        style: {
          textTransform: "uppercase",
          fontWeight: "700",
          letterSpacing: "0.5px",
        },
      },
      label,
    );
}

const homeItem = {
  label: renderGroupLabel("Overview"),
  key: "Home",
  icon: renderIcon("simple-icons:opentelemetry"),
};

const alertItems = [
  { label: "Alerts", key: "Alerts", icon: renderIcon("carbon:warning-alt") },
  { label: "Alert Rules", key: "AlertRules", icon: renderIcon("carbon:rule") },
];

const iamItems = [
  {
    label: "Overview",
    key: "IAMOverview",
    icon: renderIcon("carbon:dashboard"),
  },
  { label: "Users", key: "IAMUsers", icon: renderIcon("carbon:user-multiple") },
  { label: "Roles", key: "IAMRoles", icon: renderIcon("carbon:user-role") },
  {
    label: "Permissions",
    key: "IAMPermissions",
    icon: renderIcon("carbon:password"),
  },
  { type: "divider", key: "divider-iam-1" },
  { label: "Matrix", key: "IAMMatrix", icon: renderIcon("carbon:grid") },
  {
    label: "Assignments",
    key: "IAMAssignments",
    icon: renderIcon("carbon:user-access"),
  },
];

const tenancyItems = [
  {
    label: "Regions",
    key: "TenancyRegions",
    icon: renderIcon("carbon:location"),
  },
  {
    label: "Organizations",
    key: "TenancyOrganizations",
    icon: renderIcon("carbon:enterprise"),
  },
  {
    label: "Workspaces",
    key: "TenancyWorkspaces",
    icon: renderIcon("carbon:workspace"),
  },
  {
    label: "Tenants",
    key: "TenancyTenants",
    icon: renderIcon("carbon:user-multiple"),
  },
];

const systemItems = computed<MenuOption[]>(() => {
  const items: MenuOption[] = [
    { label: "Setup", key: "Settings", icon: renderIcon("carbon:settings") },
    { type: "divider", key: "divider-system-1" },
    {
      label: "Channels",
      key: "NotificationChannels",
      icon: renderIcon("carbon:notification"),
    },
    {
      label: "Notification",
      key: "Notifications",
      icon: renderIcon("carbon:notification-new"),
    },
    {
      label: "AI Assistant",
      key: "AIAssistant",
      icon: renderIcon("carbon:ai-status"),
    },
    { label: "API Keys", key: "ApiKeys", icon: renderIcon("carbon:password") },
    { type: "divider", key: "divider-system-2" },
  ];
  if (authStore.hasPermission("data-masking:read")) {
    items.push({
      label: "PII Masking",
      key: "DataMasking",
      icon: renderIcon("carbon:locked"),
    });
  }
  if (authStore.hasPermission("platform:audit")) {
    items.push({
      label: "Audit Logs",
      key: "AuditLogs",
      icon: renderIcon("carbon:document-security"),
    });
  }
  items.push(
    { type: "divider", key: "divider-system-3" },
    {
      label: "Retention",
      key: "RetentionPolicies",
      icon: renderIcon("carbon:time"),
    },
  );
  return items;
});

const accountItems = [
  {
    label: "My Profile",
    key: "AccountProfile",
    icon: renderIcon("carbon:user-avatar"),
  },
  {
    label: "Security",
    key: "AccountSecurity",
    icon: renderIcon("carbon:password"),
  },
  {
    label: "Sessions",
    key: "AccountSessions",
    icon: renderIcon("carbon:devices"),
  },
  {
    label: "Notification",
    key: "AccountNotifications",
    icon: renderIcon("carbon:notification"),
  },
  {
    label: "Preferences",
    key: "AccountPreferences",
    icon: renderIcon("carbon:settings-adjust"),
  },
];

const menuOptions = computed<MenuOption[]>(() => {
  if (appStore.sidebarCollapsed) {
    return [
      homeItem,
      { type: "divider", key: "d0" },
      ...alertItems,
      { type: "divider", key: "d1" },
      ...iamItems,
      { type: "divider", key: "d2" },
      ...tenancyItems,
      { type: "divider", key: "d3" },
      ...systemItems.value,
      { type: "divider", key: "d4" },
      ...accountItems,
    ];
  }

  return [
    homeItem,
    {
      label: renderGroupLabel("Alert"),
      key: "alert",
      icon: renderIcon("carbon:warning-alt"),
      children: alertItems,
    },
    {
      label: renderGroupLabel("IAM"),
      key: "iam",
      icon: renderIcon("carbon:security"),
      children: iamItems,
    },
    {
      label: renderGroupLabel("Tenancy"),
      key: "tenancy",
      icon: renderIcon("carbon:cloud-services"),
      children: tenancyItems,
    },
    {
      label: renderGroupLabel("System"),
      key: "system",
      icon: renderIcon("carbon:settings-adjust"),
      children: systemItems.value,
    },
    {
      label: renderGroupLabel("Account"),
      key: "account",
      icon: renderIcon("carbon:user-filled"),
      children: accountItems,
    },
  ];
});

function handleSelect(key: string) {
  router.push({ name: key });
}

function toggleSidebar() {
  appStore.toggleSidebar();
}

function styleGroupHeaders() {
  nextTick(() => {
    const labels = document.querySelectorAll(".menu-group-label");
    labels.forEach((label) => {
      let el = label.parentElement;
      while (el && !el.classList.contains("n-menu-item-content")) {
        el = el.parentElement;
      }
      if (el) {
        el.style.setProperty(
          "background-color",
          "rgba(128, 128, 128, 0.09)",
          "important",
        );
        el.style.setProperty("border-radius", "6px");
      }
    });
  });
}

onMounted(() => styleGroupHeaders());
watch(
  () => appStore.sidebarCollapsed,
  () => styleGroupHeaders(),
);
</script>

<template>
  <div class="sidenav">
    <!-- Logo -->
    <div class="logo" :class="{ collapsed: appStore.sidebarCollapsed }">
      <div class="logo-icon">
        <img
          src="@/assets/favicon-dark.svg"
          :alt="config.appTitle"
          width="28"
          height="28"
        />
      </div>
      <span v-if="!appStore.sidebarCollapsed" class="logo-text">{{
        config.appCode
      }}</span>
    </div>

    <!-- Navigation Menu with Scrolling -->
    <div class="menu-container">
      <n-scrollbar>
        <n-menu
          :value="activeKey"
          :options="menuOptions"
          :expanded-keys="expandedKeys"
          :collapsed="appStore.sidebarCollapsed"
          :collapsed-width="64"
          :collapsed-icon-size="20"
          :indent="24"
          @update:value="handleSelect"
          @update:expanded-keys="(keys: string[]) => (expandedKeys = keys)"
        />
      </n-scrollbar>
    </div>

    <!-- Collapse Toggle -->
    <div
      class="collapse-toggle"
      :class="{ collapsed: appStore.sidebarCollapsed }"
      @click="toggleSidebar"
    >
      <div class="toggle-content">
        <Icon
          icon="carbon:side-panel-close"
          class="panel-icon"
          :class="{ rotated: appStore.sidebarCollapsed }"
        />
        <span v-if="!appStore.sidebarCollapsed" class="toggle-text"
          >Hide Panel</span
        >
      </div>
      <Icon
        :icon="
          appStore.sidebarCollapsed
            ? 'carbon:chevron-right'
            : 'carbon:chevron-left'
        "
        class="arrow-icon"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidenav {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.menu-container {
  flex: 1;
  overflow: hidden;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid var(--n-border-color);
  transition: all 0.3s ease;

  &.collapsed {
    justify-content: center;
    padding: 0;
  }
}

.logo-icon {
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:deep(.n-menu-item-group) {
  margin-top: 16px;
}

:deep(.n-menu-item-group-title) {
  padding: 8px 16px 4px !important;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--n-group-text-color);
  opacity: 0.5;
}

:deep(.menu-group-label) {
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}

:deep(.n-menu-item-content-header) {
  font-weight: 600 !important;
}

:deep(.n-menu-divider) {
  border: none !important;
  height: 1px !important;
  margin: 8px 20px !important;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(128, 128, 128, 0.3) 20%,
    rgba(128, 128, 128, 0.3) 80%,
    transparent 100%
  ) !important;
  background-size: 8px 1px !important;
  background-repeat: repeat-x !important;
}

.collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--n-border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--n-text-color-3);

  &:hover {
    background: rgba(128, 128, 128, 0.1);
    color: var(--n-text-color);

    .arrow-icon {
      color: var(--n-primary-color);
    }
  }

  &.collapsed {
    justify-content: center;
    padding: 12px;
  }
}

.toggle-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-icon {
  font-size: 18px;
  flex-shrink: 0;
  transition: transform 0.3s ease;

  &.rotated {
    transform: rotate(180deg);
  }
}

.arrow-icon {
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.toggle-text {
  font-size: 0.8125rem;
  font-weight: 500;
}
</style>
