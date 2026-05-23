/**
 * Auth Module Migrations Index
 *
 * Exports all Auth migrations in execution order.
 * Timestamp range: 1706000000000 - 1706999999999
 */

import { MigrationInterface } from "typeorm";

// Import all migrations
import { CreateAuthTokensTable1706000000001 } from "./1706000000001-CreateAuthTokensTable";
import { CreateUserSessionsTable1706000000002 } from "./1706000000002-CreateUserSessionsTable";
import { CreateKnownDevicesTable1706000000003 } from "./1706000000003-CreateKnownDevicesTable";
import { CreateSecurityLogsTable1706000000004 } from "./1706000000004-CreateSecurityLogsTable";
import { AddMfaFailureTracking1706000000005 } from "./1706000000005-AddMfaFailureTracking";
import { CreateInviteTokensTable1706000000006 } from "./1706000000006-CreateInviteTokensTable";

/**
 * All Auth module migrations in execution order
 */
export const AuthMigrations: (new () => MigrationInterface)[] = [
  CreateAuthTokensTable1706000000001,
  CreateUserSessionsTable1706000000002,
  CreateKnownDevicesTable1706000000003,
  CreateSecurityLogsTable1706000000004,
  AddMfaFailureTracking1706000000005,
  CreateInviteTokensTable1706000000006,
];

/**
 * Auth Module migration configuration
 */
export const AuthMigrationConfig = {
  moduleName: "auth",
  database: "postgres" as const,
  migrations: AuthMigrations,
};

// Re-export individual migrations for direct import if needed
export {
  CreateAuthTokensTable1706000000001,
  CreateUserSessionsTable1706000000002,
  CreateKnownDevicesTable1706000000003,
  CreateSecurityLogsTable1706000000004,
  AddMfaFailureTracking1706000000005,
};
