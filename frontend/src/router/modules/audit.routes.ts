import type { RouteRecordRaw } from "vue-router";

export const auditRoutes: RouteRecordRaw[] = [
  {
    path: "audit",
    name: "AuditLogs",
    component: () => import("@/views/audit/index.vue"),
    meta: {
      title: "Audit Logs",
      icon: "carbon:document-tasks",
      requiredPermissions: ["platform:audit"],
    },
  },
];
