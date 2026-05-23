/**
 * IAM Permission Matrix API client
 * Manages the role-permission matrix for RBAC configuration
 * Uses collectorClient for real HTTP calls with config.useMock branching
 */

import { collectorClient } from "./collector";
import { config } from "@/config";

// ==================== TYPES ====================
// Note: Types are also available in @/types/iam-matrix.ts

export interface PermissionEntry {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage" | "execute" | "assign" | "write" | "chat" | "insights" | "audit";
  category: string;
}

export interface RolePermissionMapping {
  permissionId: string;
  granted: boolean;
  inherited: boolean;
  inheritedFrom?: string;
}

export interface MatrixRole {
  id: string;
  name: string;
  description: string;
  tier: number;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
  permissions: RolePermissionMapping[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionMatrix {
  roles: MatrixRole[];
  permissions: PermissionEntry[];
  categories: string[];
  totalRoles: number;
  totalPermissions: number;
}

export interface UpdateRolePermissionsRequest {
  permissions: Array<{
    permissionId: string;
    granted: boolean;
  }>;
}

export interface UpdateRolePermissionsResponse {
  roleId: string;
  updatedCount: number;
  permissions: RolePermissionMapping[];
  message: string;
}

// ==================== ENDPOINTS ====================

export const IAM_MATRIX_ENDPOINTS = {
  MATRIX: "/api/v2/iam/matrix",
  ROLE: (roleId: string) => `/api/v2/iam/matrix/roles/${roleId}`,
  ROLE_PERMISSIONS: (roleId: string) =>
    `/api/v2/iam/matrix/roles/${roleId}/permissions`,
} as const;

// ==================== MOCK DATA ====================

const MOCK_PERMISSIONS: PermissionEntry[] = [
  // ── IAM: Users (4) ──
  { id: "perm-001", name: "users:create", description: "Create users", resource: "users", action: "create", category: "IAM" },
  { id: "perm-002", name: "users:read", description: "Read users", resource: "users", action: "read", category: "IAM" },
  { id: "perm-003", name: "users:update", description: "Update users", resource: "users", action: "update", category: "IAM" },
  { id: "perm-004", name: "users:delete", description: "Delete users", resource: "users", action: "delete", category: "IAM" },

  // ── IAM: Roles (4) ──
  { id: "perm-005", name: "roles:create", description: "Create roles", resource: "roles", action: "create", category: "IAM" },
  { id: "perm-006", name: "roles:read", description: "Read roles", resource: "roles", action: "read", category: "IAM" },
  { id: "perm-007", name: "roles:update", description: "Update roles", resource: "roles", action: "update", category: "IAM" },
  { id: "perm-008", name: "roles:delete", description: "Delete roles", resource: "roles", action: "delete", category: "IAM" },

  // ── IAM: Permissions (2) ──
  { id: "perm-009", name: "permissions:read", description: "Read permissions", resource: "permissions", action: "read", category: "IAM" },
  { id: "perm-010", name: "permissions:assign", description: "Assign permissions", resource: "permissions", action: "assign", category: "IAM" },

  // ── Tenancy: Organizations (4) ──
  { id: "perm-011", name: "organizations:create", description: "Create organizations", resource: "organizations", action: "create", category: "Tenancy" },
  { id: "perm-012", name: "organizations:read", description: "Read organizations", resource: "organizations", action: "read", category: "Tenancy" },
  { id: "perm-013", name: "organizations:update", description: "Update organizations", resource: "organizations", action: "update", category: "Tenancy" },
  { id: "perm-014", name: "organizations:delete", description: "Delete organizations", resource: "organizations", action: "delete", category: "Tenancy" },

  // ── Tenancy: Workspaces (4) ──
  { id: "perm-015", name: "workspaces:create", description: "Create workspaces", resource: "workspaces", action: "create", category: "Tenancy" },
  { id: "perm-016", name: "workspaces:read", description: "Read workspaces", resource: "workspaces", action: "read", category: "Tenancy" },
  { id: "perm-017", name: "workspaces:update", description: "Update workspaces", resource: "workspaces", action: "update", category: "Tenancy" },
  { id: "perm-018", name: "workspaces:delete", description: "Delete workspaces", resource: "workspaces", action: "delete", category: "Tenancy" },

  // ── Tenancy: Tenants (4) ──
  { id: "perm-019", name: "tenants:create", description: "Create tenants", resource: "tenants", action: "create", category: "Tenancy" },
  { id: "perm-020", name: "tenants:read", description: "Read tenants", resource: "tenants", action: "read", category: "Tenancy" },
  { id: "perm-021", name: "tenants:update", description: "Update tenants", resource: "tenants", action: "update", category: "Tenancy" },
  { id: "perm-022", name: "tenants:delete", description: "Delete tenants", resource: "tenants", action: "delete", category: "Tenancy" },

  // ── Tenancy: Groups (4) ──
  { id: "perm-023", name: "groups:create", description: "Create groups", resource: "groups", action: "create", category: "Tenancy" },
  { id: "perm-024", name: "groups:read", description: "Read groups", resource: "groups", action: "read", category: "Tenancy" },
  { id: "perm-025", name: "groups:update", description: "Update groups", resource: "groups", action: "update", category: "Tenancy" },
  { id: "perm-026", name: "groups:delete", description: "Delete groups", resource: "groups", action: "delete", category: "Tenancy" },

  // ── Tenancy: Regions (4) ──
  { id: "perm-027", name: "regions:create", description: "Create regions", resource: "regions", action: "create", category: "Tenancy" },
  { id: "perm-028", name: "regions:read", description: "Read regions", resource: "regions", action: "read", category: "Tenancy" },
  { id: "perm-029", name: "regions:update", description: "Update regions", resource: "regions", action: "update", category: "Tenancy" },
  { id: "perm-030", name: "regions:delete", description: "Delete regions", resource: "regions", action: "delete", category: "Tenancy" },

  // ── Platform (3) ──
  { id: "perm-031", name: "platform:manage", description: "Manage platform settings", resource: "platform", action: "manage", category: "Platform" },
  { id: "perm-032", name: "platform:audit", description: "View audit logs", resource: "platform", action: "audit", category: "Platform" },
  { id: "perm-032a", name: "audit:read", description: "View audit logs", resource: "audit", action: "read", category: "Platform" },

  // ── Telemetry (3) ──
  { id: "perm-033", name: "telemetry:read", description: "Read telemetry data", resource: "telemetry", action: "read", category: "Telemetry" },
  { id: "perm-034", name: "telemetry:write", description: "Write telemetry data", resource: "telemetry", action: "write", category: "Telemetry" },
  { id: "perm-035", name: "telemetry:manage", description: "Manage telemetry settings", resource: "telemetry", action: "manage", category: "Telemetry" },

  // ── Dashboard (3) ──
  { id: "perm-036", name: "dashboard:read", description: "View dashboards", resource: "dashboard", action: "read", category: "Dashboard" },
  { id: "perm-037", name: "dashboard:write", description: "Create/edit dashboards", resource: "dashboard", action: "write", category: "Dashboard" },
  { id: "perm-038", name: "dashboard:delete", description: "Delete dashboards", resource: "dashboard", action: "delete", category: "Dashboard" },

  // ── Monitoring: Agent (2) ──
  { id: "perm-039", name: "monitoring:agent:read", description: "View monitoring agents", resource: "monitoring:agent", action: "read", category: "Monitoring" },
  { id: "perm-040", name: "monitoring:agent:write", description: "Manage monitoring agents", resource: "monitoring:agent", action: "write", category: "Monitoring" },

  // ── Monitoring: VM (3) ──
  { id: "perm-041", name: "monitoring:vm:read", description: "View virtual machines", resource: "monitoring:vm", action: "read", category: "Monitoring" },
  { id: "perm-042", name: "monitoring:vm:write", description: "Manage virtual machines", resource: "monitoring:vm", action: "write", category: "Monitoring" },
  { id: "perm-043", name: "monitoring:vm:delete", description: "Delete virtual machines", resource: "monitoring:vm", action: "delete", category: "Monitoring" },

  // ── Monitoring: Kubernetes (2) ──
  { id: "perm-044", name: "monitoring:kubernetes:read", description: "View Kubernetes clusters", resource: "monitoring:kubernetes", action: "read", category: "Monitoring" },
  { id: "perm-045", name: "monitoring:kubernetes:write", description: "Manage Kubernetes clusters", resource: "monitoring:kubernetes", action: "write", category: "Monitoring" },

  // ── Monitoring: Uptime (2) ──
  { id: "perm-046", name: "monitoring:uptime:read", description: "View uptime monitors", resource: "monitoring:uptime", action: "read", category: "Monitoring" },
  { id: "perm-047", name: "monitoring:uptime:manage", description: "Manage uptime monitors", resource: "monitoring:uptime", action: "manage", category: "Monitoring" },

  // ── Monitoring: Status Page (2) ──
  { id: "perm-048", name: "monitoring:status-page:read", description: "View status pages", resource: "monitoring:status-page", action: "read", category: "Monitoring" },
  { id: "perm-049", name: "monitoring:status-page:manage", description: "Manage status pages", resource: "monitoring:status-page", action: "manage", category: "Monitoring" },

  // ── Monitoring: Service Map (2) ──
  { id: "perm-050", name: "monitoring:service-map:read", description: "View service map", resource: "monitoring:service-map", action: "read", category: "Monitoring" },
  { id: "perm-051", name: "monitoring:service-map:manage", description: "Manage service map", resource: "monitoring:service-map", action: "manage", category: "Monitoring" },

  // ── Monitoring: Network Map (2) ──
  { id: "perm-052", name: "monitoring:network-map:read", description: "View network map", resource: "monitoring:network-map", action: "read", category: "Monitoring" },
  { id: "perm-053", name: "monitoring:network-map:manage", description: "Manage network map", resource: "monitoring:network-map", action: "manage", category: "Monitoring" },

  // ── Alerts (4) ──
  { id: "perm-054", name: "alert:read", description: "View alerts and alert rules", resource: "alert", action: "read", category: "Alerts" },
  { id: "perm-055", name: "alert:write", description: "Create and update alert rules", resource: "alert", action: "write", category: "Alerts" },
  { id: "perm-056", name: "alert:delete", description: "Delete alert rules", resource: "alert", action: "delete", category: "Alerts" },
  { id: "perm-057", name: "alert:manage", description: "Acknowledge and resolve alerts", resource: "alert", action: "manage", category: "Alerts" },

  // ── Reports (3) ──
  { id: "perm-058", name: "reports:read", description: "View reports and schedules", resource: "reports", action: "read", category: "Reports" },
  { id: "perm-059", name: "reports:write", description: "Create and update reports", resource: "reports", action: "write", category: "Reports" },
  { id: "perm-060", name: "reports:delete", description: "Delete reports and schedules", resource: "reports", action: "delete", category: "Reports" },

  // ── Notifications (3) ──
  { id: "perm-061", name: "notifications:read", description: "View notification channels", resource: "notifications", action: "read", category: "System" },
  { id: "perm-062", name: "notifications:write", description: "Create notification channels", resource: "notifications", action: "write", category: "System" },
  { id: "perm-063", name: "notifications:delete", description: "Delete notification channels", resource: "notifications", action: "delete", category: "System" },

  // ── API Keys (3) ──
  { id: "perm-064", name: "api-keys:read", description: "View API keys", resource: "api-keys", action: "read", category: "System" },
  { id: "perm-065", name: "api-keys:write", description: "Create and rotate API keys", resource: "api-keys", action: "write", category: "System" },
  { id: "perm-066", name: "api-keys:delete", description: "Delete API keys", resource: "api-keys", action: "delete", category: "System" },

  // ── Retention (2) ──
  { id: "perm-067", name: "retention:read", description: "View retention policies", resource: "retention", action: "read", category: "System" },
  { id: "perm-068", name: "retention:manage", description: "Manage retention policies", resource: "retention", action: "manage", category: "System" },

  // ── Subscription (2) ──
  { id: "perm-069", name: "subscription:read", description: "View subscription details", resource: "subscription", action: "read", category: "System" },
  { id: "perm-070", name: "subscription:manage", description: "Manage subscription plans", resource: "subscription", action: "manage", category: "System" },

  // ── AI Assistant (2) ──
  { id: "perm-071", name: "ai-assistant:read", description: "Access AI assistant", resource: "ai-assistant", action: "read", category: "System" },
  { id: "perm-072", name: "ai-assistant:manage", description: "Configure AI assistant settings", resource: "ai-assistant", action: "manage", category: "System" },

  // ── LLM (5) ──
  { id: "perm-073", name: "llm:read", description: "View LLM conversations and providers", resource: "llm", action: "read", category: "LLM" },
  { id: "perm-074", name: "llm:chat", description: "Send messages to LLM chat", resource: "llm", action: "chat", category: "LLM" },
  { id: "perm-075", name: "llm:write", description: "Create and update LLM providers", resource: "llm", action: "write", category: "LLM" },
  { id: "perm-076", name: "llm:delete", description: "Delete LLM providers and conversations", resource: "llm", action: "delete", category: "LLM" },
  { id: "perm-077", name: "llm:insights", description: "Generate AI insights and analysis", resource: "llm", action: "insights", category: "LLM" },

  // ── IAM write aliases (4) — controller-level write shortcuts ──
  { id: "perm-078", name: "users:write", description: "Create and update users", resource: "users", action: "write", category: "IAM" },
  { id: "perm-079", name: "roles:write", description: "Create and update roles", resource: "roles", action: "write", category: "IAM" },
  { id: "perm-080", name: "groups:write", description: "Create and update groups", resource: "groups", action: "write", category: "IAM" },
  { id: "perm-081", name: "permissions:write", description: "Create and update permissions", resource: "permissions", action: "write", category: "IAM" },

  // ── Tenancy singular aliases (12) — used by tenancy controllers ──
  { id: "perm-082", name: "region:read", description: "View regions", resource: "region", action: "read", category: "Tenancy" },
  { id: "perm-083", name: "region:write", description: "Create and update regions", resource: "region", action: "write", category: "Tenancy" },
  { id: "perm-084", name: "region:delete", description: "Delete regions", resource: "region", action: "delete", category: "Tenancy" },
  { id: "perm-085", name: "organization:read", description: "View organizations", resource: "organization", action: "read", category: "Tenancy" },
  { id: "perm-086", name: "organization:write", description: "Create and update organizations", resource: "organization", action: "write", category: "Tenancy" },
  { id: "perm-087", name: "organization:delete", description: "Delete organizations", resource: "organization", action: "delete", category: "Tenancy" },
  { id: "perm-088", name: "workspace:read", description: "View workspaces", resource: "workspace", action: "read", category: "Tenancy" },
  { id: "perm-089", name: "workspace:write", description: "Create and update workspaces", resource: "workspace", action: "write", category: "Tenancy" },
  { id: "perm-090", name: "workspace:delete", description: "Delete workspaces", resource: "workspace", action: "delete", category: "Tenancy" },
  { id: "perm-091", name: "tenant:read", description: "View tenants", resource: "tenant", action: "read", category: "Tenancy" },
  { id: "perm-092", name: "tenant:write", description: "Create and update tenants", resource: "tenant", action: "write", category: "Tenancy" },
  { id: "perm-093", name: "tenant:delete", description: "Delete tenants", resource: "tenant", action: "delete", category: "Tenancy" },

  // ── Monitoring write/delete aliases (8) — inserted by migration 1700000000018 ──
  { id: "perm-094", name: "monitoring:agent:delete", description: "Delete monitoring agents", resource: "monitoring:agent", action: "delete", category: "Monitoring" },
  { id: "perm-095", name: "monitoring:kubernetes:delete", description: "Delete Kubernetes clusters", resource: "monitoring:kubernetes", action: "delete", category: "Monitoring" },
  { id: "perm-096", name: "monitoring:uptime:write", description: "Create and update uptime monitors", resource: "monitoring:uptime", action: "write", category: "Monitoring" },
  { id: "perm-097", name: "monitoring:status-page:write", description: "Create and update status pages", resource: "monitoring:status-page", action: "write", category: "Monitoring" },
  { id: "perm-098", name: "monitoring:service-map:write", description: "Create and update service maps", resource: "monitoring:service-map", action: "write", category: "Monitoring" },
  { id: "perm-099", name: "monitoring:service-map:delete", description: "Delete service map data", resource: "monitoring:service-map", action: "delete", category: "Monitoring" },
  { id: "perm-100", name: "monitoring:network-map:write", description: "Create and update network maps", resource: "monitoring:network-map", action: "write", category: "Monitoring" },
  { id: "perm-101", name: "monitoring:network-map:delete", description: "Delete network map data", resource: "monitoring:network-map", action: "delete", category: "Monitoring" },
];

// Exact permission sets per role — matches backend 07-RolePermissionsSeed.ts
const ADMIN_EXCLUDED_PERMS = new Set([
  "roles:create", "roles:delete",
  "organizations:create", "organizations:delete",
  "regions:create", "regions:update", "regions:delete",
  "region:write", "region:delete", // singular aliases — admin cannot manage regions
  "organization:delete",            // admin cannot delete organizations
  "platform:manage",
  "subscription:manage",
]);

const DEVELOPER_PERMS = new Set([
  "users:create", "users:read", "users:update", "users:write",
  "roles:read", "permissions:read",
  "organizations:read",
  "workspaces:create", "workspaces:read", "workspaces:update",
  "tenants:read", "tenants:update",
  "groups:read", "groups:update", "groups:write",
  "regions:read",
  // Tenancy singular aliases — read + limited workspace write
  "region:read", "organization:read",
  "workspace:read", "workspace:write",
  "tenant:read",
  "telemetry:read", "telemetry:write",
  "dashboard:read", "dashboard:write",
  "monitoring:agent:read", "monitoring:agent:write",
  "monitoring:vm:read", "monitoring:vm:write",
  "monitoring:kubernetes:read", "monitoring:kubernetes:write",
  "monitoring:uptime:read", "monitoring:uptime:write",
  "monitoring:status-page:read", "monitoring:status-page:write",
  "monitoring:service-map:read", "monitoring:service-map:write",
  "monitoring:network-map:read", "monitoring:network-map:write",
  "alert:read", "alert:write",
  "reports:read", "reports:write",
  "notifications:read",
  "api-keys:read", "api-keys:write",
  "retention:read", "subscription:read",
  "ai-assistant:read",
  "llm:read", "llm:chat", "llm:insights",
]);

const VIEWER_PERMS = new Set([
  "users:read", "roles:read", "permissions:read",
  "organizations:read", "workspaces:read", "tenants:read",
  "groups:read", "regions:read",
  // Tenancy singular aliases — read only
  "region:read", "organization:read", "workspace:read", "tenant:read",
  // NOTE: audit:read is NOT granted to Viewer — only Admin and above
  "telemetry:read", "dashboard:read",
  "monitoring:agent:read", "monitoring:vm:read", "monitoring:kubernetes:read",
  "monitoring:uptime:read", "monitoring:status-page:read",
  "monitoring:service-map:read", "monitoring:network-map:read",
  "alert:read", "reports:read", "notifications:read",
  "api-keys:read", "retention:read", "subscription:read",
  "ai-assistant:read", "llm:read", "llm:chat",
]);

const DEMO_PERMS = new Set([
  "organizations:read", "workspaces:read", "tenants:read",
  // Tenancy singular aliases — limited read
  "organization:read", "workspace:read", "tenant:read",
  "telemetry:read", "dashboard:read",
  "monitoring:vm:read", "monitoring:kubernetes:read",
  "monitoring:uptime:read", "monitoring:status-page:read",
  "monitoring:service-map:read", "monitoring:network-map:read",
  "alert:read", "reports:read",
  "ai-assistant:read", "llm:read", "llm:chat",
]);

function buildPermissionsForRole(tier: number): RolePermissionMapping[] {
  return MOCK_PERMISSIONS.map((perm) => {
    let granted = false;
    let inherited = false;
    let inheritedFrom: string | undefined;

    if (tier === 1) {
      granted = true; // Super Admin: all permissions
    } else if (tier === 2) {
      granted = !ADMIN_EXCLUDED_PERMS.has(perm.name); // Admin: all except excluded
    } else if (tier === 3) {
      granted = DEVELOPER_PERMS.has(perm.name); // Developer
    } else if (tier === 4) {
      granted = VIEWER_PERMS.has(perm.name); // Viewer
    } else {
      granted = DEMO_PERMS.has(perm.name); // Demo
    }

    if (tier > 1 && granted) {
      inherited = tier > 2 && VIEWER_PERMS.has(perm.name);
      inheritedFrom = inherited ? "base-viewer" : undefined;
    }

    return {
      permissionId: perm.id,
      granted,
      inherited,
      inheritedFrom,
    };
  });
}

function generateMockMatrix(): PermissionMatrix {
  const roles: MatrixRole[] = [
    {
      id: "role-superadmin",
      name: "Super Admin",
      description: "Full platform access across all regions and organizations",
      tier: 1,
      isSystem: true,
      permissionCount: MOCK_PERMISSIONS.length,
      userCount: 1,
      permissions: buildPermissionsForRole(1),
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "role-admin",
      name: "Administrator",
      description: "Organization-scoped admin with full resource management",
      tier: 2,
      isSystem: true,
      permissionCount: buildPermissionsForRole(2).filter((p) => p.granted)
        .length,
      userCount: 3,
      permissions: buildPermissionsForRole(2),
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-06-15T10:30:00Z",
    },
    {
      id: "role-developer",
      name: "Developer",
      description: "Technical access for telemetry and monitoring management",
      tier: 3,
      isSystem: true,
      permissionCount: buildPermissionsForRole(3).filter((p) => p.granted)
        .length,
      userCount: 8,
      permissions: buildPermissionsForRole(3),
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-09-20T14:15:00Z",
    },
    {
      id: "role-viewer",
      name: "Viewer",
      description: "Read-only access to organization resources",
      tier: 4,
      isSystem: true,
      permissionCount: buildPermissionsForRole(4).filter((p) => p.granted)
        .length,
      userCount: 15,
      permissions: buildPermissionsForRole(4),
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "role-demo",
      name: "Demo",
      description: "Limited demo access with auto-cleanup every 6 hours",
      tier: 5,
      isSystem: true,
      permissionCount: buildPermissionsForRole(5).filter((p) => p.granted)
        .length,
      userCount: 50,
      permissions: buildPermissionsForRole(5),
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ];

  const categories = [...new Set(MOCK_PERMISSIONS.map((p) => p.category))];

  return {
    roles,
    permissions: MOCK_PERMISSIONS,
    categories,
    totalRoles: roles.length,
    totalPermissions: MOCK_PERMISSIONS.length,
  };
}

// ==================== API CLIENT ====================

export const iamMatrixApi = {
  /**
   * Get the full permission matrix showing all roles and their permissions
   * Used to render the matrix grid in the IAM settings page
   */
  async getMatrix(): Promise<PermissionMatrix> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return generateMockMatrix();
    }

    const response = await collectorClient.get<PermissionMatrix>(
      IAM_MATRIX_ENDPOINTS.MATRIX,
    );
    return response.data;
  },

  /**
   * Get a single role with its full permission mappings
   */
  async getRole(roleId: string): Promise<MatrixRole> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const matrix = generateMockMatrix();
      const role = matrix.roles.find((r) => r.id === roleId);
      if (!role) {
        return { ...matrix.roles[0], id: roleId };
      }
      return role;
    }

    const response = await collectorClient.get<MatrixRole>(
      IAM_MATRIX_ENDPOINTS.ROLE(roleId),
    );
    return response.data;
  },

  /**
   * Update permissions for a specific role
   * Allows bulk grant/revoke of permissions
   */
  async updateRolePermissions(
    roleId: string,
    data: UpdateRolePermissionsRequest,
  ): Promise<UpdateRolePermissionsResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const matrix = generateMockMatrix();
      const role = matrix.roles.find((r) => r.id === roleId) || matrix.roles[0];
      const updatedPermissions = role.permissions.map((p) => {
        const update = data.permissions.find(
          (u) => u.permissionId === p.permissionId,
        );
        return update ? { ...p, granted: update.granted } : p;
      });
      return {
        roleId,
        updatedCount: data.permissions.length,
        permissions: updatedPermissions,
        message: `${data.permissions.length} permissions updated for role ${role.name}`,
      };
    }

    const response = await collectorClient.put<UpdateRolePermissionsResponse>(
      IAM_MATRIX_ENDPOINTS.ROLE_PERMISSIONS(roleId),
      data,
    );
    return response.data;
  },
};

export default iamMatrixApi;
