/**
 * IAM Module Seeds Index
 *
 * Exports all IAM seeds in execution order with dependency resolution.
 */

import type { PostgresSeed } from "../../../../../database/shared/interfaces";

// Import all seeds
import { RegionsSeed } from "./01-RegionsSeed";
import { OrganizationsSeed } from "./02-OrganizationsSeed";
import { WorkspacesSeed } from "./03-WorkspacesSeed";
import { TenantsSeed } from "./04-TenantsSeed";
import { RolesSeed } from "./05-RolesSeed";
import { PermissionsSeed } from "./06-PermissionsSeed";
import { RolePermissionsSeed } from "./07-RolePermissionsSeed";
import { DefaultUsersSeed } from "./08-DefaultUsersSeed";

/**
 * All IAM module seeds in execution order
 */
export const IAMSeeds: (new () => PostgresSeed)[] = [
  RegionsSeed,
  OrganizationsSeed,
  WorkspacesSeed,
  TenantsSeed,
  RolesSeed,
  PermissionsSeed,
  RolePermissionsSeed,
  DefaultUsersSeed,
];

/**
 * IAM Module seed configuration
 */
export const IAMSeedConfig = {
  moduleName: "iam",
  database: "postgres" as const,
  seeds: IAMSeeds,
};

// Re-export individual seeds for direct import if needed
export {
  RegionsSeed,
  OrganizationsSeed,
  WorkspacesSeed,
  TenantsSeed,
  RolesSeed,
  PermissionsSeed,
  RolePermissionsSeed,
  DefaultUsersSeed,
};
