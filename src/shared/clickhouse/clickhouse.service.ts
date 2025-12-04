import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { ConfigService } from '@nestjs/config';

const MODULE_NAME = 'ClickHouse';

export interface LogRecord {
  timestamp?: Date | string;
  observed_timestamp?: Date | string;
  trace_id: string;
  span_id: string;
  trace_flags: number;
  severity_text: string;
  severity_number: number;
  service_name: string;
  organization_id?: string;
  workspace_id?: string;
  tenant_id?: string;
  body: string;
  resource_attributes?: Record<string, string>;
  scope_name?: string;
  scope_version?: string;
  log_attributes?: Record<string, string>;
}

export interface MetricRecord {
  timestamp: Date | string;
  metric_name: string;
  metric_type: 'gauge' | 'counter' | 'histogram' | 'summary';
  value: number;
  service_name: string;
  organization_id?: string;
  workspace_id?: string;
  tenant_id?: string;
  resource_attributes?: Record<string, string>;
  metric_attributes?: Record<string, string>;
  unit?: string;
}

export interface TraceRecord {
  timestamp: Date | string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  span_name: string;
  span_kind: 'UNSPECIFIED' | 'INTERNAL' | 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER';
  service_name: string;
  organization_id?: string;
  workspace_id?: string;
  tenant_id?: string;
  status_code: 'UNSET' | 'OK' | 'ERROR';
  status_message?: string;
  duration_ns: number;
  resource_attributes?: Record<string, string>;
  span_attributes?: Record<string, string>;
  events?: string[];
}

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger(MODULE_NAME);
  private client: ClickHouseClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('CLICKHOUSE_HOST', 'http://localhost:8123');
    const database = this.configService.get<string>('CLICKHOUSE_DB', 'telemetryflow_db');
    const username = this.configService.get<string>('CLICKHOUSE_USER', 'default');
    const password = this.configService.get<string>('CLICKHOUSE_PASSWORD', '');

    this.client = createClient({
      host,
      database,
      username,
      password,
    });

    this.logger.log(`ClickHouse client initialized: ${host}/${database}`);
  }

  getClient(): ClickHouseClient {
    return this.client;
  }

  // ==================== LOGS ====================

  async insertLog(log: LogRecord): Promise<void> {
    try {
      await this.client.insert({
        table: 'logs',
        values: [log],
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.logger.error(`Failed to insert log: ${error.message}`, error.stack);
      throw error;
    }
  }

  async insertLogs(logs: LogRecord[]): Promise<void> {
    if (logs.length === 0) return;

    try {
      await this.client.insert({
        table: 'logs',
        values: logs,
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.logger.error(`Failed to insert logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async queryLogs(params: {
    startTime?: Date;
    endTime?: Date;
    service_name?: string;
    severity?: string;
    trace_id?: string;
    organization_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<LogRecord[]> {
    const {
      startTime,
      endTime,
      service_name,
      severity,
      trace_id,
      organization_id,
      limit = 100,
      offset = 0,
    } = params;

    let query = 'SELECT * FROM logs WHERE 1=1';
    const conditions: string[] = [];

    if (startTime) conditions.push(`timestamp >= '${startTime.toISOString()}'`);
    if (endTime) conditions.push(`timestamp <= '${endTime.toISOString()}'`);
    if (service_name) conditions.push(`service_name = '${service_name}'`);
    if (severity) conditions.push(`severity_text = '${severity}'`);
    if (trace_id) conditions.push(`trace_id = '${trace_id}'`);
    if (organization_id) conditions.push(`organization_id = '${organization_id}'`);

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ` ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await this.client.query({ query, format: 'JSONEachRow' });
    return result.json() as Promise<LogRecord[]>;
  }

  // ==================== METRICS ====================

  async insertMetric(metric: MetricRecord): Promise<void> {
    try {
      await this.client.insert({
        table: 'metrics',
        values: [metric],
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.logger.error(`Failed to insert metric: ${error.message}`, error.stack);
      throw error;
    }
  }

  async insertMetrics(metrics: MetricRecord[]): Promise<void> {
    if (metrics.length === 0) return;

    try {
      await this.client.insert({
        table: 'metrics',
        values: metrics,
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.logger.error(`Failed to insert metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  async queryMetrics(params: {
    startTime?: Date;
    endTime?: Date;
    service_name?: string;
    metric_name?: string;
    organization_id?: string;
    limit?: number;
  }): Promise<MetricRecord[]> {
    const { startTime, endTime, service_name, metric_name, organization_id, limit = 1000 } = params;

    let query = 'SELECT * FROM metrics WHERE 1=1';
    const conditions: string[] = [];

    if (startTime) conditions.push(`timestamp >= '${startTime.toISOString()}'`);
    if (endTime) conditions.push(`timestamp <= '${endTime.toISOString()}'`);
    if (service_name) conditions.push(`service_name = '${service_name}'`);
    if (metric_name) conditions.push(`metric_name = '${metric_name}'`);
    if (organization_id) conditions.push(`organization_id = '${organization_id}'`);

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ` ORDER BY timestamp DESC LIMIT ${limit}`;

    const result = await this.client.query({ query, format: 'JSONEachRow' });
    return result.json() as Promise<MetricRecord[]>;
  }

  // ==================== TRACES ====================

  async insertTrace(trace: TraceRecord): Promise<void> {
    try {
      await this.client.insert({
        table: 'traces',
        values: [trace],
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.logger.error(`Failed to insert trace: ${error.message}`, error.stack);
      throw error;
    }
  }

  async insertTraces(traces: TraceRecord[]): Promise<void> {
    if (traces.length === 0) return;

    try {
      await this.client.insert({
        table: 'traces',
        values: traces,
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.logger.error(`Failed to insert traces: ${error.message}`, error.stack);
      throw error;
    }
  }

  async queryTraces(params: {
    startTime?: Date;
    endTime?: Date;
    service_name?: string;
    trace_id?: string;
    organization_id?: string;
    limit?: number;
  }): Promise<TraceRecord[]> {
    const { startTime, endTime, service_name, trace_id, organization_id, limit = 100 } = params;

    let query = 'SELECT * FROM traces WHERE 1=1';
    const conditions: string[] = [];

    if (startTime) conditions.push(`timestamp >= '${startTime.toISOString()}'`);
    if (endTime) conditions.push(`timestamp <= '${endTime.toISOString()}'`);
    if (service_name) conditions.push(`service_name = '${service_name}'`);
    if (trace_id) conditions.push(`trace_id = '${trace_id}'`);
    if (organization_id) conditions.push(`organization_id = '${organization_id}'`);

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ` ORDER BY timestamp DESC LIMIT ${limit}`;

    const result = await this.client.query({ query, format: 'JSONEachRow' });
    return result.json() as Promise<TraceRecord[]>;
  }

  // ==================== UTILITY ====================

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      this.logger.error(`ClickHouse ping failed: ${error.message}`);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
    this.logger.log(`ClickHouse client closed`);
  }
}
