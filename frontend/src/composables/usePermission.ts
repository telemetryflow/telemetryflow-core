/**
 * Permission composable for checking user permissions and roles
 */

import { computed } from "vue";
import { useAuthStore } from "@/store";

export function usePermission() {
  const authStore = useAuthStore();

  /**
   * Current user
   */
  const user = computed(() => authStore.currentUser);

  /**
   * User's roles
   */
  const roles = computed(() => authStore.userRoles);

  /**
   * User's permissions
   */
  const permissions = computed(() => authStore.userPermissions);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => authStore.isAuthenticated);

  /**
   * Check if user has a specific role
   */
  function hasRole(role: string): boolean {
    return authStore.hasRole(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  function hasAnyRole(roleList: string[]): boolean {
    return roleList.some((role) => authStore.hasRole(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  function hasAllRoles(roleList: string[]): boolean {
    return roleList.every((role) => authStore.hasRole(role));
  }

  /**
   * Check if user has a specific permission
   */
  function can(permission: string): boolean {
    return authStore.hasPermission(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  function canAny(permissionList: string[]): boolean {
    return authStore.hasAnyPermission(permissionList);
  }

  /**
   * Check if user has all of the specified permissions
   */
  function canAll(permissionList: string[]): boolean {
    return authStore.hasAllPermissions(permissionList);
  }

  /**
   * Check if user can perform action on resource
   * @param resource - Resource name (e.g., 'user', 'role')
   * @param action - Action name (e.g., 'read', 'create', 'update', 'delete')
   */
  function canDo(resource: string, action: string): boolean {
    return authStore.hasPermission(`${resource}:${action}`);
  }

  /**
   * Check if user is super admin
   */
  function isSuperAdmin(): boolean {
    return authStore.hasRole("super_admin") || authStore.hasRole("superadmin");
  }

  /**
   * Check if user is admin (includes super admin)
   */
  function isAdmin(): boolean {
    return (
      isSuperAdmin() ||
      authStore.hasRole("admin") ||
      authStore.hasRole("administrator")
    );
  }

  return {
    // State
    user,
    roles,
    permissions,
    isAuthenticated,
    // Role checks
    hasRole,
    hasAnyRole,
    hasAllRoles,
    // Permission checks
    can,
    canAny,
    canAll,
    canDo,
    // Role shortcuts
    isSuperAdmin,
    isAdmin,
  };
}

export default usePermission;
