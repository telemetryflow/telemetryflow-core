import type { RouteRecordRaw } from "vue-router";

export const alertsRoutes: RouteRecordRaw[] = [
  {
    path: "alerts",
    name: "Alerts",
    component: () => import("@/views/alerts/index.vue"),
    meta: { title: "Alerts", icon: "i-carbon-warning-alt" },
  },
  {
    path: "alerts/rules",
    name: "AlertRules",
    component: () => import("@/views/alerts/rules.vue"),
    meta: { title: "Alert Rules", hidden: true },
  },
];
