/**
 * IAM & Tenancy Mock Data
 * Comprehensive mock data for Identity and Access Management
 * Implements 5-Tier RBAC System as per TelemetryFlow Platform Architecture
 *
 * Synced with backend seed data (source of truth)
 */

import { randomId } from "./shared";
import type {
  User,
  UserProfile,
  Role,
  Permission,
  Region,
  Organization,
  Workspace,
  Tenant,
} from "@/types";

// =============================================================================
// Fixed timestamp for deterministic mock data
// =============================================================================

const CREATED_AT = "2025-01-15T00:00:00.000Z";
const UPDATED_AT = "2025-01-15T00:00:00.000Z";

// =============================================================================
// PERMISSIONS - 106 total, matching backend seed data + migration permissions
// =============================================================================

export const MOCK_PERMISSIONS: Permission[] = [
  // Users (4)
  {
    id: "perm-users-create",
    name: "users:create",
    description: "Create users",
    resource: "users",
    action: "create",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-users-read",
    name: "users:read",
    description: "Read users",
    resource: "users",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-users-update",
    name: "users:update",
    description: "Update users",
    resource: "users",
    action: "update",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-users-delete",
    name: "users:delete",
    description: "Delete users",
    resource: "users",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Roles (4)
  {
    id: "perm-roles-create",
    name: "roles:create",
    description: "Create roles",
    resource: "roles",
    action: "create",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-roles-read",
    name: "roles:read",
    description: "Read roles",
    resource: "roles",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-roles-update",
    name: "roles:update",
    description: "Update roles",
    resource: "roles",
    action: "update",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-roles-delete",
    name: "roles:delete",
    description: "Delete roles",
    resource: "roles",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Permissions (2)
  {
    id: "perm-permissions-read",
    name: "permissions:read",
    description: "Read permissions",
    resource: "permissions",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-permissions-assign",
    name: "permissions:assign",
    description: "Assign permissions",
    resource: "permissions",
    action: "assign",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Organizations (4)
  {
    id: "perm-organizations-create",
    name: "organizations:create",
    description: "Create organizations",
    resource: "organizations",
    action: "create",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-organizations-read",
    name: "organizations:read",
    description: "Read organizations",
    resource: "organizations",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-organizations-update",
    name: "organizations:update",
    description: "Update organizations",
    resource: "organizations",
    action: "update",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-organizations-delete",
    name: "organizations:delete",
    description: "Delete organizations",
    resource: "organizations",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Workspaces (4)
  {
    id: "perm-workspaces-create",
    name: "workspaces:create",
    description: "Create workspaces",
    resource: "workspaces",
    action: "create",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-workspaces-read",
    name: "workspaces:read",
    description: "Read workspaces",
    resource: "workspaces",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-workspaces-update",
    name: "workspaces:update",
    description: "Update workspaces",
    resource: "workspaces",
    action: "update",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-workspaces-delete",
    name: "workspaces:delete",
    description: "Delete workspaces",
    resource: "workspaces",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Tenants (4)
  {
    id: "perm-tenants-create",
    name: "tenants:create",
    description: "Create tenants",
    resource: "tenants",
    action: "create",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-tenants-read",
    name: "tenants:read",
    description: "Read tenants",
    resource: "tenants",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-tenants-update",
    name: "tenants:update",
    description: "Update tenants",
    resource: "tenants",
    action: "update",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-tenants-delete",
    name: "tenants:delete",
    description: "Delete tenants",
    resource: "tenants",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Groups (4)
  {
    id: "perm-groups-create",
    name: "groups:create",
    description: "Create groups",
    resource: "groups",
    action: "create",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-groups-read",
    name: "groups:read",
    description: "Read groups",
    resource: "groups",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-groups-update",
    name: "groups:update",
    description: "Update groups",
    resource: "groups",
    action: "update",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-groups-delete",
    name: "groups:delete",
    description: "Delete groups",
    resource: "groups",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Regions (4)
  {
    id: "perm-regions-create",
    name: "regions:create",
    description: "Create regions",
    resource: "regions",
    action: "create",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-regions-read",
    name: "regions:read",
    description: "Read regions",
    resource: "regions",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-regions-update",
    name: "regions:update",
    description: "Update regions",
    resource: "regions",
    action: "update",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-regions-delete",
    name: "regions:delete",
    description: "Delete regions",
    resource: "regions",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Platform (2)
  {
    id: "perm-platform-manage",
    name: "platform:manage",
    description: "Manage platform",
    resource: "platform",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-platform-audit",
    name: "platform:audit",
    description: "Audit platform",
    resource: "platform",
    action: "audit",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-audit-read",
    name: "audit:read",
    description: "View audit logs",
    resource: "audit",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Telemetry (3)
  {
    id: "perm-telemetry-read",
    name: "telemetry:read",
    description: "Read telemetry",
    resource: "telemetry",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-telemetry-write",
    name: "telemetry:write",
    description: "Write telemetry",
    resource: "telemetry",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-telemetry-manage",
    name: "telemetry:manage",
    description: "Manage telemetry",
    resource: "telemetry",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Dashboard (3)
  {
    id: "perm-dashboard-read",
    name: "dashboard:read",
    description: "Read dashboards",
    resource: "dashboard",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-dashboard-write",
    name: "dashboard:write",
    description: "Write dashboards",
    resource: "dashboard",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-dashboard-delete",
    name: "dashboard:delete",
    description: "Delete dashboards",
    resource: "dashboard",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Monitoring - Agent (2)
  {
    id: "perm-monitoring-agent-read",
    name: "monitoring:agent:read",
    description: "View monitoring agents",
    resource: "monitoring:agent",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-agent-write",
    name: "monitoring:agent:write",
    description: "Manage monitoring agents",
    resource: "monitoring:agent",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Monitoring - VM (3)
  {
    id: "perm-monitoring-vm-read",
    name: "monitoring:vm:read",
    description: "View virtual machines",
    resource: "monitoring:vm",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-vm-write",
    name: "monitoring:vm:write",
    description: "Manage virtual machines",
    resource: "monitoring:vm",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-vm-delete",
    name: "monitoring:vm:delete",
    description: "Delete virtual machines",
    resource: "monitoring:vm",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Monitoring - Kubernetes (2)
  {
    id: "perm-monitoring-kubernetes-read",
    name: "monitoring:kubernetes:read",
    description: "View Kubernetes clusters",
    resource: "monitoring:kubernetes",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-kubernetes-write",
    name: "monitoring:kubernetes:write",
    description: "Manage Kubernetes clusters",
    resource: "monitoring:kubernetes",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Monitoring - Uptime (2)
  {
    id: "perm-monitoring-uptime-read",
    name: "monitoring:uptime:read",
    description: "View uptime monitors",
    resource: "monitoring:uptime",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-uptime-manage",
    name: "monitoring:uptime:manage",
    description: "Manage uptime monitors",
    resource: "monitoring:uptime",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Monitoring - Status Page (2)
  {
    id: "perm-monitoring-status-page-read",
    name: "monitoring:status-page:read",
    description: "View status pages",
    resource: "monitoring:status-page",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-status-page-manage",
    name: "monitoring:status-page:manage",
    description: "Manage status pages",
    resource: "monitoring:status-page",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Monitoring - Service Map (2)
  {
    id: "perm-monitoring-service-map-read",
    name: "monitoring:service-map:read",
    description: "View service map",
    resource: "monitoring:service-map",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-service-map-manage",
    name: "monitoring:service-map:manage",
    description: "Manage service map",
    resource: "monitoring:service-map",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Monitoring - Network Map (2)
  {
    id: "perm-monitoring-network-map-read",
    name: "monitoring:network-map:read",
    description: "View network map",
    resource: "monitoring:network-map",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-network-map-manage",
    name: "monitoring:network-map:manage",
    description: "Manage network map",
    resource: "monitoring:network-map",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Alerts (4)
  {
    id: "perm-alert-read",
    name: "alert:read",
    description: "View alerts and alert rules",
    resource: "alert",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-alert-write",
    name: "alert:write",
    description: "Create and update alert rules",
    resource: "alert",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-alert-delete",
    name: "alert:delete",
    description: "Delete alert rules",
    resource: "alert",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-alert-manage",
    name: "alert:manage",
    description: "Acknowledge and resolve alerts",
    resource: "alert",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Reports (3)
  {
    id: "perm-reports-read",
    name: "reports:read",
    description: "View reports and schedules",
    resource: "reports",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-reports-write",
    name: "reports:write",
    description: "Create and update reports and schedules",
    resource: "reports",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-reports-delete",
    name: "reports:delete",
    description: "Delete reports and schedules",
    resource: "reports",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Notifications (3)
  {
    id: "perm-notifications-read",
    name: "notifications:read",
    description: "View notification channels and history",
    resource: "notifications",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-notifications-write",
    name: "notifications:write",
    description: "Create and update notification channels",
    resource: "notifications",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-notifications-delete",
    name: "notifications:delete",
    description: "Delete notification channels",
    resource: "notifications",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // API Keys (3)
  {
    id: "perm-api-keys-read",
    name: "api-keys:read",
    description: "View API keys",
    resource: "api-keys",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-api-keys-write",
    name: "api-keys:write",
    description: "Create and rotate API keys",
    resource: "api-keys",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-api-keys-delete",
    name: "api-keys:delete",
    description: "Delete API keys",
    resource: "api-keys",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Retention (2)
  {
    id: "perm-retention-read",
    name: "retention:read",
    description: "View retention policies",
    resource: "retention",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-retention-manage",
    name: "retention:manage",
    description: "Manage retention policies",
    resource: "retention",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Subscription (2)
  {
    id: "perm-subscription-read",
    name: "subscription:read",
    description: "View subscription details",
    resource: "subscription",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-subscription-manage",
    name: "subscription:manage",
    description: "Manage subscription plans",
    resource: "subscription",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // AI Assistant (2)
  {
    id: "perm-ai-assistant-read",
    name: "ai-assistant:read",
    description: "Access AI assistant",
    resource: "ai-assistant",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-ai-assistant-manage",
    name: "ai-assistant:manage",
    description: "Configure AI assistant settings",
    resource: "ai-assistant",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // LLM (5)
  {
    id: "perm-llm-read",
    name: "llm:read",
    description: "View LLM conversations and providers",
    resource: "llm",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-llm-chat",
    name: "llm:chat",
    description: "Send messages to LLM chat",
    resource: "llm",
    action: "chat",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-llm-write",
    name: "llm:write",
    description: "Create and update LLM providers and conversations",
    resource: "llm",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-llm-delete",
    name: "llm:delete",
    description: "Delete LLM providers and conversations",
    resource: "llm",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-llm-insights",
    name: "llm:insights",
    description: "Generate AI insights and analysis",
    resource: "llm",
    action: "insights",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Data Masking / PII (4)
  {
    id: "perm-data-masking-read",
    name: "data-masking:read",
    description: "View PII masking policies and built-in patterns",
    resource: "data-masking",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-data-masking-write",
    name: "data-masking:write",
    description: "Create and update PII masking policies and test rules",
    resource: "data-masking",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-data-masking-delete",
    name: "data-masking:delete",
    description: "Delete PII masking policies",
    resource: "data-masking",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-data-masking-manage",
    name: "data-masking:manage",
    description: "Enable and disable PII masking policies",
    resource: "data-masking",
    action: "manage",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // IAM controller aliases (5) — grouped write permissions used by IAM controllers
  {
    id: "perm-users-write",
    name: "users:write",
    description: "Create and update users",
    resource: "users",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-roles-write",
    name: "roles:write",
    description: "Create and update roles",
    resource: "roles",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-groups-write",
    name: "groups:write",
    description: "Create and update groups",
    resource: "groups",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-permissions-write",
    name: "permissions:write",
    description: "Create and update permissions",
    resource: "permissions",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Tenancy controller aliases (12) — singular resource aliases used by Tenancy controllers
  {
    id: "perm-region-read",
    name: "region:read",
    description: "View regions",
    resource: "region",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-region-write",
    name: "region:write",
    description: "Create and update regions",
    resource: "region",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-region-delete",
    name: "region:delete",
    description: "Delete regions",
    resource: "region",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-organization-read",
    name: "organization:read",
    description: "View organizations",
    resource: "organization",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-organization-write",
    name: "organization:write",
    description: "Create and update organizations",
    resource: "organization",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-organization-delete",
    name: "organization:delete",
    description: "Delete organizations",
    resource: "organization",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-workspace-read",
    name: "workspace:read",
    description: "View workspaces",
    resource: "workspace",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-workspace-write",
    name: "workspace:write",
    description: "Create and update workspaces",
    resource: "workspace",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-workspace-delete",
    name: "workspace:delete",
    description: "Delete workspaces",
    resource: "workspace",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-tenant-read",
    name: "tenant:read",
    description: "View tenants",
    resource: "tenant",
    action: "read",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-tenant-write",
    name: "tenant:write",
    description: "Create and update tenants",
    resource: "tenant",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-tenant-delete",
    name: "tenant:delete",
    description: "Delete tenants",
    resource: "tenant",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Migration-added monitoring permissions (8) — from 1700000000018-AddMonitoringControllerPermissions
  {
    id: "perm-monitoring-agent-delete",
    name: "monitoring:agent:delete",
    description: "Delete monitoring agents",
    resource: "monitoring:agent",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-kubernetes-delete",
    name: "monitoring:kubernetes:delete",
    description: "Delete Kubernetes clusters",
    resource: "monitoring:kubernetes",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-uptime-write",
    name: "monitoring:uptime:write",
    description: "Create and update uptime monitors",
    resource: "monitoring:uptime",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-status-page-write",
    name: "monitoring:status-page:write",
    description: "Create and update status pages",
    resource: "monitoring:status-page",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-service-map-write",
    name: "monitoring:service-map:write",
    description: "Create and update service map",
    resource: "monitoring:service-map",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-service-map-delete",
    name: "monitoring:service-map:delete",
    description: "Delete service map",
    resource: "monitoring:service-map",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-network-map-write",
    name: "monitoring:network-map:write",
    description: "Create and update network map",
    resource: "monitoring:network-map",
    action: "write",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "perm-monitoring-network-map-delete",
    name: "monitoring:network-map:delete",
    description: "Delete network map",
    resource: "monitoring:network-map",
    action: "delete",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

// Permission lookup helper
function getPermissionsByNames(names: string[]): Permission[] {
  return MOCK_PERMISSIONS.filter((p) => names.includes(p.name));
}

// =============================================================================
// ROLES - 5-Tier RBAC Hierarchy (matching backend seed)
// =============================================================================

// Super Administrator: ALL permissions
const SUPER_ADMIN_PERMISSION_NAMES = MOCK_PERMISSIONS.map((p) => p.name);

// Administrator: All except roles:create/delete, orgs:create/delete, regions CUD, platform:manage,
// subscription:manage, region write/delete aliases, organization:delete alias
const ADMIN_EXCLUDED = new Set([
  "roles:create",
  "roles:delete",
  "organizations:create",
  "organizations:delete",
  "regions:create",
  "regions:update",
  "regions:delete",
  "platform:manage",
  "subscription:manage",
  // Tenancy alias exclusions (singular)
  "region:write",
  "region:delete",
  "organization:delete",
]);
const ADMIN_PERMISSION_NAMES = MOCK_PERMISSIONS.filter(
  (p) => !ADMIN_EXCLUDED.has(p.name),
).map((p) => p.name);

// Developer: create/read/update only, limited scope
const DEVELOPER_PERMISSION_NAMES = [
  "users:create",
  "users:read",
  "users:update",
  "users:write",
  "roles:read",
  "permissions:read",
  "organizations:read",
  "workspaces:create",
  "workspaces:read",
  "workspaces:update",
  "tenants:read",
  "tenants:update",
  "groups:read",
  "groups:update",
  "groups:write",
  "regions:read",
  // Tenancy aliases — read only
  "region:read",
  "organization:read",
  "workspace:read",
  "workspace:write",
  "tenant:read",
  "telemetry:read",
  "telemetry:write",
  "dashboard:read",
  "dashboard:write",
  // Monitoring - read + write (no delete/manage)
  "monitoring:agent:read",
  "monitoring:agent:write",
  "monitoring:vm:read",
  "monitoring:vm:write",
  "monitoring:kubernetes:read",
  "monitoring:kubernetes:write",
  "monitoring:uptime:read",
  "monitoring:uptime:write",
  "monitoring:status-page:read",
  "monitoring:status-page:write",
  "monitoring:service-map:read",
  "monitoring:service-map:write",
  "monitoring:network-map:read",
  "monitoring:network-map:write",
  // Alerts - read + write
  "alert:read",
  "alert:write",
  // Reports - read + write
  "reports:read",
  "reports:write",
  // Notifications - read only
  "notifications:read",
  // API Keys - read + write
  "api-keys:read",
  "api-keys:write",
  // Retention - read only
  "retention:read",
  // Subscription - read only
  "subscription:read",
  // AI Assistant - read only
  "ai-assistant:read",
  // LLM - chat + read + insights (no provider write/delete)
  "llm:read",
  "llm:chat",
  "llm:insights",
  // Data Masking - read + write only (no delete, no toggle)
  "data-masking:read",
  "data-masking:write",
];

// Viewer: Read-only across all resources
const VIEWER_PERMISSION_NAMES = [
  "users:read",
  "roles:read",
  "permissions:read",
  "organizations:read",
  "workspaces:read",
  "tenants:read",
  "groups:read",
  "regions:read",
  // Tenancy aliases — read only
  "region:read",
  "organization:read",
  "workspace:read",
  "tenant:read",
  "telemetry:read",
  "dashboard:read",
  // Monitoring - read only
  "monitoring:agent:read",
  "monitoring:vm:read",
  "monitoring:kubernetes:read",
  "monitoring:uptime:read",
  "monitoring:status-page:read",
  "monitoring:service-map:read",
  "monitoring:network-map:read",
  // Alerts - read only
  "alert:read",
  // Reports - read only
  "reports:read",
  // Notifications - read only
  "notifications:read",
  // API Keys - read only
  "api-keys:read",
  // Retention - read only
  "retention:read",
  // Subscription - read only
  "subscription:read",
  // AI Assistant - read only
  "ai-assistant:read",
  // LLM - read + chat only
  "llm:read",
  "llm:chat",
  // Data Masking - read only
  "data-masking:read",
];

// Demo: Limited read-only
const DEMO_PERMISSION_NAMES = [
  "organizations:read",
  "workspaces:read",
  "tenants:read",
  // Tenancy aliases — limited read only
  "organization:read",
  "workspace:read",
  "tenant:read",
  "telemetry:read",
  "dashboard:read",
  // Monitoring - limited read
  "monitoring:vm:read",
  "monitoring:kubernetes:read",
  "monitoring:uptime:read",
  "monitoring:status-page:read",
  "monitoring:service-map:read",
  "monitoring:network-map:read",
  // Alerts - read only
  "alert:read",
  // Reports - read only
  "reports:read",
  // AI Assistant - read only
  "ai-assistant:read",
  // LLM - read + chat only
  "llm:read",
  "llm:chat",
];

export const MOCK_ROLES: Role[] = [
  {
    id: "role-super-admin",
    name: "Super Administrator",
    description:
      "Platform management across all organizations. Full access to all resources.",
    isSystem: true,
    permissions: getPermissionsByNames(SUPER_ADMIN_PERMISSION_NAMES),
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "role-admin",
    name: "Administrator",
    description:
      "Full CRUD within organization. Can manage users, roles, and resources.",
    isSystem: true,
    permissions: getPermissionsByNames(ADMIN_PERMISSION_NAMES),
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "role-developer",
    name: "Developer",
    description:
      "Create/Read/Update access (no delete). Can work with most resources.",
    isSystem: true,
    permissions: getPermissionsByNames(DEVELOPER_PERMISSION_NAMES),
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "role-viewer",
    name: "Viewer",
    description:
      "Read-only access. Can view resources but cannot modify them.",
    isSystem: true,
    permissions: getPermissionsByNames(VIEWER_PERMISSION_NAMES),
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "role-demo",
    name: "Demo",
    description:
      "Demo access in demo organization. Limited read-only access.",
    isSystem: true,
    permissions: getPermissionsByNames(DEMO_PERMISSION_NAMES),
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

// =============================================================================
// REGIONS - 11 total (matching backend seed)
// =============================================================================

export const MOCK_REGIONS: Region[] = [
  {
    id: "region-ap-southeast-3",
    name: "Asia Pacific (Jakarta)",
    code: "ap-southeast-3",
    description: "Asia Pacific (Jakarta)",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "region-ap-southeast-1",
    name: "Asia Pacific (Singapore)",
    code: "ap-southeast-1",
    description: "Asia Pacific (Singapore)",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

// =============================================================================
// ORGANIZATIONS - 2 (matching backend seed)
// =============================================================================

export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: "org-devopscorner",
    name: "DevOpsCorner",
    slug: "devopscorner",
    description: "DevOpsCorner organization - Default demo organization",
    regionId: "region-ap-southeast-3",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "org-telemetryflow",
    name: "TelemetryFlow",
    slug: "telemetryflow",
    description: "TelemetryFlow organization",
    regionId: "region-ap-southeast-1",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

// =============================================================================
// WORKSPACES - 2 (1 per organization, matching backend seed)
// =============================================================================

export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: "ws-devopscorner",
    name: "DevOpsCorner Workspace",
    slug: "devopscorner-workspace",
    description: "Default workspace for DevOpsCorner organization",
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "ws-telemetryflow",
    name: "TelemetryFlow Workspace",
    slug: "telemetryflow-workspace",
    description: "Default workspace for TelemetryFlow organization",
    organizationId: "org-telemetryflow",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

// =============================================================================
// TENANTS - 2 under DEVOPSCORNER-WORKSPACE (matching backend seed)
// =============================================================================

export const MOCK_TENANTS: Tenant[] = [
  {
    id: "tenant-devopscorner",
    name: "DevOpsCorner",
    slug: "devopscorner",
    description: "DevOpsCorner tenant - Default demo tenant",
    workspaceId: "ws-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "tenant-demo",
    name: "Demo Tenant",
    slug: "demo",
    description: "Demo tenant for testing purposes",
    workspaceId: "ws-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

// =============================================================================
// USERS - 24 total (matching backend seed)
// =============================================================================

export const MOCK_USERS: User[] = [
  // 5-Tier Default Users
  {
    id: "user-superadmin",
    username: "superadmin.telemetryflow",
    email: "superadmin.telemetryflow@telemetryflow.id",
    firstName: "Super",
    lastName: "Admin",
    isActive: true,
    avatar: undefined,
    timezone: "UTC",
    locale: "en-US",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 150,
    mfaEnabled: true,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-admin",
    username: "admin.telemetryflow",
    email: "administrator.telemetryflow@telemetryflow.id",
    firstName: "Admin",
    lastName: "User",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 89,
    mfaEnabled: true,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-developer",
    username: "developer.telemetryflow",
    email: "developer.telemetryflow@telemetryflow.id",
    firstName: "Developer",
    lastName: "User",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 234,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-viewer",
    username: "viewer.telemetryflow",
    email: "viewer.telemetryflow@telemetryflow.id",
    firstName: "Viewer",
    lastName: "User",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 45,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-demo",
    username: "demo.telemetryflow",
    email: "demo.telemetryflow@telemetryflow.id",
    firstName: "Demo",
    lastName: "User",
    isActive: true,
    avatar: undefined,
    timezone: "UTC",
    locale: "en-US",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 1024,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Platform Engineering Team (3)
  {
    id: "user-platform-engineer01",
    username: "platform.engineer01",
    email: "platform.engineer01@telemetryflow.id",
    firstName: "Platform",
    lastName: "Engineer 01",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 72,
    mfaEnabled: true,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-platform-engineer02",
    username: "platform.engineer02",
    email: "platform.engineer02@telemetryflow.id",
    firstName: "Platform",
    lastName: "Engineer 02",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 58,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-platform-engineer03",
    username: "platform.engineer03",
    email: "platform.engineer03@telemetryflow.id",
    firstName: "Platform",
    lastName: "Engineer 03",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Singapore",
    locale: "en-SG",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 41,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // SRE Team (3)
  {
    id: "user-sre-team01",
    username: "sre.team01",
    email: "sre.team01@telemetryflow.id",
    firstName: "SRE",
    lastName: "Team 01",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Singapore",
    locale: "en-SG",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 95,
    mfaEnabled: true,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-sre-team02",
    username: "sre.team02",
    email: "sre.team02@telemetryflow.id",
    firstName: "SRE",
    lastName: "Team 02",
    isActive: true,
    avatar: undefined,
    timezone: "America/New_York",
    locale: "en-US",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 67,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-sre-team03",
    username: "sre.team03",
    email: "sre.team03@telemetryflow.id",
    firstName: "SRE",
    lastName: "Team 03",
    isActive: true,
    avatar: undefined,
    timezone: "Europe/London",
    locale: "en-GB",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 53,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // DevOps Team (3)
  {
    id: "user-devops-team01",
    username: "devops.team01",
    email: "devops.team01@telemetryflow.id",
    firstName: "DevOps",
    lastName: "Team 01",
    isActive: true,
    avatar: undefined,
    timezone: "America/New_York",
    locale: "en-US",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 110,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-devops-team02",
    username: "devops.team02",
    email: "devops.team02@telemetryflow.id",
    firstName: "DevOps",
    lastName: "Team 02",
    isActive: true,
    avatar: undefined,
    timezone: "America/Los_Angeles",
    locale: "en-US",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 88,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-devops-team03",
    username: "devops.team03",
    email: "devops.team03@telemetryflow.id",
    firstName: "DevOps",
    lastName: "Team 03",
    isActive: true,
    avatar: undefined,
    timezone: "Europe/Berlin",
    locale: "de-DE",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 64,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Backend Team (2)
  {
    id: "user-backend-dev01",
    username: "backend.dev01",
    email: "backend.dev01@telemetryflow.id",
    firstName: "Backend",
    lastName: "Developer 01",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 132,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-backend-dev02",
    username: "backend.dev02",
    email: "backend.dev02@telemetryflow.id",
    firstName: "Backend",
    lastName: "Developer 02",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 98,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Frontend Team (2)
  {
    id: "user-frontend-dev01",
    username: "frontend.dev01",
    email: "frontend.dev01@telemetryflow.id",
    firstName: "Frontend",
    lastName: "Developer 01",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 145,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-frontend-dev02",
    username: "frontend.dev02",
    email: "frontend.dev02@telemetryflow.id",
    firstName: "Frontend",
    lastName: "Developer 02",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Singapore",
    locale: "en-SG",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 112,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // QA Team (2)
  {
    id: "user-qa-engineer01",
    username: "qa.engineer01",
    email: "qa.engineer01@telemetryflow.id",
    firstName: "QA",
    lastName: "Engineer 01",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 76,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-qa-engineer02",
    username: "qa.engineer02",
    email: "qa.engineer02@telemetryflow.id",
    firstName: "QA",
    lastName: "Engineer 02",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 61,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Product Team (2)
  {
    id: "user-product-manager01",
    username: "product.manager01",
    email: "product.manager01@telemetryflow.id",
    firstName: "Product",
    lastName: "Manager 01",
    isActive: true,
    avatar: undefined,
    timezone: "Europe/London",
    locale: "en-GB",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 55,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
  {
    id: "user-product-owner01",
    username: "product.owner01",
    email: "product.owner01@telemetryflow.id",
    firstName: "Product",
    lastName: "Owner 01",
    isActive: true,
    avatar: undefined,
    timezone: "Europe/Berlin",
    locale: "de-DE",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 48,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Security Team (1)
  {
    id: "user-security-analyst01",
    username: "security.analyst01",
    email: "security.analyst01@telemetryflow.id",
    firstName: "Security",
    lastName: "Analyst 01",
    isActive: true,
    avatar: undefined,
    timezone: "UTC",
    locale: "en-US",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 83,
    mfaEnabled: true,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },

  // Data Team (1)
  {
    id: "user-data-engineer01",
    username: "data.engineer01",
    email: "data.engineer01@telemetryflow.id",
    firstName: "Data",
    lastName: "Engineer 01",
    isActive: true,
    avatar: undefined,
    timezone: "Asia/Jakarta",
    locale: "id-ID",
    lastLoginAt: "2025-01-15T00:00:00.000Z",
    loginCount: 91,
    mfaEnabled: false,
    emailVerified: true,
    organizationId: "org-devopscorner",
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  },
];

// =============================================================================
// User credentials mapping (for mock auth)
// =============================================================================

export const MOCK_USER_CREDENTIALS: Record<
  string,
  { password: string; userId: string; roleId: string }
> = {
  // 5-Tier Default Users (email login)
  "superadmin.telemetryflow@telemetryflow.id": {
    password: "SuperAdmin@654123",
    userId: "user-superadmin",
    roleId: "role-super-admin",
  },
  "administrator.telemetryflow@telemetryflow.id": {
    password: "Admin@654123",
    userId: "user-admin",
    roleId: "role-admin",
  },
  "developer.telemetryflow@telemetryflow.id": {
    password: "Developer@654123",
    userId: "user-developer",
    roleId: "role-developer",
  },
  "viewer.telemetryflow@telemetryflow.id": {
    password: "Viewer@654123",
    userId: "user-viewer",
    roleId: "role-viewer",
  },
  "demo.telemetryflow@telemetryflow.id": {
    password: "Demo@654123",
    userId: "user-demo",
    roleId: "role-demo",
  },

  // 5-Tier Default Users (username login)
  "superadmin.telemetryflow": {
    password: "SuperAdmin@654123",
    userId: "user-superadmin",
    roleId: "role-super-admin",
  },
  "admin.telemetryflow": {
    password: "Admin@654123",
    userId: "user-admin",
    roleId: "role-admin",
  },
  "developer.telemetryflow": {
    password: "Developer@654123",
    userId: "user-developer",
    roleId: "role-developer",
  },
  "viewer.telemetryflow": {
    password: "Viewer@654123",
    userId: "user-viewer",
    roleId: "role-viewer",
  },
  "demo.telemetryflow": {
    password: "Demo@654123",
    userId: "user-demo",
    roleId: "role-demo",
  },

  // Platform Engineering Team
  "platform.engineer01@telemetryflow.id": {
    password: "Platform@654123",
    userId: "user-platform-engineer01",
    roleId: "role-admin",
  },
  "platform.engineer02@telemetryflow.id": {
    password: "Platform@654123",
    userId: "user-platform-engineer02",
    roleId: "role-developer",
  },
  "platform.engineer03@telemetryflow.id": {
    password: "Platform@654123",
    userId: "user-platform-engineer03",
    roleId: "role-developer",
  },

  // SRE Team
  "sre.team01@telemetryflow.id": {
    password: "SRE@654123",
    userId: "user-sre-team01",
    roleId: "role-admin",
  },
  "sre.team02@telemetryflow.id": {
    password: "SRE@654123",
    userId: "user-sre-team02",
    roleId: "role-developer",
  },
  "sre.team03@telemetryflow.id": {
    password: "SRE@654123",
    userId: "user-sre-team03",
    roleId: "role-developer",
  },

  // DevOps Team
  "devops.team01@telemetryflow.id": {
    password: "DevOps@654123",
    userId: "user-devops-team01",
    roleId: "role-developer",
  },
  "devops.team02@telemetryflow.id": {
    password: "DevOps@654123",
    userId: "user-devops-team02",
    roleId: "role-developer",
  },
  "devops.team03@telemetryflow.id": {
    password: "DevOps@654123",
    userId: "user-devops-team03",
    roleId: "role-developer",
  },

  // Backend Team
  "backend.dev01@telemetryflow.id": {
    password: "Backend@654123",
    userId: "user-backend-dev01",
    roleId: "role-developer",
  },
  "backend.dev02@telemetryflow.id": {
    password: "Backend@654123",
    userId: "user-backend-dev02",
    roleId: "role-developer",
  },

  // Frontend Team
  "frontend.dev01@telemetryflow.id": {
    password: "Frontend@654123",
    userId: "user-frontend-dev01",
    roleId: "role-developer",
  },
  "frontend.dev02@telemetryflow.id": {
    password: "Frontend@654123",
    userId: "user-frontend-dev02",
    roleId: "role-developer",
  },

  // QA Team
  "qa.engineer01@telemetryflow.id": {
    password: "QA@654123",
    userId: "user-qa-engineer01",
    roleId: "role-viewer",
  },
  "qa.engineer02@telemetryflow.id": {
    password: "QA@654123",
    userId: "user-qa-engineer02",
    roleId: "role-viewer",
  },

  // Product Team
  "product.manager01@telemetryflow.id": {
    password: "Product@654123",
    userId: "user-product-manager01",
    roleId: "role-viewer",
  },
  "product.owner01@telemetryflow.id": {
    password: "Product@654123",
    userId: "user-product-owner01",
    roleId: "role-viewer",
  },

  // Security Team
  "security.analyst01@telemetryflow.id": {
    password: "Security@654123",
    userId: "user-security-analyst01",
    roleId: "role-admin",
  },

  // Data Team
  "data.engineer01@telemetryflow.id": {
    password: "Data@654123",
    userId: "user-data-engineer01",
    roleId: "role-developer",
  },
};

// =============================================================================
// User-Role assignments
// =============================================================================

export const MOCK_USER_ROLES: Record<string, string[]> = {
  // 5-Tier Default Users
  "user-superadmin": ["role-super-admin"],
  "user-admin": ["role-admin"],
  "user-developer": ["role-developer"],
  "user-viewer": ["role-viewer"],
  "user-demo": ["role-demo"],

  // Platform Engineering Team
  "user-platform-engineer01": ["role-admin"],
  "user-platform-engineer02": ["role-developer"],
  "user-platform-engineer03": ["role-developer"],

  // SRE Team
  "user-sre-team01": ["role-admin"],
  "user-sre-team02": ["role-developer"],
  "user-sre-team03": ["role-developer"],

  // DevOps Team
  "user-devops-team01": ["role-developer"],
  "user-devops-team02": ["role-developer"],
  "user-devops-team03": ["role-developer"],

  // Backend Team
  "user-backend-dev01": ["role-developer"],
  "user-backend-dev02": ["role-developer"],

  // Frontend Team
  "user-frontend-dev01": ["role-developer"],
  "user-frontend-dev02": ["role-developer"],

  // QA Team
  "user-qa-engineer01": ["role-viewer"],
  "user-qa-engineer02": ["role-viewer"],

  // Product Team
  "user-product-manager01": ["role-viewer"],
  "user-product-owner01": ["role-viewer"],

  // Security Team
  "user-security-analyst01": ["role-admin"],

  // Data Team
  "user-data-engineer01": ["role-developer"],
};

// User-Organization assignments
export const MOCK_USER_ORGANIZATIONS: Record<string, string> = {
  "user-superadmin": "org-devopscorner",
  "user-admin": "org-devopscorner",
  "user-developer": "org-devopscorner",
  "user-viewer": "org-devopscorner",
  "user-demo": "org-devopscorner",
  "user-platform-engineer01": "org-devopscorner",
  "user-platform-engineer02": "org-devopscorner",
  "user-platform-engineer03": "org-devopscorner",
  "user-sre-team01": "org-devopscorner",
  "user-sre-team02": "org-devopscorner",
  "user-sre-team03": "org-devopscorner",
  "user-devops-team01": "org-devopscorner",
  "user-devops-team02": "org-devopscorner",
  "user-devops-team03": "org-devopscorner",
  "user-backend-dev01": "org-devopscorner",
  "user-backend-dev02": "org-devopscorner",
  "user-frontend-dev01": "org-devopscorner",
  "user-frontend-dev02": "org-devopscorner",
  "user-qa-engineer01": "org-devopscorner",
  "user-qa-engineer02": "org-devopscorner",
  "user-product-manager01": "org-devopscorner",
  "user-product-owner01": "org-devopscorner",
  "user-security-analyst01": "org-devopscorner",
  "user-data-engineer01": "org-devopscorner",
};

// User-Tenant assignments
export const MOCK_USER_TENANTS: Record<string, string | null> = {
  "user-superadmin": null,
  "user-admin": "tenant-devopscorner",
  "user-developer": "tenant-devopscorner",
  "user-viewer": "tenant-devopscorner",
  "user-demo": "tenant-demo",
  "user-platform-engineer01": "tenant-devopscorner",
  "user-platform-engineer02": "tenant-devopscorner",
  "user-platform-engineer03": "tenant-devopscorner",
  "user-sre-team01": "tenant-devopscorner",
  "user-sre-team02": "tenant-devopscorner",
  "user-sre-team03": "tenant-devopscorner",
  "user-devops-team01": "tenant-devopscorner",
  "user-devops-team02": "tenant-devopscorner",
  "user-devops-team03": "tenant-devopscorner",
  "user-backend-dev01": "tenant-devopscorner",
  "user-backend-dev02": "tenant-devopscorner",
  "user-frontend-dev01": "tenant-devopscorner",
  "user-frontend-dev02": "tenant-devopscorner",
  "user-qa-engineer01": "tenant-devopscorner",
  "user-qa-engineer02": "tenant-devopscorner",
  "user-product-manager01": "tenant-devopscorner",
  "user-product-owner01": "tenant-devopscorner",
  "user-security-analyst01": "tenant-devopscorner",
  "user-data-engineer01": "tenant-devopscorner",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get user profile with roles and permissions
 */
export function getUserProfile(userId: string): UserProfile | null {
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) return null;

  const roleIds = MOCK_USER_ROLES[userId] || [];
  const roles = MOCK_ROLES.filter((r) => roleIds.includes(r.id));
  const permissions = roles.flatMap(
    (r) => r.permissions?.map((p) => p.name) || [],
  );
  const uniquePermissions = [...new Set(permissions)];

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: roles.map((r) => r.name),
    permissions: uniquePermissions,
    avatar: user.avatar || null,
    tenantId: MOCK_USER_TENANTS[userId] || null,
    organizationId: MOCK_USER_ORGANIZATIONS[userId] || null,
  };
}

/**
 * Authenticate user and return profile
 */
export function authenticateUser(
  identifier: string,
  password: string,
): UserProfile | null {
  const credential = MOCK_USER_CREDENTIALS[identifier];
  if (!credential || credential.password !== password) {
    return null;
  }
  return getUserProfile(credential.userId);
}

/**
 * Generate mock JWT tokens
 */
export function generateMockTokens(userId: string): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  return {
    accessToken: `mock_access_${randomId(32)}_${userId}`,
    refreshToken: `mock_refresh_${randomId(32)}_${userId}`,
    expiresIn: 3600, // 1 hour
  };
}

/**
 * Get role by ID
 */
export function getRoleById(roleId: string): Role | undefined {
  return MOCK_ROLES.find((r) => r.id === roleId);
}

/**
 * Get role by name
 */
export function getRoleByName(name: string): Role | undefined {
  return MOCK_ROLES.find((r) => r.name === name);
}

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(roleId: string): Permission[] {
  const role = getRoleById(roleId);
  return role?.permissions || [];
}

/**
 * Get organizations by region
 */
export function getOrganizationsByRegion(regionId: string): Organization[] {
  return MOCK_ORGANIZATIONS.filter((o) => o.regionId === regionId);
}

/**
 * Get workspaces by organization
 */
export function getWorkspacesByOrganization(
  organizationId: string,
): Workspace[] {
  return MOCK_WORKSPACES.filter((w) => w.organizationId === organizationId);
}

/**
 * Get tenants by workspace
 */
export function getTenantsByWorkspace(workspaceId: string): Tenant[] {
  return MOCK_TENANTS.filter((t) => t.workspaceId === workspaceId);
}

// =============================================================================
// AUDIT LOG MOCK DATA
// =============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string | number;
  createdAt?: number;
  userId: string;
  userName?: string;
  userEmail: string;
  userFirstName?: string;
  userLastName?: string;
  eventType: "AUTH" | "AUTHZ" | "DATA" | "SYSTEM";
  action: string;
  resource: string;
  resourceId: string;
  result: "SUCCESS" | "FAILURE" | "DENIED";
  errorMessage?: string;
  errorCode?: string;
  details?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  requestMethod?: string;
  requestPath?: string;
  metadata?: Record<string, unknown>;
  durationMs?: number;
  tenantId?: string;
  workspaceId?: string;
  organizationId?: string;
  organizationName?: string;
  regionId?: string;
  sessionId?: string;
  correlationId?: string;
  status?: "success" | "failure";
}

const AUDIT_ACTIONS = [
  "user.login",
  "user.logout",
  "user.create",
  "user.update",
  "user.delete",
  "role.create",
  "role.update",
  "role.delete",
  "role.assign",
  "role.revoke",
  "permission.assign",
  "permission.revoke",
  "organization.create",
  "organization.update",
  "organization.delete",
  "workspace.create",
  "workspace.update",
  "workspace.delete",
  "tenant.create",
  "tenant.update",
  "tenant.delete",
  "api-key.create",
  "api-key.rotate",
  "api-key.delete",
  "dashboard.create",
  "dashboard.update",
  "dashboard.delete",
  "dashboard.share",
  "alert.create",
  "alert.acknowledge",
  "alert.resolve",
  "settings.update",
  "retention.update",
];

const ACTION_TO_EVENT_TYPE: Record<
  string,
  "AUTH" | "AUTHZ" | "DATA" | "SYSTEM"
> = {
  "user.login": "AUTH",
  "user.logout": "AUTH",
  "user.create": "DATA",
  "user.update": "DATA",
  "user.delete": "DATA",
  "role.create": "DATA",
  "role.update": "DATA",
  "role.delete": "DATA",
  "role.assign": "AUTHZ",
  "role.revoke": "AUTHZ",
  "permission.assign": "AUTHZ",
  "permission.revoke": "AUTHZ",
  "organization.create": "DATA",
  "organization.update": "DATA",
  "organization.delete": "DATA",
  "workspace.create": "DATA",
  "workspace.update": "DATA",
  "workspace.delete": "DATA",
  "tenant.create": "DATA",
  "tenant.update": "DATA",
  "tenant.delete": "DATA",
  "api-key.create": "DATA",
  "api-key.rotate": "DATA",
  "api-key.delete": "DATA",
  "dashboard.create": "DATA",
  "dashboard.update": "DATA",
  "dashboard.delete": "DATA",
  "dashboard.share": "AUTHZ",
  "alert.create": "DATA",
  "alert.acknowledge": "DATA",
  "alert.resolve": "DATA",
  "settings.update": "SYSTEM",
  "retention.update": "SYSTEM",
};

function secureRandomFloat(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 4294967296;
}

function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const values = new Uint32Array(1);
  const range = 4294967296;
  const limit = range - (range % max);

  let value = 0;
  do {
    crypto.getRandomValues(values);
    value = values[0];
  } while (value >= limit);

  return value % max;
}

export function generateAuditLogs(count: number = 100): AuditLogEntry[] {
  const logs: AuditLogEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const user = MOCK_USERS[secureRandomInt(MOCK_USERS.length)];
    const action =
      AUDIT_ACTIONS[secureRandomInt(AUDIT_ACTIONS.length)];
    const [resource] = action.split(".");
    const eventType = ACTION_TO_EVENT_TYPE[action] || "DATA";
    const resultRandom = secureRandomFloat();
    const result: "SUCCESS" | "FAILURE" | "DENIED" =
      resultRandom > 0.9
        ? "FAILURE"
        : resultRandom > 0.85
          ? "DENIED"
          : "SUCCESS";
    const timestamp = now - secureRandomFloat() * 7 * 24 * 60 * 60 * 1000;

    logs.push({
      id: `audit-${randomId(12)}`,
      timestamp,
      createdAt: timestamp,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      userFirstName: user.firstName,
      userLastName: user.lastName,
      eventType,
      action,
      resource,
      resourceId: `${resource}-${randomId(6)}`,
      result,
      errorMessage:
        result === "FAILURE" ? `${action} operation failed` : undefined,
      errorCode:
        result === "FAILURE"
          ? `ERR_${action.toUpperCase().replace(/\./g, "_")}`
          : undefined,
      details: {
        previousValue: action.includes("update")
          ? { name: "Old Value" }
          : undefined,
        newValue:
          action.includes("update") || action.includes("create")
            ? { name: "New Value" }
            : undefined,
      },
      ipAddress: `192.168.${secureRandomInt(255)}.${secureRandomInt(255)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      requestMethod: ["GET", "POST", "PUT", "DELETE"][
        secureRandomInt(4)
      ],
      requestPath: `/api/v2/${resource}s`,
      metadata: {
        requestMethod: ["GET", "POST", "PUT", "DELETE"][secureRandomInt(4)],
        requestPath: `/api/v2/${resource}s`,
        statusCode: result === "SUCCESS" ? 200 : result === "DENIED" ? 403 : 500,
        duration: secureRandomInt(500) + 10,
        resourceId: `${resource}-${randomId(6)}`,
        sessionId: "",
      },
      durationMs: secureRandomInt(500) + 10,
      tenantId: "tenant-devopscorner",
      workspaceId: "ws-devopscorner",
      organizationId: user.organizationId || "org-devopscorner",
      organizationName: "DevOpsCorner",
      regionId: "ap-southeast-3",
      sessionId: `session-${user.id}-${Math.floor(timestamp / 3600000)}`,
      correlationId: `corr-${randomId(16)}`,
      status: result === "SUCCESS" ? "success" : "failure",
    });
  }

  return logs.sort((a, b) => {
    const timeA =
      typeof a.timestamp === "string"
        ? new Date(a.timestamp).getTime()
        : a.timestamp;
    const timeB =
      typeof b.timestamp === "string"
        ? new Date(b.timestamp).getTime()
        : b.timestamp;
    return timeB - timeA;
  });
}

export const MOCK_AUDIT_LOGS = generateAuditLogs(100);

// =============================================================================
// IAM MOCK SERVICE - Unified API
// =============================================================================

export const iamMock = {
  // Users
  users: MOCK_USERS,
  getUserById: (id: string) => MOCK_USERS.find((u) => u.id === id),
  getUserByEmail: (email: string) => MOCK_USERS.find((u) => u.email === email),
  getUserProfile,
  authenticateUser,
  generateMockTokens,

  // Roles
  roles: MOCK_ROLES,
  getRoleById,
  getRoleByName,
  getPermissionsForRole,
  userRoles: MOCK_USER_ROLES,

  // Permissions
  permissions: MOCK_PERMISSIONS,
  getPermissionsByResource: (resource: string) =>
    MOCK_PERMISSIONS.filter((p) => p.resource === resource),

  // Regions
  regions: MOCK_REGIONS,
  getRegionById: (id: string) => MOCK_REGIONS.find((r) => r.id === id),

  // Organizations
  organizations: MOCK_ORGANIZATIONS,
  getOrganizationById: (id: string) =>
    MOCK_ORGANIZATIONS.find((o) => o.id === id),
  getOrganizationsByRegion,

  // Workspaces
  workspaces: MOCK_WORKSPACES,
  getWorkspaceById: (id: string) => MOCK_WORKSPACES.find((w) => w.id === id),
  getWorkspacesByOrganization,

  // Tenants
  tenants: MOCK_TENANTS,
  getTenantById: (id: string) => MOCK_TENANTS.find((t) => t.id === id),
  getTenantsByWorkspace,

  // Audit Logs
  auditLogs: MOCK_AUDIT_LOGS,
  generateAuditLogs,

  // Credentials (for testing)
  credentials: MOCK_USER_CREDENTIALS,
};

export default iamMock;
