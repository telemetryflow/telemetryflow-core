/**
 * Alerting Migration: Add TFQL Support to Alert Rules
 * Timestamp: 1710000000010 (TASK-03)
 *
 * Adds columns for:
 * - query_language: Type of query language used (condition, tfql, promql, elasticsearch, sql)
 * - query_string: Raw query string when using TFQL/PromQL
 * - parsed_ast: Cached parsed AST for performance
 * - query_target: TFQL fetch target (metrics, logs, traces, etc.)
 * - source_type: Alert source (prometheus, tfo-agent, tfo-collector, custom)
 */

import { QueryRunner, TableColumn, TableIndex } from 'typeorm';
import { BaseMigration } from '../../../../../database/shared/BaseMigration';

export class AddTfqlToAlertRules1710000000010 extends BaseMigration {
  name = 'AddTfqlToAlertRules1710000000010';
  moduleName = 'alerting';

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log('Adding TFQL support columns to alert_rules...');

    // Add query_language column
    await queryRunner.addColumn(
      'alert_rules',
      new TableColumn({
        name: 'query_language',
        type: 'varchar',
        length: '20',
        default: "'condition'",
        isNullable: false,
        comment: 'Query language used: condition (legacy), tfql, promql, elasticsearch, sql',
      })
    );

    // Add query_string column
    await queryRunner.addColumn(
      'alert_rules',
      new TableColumn({
        name: 'query_string',
        type: 'text',
        isNullable: true,
        comment: 'Raw query string when using TFQL/PromQL',
      })
    );

    // Add parsed_ast column
    await queryRunner.addColumn(
      'alert_rules',
      new TableColumn({
        name: 'parsed_ast',
        type: 'jsonb',
        isNullable: true,
        comment: 'Cached parsed AST for performance',
      })
    );

    // Add query_target column
    await queryRunner.addColumn(
      'alert_rules',
      new TableColumn({
        name: 'query_target',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'TFQL fetch target: metrics, logs, traces, etc.',
      })
    );

    // Add source_type column
    await queryRunner.addColumn(
      'alert_rules',
      new TableColumn({
        name: 'source_type',
        type: 'varchar',
        length: '20',
        default: "'prometheus'",
        isNullable: false,
        comment: 'Alert source: prometheus, tfo-agent, tfo-collector, custom',
      })
    );

    // Add check constraint for query_language
    await queryRunner.query(`
      ALTER TABLE "alert_rules"
      ADD CONSTRAINT "CHK_alert_rules_query_language"
      CHECK ("query_language" IN ('condition', 'tfql', 'promql', 'elasticsearch', 'sql'))
    `);

    // Add check constraint for source_type
    await queryRunner.query(`
      ALTER TABLE "alert_rules"
      ADD CONSTRAINT "CHK_alert_rules_source_type"
      CHECK ("source_type" IN ('prometheus', 'tfo-agent', 'tfo-collector', 'custom'))
    `);

    // Add check constraint for query_target
    await queryRunner.query(`
      ALTER TABLE "alert_rules"
      ADD CONSTRAINT "CHK_alert_rules_query_target"
      CHECK ("query_target" IS NULL OR "query_target" IN ('metrics', 'logs', 'traces', 'exemplars', 'correlations', 'agents'))
    `);

    // Add index for source_type filtering
    await this.createIndexIfNotExists(
      queryRunner,
      'alert_rules',
      new TableIndex({
        name: 'IDX_alert_rules_source_type',
        columnNames: ['source_type'],
      })
    );

    // Add index for query_language filtering
    await this.createIndexIfNotExists(
      queryRunner,
      'alert_rules',
      new TableIndex({
        name: 'IDX_alert_rules_query_language',
        columnNames: ['query_language'],
      })
    );

    // Add composite index for organization + source_type
    await this.createIndexIfNotExists(
      queryRunner,
      'alert_rules',
      new TableIndex({
        name: 'IDX_alert_rules_org_source_type',
        columnNames: ['organization_id', 'source_type'],
      })
    );

    // Add column comments
    await queryRunner.query(`
      COMMENT ON COLUMN "alert_rules"."query_language" IS 'Query language used: condition (legacy), tfql, promql, elasticsearch, sql'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "alert_rules"."query_string" IS 'Raw query string when using TFQL/PromQL'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "alert_rules"."parsed_ast" IS 'Cached parsed AST for performance optimization'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "alert_rules"."query_target" IS 'TFQL fetch target: metrics, logs, traces, exemplars, correlations, agents'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "alert_rules"."source_type" IS 'Alert source type: prometheus (traditional), tfo-agent (host monitoring), tfo-collector (OTEL), custom'
    `);

    this.log('TFQL support columns added successfully');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log('Removing TFQL support columns from alert_rules...');

    // Drop indexes first
    await queryRunner.dropIndex('alert_rules', 'IDX_alert_rules_org_source_type');
    await queryRunner.dropIndex('alert_rules', 'IDX_alert_rules_query_language');
    await queryRunner.dropIndex('alert_rules', 'IDX_alert_rules_source_type');

    // Drop check constraints
    await queryRunner.query(`ALTER TABLE "alert_rules" DROP CONSTRAINT "CHK_alert_rules_query_target"`);
    await queryRunner.query(`ALTER TABLE "alert_rules" DROP CONSTRAINT "CHK_alert_rules_source_type"`);
    await queryRunner.query(`ALTER TABLE "alert_rules" DROP CONSTRAINT "CHK_alert_rules_query_language"`);

    // Drop columns
    await queryRunner.dropColumn('alert_rules', 'source_type');
    await queryRunner.dropColumn('alert_rules', 'query_target');
    await queryRunner.dropColumn('alert_rules', 'parsed_ast');
    await queryRunner.dropColumn('alert_rules', 'query_string');
    await queryRunner.dropColumn('alert_rules', 'query_language');

    this.log('TFQL support columns removed');
  }
}
