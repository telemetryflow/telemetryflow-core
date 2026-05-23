/**
 * Permission directives for Vue
 *
 * Usage:
 * v-can="'user:read'"              - Show if user has permission
 * v-can="['user:read', 'user:write']" - Show if user has any of these permissions
 * v-can.all="['user:read', 'user:write']" - Show if user has all permissions
 * v-can.not="'user:delete'"        - Show if user does NOT have permission
 *
 * v-role="'admin'"                 - Show if user has role
 * v-role="['admin', 'super_admin']" - Show if user has any of these roles
 * v-role.all="['admin', 'manager']" - Show if user has all roles
 * v-role.not="'guest'"             - Show if user does NOT have role
 */

import type { Directive, DirectiveBinding } from "vue";
import { useAuthStore } from "@/store";

// Store original display value
const originalDisplay = new WeakMap<Element, string>();

/**
 * v-can directive - Check permissions
 */
export const vCan: Directive<Element> = {
  mounted(el: Element, binding: DirectiveBinding) {
    checkPermission(el, binding);
  },
  updated(el: Element, binding: DirectiveBinding) {
    checkPermission(el, binding);
  },
};

function checkPermission(el: Element, binding: DirectiveBinding) {
  const authStore = useAuthStore();
  const { value, modifiers } = binding;

  if (!value) {
    console.warn("v-can directive requires a permission value");
    return;
  }

  // Store original display
  if (!originalDisplay.has(el)) {
    originalDisplay.set(el, (el as HTMLElement).style.display);
  }

  const permissions = Array.isArray(value) ? value : [value];
  let hasPermission = false;

  if (modifiers.all) {
    // User must have all permissions
    hasPermission = authStore.hasAllPermissions(permissions);
  } else {
    // User must have any permission
    hasPermission = authStore.hasAnyPermission(permissions);
  }

  // Invert if 'not' modifier is present
  if (modifiers.not) {
    hasPermission = !hasPermission;
  }

  // Show or hide element
  const htmlEl = el as HTMLElement;
  if (hasPermission) {
    htmlEl.style.display = originalDisplay.get(el) || "";
  } else {
    htmlEl.style.display = "none";
  }
}

/**
 * v-role directive - Check roles
 */
export const vRole: Directive<Element> = {
  mounted(el: Element, binding: DirectiveBinding) {
    checkRole(el, binding);
  },
  updated(el: Element, binding: DirectiveBinding) {
    checkRole(el, binding);
  },
};

function checkRole(el: Element, binding: DirectiveBinding) {
  const authStore = useAuthStore();
  const { value, modifiers } = binding;

  if (!value) {
    console.warn("v-role directive requires a role value");
    return;
  }

  // Store original display
  if (!originalDisplay.has(el)) {
    originalDisplay.set(el, (el as HTMLElement).style.display);
  }

  const roles = Array.isArray(value) ? value : [value];
  const userRoles = authStore.userRoles;

  let hasRole = false;

  if (modifiers.all) {
    // User must have all roles
    hasRole = roles.every((role) => userRoles.includes(role));
  } else {
    // User must have any role
    hasRole = roles.some((role) => userRoles.includes(role));
  }

  // Invert if 'not' modifier is present
  if (modifiers.not) {
    hasRole = !hasRole;
  }

  // Show or hide element
  const htmlEl = el as HTMLElement;
  if (hasRole) {
    htmlEl.style.display = originalDisplay.get(el) || "";
  } else {
    htmlEl.style.display = "none";
  }
}

/**
 * Register permission directives globally
 */
export function registerPermissionDirectives(app: {
  directive: (name: string, directive: Directive) => void;
}) {
  app.directive("can", vCan);
  app.directive("role", vRole);
}

export default {
  vCan,
  vRole,
  registerPermissionDirectives,
};
