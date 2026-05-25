/**
 * API Keys Migration: Widen api_key_secret column
 * Timestamp: 1708000000003
 *
 * The api_key_secret stores a scrypt hash in format {salt_hex}:{hash_hex}
 * which is 32 + 1 + 128 = 161 characters, exceeding the original varchar(128).
 */

import { QueryRunner } from 'typeorm';
import { BaseMigration } from '../../../../../database/shared/BaseMigration';

export class WidenApiKeySecretColumn1708000000003 extends BaseMigration {
  name = 'WidenApiKeySecretColumn1708000000003';
  moduleName = 'api-keys';

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log('Widening api_key_secret column from varchar(128) to varchar(256)...');
    await queryRunner.query(`
      ALTER TABLE "api_keys"
      ALTER COLUMN "api_key_secret" TYPE varchar(256)
    `);
    this.log('api_key_secret column widened to varchar(256)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log('Reverting api_key_secret column to varchar(128)...');
    await queryRunner.query(`
      ALTER TABLE "api_keys"
      ALTER COLUMN "api_key_secret" TYPE varchar(128)
    `);
    this.log('api_key_secret column reverted to varchar(128)');
  }
}
