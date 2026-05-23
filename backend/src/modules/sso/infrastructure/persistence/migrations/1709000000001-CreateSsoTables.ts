/**
 * SSO Migration: Create SSO Tables
 * Timestamp: 1709000000001 (SSO module range)
 *
 * Creates tables for:
 * - SSO providers (OAuth2, SAML, OIDC configurations)
 * - SSO connections (user's linked identities)
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';
import { BaseMigration } from '../../../../../database/shared/BaseMigration';

export class CreateSsoTables1709000000001 extends BaseMigration {
  name = 'CreateSsoTables1709000000001';
  moduleName = 'sso';

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log('Creating SSO tables...');

    // Create sso_providers table
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: 'sso_providers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'provider_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'provider_name',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'enabled',
            type: 'boolean',
            default: false,
          },
          // OAuth2/OIDC
          {
            name: 'client_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'client_secret',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'authorization_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'token_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'user_info_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'scopes',
            type: 'jsonb',
            default: "'[]'",
          },
          // SAML
          {
            name: 'entity_id',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sso_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'slo_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'certificate',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'private_key',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'signature_algorithm',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          // Common
          {
            name: 'callback_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'allowed_domains',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'auto_create_users',
            type: 'boolean',
            default: false,
          },
          {
            name: 'default_role_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'attribute_mapping',
            type: 'jsonb',
            isNullable: true,
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
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create sso_connections table
    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: 'sso_connections',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'provider_name',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'access_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'refresh_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'token_expires_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'last_login_at',
            type: 'timestamptz',
            isNullable: true,
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
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Foreign keys for sso_providers
    await this.createForeignKeyIfNotExists(
      queryRunner,
      'sso_providers',
      new TableForeignKey({
        name: 'FK_sso_providers_organization',
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['organization_id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign keys for sso_connections
    await this.createForeignKeyIfNotExists(
      queryRunner,
      'sso_connections',
      new TableForeignKey({
        name: 'FK_sso_connections_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      'sso_connections',
      new TableForeignKey({
        name: 'FK_sso_connections_provider',
        columnNames: ['provider_id'],
        referencedTableName: 'sso_providers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Indexes for sso_providers
    await this.createIndexIfNotExists(
      queryRunner,
      'sso_providers',
      new TableIndex({
        name: 'IDX_sso_providers_organization_id',
        columnNames: ['organization_id'],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      'sso_providers',
      new TableIndex({
        name: 'IDX_sso_providers_org_provider',
        columnNames: ['organization_id', 'provider_name'],
        isUnique: true,
      }),
    );

    // Indexes for sso_connections
    await this.createIndexIfNotExists(
      queryRunner,
      'sso_connections',
      new TableIndex({
        name: 'IDX_sso_connections_user_id',
        columnNames: ['user_id'],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      'sso_connections',
      new TableIndex({
        name: 'IDX_sso_connections_provider_id',
        columnNames: ['provider_id'],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      'sso_connections',
      new TableIndex({
        name: 'IDX_sso_connections_user_provider',
        columnNames: ['user_id', 'provider_id'],
        isUnique: true,
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      'sso_connections',
      new TableIndex({
        name: 'IDX_sso_connections_external_provider',
        columnNames: ['external_id', 'provider_id'],
        isUnique: true,
      }),
    );

    // Comments
    await queryRunner.query(`
      COMMENT ON TABLE "sso_providers" IS 'SSO provider configurations (OAuth2, SAML, OIDC)'
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "sso_connections" IS 'User SSO connections (linked identities)'
    `);

    this.log('SSO tables created successfully');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log('Dropping SSO tables...');
    await queryRunner.dropTable('sso_connections', true, true, true);
    await queryRunner.dropTable('sso_providers', true, true, true);
    this.log('SSO tables dropped');
  }
}
