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
      database: process.env.CLICKHOUSE_DB || 'telemetryflow_db',
    });
  }

  async log(options: CreateAuditLogOptions): Promise<void> {
    try {
      const logLevel = options.result === AuditEventResult.SUCCESS ? 'log' : 'warn';
      const message = `[${options.eventType}] ${options.action} - ${options.result}`;
      
      if (logLevel === 'log') {
        this.logger.log(`[Audit] ✓ ${message}`, this.context);
      } else {
        this.logger.warn(`[Audit] ⚠ ${message}`, this.context);
      }

      // TODO: ClickHouse integration - requires HTTP interface configuration
      // Uncomment when ClickHouse is properly configured
      /*
      await this.clickhouse.insert({
        table: 'audit_logs',
        values: [{
          user_id: options.userId || null,
          user_email: options.userEmail || null,
          event_type: options.eventType,
          action: options.action,
          resource: options.resource || null,
          result: options.result,
          ip_address: options.ipAddress || null,
          user_agent: options.userAgent || null,
          metadata: JSON.stringify(options.metadata || {}),
          error_message: options.errorMessage || null,
          tenant_id: options.tenantId || null,
          organization_id: options.organizationId || null,
        }],
        format: 'JSONEachRow',
      });
      */
    } catch (error) {
      this.logger.error(`[Audit] ✗ Failed to create audit log: ${error.message}`, error.stack, this.context);
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
}
