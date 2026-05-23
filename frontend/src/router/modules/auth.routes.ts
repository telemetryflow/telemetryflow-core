import type { RouteRecordRaw } from "vue-router";

export const authRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/login.vue"),
    meta: { title: "Login", requiresAuth: false },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/auth/register.vue"),
    meta: { title: "Create Account", requiresAuth: false },
  },
  {
    path: "/verify-email",
    name: "VerifyEmail",
    component: () => import("@/views/auth/verify-email.vue"),
    meta: { title: "Verify Email", requiresAuth: false },
  },
  {
    path: "/verify-email/pending",
    name: "VerifyEmailPending",
    component: () => import("@/views/auth/verify-email-pending.vue"),
    meta: { title: "Verify Your Email", requiresAuth: false },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: () => import("@/views/auth/forgot-password.vue"),
    meta: { title: "Forgot Password", requiresAuth: false },
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: () => import("@/views/auth/reset-password.vue"),
    meta: { title: "Reset Password", requiresAuth: false },
  },
  {
    path: "/mfa-verify",
    name: "MFAVerify",
    component: () => import("@/views/auth/mfa-verify.vue"),
    meta: { title: "Two-Factor Authentication", requiresAuth: false },
  },
  {
    path: "/mfa-setup",
    name: "MFASetup",
    component: () => import("@/views/auth/mfa-setup.vue"),
    meta: { title: "Set Up Two-Factor Auth", requiresAuth: true },
  },
  {
    path: "/change-password",
    name: "ChangePassword",
    component: () => import("@/views/auth/change-password.vue"),
    meta: { title: "Change Password", requiresAuth: true },
  },
  {
    path: "/auth/sso/callback",
    name: "SSOCallback",
    component: () => import("@/views/auth/sso-callback.vue"),
    meta: { title: "SSO Login", requiresAuth: false },
  },
  {
    path: "/auth/sso/error",
    name: "SSOError",
    component: () => import("@/views/auth/sso-callback.vue"),
    meta: { title: "SSO Error", requiresAuth: false },
  },
  {
    path: "/profile/complete",
    name: "ProfileComplete",
    component: () => import("@/views/auth/profile-complete.vue"),
    meta: { title: "Complete Your Profile", requiresAuth: true },
  },
];
