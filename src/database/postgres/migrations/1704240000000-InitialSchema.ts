import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial Schema Migration - Deprecated
 * 
 * This migration has been split into multiple files:
 * - 1704240000001-CreateRegionsTable.ts
 * - 1704240000002-CreateOrganizationsTable.ts
 * - 1704240000003-CreateWorkspacesTable.ts
 * - 1704240000004-CreateTenantsTable.ts
 * - 1704240000005-CreateGroupsTable.ts
 * - 1704240000006-CreateUsersTable.ts
 * - 1704240000007-CreateRBACTables.ts
 * - 1704240000008-CreateJunctionTables.ts
 */
export class InitialSchema1704240000000 implements MigrationInterface {
  name = 'InitialSchema1704240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️  This migration is deprecated. Use individual table migrations instead.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️  This migration is deprecated. Use individual table migrations instead.');
  }
}
