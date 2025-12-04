import Transport from 'winston-transport';
import { ClickHouseService, LogRecord } from '../../shared/clickhouse/clickhouse.service';

interface ClickHouseTransportOptions extends Transport.TransportStreamOptions {
  clickHouseService: ClickHouseService;
  serviceName?: string;
  batchSize?: number;
  flushInterval?: number;
}

export class ClickHouseTransport extends Transport {
  private clickHouseService: ClickHouseService;
  private serviceName: string;
  private batchSize: number;
  private flushInterval: number;
  private logBuffer: LogRecord[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(opts: ClickHouseTransportOptions) {
    super(opts);
    this.clickHouseService = opts.clickHouseService;
    this.serviceName = opts.serviceName || 'telemetryflow-core';
    this.batchSize = opts.batchSize || 100;
    this.flushInterval = opts.flushInterval || 5000; // 5 seconds

    this.startFlushTimer();
  }

  log(info: any, callback: () => void): void {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const logRecord: LogRecord = {
      timestamp: new Date(),
      observed_timestamp: new Date(),
      trace_id: info.trace_id || '',
      span_id: info.span_id || '',
      trace_flags: info.trace_flags || 0,
      severity_text: info.level.toUpperCase(),
      severity_number: this.getSeverityNumber(info.level),
      service_name: this.serviceName,
      organization_id: info.organization_id || '',
      workspace_id: info.workspace_id || '',
      tenant_id: info.tenant_id || '',
      body: info.message,
      resource_attributes: info.resource_attributes || {},
      scope_name: info.scope_name || '',
      scope_version: info.scope_version || '',
      log_attributes: {
        ...info.metadata,
        context: info.context || '',
        stack: info.stack || '',
      },
    };

    this.logBuffer.push(logRecord);

    if (this.logBuffer.length >= this.batchSize) {
      this.flush();
    }

    callback();
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.clickHouseService.insertLogs(logsToSend);
    } catch (error) {
      console.error('Failed to send logs to ClickHouse:', error);
      // Re-add logs to buffer on failure (with limit to prevent memory issues)
      if (this.logBuffer.length < this.batchSize * 10) {
        this.logBuffer.unshift(...logsToSend);
      }
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private getSeverityNumber(level: string): number {
    const severityMap: Record<string, number> = {
      error: 17,
      warn: 13,
      info: 9,
      http: 9,
      verbose: 5,
      debug: 5,
      silly: 1,
    };
    return severityMap[level] || 9;
  }

  close(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}
