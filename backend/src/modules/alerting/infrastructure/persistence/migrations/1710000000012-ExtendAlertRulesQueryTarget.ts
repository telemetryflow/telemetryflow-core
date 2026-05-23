import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Extend CHK_alert_rules_query_target to include monitoring signal targets.
 *
 * Original constraint (migration 010) only allowed:
 *   metrics | logs | traces | exemplars | correlations | agents
 *
 * This migration adds:
 *   uptime | kubernetes | vm | status_page
 *
 * This allows alert rules to target uptime monitors (SSL expiry, downtime),
 * Kubernetes workloads, VM resources, and status page health.
 */
export class ExtendAlertRulesQueryTarget1710000000012
  implements MigrationInterface
{
  name = "ExtendAlertRulesQueryTarget1710000000012";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old constraint
    await queryRunner.query(`
      ALTER TABLE "alert_rules"
      DROP CONSTRAINT IF EXISTS "CHK_alert_rules_query_target"
    `);

    // Recreate with extended allowed values
    await queryRunner.query(`
      ALTER TABLE "alert_rules"
      ADD CONSTRAINT "CHK_alert_rules_query_target"
      CHECK (
        "query_target" IS NULL OR "query_target" IN (
          'metrics', 'logs', 'traces', 'exemplars', 'correlations', 'agents',
          'uptime', 'kubernetes', 'vm', 'status_page'
        )
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to original constraint (rows with new values will fail — truncate first if needed)
    await queryRunner.query(`
      ALTER TABLE "alert_rules"
      DROP CONSTRAINT IF EXISTS "CHK_alert_rules_query_target"
    `);

    await queryRunner.query(`
      ALTER TABLE "alert_rules"
      ADD CONSTRAINT "CHK_alert_rules_query_target"
      CHECK ("query_target" IS NULL OR "query_target" IN (
        'metrics', 'logs', 'traces', 'exemplars', 'correlations', 'agents'
      ))
    `);
  }
}
