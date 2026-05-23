import type { RouteRecordRaw } from "vue-router";

export const tenancyRoutes: RouteRecordRaw[] = [
  {
    path: "tenancy",
    name: "Tenancy",
    redirect: "/tenancy/regions",
    meta: { title: "Multi-Tenancy", icon: "carbon:network-4" },
  },
  {
    path: "tenancy/regions",
    name: "TenancyRegions",
    component: () => import("@/views/tenancy/regions/index.vue"),
    meta: { title: "Regions", icon: "carbon:location" },
  },
  {
    path: "tenancy/organizations",
    name: "TenancyOrganizations",
    component: () => import("@/views/tenancy/organizations/index.vue"),
    meta: { title: "Organizations", icon: "carbon:enterprise" },
  },
  {
    path: "tenancy/workspaces",
    name: "TenancyWorkspaces",
    component: () => import("@/views/tenancy/workspaces/index.vue"),
    meta: { title: "Workspaces", icon: "carbon:workspace" },
  },
  {
    path: "tenancy/tenants",
    name: "TenancyTenants",
    component: () => import("@/views/tenancy/tenants/index.vue"),
    meta: { title: "Tenants", icon: "carbon:group" },
  },
];
