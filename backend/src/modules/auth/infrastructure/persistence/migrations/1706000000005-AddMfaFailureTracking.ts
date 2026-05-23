import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add MFA failure tracking fields
 * Requirements: 7.5, 7.6
 * - Track MFA verification failures
 * - Implement MFA lockout after 5 failures
 * - Lock duration is 15 minutes
 */
export class AddMfaFailureTracking1706000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table) return;

    if (!table.findColumnByName('mfa_failure_count')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'mfa_failure_count',
          type: 'integer',
          default: 0,
          isNullable: false,
        }),
      );
    }

    if (!table.findColumnByName('mfa_locked_until')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'mfa_locked_until',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (!table) return;

    if (table.findColumnByName('mfa_locked_until')) {
      await queryRunner.dropColumn('users', 'mfa_locked_until');
    }
    if (table.findColumnByName('mfa_failure_count')) {
      await queryRunner.dropColumn('users', 'mfa_failure_count');
    }
  }
}
