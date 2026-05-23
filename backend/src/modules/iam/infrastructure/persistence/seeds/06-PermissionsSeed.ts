/**
 * IAM Seed: Permissions
 * Order: 06 (base entity for RBAC)
 */

import { DataSource } from "typeorm";
import { BaseSeed } from "../../../../../database/shared/BaseSeed";

export class PermissionsSeed extends BaseSeed {
  name = "PermissionsSeed";
  moduleName = "iam";
  order = 6;
  dependencies = [];

  async run(dataSource: DataSource): Promise<void> {
    this.log("Seeding permissions...");

    // Define all permissions by resource
    const permissionDefinitions = [
      // Users
      {
        name: "users:create",
        description: "Create users",
        resource: "users",
        action: "create",
      },
      {
        name: "users:read",
        description: "Read users",
        resource: "users",
        action: "read",
      },
      {
        name: "users:update",
        description: "Update users",
        resource: "users",
        action: "update",
      },
      {
        name: "users:delete",
        description: "Delete users",
        resource: "users",
        action: "delete",
      },

      // Roles
      {
        name: "roles:create",
        description: "Create roles",
        resource: "roles",
        action: "create",
      },
      {
        name: "roles:read",
        description: "Read roles",
        resource: "roles",
        action: "read",
      },
      {
        name: "roles:update",
        description: "Update roles",
        resource: "roles",
        action: "update",
      },
      {
        name: "roles:delete",
        description: "Delete roles",
        resource: "roles",
        action: "delete",
      },

      // Permissions
      {
        name: "permissions:read",
        description: "Read permissions",
        resource: "permissions",
        action: "read",
      },
      {
        name: "permissions:assign",
        description: "Assign permissions",
        resource: "permissions",
        action: "assign",
      },

      // Organizations
      {
        name: "organizations:create",
        description: "Create organizations",
        resource: "organizations",
        action: "create",
      },
      {
        name: "organizations:read",
        description: "Read organizations",
        resource: "organizations",
        action: "read",
      },
      {
        name: "organizations:update",
        description: "Update organizations",
        resource: "organizations",
        action: "update",
      },
      {
        name: "organizations:delete",
        description: "Delete organizations",
        resource: "organizations",
        action: "delete",
      },

      // Workspaces
      {
        name: "workspaces:create",
        description: "Create workspaces",
        resource: "workspaces",
        action: "create",
      },
      {
        name: "workspaces:read",
        description: "Read workspaces",
        resource: "workspaces",
        action: "read",
      },
      {
        name: "workspaces:update",
        description: "Update workspaces",
        resource: "workspaces",
        action: "update",
      },
      {
        name: "workspaces:delete",
        description: "Delete workspaces",
        resource: "workspaces",
        action: "delete",
      },

      // Tenants
      {
        name: "tenants:create",
        description: "Create tenants",
        resource: "tenants",
        action: "create",
      },
      {
        name: "tenants:read",
        description: "Read tenants",
        resource: "tenants",
        action: "read",
      },
      {
        name: "tenants:update",
        description: "Update tenants",
        resource: "tenants",
        action: "update",
      },
      {
        name: "tenants:delete",
        description: "Delete tenants",
        resource: "tenants",
        action: "delete",
      },

      // Groups
      {
        name: "groups:create",
        description: "Create groups",
        resource: "groups",
        action: "create",
      },
      {
        name: "groups:read",
        description: "Read groups",
        resource: "groups",
        action: "read",
      },
      {
        name: "groups:update",
        description: "Update groups",
        resource: "groups",
        action: "update",
      },
      {
        name: "groups:delete",
        description: "Delete groups",
        resource: "groups",
        action: "delete",
      },

      // Regions
      {
        name: "regions:create",
        description: "Create regions",
        resource: "regions",
        action: "create",
      },
      {
        name: "regions:read",
        description: "Read regions",
        resource: "regions",
        action: "read",
      },
      {
        name: "regions:update",
        description: "Update regions",
        resource: "regions",
        action: "update",
      },
      {
        name: "regions:delete",
        description: "Delete regions",
        resource: "regions",
        action: "delete",
      },

      // Platform management
      {
        name: "platform:manage",
        description: "Manage platform settings",
        resource: "platform",
        action: "manage",
      },
      {
        name: "platform:audit",
        description: "View audit logs",
        resource: "platform",
        action: "audit",
      },

      // Telemetry
      {
        name: "telemetry:read",
        description: "Read telemetry data",
        resource: "telemetry",
        action: "read",
      },
      {
        name: "telemetry:write",
        description: "Write telemetry data",
        resource: "telemetry",
        action: "write",
      },
      {
        name: "telemetry:manage",
        description: "Manage telemetry settings",
        resource: "telemetry",
        action: "manage",
      },

      // Dashboard
      {
        name: "dashboard:read",
        description: "View dashboards",
        resource: "dashboard",
        action: "read",
      },
      {
        name: "dashboard:write",
        description: "Create/edit dashboards",
        resource: "dashboard",
        action: "write",
      },
      {
        name: "dashboard:delete",
        description: "Delete dashboards",
        resource: "dashboard",
        action: "delete",
      },

      // Monitoring - Agent
      {
        name: "monitoring:agent:read",
        description: "View monitoring agents",
        resource: "monitoring:agent",
        action: "read",
      },
      {
        name: "monitoring:agent:write",
        description: "Manage monitoring agents",
        resource: "monitoring:agent",
        action: "write",
      },

      // Monitoring - VM
      {
        name: "monitoring:vm:read",
        description: "View virtual machines",
        resource: "monitoring:vm",
        action: "read",
      },
      {
        name: "monitoring:vm:write",
        description: "Manage virtual machines",
        resource: "monitoring:vm",
        action: "write",
      },
      {
        name: "monitoring:vm:delete",
        description: "Delete virtual machines",
        resource: "monitoring:vm",
        action: "delete",
      },

      // Monitoring - Kubernetes
      {
        name: "monitoring:kubernetes:read",
        description: "View Kubernetes clusters",
        resource: "monitoring:kubernetes",
        action: "read",
      },
      {
        name: "monitoring:kubernetes:write",
        description: "Manage Kubernetes clusters",
        resource: "monitoring:kubernetes",
        action: "write",
      },

      // Monitoring - Uptime
      {
        name: "monitoring:uptime:read",
        description: "View uptime monitors",
        resource: "monitoring:uptime",
        action: "read",
      },
      {
        name: "monitoring:uptime:manage",
        description: "Manage uptime monitors",
        resource: "monitoring:uptime",
        action: "manage",
      },

      // Monitoring - Status Page
      {
        name: "monitoring:status-page:read",
        description: "View status pages",
        resource: "monitoring:status-page",
        action: "read",
      },
      {
        name: "monitoring:status-page:manage",
        description: "Manage status pages",
        resource: "monitoring:status-page",
        action: "manage",
      },

      // Monitoring - Service Map
      {
        name: "monitoring:service-map:read",
        description: "View service map",
        resource: "monitoring:service-map",
        action: "read",
      },
      {
        name: "monitoring:service-map:manage",
        description: "Manage service map",
        resource: "monitoring:service-map",
        action: "manage",
      },

      // Monitoring - Network Map
      {
        name: "monitoring:network-map:read",
        description: "View network map",
        resource: "monitoring:network-map",
        action: "read",
      },
      {
        name: "monitoring:network-map:manage",
        description: "Manage network map",
        resource: "monitoring:network-map",
        action: "manage",
      },

      // Monitoring - DB Inventory
      {
        name: "monitoring:db-inventory:read",
        description: "View database inventory and instances",
        resource: "monitoring:db-inventory",
        action: "read",
      },
      {
        name: "monitoring:db-inventory:write",
        description: "Add and manage database instances",
        resource: "monitoring:db-inventory",
        action: "write",
      },
      {
        name: "monitoring:db-inventory:delete",
        description: "Remove database instances",
        resource: "monitoring:db-inventory",
        action: "delete",
      },

      // Monitoring - DB MySQL
      {
        name: "monitoring:db-mysql:read",
        description: "View MySQL database monitoring metrics and queries",
        resource: "monitoring:db-mysql",
        action: "read",
      },
      {
        name: "monitoring:db-mysql:write",
        description: "Manage MySQL database monitoring configuration",
        resource: "monitoring:db-mysql",
        action: "write",
      },
      {
        name: "monitoring:db-mysql:delete",
        description: "Delete MySQL database monitoring data",
        resource: "monitoring:db-mysql",
        action: "delete",
      },

      // Monitoring - DB MariaDB
      {
        name: "monitoring:db-mariadb:read",
        description: "View MariaDB database monitoring metrics and queries",
        resource: "monitoring:db-mariadb",
        action: "read",
      },
      {
        name: "monitoring:db-mariadb:write",
        description: "Manage MariaDB database monitoring configuration",
        resource: "monitoring:db-mariadb",
        action: "write",
      },
      {
        name: "monitoring:db-mariadb:delete",
        description: "Delete MariaDB database monitoring data",
        resource: "monitoring:db-mariadb",
        action: "delete",
      },

      // Monitoring - DB Percona
      {
        name: "monitoring:db-percona:read",
        description:
          "View Percona Server monitoring metrics, QRT, PXC, Thread Pool",
        resource: "monitoring:db-percona",
        action: "read",
      },
      {
        name: "monitoring:db-percona:write",
        description: "Manage Percona Server monitoring configuration",
        resource: "monitoring:db-percona",
        action: "write",
      },
      {
        name: "monitoring:db-percona:delete",
        description: "Delete Percona Server monitoring data",
        resource: "monitoring:db-percona",
        action: "delete",
      },

      // Monitoring - DB PostgreSQL
      {
        name: "monitoring:db-postgresql:read",
        description: "View PostgreSQL database monitoring metrics and queries",
        resource: "monitoring:db-postgresql",
        action: "read",
      },
      {
        name: "monitoring:db-postgresql:write",
        description: "Manage PostgreSQL database monitoring configuration",
        resource: "monitoring:db-postgresql",
        action: "write",
      },
      {
        name: "monitoring:db-postgresql:delete",
        description: "Delete PostgreSQL database monitoring data",
        resource: "monitoring:db-postgresql",
        action: "delete",
      },

      // Monitoring - DB ClickHouse
      {
        name: "monitoring:db-clickhouse:read",
        description: "View ClickHouse database monitoring metrics and queries",
        resource: "monitoring:db-clickhouse",
        action: "read",
      },
      {
        name: "monitoring:db-clickhouse:write",
        description: "Manage ClickHouse database monitoring configuration",
        resource: "monitoring:db-clickhouse",
        action: "write",
      },
      {
        name: "monitoring:db-clickhouse:delete",
        description: "Delete ClickHouse database monitoring data",
        resource: "monitoring:db-clickhouse",
        action: "delete",
      },

      // Monitoring - DB Query Analytics (QAN)
      {
        name: "monitoring:db-qan:read",
        description: "View query analytics across all database engines",
        resource: "monitoring:db-qan",
        action: "read",
      },
      {
        name: "monitoring:db-qan:write",
        description: "Manage query analytics filters and configuration",
        resource: "monitoring:db-qan",
        action: "write",
      },

      // Monitoring - DB TimescaleDB
      {
        name: "monitoring:db-timescaledb:read",
        description: "View TimescaleDB database monitoring metrics and queries",
        resource: "monitoring:db-timescaledb",
        action: "read",
      },
      {
        name: "monitoring:db-timescaledb:write",
        description:
          "Manage TimescaleDB instances and monitoring configuration",
        resource: "monitoring:db-timescaledb",
        action: "write",
      },
      {
        name: "monitoring:db-timescaledb:delete",
        description: "Delete TimescaleDB instances from monitoring",
        resource: "monitoring:db-timescaledb",
        action: "delete",
      },

      // Monitoring - DB MSSQL
      {
        name: "monitoring:db-mssql:read",
        description:
          "View Microsoft SQL Server database monitoring metrics and queries",
        resource: "monitoring:db-mssql",
        action: "read",
      },
      {
        name: "monitoring:db-mssql:write",
        description: "Manage MSSQL instances and monitoring configuration",
        resource: "monitoring:db-mssql",
        action: "write",
      },
      {
        name: "monitoring:db-mssql:delete",
        description: "Delete MSSQL instances from monitoring",
        resource: "monitoring:db-mssql",
        action: "delete",
      },

      // Monitoring - DB SQLite3
      {
        name: "monitoring:db-sqlite3:read",
        description: "View SQLite3 database monitoring metrics and queries",
        resource: "monitoring:db-sqlite3",
        action: "read",
      },
      {
        name: "monitoring:db-sqlite3:write",
        description: "Manage SQLite3 instances and monitoring configuration",
        resource: "monitoring:db-sqlite3",
        action: "write",
      },
      {
        name: "monitoring:db-sqlite3:delete",
        description: "Delete SQLite3 instances from monitoring",
        resource: "monitoring:db-sqlite3",
        action: "delete",
      },

      // Monitoring - DB MongoDB Community
      {
        name: "monitoring:db-mongodb-community:read",
        description:
          "View MongoDB Community database monitoring metrics and queries",
        resource: "monitoring:db-mongodb-community",
        action: "read",
      },
      {
        name: "monitoring:db-mongodb-community:write",
        description:
          "Manage MongoDB Community instances and monitoring configuration",
        resource: "monitoring:db-mongodb-community",
        action: "write",
      },
      {
        name: "monitoring:db-mongodb-community:delete",
        description: "Delete MongoDB Community instances from monitoring",
        resource: "monitoring:db-mongodb-community",
        action: "delete",
      },

      // Monitoring - DB MongoDB Atlas
      {
        name: "monitoring:db-mongodb-atlas:read",
        description:
          "View MongoDB Atlas database monitoring metrics and queries",
        resource: "monitoring:db-mongodb-atlas",
        action: "read",
      },
      {
        name: "monitoring:db-mongodb-atlas:write",
        description:
          "Manage MongoDB Atlas instances and monitoring configuration",
        resource: "monitoring:db-mongodb-atlas",
        action: "write",
      },
      {
        name: "monitoring:db-mongodb-atlas:delete",
        description: "Delete MongoDB Atlas instances from monitoring",
        resource: "monitoring:db-mongodb-atlas",
        action: "delete",
      },

      // Monitoring - DB AWS RDS MySQL
      {
        name: "monitoring:db-aws-rds-mysql:read",
        description:
          "View AWS RDS MySQL database monitoring metrics and queries",
        resource: "monitoring:db-aws-rds-mysql",
        action: "read",
      },
      {
        name: "monitoring:db-aws-rds-mysql:write",
        description:
          "Manage AWS RDS MySQL instances and monitoring configuration",
        resource: "monitoring:db-aws-rds-mysql",
        action: "write",
      },
      {
        name: "monitoring:db-aws-rds-mysql:delete",
        description: "Delete AWS RDS MySQL instances from monitoring",
        resource: "monitoring:db-aws-rds-mysql",
        action: "delete",
      },

      // Monitoring - DB AWS RDS Aurora
      {
        name: "monitoring:db-aws-rds-aurora:read",
        description:
          "View AWS RDS Aurora database monitoring metrics and queries",
        resource: "monitoring:db-aws-rds-aurora",
        action: "read",
      },
      {
        name: "monitoring:db-aws-rds-aurora:write",
        description:
          "Manage AWS RDS Aurora instances and monitoring configuration",
        resource: "monitoring:db-aws-rds-aurora",
        action: "write",
      },
      {
        name: "monitoring:db-aws-rds-aurora:delete",
        description: "Delete AWS RDS Aurora instances from monitoring",
        resource: "monitoring:db-aws-rds-aurora",
        action: "delete",
      },

      // Monitoring - DB AWS DynamoDB
      {
        name: "monitoring:db-aws-dynamodb:read",
        description:
          "View AWS DynamoDB database monitoring metrics and queries",
        resource: "monitoring:db-aws-dynamodb",
        action: "read",
      },
      {
        name: "monitoring:db-aws-dynamodb:write",
        description:
          "Manage AWS DynamoDB instances and monitoring configuration",
        resource: "monitoring:db-aws-dynamodb",
        action: "write",
      },
      {
        name: "monitoring:db-aws-dynamodb:delete",
        description: "Delete AWS DynamoDB instances from monitoring",
        resource: "monitoring:db-aws-dynamodb",
        action: "delete",
      },

      // Monitoring - DB CockroachDB
      {
        name: "monitoring:db-cockroachdb:read",
        description: "View CockroachDB database monitoring metrics and queries",
        resource: "monitoring:db-cockroachdb",
        action: "read",
      },
      {
        name: "monitoring:db-cockroachdb:write",
        description:
          "Manage CockroachDB instances and monitoring configuration",
        resource: "monitoring:db-cockroachdb",
        action: "write",
      },
      {
        name: "monitoring:db-cockroachdb:delete",
        description: "Delete CockroachDB instances from monitoring",
        resource: "monitoring:db-cockroachdb",
        action: "delete",
      },

      // Monitoring - DB AWS RDS PostgreSQL
      {
        name: "monitoring:db-aws-rds-postgresql:read",
        description:
          "View AWS RDS PostgreSQL database monitoring metrics and queries",
        resource: "monitoring:db-aws-rds-postgresql",
        action: "read",
      },
      {
        name: "monitoring:db-aws-rds-postgresql:write",
        description:
          "Manage AWS RDS PostgreSQL instances and monitoring configuration",
        resource: "monitoring:db-aws-rds-postgresql",
        action: "write",
      },
      {
        name: "monitoring:db-aws-rds-postgresql:delete",
        description: "Delete AWS RDS PostgreSQL instances from monitoring",
        resource: "monitoring:db-aws-rds-postgresql",
        action: "delete",
      },

      // Alerts
      {
        name: "alert:read",
        description: "View alerts and alert rules",
        resource: "alerts",
        action: "read",
      },
      {
        name: "alert:write",
        description: "Create and update alert rules",
        resource: "alerts",
        action: "write",
      },
      {
        name: "alert:delete",
        description: "Delete alert rules",
        resource: "alerts",
        action: "delete",
      },
      {
        name: "alert:manage",
        description: "Acknowledge and resolve alerts",
        resource: "alerts",
        action: "manage",
      },

      // Reports
      {
        name: "reports:read",
        description: "View reports and schedules",
        resource: "reports",
        action: "read",
      },
      {
        name: "reports:write",
        description: "Create and update reports and schedules",
        resource: "reports",
        action: "write",
      },
      {
        name: "reports:delete",
        description: "Delete reports and schedules",
        resource: "reports",
        action: "delete",
      },

      // Notifications
      {
        name: "notifications:read",
        description: "View notification channels and history",
        resource: "notifications",
        action: "read",
      },
      {
        name: "notifications:write",
        description: "Create and update notification channels",
        resource: "notifications",
        action: "write",
      },
      {
        name: "notifications:delete",
        description: "Delete notification channels",
        resource: "notifications",
        action: "delete",
      },

      // API Keys
      {
        name: "api-keys:read",
        description: "View API keys",
        resource: "api-keys",
        action: "read",
      },
      {
        name: "api-keys:write",
        description: "Create and rotate API keys",
        resource: "api-keys",
        action: "write",
      },
      {
        name: "api-keys:delete",
        description: "Delete API keys",
        resource: "api-keys",
        action: "delete",
      },

      // Retention
      {
        name: "retention:read",
        description: "View retention policies",
        resource: "retention",
        action: "read",
      },
      {
        name: "retention:manage",
        description: "Manage retention policies",
        resource: "retention",
        action: "manage",
      },

      // Subscription
      {
        name: "subscription:read",
        description: "View subscription details",
        resource: "subscription",
        action: "read",
      },
      {
        name: "subscription:manage",
        description: "Manage subscription plans",
        resource: "subscription",
        action: "manage",
      },

      // AI Assistant
      {
        name: "ai-assistant:read",
        description: "Access AI assistant",
        resource: "ai-assistant",
        action: "read",
      },
      {
        name: "ai-assistant:manage",
        description: "Configure AI assistant settings",
        resource: "ai-assistant",
        action: "manage",
      },

      // LLM
      {
        name: "llm:read",
        description: "View LLM conversations and providers",
        resource: "llm",
        action: "read",
      },
      {
        name: "llm:chat",
        description: "Send messages to LLM chat",
        resource: "llm",
        action: "chat",
      },
      {
        name: "llm:write",
        description: "Create and update LLM providers and conversations",
        resource: "llm",
        action: "write",
      },
      {
        name: "llm:delete",
        description: "Delete LLM providers and conversations",
        resource: "llm",
        action: "delete",
      },
      {
        name: "llm:insights",
        description: "Generate AI insights and analysis",
        resource: "llm",
        action: "insights",
      },

      // ── IAM controller aliases (grouped write permissions) ──
      // Menu group: IAM > Users, Roles, Groups, Permissions, Audit Logs
      {
        name: "users:write",
        description: "Create and update users",
        resource: "users",
        action: "write",
      },
      {
        name: "roles:write",
        description: "Create and update roles",
        resource: "roles",
        action: "write",
      },
      {
        name: "groups:write",
        description: "Create and update groups",
        resource: "groups",
        action: "write",
      },
      {
        name: "permissions:write",
        description: "Create and update permissions",
        resource: "permissions",
        action: "write",
      },
      {
        name: "audit:read",
        description: "View audit logs",
        resource: "audit",
        action: "read",
      },

      // ── Tenancy controller aliases (singular grouped write permissions) ──
      // Menu group: Tenancy > Regions, Organizations, Workspaces, Tenants
      {
        name: "region:read",
        description: "View regions",
        resource: "region",
        action: "read",
      },
      {
        name: "region:write",
        description: "Create and update regions",
        resource: "region",
        action: "write",
      },
      {
        name: "region:delete",
        description: "Delete regions",
        resource: "region",
        action: "delete",
      },
      {
        name: "organization:read",
        description: "View organizations",
        resource: "organization",
        action: "read",
      },
      {
        name: "organization:write",
        description: "Create and update organizations",
        resource: "organization",
        action: "write",
      },
      {
        name: "organization:delete",
        description: "Delete organizations",
        resource: "organization",
        action: "delete",
      },
      {
        name: "workspace:read",
        description: "View workspaces",
        resource: "workspace",
        action: "read",
      },
      {
        name: "workspace:write",
        description: "Create and update workspaces",
        resource: "workspace",
        action: "write",
      },
      {
        name: "workspace:delete",
        description: "Delete workspaces",
        resource: "workspace",
        action: "delete",
      },
      {
        name: "tenant:read",
        description: "View tenants",
        resource: "tenant",
        action: "read",
      },
      {
        name: "tenant:write",
        description: "Create and update tenants",
        resource: "tenant",
        action: "write",
      },
      {
        name: "tenant:delete",
        description: "Delete tenants",
        resource: "tenant",
        action: "delete",
      },

      // Data Masking (PII)
      {
        name: "data-masking:read",
        description: "View PII masking policies and built-in patterns",
        resource: "data-masking",
        action: "read",
      },
      {
        name: "data-masking:write",
        description: "Create and update PII masking policies and test rules",
        resource: "data-masking",
        action: "write",
      },
      {
        name: "data-masking:delete",
        description: "Delete PII masking policies",
        resource: "data-masking",
        action: "delete",
      },
      {
        name: "data-masking:manage",
        description: "Enable and disable PII masking policies",
        resource: "data-masking",
        action: "manage",
      },

      // AI Intelligence
      {
        name: "ai-intelligence:read",
        description:
          "Read AI Intelligence data (anomaly events, detection rules, predictions, remediation plans, cost data)",
        resource: "ai-intelligence",
        action: "read",
      },
      {
        name: "ai-intelligence:write",
        description:
          "Create and update AI Intelligence configurations (detection rules, prediction models, budgets)",
        resource: "ai-intelligence",
        action: "write",
      },
      {
        name: "ai-intelligence:delete",
        description: "Delete AI Intelligence configurations",
        resource: "ai-intelligence",
        action: "delete",
      },
      {
        name: "ai-intelligence:manage",
        description:
          "Full AI Intelligence management including admin operations",
        resource: "ai-intelligence",
        action: "manage",
      },

      // NOTE: monitoring write/delete aliases (monitoring:agent:delete, monitoring:kubernetes:delete,
      // monitoring:uptime:write, monitoring:status-page:write, monitoring:service-map:write/delete,
      // monitoring:network-map:write/delete) are inserted by migration
      // 1700000000018-AddMonitoringControllerPermissions which also handles role assignments.
    ];

    let inserted = 0;
    for (const perm of permissionDefinitions) {
      const wasInserted = await this.insertIfNotExists(
        dataSource,
        "permissions",
        {
          name: perm.name,
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
          is_active: true,
        },
        "name",
      );

      if (wasInserted) {
        this.logSuccess(`Created permission: ${perm.name}`);
        inserted++;
      } else {
        this.logSkip(`Permission exists: ${perm.name}`);
      }
    }

    this.log(
      `Permissions seeded: ${inserted} created, ${permissionDefinitions.length - inserted} skipped`,
    );
  }
}
