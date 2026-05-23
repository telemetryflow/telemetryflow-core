import type { RouteRecordRaw } from "vue-router";

import { publicRoutes } from "./modules/public.routes";
import { authRoutes } from "./modules/auth.routes";
import { alertsRoutes } from "./modules/alerts.routes";
import { settingsRoutes } from "./modules/settings.routes";
import { accountRoutes } from "./modules/account.routes";
import { iamRoutes } from "./modules/iam.routes";
import { tenancyRoutes } from "./modules/tenancy.routes";
import { auditRoutes } from "./modules/audit.routes";
import { errorRoutes } from "./modules/error.routes";

export const routes: RouteRecordRaw[] = [
  ...publicRoutes,
  ...authRoutes,
  {
    path: "/",
    name: "Layout",
    component: () => import("@/layouts/MainLayout.vue"),
    redirect: "/home",
    meta: { requiresAuth: true },
    children: [
      {
        path: "home",
        name: "Home",
        component: () => import("@/views/home/index.vue"),
        meta: { title: "Overview", icon: "simple-icons:opentelemetry" },
      },
      ...alertsRoutes,
      ...iamRoutes,
      ...tenancyRoutes,
      ...auditRoutes,
      ...settingsRoutes,
      ...accountRoutes,
    ],
  },
  ...errorRoutes,
];

export default routes;
