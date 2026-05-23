import type { RouteRecordRaw } from "vue-router";

export const iamRoutes: RouteRecordRaw[] = [
  {
    path: "iam",
    name: "IAM",
    redirect: "/iam/overview",
    meta: { title: "IAM", icon: "carbon:security" },
  },
  {
    path: "iam/overview",
    name: "IAMOverview",
    component: () => import("@/views/iam/overview/index.vue"),
    meta: { title: "IAM Overview", icon: "carbon:dashboard" },
  },
  {
    path: "iam/users",
    name: "IAMUsers",
    component: () => import("@/views/iam/users/index.vue"),
    meta: { title: "Users", icon: "carbon:user-multiple" },
  },
  {
    path: "iam/users/:id",
    name: "IAMUserDetail",
    component: () => import("@/views/iam/users/detail.vue"),
    meta: { title: "User Detail", hidden: true },
  },
  {
    path: "iam/roles",
    name: "IAMRoles",
    component: () => import("@/views/iam/roles/index.vue"),
    meta: { title: "Roles", icon: "carbon:user-role" },
  },
  {
    path: "iam/permissions",
    name: "IAMPermissions",
    component: () => import("@/views/iam/permissions/index.vue"),
    meta: { title: "Permissions", icon: "carbon:password" },
  },
  {
    path: "iam/matrix",
    name: "IAMMatrix",
    component: () => import("@/views/iam/matrix/index.vue"),
    meta: { title: "Permission Matrix", icon: "carbon:grid" },
  },
  {
    path: "iam/assignments",
    name: "IAMAssignments",
    component: () => import("@/views/iam/assignments/index.vue"),
    meta: { title: "User Assignments", icon: "carbon:user-access" },
  },
];
