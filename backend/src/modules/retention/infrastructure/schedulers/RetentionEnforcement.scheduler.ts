import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { RetentionEnforcementService } from '../../application/services/RetentionEnforcement.service';

@Injectable()
export class RetentionEnforcementScheduler {
  private readonly logger = new Logger(RetentionEnforcementScheduler.name);
  private readonly isEnabled: boolean;

  constructor(
    private readonly enforcementService: RetentionEnforcementService,
    private readonly configService: ConfigService,
  ) {
    this.isEnabled = this.configService.get<boolean>('RETENTION_SCHEDULER_ENABLED', true);
  }

  /**
   * Run retention enforcement daily at 2:00 AM UTC
   * This ensures old data is cleaned up according to configured policies
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyRetention() {
    if (!this.isEnabled) {
      this.logger.debug('Retention scheduler is disabled');
      return;
    }

    this.logger.log('Starting daily retention enforcement...');
    const startTime = Date.now();

    try {
      const results = await this.enforcementService.enforceRetention();

      const totalDeleted = results.reduce((sum, r) => sum + r.recordsDeleted, 0);
      const hasErrors = results.some((r) => r.errors && r.errors.length > 0);

      if (hasErrors) {
        this.logger.warn(
          `Daily retention completed with errors. Total records deleted: ${totalDeleted}`,
        );
        results
          .filter((r) => r.errors && r.errors.length > 0)
          .forEach((r) => {
            this.logger.error(`${r.dataType}: ${r.errors?.join(', ')}`);
          });
      } else {
        this.logger.log(
          `Daily retention completed successfully. Total records deleted: ${totalDeleted}`,
        );
      }

      this.logger.log(`Retention enforcement took ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error(`Failed to run daily retention: ${error.message}`, error.stack);
    }
  }

  /**
   * Run a quick check every hour to see if any policies need urgent enforcement
   * This handles cases where data is growing faster than expected
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyCheck() {
    if (!this.isEnabled) {
      return;
    }

    this.logger.debug('Running hourly retention check...');

    try {
      // Get statistics to check if any data type is significantly over retention
      const stats = await this.enforcementService.getStatistics();

      for (const stat of stats) {
        if (stat.recordsToDelete && stat.recordsToDelete > 1000000) {
          // More than 1M records to delete
          this.logger.warn(
            `${stat.dataType} has ${stat.recordsToDelete} records pending deletion. Consider running manual enforcement.`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to run hourly retention check: ${error.message}`);
    }
  }

  /**
   * Run weekly report on retention status
   * Generates a summary of data retention across all types
   */
  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyReport() {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Generating weekly retention report...');

    try {
      const stats = await this.enforcementService.getStatistics();

      this.logger.log('=== Weekly Retention Report ===');
      for (const stat of stats) {
        this.logger.log(`
          Data Type: ${stat.dataType}
          Total Records: ${stat.totalRecords}
          Estimated Size: ${stat.estimatedSize}
          Oldest Record: ${stat.oldestRecord?.toISOString() || 'N/A'}
          Newest Record: ${stat.newestRecord?.toISOString() || 'N/A'}
          Retention Policy: ${stat.retentionPolicy?.name || 'None'}
          Retention Days: ${stat.retentionPolicy?.retentionDays || 'N/A'}
          Records to Delete: ${stat.recordsToDelete || 0}
        `);
      }
      this.logger.log('=== End of Weekly Report ===');
    } catch (error) {
      this.logger.error(`Failed to generate weekly report: ${error.message}`);
    }
  }

  // =========================================================================
  // Backup Schedules — Outside operational hours 01:00-04:00 GMT+7
  // =========================================================================

  /**
   * Daily backup at 18:00 UTC (01:00 GMT+7)
   * PostgreSQL & ClickHouse raw data -> S3
   */
  @Cron('0 18 * * *')
  async handleDailyBackup() {
    if (!this.isEnabled) {
      this.logger.debug('Backup scheduler is disabled');
      return;
    }

    this.logger.log('Starting daily backup (01:00 GMT+7 / 18:00 UTC)...');
    const startTime = Date.now();

    try {
      await this.enforcementService.executeBackup('daily');
      this.logger.log(`Daily backup completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error(`Daily backup failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Weekly backup every Friday at 19:00 UTC (02:00 GMT+7 Saturday)
   * PostgreSQL & ClickHouse raw data -> S3
   */
  @Cron('0 19 * * 5')
  async handleWeeklyBackup() {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Starting weekly backup (02:00 GMT+7 Sat / 19:00 UTC Fri)...');
    const startTime = Date.now();

    try {
      await this.enforcementService.executeBackup('weekly');
      this.logger.log(`Weekly backup completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error(`Weekly backup failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Monthly backup on 1st at 20:00 UTC (03:00 GMT+7 2nd)
   * PostgreSQL & ClickHouse raw data -> S3
   */
  @Cron('0 20 1 * *')
  async handleMonthlyBackup() {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Starting monthly backup (03:00 GMT+7 2nd / 20:00 UTC 1st)...');
    const startTime = Date.now();

    try {
      await this.enforcementService.executeBackup('monthly');
      this.logger.log(`Monthly backup completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      this.logger.error(`Monthly backup failed: ${error.message}`, error.stack);
    }
  }

  // =========================================================================
  // ClickHouse Per-Organization Cleanup
  // =========================================================================

  /**
   * ClickHouse cleanup at 21:00 UTC (04:00 GMT+7) daily
   *
   * Per-organization cleanup:
   * - DevOpsCorner: data older than 7 days
   * - TelemetryFlow: data older than 5 days
   * - Default (all others): data older than 31 days
   */
  @Cron('0 21 * * *')
  async handleClickHouseCleanup() {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Starting ClickHouse per-org cleanup (04:00 GMT+7 / 21:00 UTC)...');
    const startTime = Date.now();

    try {
      const results = await this.enforcementService.enforceClickHouseCleanup();

      const totalDeleted = results.reduce((sum, r) => sum + r.recordsDeleted, 0);
      this.logger.log(
        `ClickHouse cleanup completed: ${totalDeleted} records deleted in ${Date.now() - startTime}ms`,
      );
    } catch (error) {
      this.logger.error(`ClickHouse cleanup failed: ${error.message}`, error.stack);
    }
  }
}
