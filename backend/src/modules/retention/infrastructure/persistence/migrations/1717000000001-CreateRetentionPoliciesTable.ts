import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRetentionPoliciesTable1717000000001 implements MigrationInterface {
  name = 'CreateRetentionPoliciesTable1717000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create data_type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE data_type_enum AS ENUM ('logs', 'metrics', 'traces', 'alerts', 'exemplars');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create retention_policies table
    await queryRunner.createTable(
      new Table({
        name: 'retention_policies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'data_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'retention_days',
            type: 'integer',
          },
          {
            name: 'archive_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'archive_destination',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'filters',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'last_enforced_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'retention_policies',
      new TableIndex({
        name: 'IDX_retention_policies_organization_id',
        columnNames: ['organization_id'],
      }),
    );

    await queryRunner.createIndex(
      'retention_policies',
      new TableIndex({
        name: 'IDX_retention_policies_org_data_type',
        columnNames: ['organization_id', 'data_type'],
      }),
    );

    await queryRunner.createIndex(
      'retention_policies',
      new TableIndex({
        name: 'IDX_retention_policies_data_type_active',
        columnNames: ['data_type', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'retention_policies',
      new TableIndex({
        name: 'IDX_retention_policies_is_default',
        columnNames: ['is_default'],
        where: 'is_default = true',
      }),
    );

    // Insert default retention policies
    await queryRunner.query(`
      INSERT INTO retention_policies (id, name, description, data_type, retention_days, archive_enabled, is_default, is_active, created_at, updated_at)
      VALUES
        (gen_random_uuid(), 'Default Logs Retention', 'Default retention policy for log data', 'logs', 30, false, true, true, NOW(), NOW()),
        (gen_random_uuid(), 'Default Metrics Retention', 'Default retention policy for metrics data', 'metrics', 90, false, true, true, NOW(), NOW()),
        (gen_random_uuid(), 'Default Traces Retention', 'Default retention policy for trace data', 'traces', 14, false, true, true, NOW(), NOW()),
        (gen_random_uuid(), 'Default Alerts Retention', 'Default retention policy for alert history', 'alerts', 365, false, true, true, NOW(), NOW()),
        (gen_random_uuid(), 'Default Exemplars Retention', 'Default retention policy for exemplar data', 'exemplars', 7, false, true, true, NOW(), NOW())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('retention_policies', 'IDX_retention_policies_is_default');
    await queryRunner.dropIndex('retention_policies', 'IDX_retention_policies_data_type_active');
    await queryRunner.dropIndex('retention_policies', 'IDX_retention_policies_org_data_type');
    await queryRunner.dropIndex('retention_policies', 'IDX_retention_policies_organization_id');
    await queryRunner.dropTable('retention_policies');
    await queryRunner.query('DROP TYPE IF EXISTS data_type_enum');
  }
}
