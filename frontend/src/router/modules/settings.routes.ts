import type { RouteRecordRaw } from "vue-router";

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: "settings",
    name: "Settings",
    component: () => import("@/views/settings/index.vue"),
    meta: { title: "Setup", icon: "i-carbon-settings" },
  },
  {
    path: "settings/api-keys",
    name: "ApiKeys",
    component: () => import("@/views/settings/api-keys/index.vue"),
    meta: {
      title: "API Keys",
      icon: "carbon:password",
      requiredPermissions: ["api-keys:read"],
    },
  },
  {
    path: "settings/notification-channels",
    name: "NotificationChannels",
    component: () => import("@/views/settings/notification-channels/index.vue"),
    meta: { title: "Notification Channels", icon: "carbon:notification" },
  },
  {
    path: "settings/notifications",
    name: "Notifications",
    component: () => import("@/views/settings/notifications/index.vue"),
    meta: { title: "Notifications", icon: "carbon:notification-new" },
  },
  {
    path: "settings/ai-assistant",
    name: "AIAssistant",
    component: () => import("@/views/settings/llm/index.vue"),
    meta: { title: "AI Assistant", icon: "carbon:machine-learning-model" },
  },
  {
    path: "settings/data-masking",
    name: "DataMasking",
    component: () => import("@/views/settings/data-masking/index.vue"),
    meta: {
      title: "PII Data Masking",
      icon: "carbon:locked",
      requiredPermissions: ["data-masking:read"],
    },
  },
  {
    path: "settings/retention",
    name: "RetentionPolicies",
    component: () => import("@/views/settings/retention/index.vue"),
    meta: {
      title: "Retention Policies",
      icon: "carbon:rule",
      requiredPermissions: ["retention:read"],
    },
  },
  {
    path: "settings/sso",
    name: "SSOConfig",
    component: () => import("@/views/settings/index.vue"),
    meta: { title: "SSO Configuration", icon: "carbon:connect" },
  },
];
