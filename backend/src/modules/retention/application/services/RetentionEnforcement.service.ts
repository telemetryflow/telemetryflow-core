import { Injectable, Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import {
  DataType,
  RetentionPolicy,
} from "../../domain/aggregates/RetentionPolicy";
import {
  IRetentionPolicyRepository,
  RETENTION_POLICY_REPOSITORY,
} from "../../domain/repositories/IRetentionPolicyRepository";
import {
  EnforceRetentionResultDto,
  RetentionStatisticsDto,
} from "../dto/RetentionPolicyResponse.dto";
import { ClickHouseService } from "../../../../shared/clickhouse/clickhouse.service";

/** ClickHouse tables subject to per-org cleanup */
const CLICKHOUSE_TABLES = [
  "metrics",
  "logs",
  "traces",
  "exemplars",
  "uptime_checks",
  "audit_logs",
  "kubernetes_metrics",
  "llm_usage_raw",
  "network_map_connection_metrics",
  "network_map_traffic",
  "service_map_metrics",
  "signal_correlations",
  "vm_metrics",
] as const;

type ClickHouseDataType =
  | "metrics"
  | "logs"
  | "traces"
  | "exemplars"
  | "uptime"
  | "audit_logs"
  | "kubernetes_metrics"
  | "llm_usage_raw"
  | "network_map_connection_metrics"
  | "network_map_traffic"
  | "service_map_metrics"
  | "signal_correlations"
  | "vm_metrics";

@Injectable()
export class RetentionEnforcementService {
  private readonly logger = new Logger(RetentionEnforcementService.name);

  constructor(
    @Inject(RETENTION_POLICY_REPOSITORY)
    private readonly repository: IRetentionPolicyRepository,
    private readonly clickhouseService: ClickHouseService,
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async enforceRetention(
    dataType?: DataType,
    organizationId?: string,
    dryRun: boolean = false,
  ): Promise<EnforceRetentionResultDto[]> {
    const results: EnforceRetentionResultDto[] = [];
    const startTime = Date.now();

    // Get active policies
    let policies = await this.repository.findActivePolicies();

    // Filter by data type if specified
    if (dataType) {
      policies = policies.filter((p) => p.dataType === dataType);
    }

    // Filter by organization if specified
    if (organizationId) {
      policies = policies.filter(
        (p) =>
          p.organizationId === organizationId || p.organizationId === undefined,
      );
    }

    this.logger.log(
      `Enforcing retention for ${policies.length} policies (dryRun: ${dryRun})`,
    );

    for (const policy of policies) {
      const cutoffDate = policy.getCutoffDate();
      const policyDataType = policy.dataType;

      try {
        let recordsDeleted = 0;
        let spaceReclaimed = "0 bytes";

        if (!dryRun) {
          // Actual deletion based on data type
          const deleteResult = await this.deleteOldData(
            policyDataType,
            cutoffDate,
            policy.organizationId,
            policy.filters,
          );

          recordsDeleted = deleteResult.recordsDeleted;
          spaceReclaimed = deleteResult.spaceReclaimed;

          // Mark policy as enforced
          policy.markEnforced();
          await this.repository.save(policy);
        } else {
          // Estimate records to delete
          const estimate = await this.estimateDataToDelete(
            policyDataType,
            cutoffDate,
            policy.organizationId,
            policy.filters,
          );

          recordsDeleted = estimate.recordsToDelete;
          spaceReclaimed = estimate.estimatedSize;
        }

        results.push({
          dataType: policyDataType,
          recordsDeleted,
          spaceReclaimed,
          duration: Date.now() - startTime,
          dryRun,
        });

        this.logger.log(
          `Retention enforced for ${policyDataType}: ${recordsDeleted} records ${dryRun ? "would be" : ""} deleted`,
        );
      } catch (error) {
        this.logger.error(
          `Error enforcing retention for ${policyDataType}: ${error.message}`,
        );
        results.push({
          dataType: policyDataType,
          recordsDeleted: 0,
          spaceReclaimed: "0 bytes",
          duration: Date.now() - startTime,
          dryRun,
          errors: [error.message],
        });
      }
    }

    return results;
  }

  async getStatistics(
    organizationId?: string,
    dataType?: DataType,
  ): Promise<RetentionStatisticsDto[]> {
    const statistics: RetentionStatisticsDto[] = [];
    const dataTypes: DataType[] = dataType
      ? [dataType]
      : [
          "metrics",
          "logs",
          "traces",
          "exemplars",
          "alerts",
          "uptime",
          "audit_logs",
          "kubernetes_metrics",
          "llm_usage_raw",
          "network_map_connection_metrics",
          "network_map_traffic",
          "service_map_metrics",
          "signal_correlations",
          "vm_metrics",
        ];

    for (const type of dataTypes) {
      const policies = await this.repository.findByDataType(
        type,
        organizationId,
      );
      const policy = policies[0]; // Use the first matching policy (org-specific or default)

      const cutoffDate = policy ? policy.getCutoffDate() : undefined;
      const stats = await this.getDataTypeStatistics(
        type,
        organizationId,
        cutoffDate,
      );

      statistics.push({
        dataType: type,
        totalRecords: stats.totalRecords,
        oldestRecord: stats.oldestRecord,
        newestRecord: stats.newestRecord,
        estimatedSize: stats.estimatedSize,
        retentionPolicy: policy
          ? {
              name: policy.name,
              retentionDays: policy.retentionDays,
              cutoffDate: policy.getCutoffDate(),
            }
          : undefined,
        recordsToDelete: stats.recordsToDelete,
        estimatedSizeToDelete: stats.estimatedSizeToDelete,
      });
    }

    return statistics;
  }

  private async deleteOldData(
    dataType: DataType,
    cutoffDate: Date,
    organizationId?: string,
    filters?: Record<string, string>,
  ): Promise<{ recordsDeleted: number; spaceReclaimed: string }> {
    this.logger.log(
      `Deleting ${dataType} data older than ${cutoffDate.toISOString()} for org: ${organizationId || "all"}`,
    );

    try {
      const client = this.clickhouseService.getClient();
      const cutoffTimestamp = cutoffDate
        .toISOString()
        .replace("T", " ")
        .replace("Z", "");

      // Map data types to ClickHouse table names
      const tableMap: Record<DataType, string | null> = {
        logs: "logs",
        metrics: "metrics",
        traces: "traces",
        exemplars: "exemplars",
        uptime: "uptime_checks",
        alerts: null, // alerts are in PostgreSQL
        audit_logs: "audit_logs",
        kubernetes_metrics: "kubernetes_metrics",
        llm_usage_raw: "llm_usage_raw",
        network_map_connection_metrics: "network_map_connection_metrics",
        network_map_traffic: "network_map_traffic",
        service_map_metrics: "service_map_metrics",
        signal_correlations: "signal_correlations",
        vm_metrics: "vm_metrics",
      };

      const tableName = tableMap[dataType];

      if (!tableName) {
        // Handle PostgreSQL data (alerts)
        this.logger.warn(
          `PostgreSQL deletion for ${dataType} not yet implemented`,
        );
        return {
          recordsDeleted: 0,
          spaceReclaimed: "0 bytes",
        };
      }

      const ALLOWED_FILTER_KEYS = new Set([
        "data_type",
        "severity",
        "status",
        "service_name",
        "host_name",
        "environment",
        "trace_id",
        "span_id",
      ]);

      const whereClauses: string[] = ["timestamp < {cutoff:String}"];
      const queryParams: Record<string, string> = { cutoff: cutoffTimestamp };

      if (organizationId) {
        whereClauses.push("organization_id = {orgId:String}");
        queryParams.orgId = organizationId;
      }

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (ALLOWED_FILTER_KEYS.has(key)) {
            const paramKey = `filter_${key}`;
            whereClauses.push(`${key} = {${paramKey}:String}`);
            queryParams[paramKey] = value;
          }
        }
      }

      const whereClause = whereClauses.join(" AND ");

      const query = `
        ALTER TABLE ${this.clickhouseService.getDatabase()}.${tableName} DELETE
        WHERE ${whereClause}
      `;

      await client.command({ query, query_params: queryParams });

      this.logger.log(
        `[deleteOldData] Initiated deletion for ${tableName} WHERE ${whereClause}`,
      );

      // Note: ClickHouse mutations are async, so we can't get immediate counts
      return {
        recordsDeleted: 0, // Would need separate COUNT query before deletion
        spaceReclaimed: "0 bytes", // Would need to track disk usage
      };
    } catch (error) {
      this.logger.error(
        `[deleteOldData] Failed for ${dataType}: ${error.message}`,
      );
      return {
        recordsDeleted: 0,
        spaceReclaimed: "0 bytes",
      };
    }
  }

  private async estimateDataToDelete(
    dataType: DataType,
    cutoffDate: Date,
    organizationId?: string,
    _filters?: Record<string, string>,
  ): Promise<{ recordsToDelete: number; estimatedSize: string }> {
    // This would query ClickHouse/PostgreSQL to estimate data to delete
    // For now, return placeholder values
    this.logger.log(
      `Estimating ${dataType} data older than ${cutoffDate.toISOString()} for org: ${organizationId || "all"}`,
    );

    return {
      recordsToDelete: 0,
      estimatedSize: "0 bytes",
    };
  }

  private async getDataTypeStatistics(
    dataType: DataType,
    organizationId?: string,
    cutoffDate?: Date,
  ): Promise<{
    totalRecords: number;
    oldestRecord?: Date;
    newestRecord?: Date;
    estimatedSize: string;
    recordsToDelete?: number;
    estimatedSizeToDelete?: string;
  }> {
    const empty = {
      totalRecords: 0,
      oldestRecord: undefined,
      newestRecord: undefined,
      estimatedSize: "0 bytes",
      recordsToDelete: 0,
      estimatedSizeToDelete: "0 bytes",
    };

    try {
      if (dataType === "alerts") {
        return await this.getAlertStatistics(organizationId, cutoffDate);
      }
      if (dataType === "uptime") {
        return await this.getUptimeStatistics(organizationId, cutoffDate);
      }
      return await this.getClickHouseStatistics(
        dataType as ClickHouseDataType,
        organizationId,
        cutoffDate,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to get ${dataType} statistics: ${error.message}`,
      );
      return empty;
    }
  }

  /** Real ClickHouse statistics for logs / metrics / traces / exemplars. */
  private async getClickHouseStatistics(
    dataType: ClickHouseDataType,
    organizationId?: string,
    cutoffDate?: Date,
  ): Promise<{
    totalRecords: number;
    oldestRecord?: Date;
    newestRecord?: Date;
    estimatedSize: string;
    recordsToDelete?: number;
    estimatedSizeToDelete?: string;
  }> {
    const client = this.clickhouseService.getClient();
    const table = this.clickhouseService.qualifyTable(dataType);
    const db = this.clickhouseService.getDatabase();

    const conditions: string[] = [];
    const queryParams: Record<string, string | number> = {};

    if (organizationId) {
      conditions.push("organization_id = {orgId:String}");
      queryParams.orgId = organizationId;
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const cutoffFragment = cutoffDate
      ? `, countIf(timestamp < {cutoff:DateTime64(9)}) AS records_to_delete`
      : "";
    if (cutoffDate) {
      queryParams.cutoff = cutoffDate
        .toISOString()
        .replace("T", " ")
        .replace("Z", "");
    }

    const statsResult = await client.query({
      query: `
        SELECT
          count()               AS total_records,
          min(timestamp)        AS oldest_record,
          max(timestamp)        AS newest_record
          ${cutoffFragment}
        FROM ${table}
        ${where}
      `,
      query_params: queryParams,
      format: "JSONEachRow",
    });
    const statsRows = (await statsResult.json()) as any[];
    const s = statsRows[0] ?? {};

    const sizeResult = await client.query({
      query: `
        SELECT sum(data_compressed_bytes) AS compressed_bytes
        FROM system.parts
        WHERE database = {db:String} AND table = {tbl:String} AND active = 1
      `,
      query_params: { db, tbl: dataType },
      format: "JSONEachRow",
    });
    const sizeRows = (await sizeResult.json()) as any[];
    const compressedBytes = Number(sizeRows[0]?.compressed_bytes ?? 0);

    const totalRecords = Number(s.total_records ?? 0);
    const recordsToDelete = cutoffDate
      ? Number(s.records_to_delete ?? 0)
      : undefined;
    const estimatedSizeToDeleteBytes =
      totalRecords > 0 && recordsToDelete !== undefined
        ? Math.round((compressedBytes * recordsToDelete) / totalRecords)
        : 0;

    return {
      totalRecords,
      oldestRecord: s.oldest_record
        ? new Date(s.oldest_record as string)
        : undefined,
      newestRecord: s.newest_record
        ? new Date(s.newest_record as string)
        : undefined,
      estimatedSize: this.formatBytes(compressedBytes),
      recordsToDelete,
      estimatedSizeToDelete: this.formatBytes(estimatedSizeToDeleteBytes),
    };
  }

  /** PostgreSQL statistics for alerts (alert_instances table, timestamp = starts_at). */
  private async getAlertStatistics(
    organizationId?: string,
    cutoffDate?: Date,
  ): Promise<{
    totalRecords: number;
    oldestRecord?: Date;
    newestRecord?: Date;
    estimatedSize: string;
    recordsToDelete?: number;
    estimatedSizeToDelete?: string;
  }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (organizationId) {
      conditions.push(`organization_id = $${idx++}`);
      params.push(organizationId);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let cutoffSelect = "";
    if (cutoffDate) {
      cutoffSelect = `, COUNT(*) FILTER (WHERE starts_at < $${idx}) AS records_to_delete`;
      params.push(cutoffDate);
    }

    const rows = await this.dataSource.query(
      `SELECT
         COUNT(*)        AS total_records,
         MIN(starts_at)  AS oldest_record,
         MAX(starts_at)  AS newest_record
         ${cutoffSelect}
       FROM alert_instances
       ${where}`,
      params,
    );
    const r = rows[0] ?? {};

    const totalRecords = Number(r.total_records ?? 0);
    const recordsToDelete = cutoffDate
      ? Number(r.records_to_delete ?? 0)
      : undefined;

    return {
      totalRecords,
      oldestRecord: r.oldest_record
        ? new Date(r.oldest_record as string)
        : undefined,
      newestRecord: r.newest_record
        ? new Date(r.newest_record as string)
        : undefined,
      estimatedSize: `${totalRecords} rows`,
      recordsToDelete,
      estimatedSizeToDelete:
        recordsToDelete !== undefined ? `${recordsToDelete} rows` : undefined,
    };
  }

  /** ClickHouse statistics for uptime (uptime_checks table, timestamp = checked_at). */
  private async getUptimeStatistics(
    organizationId?: string,
    cutoffDate?: Date,
  ): Promise<{
    totalRecords: number;
    oldestRecord?: Date;
    newestRecord?: Date;
    estimatedSize: string;
    recordsToDelete?: number;
    estimatedSizeToDelete?: string;
  }> {
    const client = this.clickhouseService.getClient();
    const table = this.clickhouseService.qualifyTable("uptime_checks");
    const db = this.clickhouseService.getDatabase();

    const conditions: string[] = [];
    const queryParams: Record<string, string | number> = {};

    if (organizationId) {
      conditions.push("organization_id = {orgId:String}");
      queryParams.orgId = organizationId;
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const cutoffFragment = cutoffDate
      ? `, countIf(checked_at < {cutoff:DateTime64(3)}) AS records_to_delete`
      : "";
    if (cutoffDate) {
      queryParams.cutoff = cutoffDate
        .toISOString()
        .replace("T", " ")
        .replace("Z", "");
    }

    const statsResult = await client.query({
      query: `
        SELECT
          count()           AS total_records,
          min(checked_at)   AS oldest_record,
          max(checked_at)   AS newest_record
          ${cutoffFragment}
        FROM ${table}
        ${where}
      `,
      query_params: queryParams,
      format: "JSONEachRow",
    });
    const statsRows = (await statsResult.json()) as any[];
    const s = statsRows[0] ?? {};

    const sizeResult = await client.query({
      query: `
        SELECT sum(data_compressed_bytes) AS compressed_bytes
        FROM system.parts
        WHERE database = {db:String} AND table = {tbl:String} AND active = 1
      `,
      query_params: { db, tbl: "uptime_checks" },
      format: "JSONEachRow",
    });
    const sizeRows = (await sizeResult.json()) as any[];
    const compressedBytes = Number(sizeRows[0]?.compressed_bytes ?? 0);

    const totalRecords = Number(s.total_records ?? 0);
    const recordsToDelete = cutoffDate
      ? Number(s.records_to_delete ?? 0)
      : undefined;
    const estimatedSizeToDeleteBytes =
      totalRecords > 0 && recordsToDelete !== undefined
        ? Math.round((compressedBytes * recordsToDelete) / totalRecords)
        : 0;

    return {
      totalRecords,
      oldestRecord: s.oldest_record
        ? new Date(s.oldest_record as string)
        : undefined,
      newestRecord: s.newest_record
        ? new Date(s.newest_record as string)
        : undefined,
      estimatedSize: this.formatBytes(compressedBytes),
      recordsToDelete,
      estimatedSizeToDelete: this.formatBytes(estimatedSizeToDeleteBytes),
    };
  }

  /**
   * Returns data volume stats for all 13 ClickHouse data types by reusing
   * getStatistics() — the exact same source as the Retention page, so numbers always match.
   */
  async getDataVolumeStats(organizationId: string): Promise<{
    logIngestionGb: number;
    metricDataPoints: number;
    traceSpans: number;
    exemplars: number;
    uptimeChecks: number;
    auditLogs: number;
    kubernetesMetrics: number;
    llmUsage: number;
    networkMapConnections: number;
    networkMapTraffic: number;
    serviceMapMetrics: number;
    signalCorrelations: number;
    vmMetrics: number;
  }> {
    const zero = {
      logIngestionGb: 0,
      metricDataPoints: 0,
      traceSpans: 0,
      exemplars: 0,
      uptimeChecks: 0,
      auditLogs: 0,
      kubernetesMetrics: 0,
      llmUsage: 0,
      networkMapConnections: 0,
      networkMapTraffic: 0,
      serviceMapMetrics: 0,
      signalCorrelations: 0,
      vmMetrics: 0,
    };

    try {
      const [
        logStats,
        metricStats,
        traceStats,
        exemplarStats,
        uptimeStats,
        auditStats,
        k8sStats,
        llmStats,
        nmConnStats,
        nmTrafficStats,
        svcMapStats,
        correlationStats,
        vmStats,
      ] = await Promise.all([
        this.getStatistics(organizationId, "logs" as DataType),
        this.getStatistics(organizationId, "metrics" as DataType),
        this.getStatistics(organizationId, "traces" as DataType),
        this.getStatistics(organizationId, "exemplars" as DataType),
        this.getStatistics(organizationId, "uptime" as DataType),
        this.getStatistics(organizationId, "audit_logs" as DataType),
        this.getStatistics(organizationId, "kubernetes_metrics" as DataType),
        this.getStatistics(organizationId, "llm_usage_raw" as DataType),
        this.getStatistics(organizationId, "network_map_connection_metrics" as DataType),
        this.getStatistics(organizationId, "network_map_traffic" as DataType),
        this.getStatistics(organizationId, "service_map_metrics" as DataType),
        this.getStatistics(organizationId, "signal_correlations" as DataType),
        this.getStatistics(organizationId, "vm_metrics" as DataType),
      ]);

      return {
        logIngestionGb: this.parseSizeToGb(logStats[0]?.estimatedSize ?? "0 bytes"),
        metricDataPoints: metricStats[0]?.totalRecords ?? 0,
        traceSpans: traceStats[0]?.totalRecords ?? 0,
        exemplars: exemplarStats[0]?.totalRecords ?? 0,
        uptimeChecks: uptimeStats[0]?.totalRecords ?? 0,
        auditLogs: auditStats[0]?.totalRecords ?? 0,
        kubernetesMetrics: k8sStats[0]?.totalRecords ?? 0,
        llmUsage: llmStats[0]?.totalRecords ?? 0,
        networkMapConnections: nmConnStats[0]?.totalRecords ?? 0,
        networkMapTraffic: nmTrafficStats[0]?.totalRecords ?? 0,
        serviceMapMetrics: svcMapStats[0]?.totalRecords ?? 0,
        signalCorrelations: correlationStats[0]?.totalRecords ?? 0,
        vmMetrics: vmStats[0]?.totalRecords ?? 0,
      };
    } catch (error) {
      this.logger.warn(
        `[getDataVolumeStats] Failed for org ${organizationId}: ${error.message}`,
      );
      return zero;
    }
  }

  private parseSizeToGb(sizeStr: string): number {
    const match = sizeStr.match(/^([\d.]+)\s*(bytes|KB|MB|GB|TB)$/);
    if (!match) return 0;
    const bytesMap: Record<string, number> = {
      bytes: 1,
      KB: 1024,
      MB: 1024 ** 2,
      GB: 1024 ** 3,
      TB: 1024 ** 4,
    };
    const bytes = parseFloat(match[1]) * (bytesMap[match[2]] ?? 1);
    return parseFloat((bytes / 1024 ** 3).toFixed(4));
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 bytes";
    const k = 1024;
    const sizes = ["bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // =========================================================================
  // Backup Execution
  // =========================================================================

  /**
   * Execute a scheduled backup (daily, weekly, or monthly).
   *
   * Queries active backup_schedule policies and executes the backup
   * for each organization that has the matching schedule type.
   *
   * Backup targets: PostgreSQL (pg_dump) and ClickHouse raw data.
   * Destination: S3 bucket from the policy's archive_destination.
   */
  async executeBackup(
    scheduleType: "daily" | "weekly" | "monthly",
  ): Promise<void> {
    const startTime = Date.now();

    const allPolicies = await this.repository.findActivePolicies();
    const backupPolicies = this.filterPoliciesByType(
      allPolicies,
      "backup_schedule",
      {
        schedule_type: scheduleType,
      },
    );

    if (backupPolicies.length === 0) {
      this.logger.warn(`No active ${scheduleType} backup policies found`);
      return;
    }

    this.logger.log(
      `Executing ${scheduleType} backup for ${backupPolicies.length} organization(s)...`,
    );

    for (const policy of backupPolicies) {
      const orgId = policy.organizationId || "global";
      const destination = policy.archiveDestination || "unknown";

      try {
        this.logger.log(
          `[${scheduleType}] Backing up org=${orgId} -> ${destination}`,
        );

        // Execute backup workflow
        await this.performBackup(orgId, destination, scheduleType);

        // Mark policy as enforced
        policy.markEnforced();
        await this.repository.save(policy);

        this.logger.log(
          `[${scheduleType}] Backup completed for org=${orgId} (${Date.now() - startTime}ms)`,
        );
      } catch (error) {
        this.logger.error(
          `[${scheduleType}] Backup failed for org=${orgId}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Perform backup for a specific organization
   * Backs up PostgreSQL and ClickHouse data to S3
   */
  private async performBackup(
    organizationId: string,
    destination: string,
    scheduleType: string,
  ): Promise<void> {
    const { execFile } = require("child_process");
    const { promisify } = require("util");
    const execFileAsync = promisify(execFile);
    const fs = require("fs").promises;
    const path = require("path");
    const os = require("os");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(
      os.tmpdir(),
      `backup-${organizationId}-${timestamp}`,
    );

    try {
      // Create temp directory
      await fs.mkdir(backupDir, { recursive: true });
      this.logger.log(`[backup] Created temp directory: ${backupDir}`);

      // 1. PostgreSQL backup
      const pgBackupFile = path.join(backupDir, "postgres.backup");
      const pgHost = this.configService.get("POSTGRES_HOST", "localhost");
      const pgPort = this.configService.get("POSTGRES_PORT", "5432");
      const pgDb = this.configService.get("POSTGRES_DB", "telemetryflow");
      const pgUser = this.configService.get("POSTGRES_USER", "postgres");
      const pgPassword = this.configService.get("POSTGRES_PASSWORD", "");

      this.logger.log(
        `[backup] Starting PostgreSQL backup for org=${organizationId}`,
      );

      try {
        await execFileAsync(
          "pg_dump",
          [
            "-h",
            pgHost,
            "-p",
            pgPort,
            "-U",
            pgUser,
            "-d",
            pgDb,
            "-F",
            "c",
            "-f",
            pgBackupFile,
          ],
          {
            env: { ...process.env, PGPASSWORD: pgPassword },
            maxBuffer: 1024 * 1024 * 100,
          },
        );
        this.logger.log(
          `[backup] PostgreSQL backup completed: ${pgBackupFile}`,
        );
      } catch (error) {
        this.logger.warn(
          `[backup] PostgreSQL backup skipped or failed: ${error.message}`,
        );
      }

      // 2. ClickHouse backup for each table
      const chHost = this.configService.get("CLICKHOUSE_HOST", "localhost");
      const chPort = this.configService.get("CLICKHOUSE_PORT", "8123");
      const chDb = this.configService.get("CLICKHOUSE_DB", "telemetryflow_db");
      const chUser = this.configService.get("CLICKHOUSE_USER", "default");
      const chPassword = this.configService.get("CLICKHOUSE_PASSWORD", "");

      this.logger.log(
        `[backup] Starting ClickHouse backup for org=${organizationId}`,
      );

      for (const table of CLICKHOUSE_TABLES) {
        const chBackupFile = path.join(backupDir, `clickhouse_${table}.native`);

        if (!/^[0-9a-fA-F-]{36}$/.test(organizationId)) {
          throw new Error(`Invalid organizationId format: ${organizationId}`);
        }
        const chQuery = `SELECT * FROM ${chDb}.${table} WHERE organization_id = '${organizationId}' FORMAT Native`;

        try {
          const { spawn } = require("child_process");
          await new Promise<void>((resolve, reject) => {
            const out = require("fs").createWriteStream(chBackupFile);
            const proc = spawn(
              "clickhouse-client",
              [
                "--host",
                chHost,
                "--port",
                chPort,
                "--user",
                chUser,
                "--password",
                chPassword,
                "--query",
                chQuery,
              ],
              { timeout: 300000 },
            );
            proc.stdout.pipe(out);
            proc.stderr.on("data", () => {});
            proc.on("close", (code: number) =>
              code === 0
                ? resolve()
                : reject(new Error(`exit ${code}`)),
            );
          });
          this.logger.log(`[backup] ClickHouse ${table} backup completed`);
        } catch (error) {
          this.logger.warn(
            `[backup] ClickHouse ${table} backup failed: ${error.message}`,
          );
        }
      }

      // 3. Upload to S3
      this.logger.log(`[backup] Uploading to S3: ${destination}`);

      // Parse S3 destination (format: s3://bucket-name/path/)
      const s3Match = destination.match(/s3:\/\/([^/]+)\/(.*)/);
      if (s3Match) {
        const [, bucket, prefix] = s3Match;
        const s3Path = `${prefix}/${scheduleType}/${timestamp}/`;
        try {
          await execFileAsync("aws", [
            "s3",
            "cp",
            backupDir,
            `s3://${bucket}/${s3Path}`,
            "--recursive",
          ]);
          this.logger.log(
            `[backup] S3 upload completed to s3://${bucket}/${s3Path}`,
          );
        } catch (error) {
          this.logger.error(`[backup] S3 upload failed: ${error.message}`);
          throw error; // Re-throw to mark backup as failed
        }
      } else {
        this.logger.warn(
          `[backup] Invalid S3 destination format: ${destination}`,
        );
      }

      // 4. Cleanup temp files
      this.logger.log(`[backup] Cleaning up temp directory: ${backupDir}`);
      await fs.rm(backupDir, { recursive: true, force: true });
    } catch (error) {
      // Cleanup on error
      try {
        await fs.rm(backupDir, { recursive: true, force: true });
      } catch (cleanupError) {
        this.logger.error(`[backup] Cleanup failed: ${cleanupError.message}`);
      }
      throw error;
    }
  }

  // =========================================================================
  // ClickHouse Per-Organization Cleanup
  // =========================================================================

  /**
   * Enforce per-organization ClickHouse data cleanup.
   *
   * Policy lookup order:
   * 1. Org-specific clickhouse_cleanup policy (e.g. DevOpsCorner 7d, TelemetryFlow 5d)
   * 2. Global default clickhouse_cleanup policy (31d) for any org without a specific policy
   *
   * Applies to all ClickHouse telemetry tables: logs, metrics, traces, exemplars.
   */
  async enforceClickHouseCleanup(): Promise<EnforceRetentionResultDto[]> {
    const results: EnforceRetentionResultDto[] = [];
    const startTime = Date.now();

    const allPolicies = await this.repository.findActivePolicies();
    const cleanupPolicies = this.filterPoliciesByType(
      allPolicies,
      "clickhouse_cleanup",
    );

    if (cleanupPolicies.length === 0) {
      this.logger.warn("No active ClickHouse cleanup policies found");
      return results;
    }

    // Separate org-specific and global default policies
    const orgPolicies = cleanupPolicies.filter((p) => p.organizationId);
    const globalDefault = cleanupPolicies.find(
      (p) => !p.organizationId && p.filters?.is_global_default === "true",
    );

    // Execute org-specific cleanups
    for (const policy of orgPolicies) {
      const orgId = policy.organizationId!;
      const cutoffDate = policy.getCutoffDate();

      this.logger.log(
        `ClickHouse cleanup: org=${orgId}, retention=${policy.retentionDays}d, cutoff=${cutoffDate.toISOString()}`,
      );

      for (const table of CLICKHOUSE_TABLES) {
        try {
          // Execute ClickHouse deletion (async mutation)
          const client = this.clickhouseService.getClient();
          const cutoffTimestamp = cutoffDate
            .toISOString()
            .replace("T", " ")
            .replace("Z", "");

          const query = `
            ALTER TABLE ${this.clickhouseService.getDatabase()}.${table} DELETE
            WHERE organization_id = {orgId:String}
              AND timestamp < {cutoff:String}
          `;

          await client.command({
            query,
            query_params: { orgId, cutoff: cutoffTimestamp },
          });

          this.logger.log(
            `[cleanup] Initiated deletion for ${table} WHERE org=${orgId} AND timestamp < ${cutoffDate.toISOString()}`,
          );
        } catch (error) {
          this.logger.error(
            `[cleanup] Failed for ${table} org=${orgId}: ${error.message}`,
          );
        }
      }

      policy.markEnforced();
      await this.repository.save(policy);

      results.push({
        dataType: "logs",
        recordsDeleted: 0,
        spaceReclaimed: "0 bytes",
        duration: Date.now() - startTime,
        dryRun: false,
      });
    }

    // Execute global default for orgs without specific policies
    if (globalDefault) {
      const cutoffDate = globalDefault.getCutoffDate();

      this.logger.log(
        `ClickHouse global cleanup: retention=${globalDefault.retentionDays}d, cutoff=${cutoffDate.toISOString()}`,
      );

      for (const table of CLICKHOUSE_TABLES) {
        try {
          // Execute ClickHouse deletion for orgs without specific policies (async mutation)
          const client = this.clickhouseService.getClient();
          const cutoffTimestamp = cutoffDate
            .toISOString()
            .replace("T", " ")
            .replace("Z", "");

          const excludedOrgIds = orgPolicies.map((p) => p.organizationId);

          let query: string;
          let queryParams: Record<string, string | string[]>;

          if (excludedOrgIds.length > 0) {
            query = `
              ALTER TABLE ${this.clickhouseService.getDatabase()}.${table} DELETE
              WHERE organization_id NOT IN ({excludedOrgs:Array(String)})
                AND timestamp < {cutoff:String}
            `;
            queryParams = {
              excludedOrgs: excludedOrgIds as unknown as string,
              cutoff: cutoffTimestamp,
            };
          } else {
            query = `
              ALTER TABLE ${this.clickhouseService.getDatabase()}.${table} DELETE
              WHERE timestamp < {cutoff:String}
            `;
            queryParams = { cutoff: cutoffTimestamp };
          }

          await client.command({ query, query_params: queryParams });

          this.logger.log(
            `[cleanup] Initiated global deletion for ${table} WHERE org NOT IN (${excludedOrgIds.join(", ") || "none"}) AND timestamp < ${cutoffDate.toISOString()}`,
          );
        } catch (error) {
          this.logger.error(
            `[cleanup] Failed for ${table} (global): ${error.message}`,
          );
        }
      }

      globalDefault.markEnforced();
      await this.repository.save(globalDefault);

      results.push({
        dataType: "logs",
        recordsDeleted: 0,
        spaceReclaimed: "0 bytes",
        duration: Date.now() - startTime,
        dryRun: false,
      });
    }

    return results;
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  /**
   * Filter policies by policy_type stored in the JSONB filters column.
   */
  private filterPoliciesByType(
    policies: RetentionPolicy[],
    policyType: string,
    additionalFilter?: Record<string, string>,
  ): RetentionPolicy[] {
    return policies.filter((p) => {
      const filters = p.filters;
      if (!filters || filters.policy_type !== policyType) return false;
      if (additionalFilter) {
        return Object.entries(additionalFilter).every(
          ([key, value]) => filters[key] === value,
        );
      }
      return true;
    });
  }
}
