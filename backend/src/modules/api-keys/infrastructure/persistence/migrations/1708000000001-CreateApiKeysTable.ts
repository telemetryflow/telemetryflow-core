/**
 * API Keys Migration: Create API Keys Table
 * Timestamp: 1708000000001 (API Keys module range)
 *
 * Stores API keys for programmatic access including:
 * - Standard keys (tfk_ prefix) for regular API access
 * - Service keys (tfs_ prefix) for service-to-service communication
 * - Key rotation and revocation tracking
 * - Usage statistics
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';
import { BaseMigration } from '../../../../../database/shared/BaseMigration';

export class CreateApiKeysTable1708000000001 extends BaseMigration {
  name = 'CreateApiKeysTable1708000000001';
  moduleName = 'api-keys';

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log('Creating api_keys table...');

    // Create key type enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'api_key_type') THEN
          CREATE TYPE api_key_type AS ENUM (
            'standard',
            'service'
          );
        END IF;
      END
      $$;
    `);

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: 'api_keys',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'workspace_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'key_type',
            type: 'api_key_type',
            default: "'standard'",
            isNullable: false,
          },
          {
            name: 'key_prefix',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'key_hash',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'key_hint',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'permissions',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'scopes',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'rate_limit',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'last_used_ip',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'usage_count',
            type: 'bigint',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'revoked_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'revocation_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rotated_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'rotated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'rotation_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
    );

    // Foreign keys
    await this.createForeignKeyIfNotExists(
      queryRunner,
      'api_keys',
      new TableForeignKey({
        name: 'FK_api_keys_organization',
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['organization_id'],
        onDelete: 'CASCADE',
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      'api_keys',
      new TableForeignKey({
        name: 'FK_api_keys_workspace',
        columnNames: ['workspace_id'],
        referencedTableName: 'workspaces',
        referencedColumnNames: ['workspace_id'],
        onDelete: 'SET NULL',
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      'api_keys',
      new TableForeignKey({
        name: 'FK_api_keys_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    // Indexes
    await this.createIndexIfNotExists(
      queryRunner,
      'api_keys',
      new TableIndex({
        name: 'IDX_api_keys_key_hash',
        columnNames: ['key_hash'],
        isUnique: true,
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      'api_keys',
      new TableIndex({
        name: 'IDX_api_keys_organization_id',
        columnNames: ['organization_id'],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      'api_keys',
      new TableIndex({
        name: 'IDX_api_keys_organization_active',
        columnNames: ['organization_id', 'is_active'],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      'api_keys',
      new TableIndex({
        name: 'IDX_api_keys_key_prefix',
        columnNames: ['key_prefix'],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      'api_keys',
      new TableIndex({
        name: 'IDX_api_keys_workspace_id',
        columnNames: ['workspace_id'],
        where: 'workspace_id IS NOT NULL',
      }),
    );

    // Add comment
    await queryRunner.query(`
      COMMENT ON TABLE "api_keys" IS 'Stores API keys for programmatic access to the platform'
    `);

    // Create updated_at trigger function if not exists
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger for updated_at
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_api_keys_updated_at ON api_keys;
      CREATE TRIGGER trigger_api_keys_updated_at
        BEFORE UPDATE ON api_keys
        FOR EACH ROW
        EXECUTE FUNCTION update_api_keys_updated_at();
    `);

    this.log('API keys table created successfully');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log('Dropping api_keys table...');
    await queryRunner.query(`DROP TRIGGER IF EXISTS trigger_api_keys_updated_at ON api_keys`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_api_keys_updated_at`);
    await queryRunner.dropTable('api_keys', true, true, true);
    await queryRunner.query(`DROP TYPE IF EXISTS api_key_type`);
    this.log('API keys table dropped');
  }
}
