import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { createClient, ClickHouseClient } from '@clickhouse/client';

export enum AuditEventType {
  AUTH = 'AUTH',
  AUTHZ = 'AUTHZ',
  DATA = 'DATA',
  SYSTEM = 'SYSTEM',
}

export enum AuditEventResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  DENIED = 'DENIED',
}

export interface CreateAuditLogOptions {
  userId?: string;
  userEmail?: string;
  eventType: AuditEventType;
  action: string;
  resource?: string;
  result: AuditEventResult;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  tenantId?: string;
  organizationId?: string;
}

@Injectable()
export class AuditService {
  private readonly context = AuditService.name;
  private clickhouse: ClickHouseClient;

  constructor(private readonly logger: LoggerService) {
    const host = process.env.CLICKHOUSE_HOST || 'localhost';
    const port = process.env.CLICKHOUSE_PORT || '8123';
    const url = host.startsWith('http') ? host : `http://${host}:${port}`;

    this.clickhouse = createClient({
      url,
      database: process.env.CLICKHOUSE_DB || 'telemetry',
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || '',
    });
  }

  async log(options: CreateAuditLogOptions): Promise<void> {
    try {
      const logLevel = options.result === AuditEventResult.SUCCESS ? 'log' : 'warn';
      const resource = options.resource ? ` ${options.resource}` : '';
      const message = `[${options.eventType}] ${options.action}${resource} - ${options.result}`;

      if (logLevel === 'log') {
        this.logger.log(`✓ ${message}`, this.context);
      } else {
        this.logger.warn(`⚠ ${message}`, this.context);
      }

      // Insert to ClickHouse
      await this.clickhouse.insert({
        table: 'audit_logs',
        values: [{
          user_id: options.userId || '',
          user_email: options.userEmail || '',
          user_first_name: '',
          user_last_name: '',
          event_type: options.eventType,
          action: options.action,
          resource: options.resource || '',
          result: options.result,
          ip_address: options.ipAddress || '',
          user_agent: options.userAgent || '',
          metadata: JSON.stringify(options.metadata || {}),
          error_message: options.errorMessage || '',
          tenant_id: options.tenantId || '',
          workspace_id: '',
          organization_id: options.organizationId || '',
          session_id: '',
          duration_ms: options.metadata?.duration || 0,
        }],
        format: 'JSONEachRow',
      });
    } catch (error) {
      this.logger.error(`✗ Failed to create audit log: ${error.message}`, error.stack, this.context);
    }
  }

  async logAuth(action: string, result: AuditEventResult, options: Partial<CreateAuditLogOptions> = {}): Promise<void> {
    return this.log({ eventType: AuditEventType.AUTH, action, result, ...options });
  }

  async logAuthz(action: string, result: AuditEventResult, options: Partial<CreateAuditLogOptions> = {}): Promise<void> {
    return this.log({ eventType: AuditEventType.AUTHZ, action, result, ...options });
  }

  async logData(action: string, result: AuditEventResult, options: Partial<CreateAuditLogOptions> = {}): Promise<void> {
    return this.log({ eventType: AuditEventType.DATA, action, result, ...options });
  }

  async logSystem(action: string, result: AuditEventResult, options: Partial<CreateAuditLogOptions> = {}): Promise<void> {
    return this.log({ eventType: AuditEventType.SYSTEM, action, result, ...options });
  }

  async query(options: { limit?: number; offset?: number; userId?: string; action?: string }): Promise<any[]> {
    try {
      const { limit = 50, offset = 0, userId, action } = options;
      let query = `SELECT * FROM audit_logs WHERE 1=1`;

      if (userId) query += ` AND user_id = '${userId}'`;
      if (action) query += ` AND action = '${action}'`;

      query += ` ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;

      console.log('Executing query:', query);
      console.log('ClickHouse database:', process.env.CLICKHOUSE_DB);

      const result = await this.clickhouse.query({ query, format: 'JSONEachRow' });
      const data = await result.json();
      console.log('Query returned:', data.length, 'rows');
      return data;
    } catch (error) {
      console.error('Query error:', error);
      this.logger.error(`Failed to query logs: ${error.message}`, error.stack, this.context);
      return [];
    }
  }

  async getById(id: string): Promise<any> {
    try {
      const query = `SELECT * FROM audit_logs WHERE id = '${id}' LIMIT 1`;
      const result = await this.clickhouse.query({ query, format: 'JSONEachRow' });
      const rows = await result.json();
      return rows[0] || null;
    } catch (error) {
      this.logger.error(`Failed to get log: ${error.message}`, error.stack, this.context);
      return null;
    }
  }

  async count(): Promise<{ count: number }> {
    try {
      const query = `SELECT COUNT(*) as count FROM audit_logs`;
      const result = await this.clickhouse.query({ query, format: 'JSONEachRow' });
      const rows: any = await result.json();
      return { count: rows[0]?.count || 0 };
    } catch (error) {
      this.logger.error(`Failed to count logs: ${error.message}`, error.stack, this.context);
      return { count: 0 };
    }
  }

  async getStatistics(): Promise<any> {
    try {
      const query = `
        SELECT
          event_type,
          result,
          COUNT(*) as count
        FROM audit_logs
        GROUP BY event_type, result
      `;
      const result = await this.clickhouse.query({ query, format: 'JSONEachRow' });
      return await result.json();
    } catch (error) {
      this.logger.error(`Failed to get statistics: ${error.message}`, error.stack, this.context);
      return [];
    }
  }

  async export(_format: string): Promise<any[]> {
    return this.query({ limit: 10000, offset: 0 });
  }
}
