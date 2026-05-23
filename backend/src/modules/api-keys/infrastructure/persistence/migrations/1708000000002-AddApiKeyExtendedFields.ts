/**
 * API Keys Migration: Add Extended Fields
 * Timestamp: 1708000000002
 *
 * Changes:
 * - Rename key_hash → api_key_secret (SHA256 hash of TELEMETRYFLOW_API_KEY_SECRET)
 * - Add api_key_id: Public API key identifier (tfk_ prefix) — TELEMETRYFLOW_API_KEY_ID
 * - Add encrypt_key: Per-key encryption key (AES-256-GCM encrypted) — ENCRYPTION_KEY
 * - Add is_system: Marks system/native keys that cannot be deleted/revoked
 *
 * Each API key now has 3 named components:
 *   1. api_key_id     (tfk_ prefix) — public identifier
 *   2. api_key_secret (SHA256 hash of tfs_ secret) — authentication
 *   3. encrypt_key    (encrypted) — per-key encryption key
 */

import { QueryRunner, TableColumn, TableIndex } from 'typeorm';
import { BaseMigration } from '../../../../../database/shared/BaseMigration';

export class AddApiKeyExtendedFields1708000000002 extends BaseMigration {
  name = 'AddApiKeyExtendedFields1708000000002';
  moduleName = 'api-keys';

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log('Adding extended fields to api_keys table...');

    // Rename key_hash → api_key_secret
    const table = await queryRunner.getTable('api_keys');
    const keyHashColumn = table?.findColumnByName('key_hash');
    if (keyHashColumn) {
      await queryRunner.renameColumn('api_keys', 'key_hash', 'api_key_secret');
      this.log('Renamed column key_hash → api_key_secret');

      // Update the unique index name to match new column name
      try {
        await queryRunner.dropIndex('api_keys', 'IDX_api_keys_key_hash');
      } catch {
        // Index may not exist
      }
      await this.createIndexIfNotExists(
        queryRunner,
        'api_keys',
        new TableIndex({
          name: 'IDX_api_keys_api_key_secret',
          columnNames: ['api_key_secret'],
          isUnique: true,
        }),
      );
    }

    // Add api_key_id column (public identifier, tfk_ prefix)
    await this.addColumnIfNotExists(
      queryRunner,
      'api_keys',
      new TableColumn({
        name: 'api_key_id',
        type: 'varchar',
        length: '128',
        isNullable: true,
      }),
    );

    // Add encrypt_key column (per-key encryption key, stored encrypted with platform ENCRYPTION_KEY)
    await this.addColumnIfNotExists(
      queryRunner,
      'api_keys',
      new TableColumn({
        name: 'encrypt_key',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add is_system column (system keys cannot be deleted/revoked)
    await this.addColumnIfNotExists(
      queryRunner,
      'api_keys',
      new TableColumn({
        name: 'is_system',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    // Add unique index on api_key_id (where not null)
    await this.createIndexIfNotExists(
      queryRunner,
      'api_keys',
      new TableIndex({
        name: 'IDX_api_keys_api_key_id',
        columnNames: ['api_key_id'],
        isUnique: true,
        where: 'api_key_id IS NOT NULL',
      }),
    );

    this.log('Extended fields added to api_keys table successfully');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log('Removing extended fields from api_keys table...');

    await queryRunner.dropIndex('api_keys', 'IDX_api_keys_api_key_id').catch(() => {});
    await queryRunner.dropColumn('api_keys', 'is_system').catch(() => {});
    await queryRunner.dropColumn('api_keys', 'encrypt_key').catch(() => {});
    await queryRunner.dropColumn('api_keys', 'api_key_id').catch(() => {});

    // Rename api_key_secret back to key_hash
    const table = await queryRunner.getTable('api_keys');
    const secretColumn = table?.findColumnByName('api_key_secret');
    if (secretColumn) {
      try {
        await queryRunner.dropIndex('api_keys', 'IDX_api_keys_api_key_secret');
      } catch {
        // Index may not exist
      }
      await queryRunner.renameColumn('api_keys', 'api_key_secret', 'key_hash');
      await this.createIndexIfNotExists(
        queryRunner,
        'api_keys',
        new TableIndex({
          name: 'IDX_api_keys_key_hash',
          columnNames: ['key_hash'],
          isUnique: true,
        }),
      );
    }

    this.log('Extended fields removed from api_keys table');
  }
}
