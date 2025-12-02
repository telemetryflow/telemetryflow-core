import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';

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

  constructor(private readonly logger: LoggerService) {}

  async log(options: CreateAuditLogOptions): Promise<void> {
    try {
      const logLevel = options.result === AuditEventResult.SUCCESS ? 'log' : 'warn';
      const message = `[${options.eventType}] ${options.action} - ${options.result}`;
      
      if (logLevel === 'log') {
        this.logger.log(`[Audit] ✓ ${message}`, this.context);
      } else {
        this.logger.warn(`[Audit] ⚠ ${message}`, this.context);
      }
    } catch (error) {
      this.logger.error('[Audit] ✗ Failed to create audit log', error, this.context);
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
