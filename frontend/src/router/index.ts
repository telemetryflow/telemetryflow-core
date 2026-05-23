/**
 * Vue Router setup for TelemetryFlow-Viz
 */

import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { config } from '@/config';
import { useAuthStore } from '@/store';

const router = createRouter({
  history: createWebHistory(config.baseUrl),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0, behavior: 'smooth' };
  },
});

// Handle stale chunk errors after deployment (dynamic import 404s)
router.onError((error, to) => {
  const isChunkError =
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Loading chunk') ||
    error.message.includes('Loading CSS chunk');
  if (isChunkError && to?.fullPath) {
    window.location.href = to.fullPath;
  }
});

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  // Update document title
  const title = to.meta.title as string;
  document.title = title ? `${title} | ${config.appTitle}` : config.appTitle;

  // Auth guard
  const authStore = useAuthStore();

  // Initialize auth from storage on first navigation
  if (!authStore.isInitialized) {
    await authStore.initializeFromStorage();
  }

  // Check if route requires auth (default: true)
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false);

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login with the original destination
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // Already logged in, redirect away from login
  if (to.name === 'Login' && authStore.isAuthenticated) {
    return next({ name: 'Home' });
  }

  // Check permissions if route requires them
  const requiredPermissions = to.meta.requiredPermissions as string[] | undefined;
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = authStore.hasAnyPermission(requiredPermissions);
    if (!hasPermission) {
      return next({ name: 'Forbidden' });
    }
  }

  next();
});

router.afterEach((_to, _from) => {
  // Could add analytics or progress bar completion here
});

export default router;
