import type { RouteRecordRaw } from "vue-router";

export const errorRoutes: RouteRecordRaw[] = [
  {
    path: "/error/401",
    name: "Unauthorized",
    component: () => import("@/views/error/401.vue"),
    meta: { title: "Unauthorized", requiresAuth: false },
  },
  {
    path: "/error/403",
    name: "Forbidden",
    component: () => import("@/views/error/403.vue"),
    meta: { title: "Forbidden", requiresAuth: false },
  },
  {
    path: "/error/500",
    name: "ServerError",
    component: () => import("@/views/error/500.vue"),
    meta: { title: "Server Error", requiresAuth: false },
  },
  {
    path: "/error/502",
    name: "BadGateway",
    component: () => import("@/views/error/502.vue"),
    meta: { title: "Bad Gateway", requiresAuth: false },
  },
  {
    path: "/error/503",
    name: "ServiceUnavailable",
    component: () => import("@/views/error/503.vue"),
    meta: { title: "Service Unavailable", requiresAuth: false },
  },
  {
    path: "/error/504",
    name: "GatewayTimeout",
    component: () => import("@/views/error/504.vue"),
    meta: { title: "Gateway Timeout", requiresAuth: false },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/error/404.vue"),
    meta: { title: "Not Found", requiresAuth: false },
  },
];
