import type { RouteRecordRaw } from "vue-router";

export const accountRoutes: RouteRecordRaw[] = [
  {
    path: "account",
    name: "Account",
    redirect: "/account/profile",
    meta: { title: "Account", icon: "carbon:user-profile" },
  },
  {
    path: "account/profile",
    name: "AccountProfile",
    component: () => import("@/views/account/profile.vue"),
    meta: { title: "My Profile", icon: "carbon:user-avatar" },
  },
  {
    path: "account/preferences",
    name: "AccountPreferences",
    component: () => import("@/views/account/preferences.vue"),
    meta: { title: "Preferences", icon: "carbon:settings" },
  },
  {
    path: "account/security",
    name: "AccountSecurity",
    component: () => import("@/views/account/security.vue"),
    meta: { title: "Security", icon: "carbon:security" },
  },
  {
    path: "account/notifications",
    name: "AccountNotifications",
    component: () => import("@/views/account/notifications.vue"),
    meta: { title: "Notifications", icon: "carbon:notification" },
  },
  {
    path: "account/sessions",
    name: "AccountSessions",
    component: () => import("@/views/account/sessions.vue"),
    meta: { title: "Active Sessions", icon: "carbon:devices" },
  },
  {
    path: "account/devices",
    name: "AccountDevices",
    component: () => import("@/views/auth/device-management.vue"),
    meta: { title: "Device Management", icon: "mdi:devices" },
  },
  {
    path: "account/active-sessions",
    name: "AccountActiveSessions",
    component: () => import("@/views/auth/session-management.vue"),
    meta: { title: "Active Sessions", icon: "mdi:monitor-multiple" },
  },
  {
    path: "account/organization",
    name: "AccountOrganization",
    component: () => import("@/views/auth/organization-management.vue"),
    meta: { title: "Organization", icon: "carbon:enterprise" },
  },
];
