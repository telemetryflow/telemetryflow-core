/**
 * P25: Winston Logging Standardization
 * Transport Factory
 *
 * Creates Winston transports based on configuration
 */

import * as winston from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import {
  LoggerConfig,
  ConsoleConfig,
  FileConfig,
  LokiConfig,
  FluentBitConfig,
  OpenSearchConfig,
} from '../interfaces/logger-config.interface';

/**
 * Create console transport for Winston
 */
export function createConsoleTransport(
  config: ConsoleConfig,
  level: string,
): winston.transport {
  const formats: winston.Logform.Format[] = [];

  if (config.colorize) {
    formats.push(winston.format.colorize({ all: true }));
  }

  formats.push(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }));

  if (config.prettyPrint) {
    formats.push(
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ctx = context ? `[${context}]` : '';
        const metaStr = Object.keys(meta).length
          ? `\n${JSON.stringify(meta, null, 2)}`
          : '';
        return `${timestamp} ${level} ${ctx} ${message}${metaStr}`;
      }),
    );
  } else {
    formats.push(winston.format.json());
  }

  return new winston.transports.Console({
    level,
    format: winston.format.combine(...formats),
  });
}

/**
 * Create OpenTelemetry transport for Winston
 */
export function createOtelTransport(): winston.transport {
  return new OpenTelemetryTransportV3();
}

/**
 * Create file transport with daily rotation for Winston
 * Requires: npm install winston-daily-rotate-file
 */
export async function createFileTransport(
  config: FileConfig,
  level: string,
): Promise<winston.transport | null> {
  if (!config.enabled) return null;

  try {
    // Dynamic import to avoid requiring the package if not used
    const DailyRotateFileModule = await import('winston-daily-rotate-file');
    const DailyRotateFile: any = DailyRotateFileModule.default || DailyRotateFileModule;

    const transportConfig = {
      level,
      dirname: config.dirname || 'logs',
      filename: config.filename || 'app-%DATE%.log',
      datePattern: config.datePattern || 'YYYY-MM-DD',
      zippedArchive: config.zippedArchive ?? true,
      maxSize: config.maxSize || '20m',
      maxFiles: config.maxFiles || '14d',
      format: config.json
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          )
        : winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            winston.format.printf(
              ({ timestamp, level, message, context, ...meta }) => {
                const ctx = context ? `[${context}]` : '';
                const metaStr = Object.keys(meta).length
                  ? ` ${JSON.stringify(meta)}`
                  : '';
                return `${timestamp} ${level} ${ctx} ${message}${metaStr}`;
              },
            ),
          ),
    };

    const transport = new DailyRotateFile(transportConfig);

    // Log rotation events
    transport.on('rotate', (oldFilename: string, newFilename: string) => {
      console.log(
        `[LoggerService] ✓ Log file rotated: ${oldFilename} -> ${newFilename}`,
      );
    });

    transport.on('new', (newFilename: string) => {
      console.log(`[LoggerService] ✓ New log file created: ${newFilename}`);
    });

     
    return transport as any;
  } catch (_error) {
    console.warn(
      '[LoggerService] winston-daily-rotate-file not installed. File transport disabled.',
      'Run: npm install winston-daily-rotate-file',
    );
    return null;
  }
}

/**
 * Create Loki transport for Winston
 * Requires: npm install winston-loki
 */
export async function createLokiTransport(
  config: LokiConfig,
  level: string,
): Promise<winston.transport | null> {
  if (!config.enabled) return null;

  try {
    // Dynamic import to avoid requiring the package if not used
    const LokiModule = await import('winston-loki');
    const LokiTransport: any = LokiModule.default || LokiModule;

    const transportConfig: Record<string, unknown> = {
      host: config.host,
      labels: config.labels,
      json: config.json ?? true,
      format: winston.format.json(),
      level,
      batching: config.batching ?? true,
      interval: config.interval ?? 5,
      timeout: config.timeout,
      replaceTimestamp: true,
      onConnectionError: (err: Error) => {
        console.error('[LoggerService] Loki connection error:', err.message);
      },
    };

    if (config.basicAuth) {
      transportConfig.basicAuth = config.basicAuth;
    }

    const transport = new LokiTransport(transportConfig as any);
     
    return transport as any;
  } catch (_error) {
    console.warn(
      '[LoggerService] winston-loki not installed. Loki transport disabled.',
      'Run: npm install winston-loki',
    );
    return null;
  }
}

/**
 * Create FluentBit transport for Winston
 * Uses fluent-logger to send logs via Forward protocol
 * Requires: npm install fluent-logger
 */
export async function createFluentBitTransport(
  config: FluentBitConfig,
  level: string,
): Promise<winston.transport | null> {
  if (!config.enabled) return null;

  try {
    // Dynamic import
    const fluent = await import('fluent-logger');
    const TransportModule = await import('winston-transport');
    const Transport: any = TransportModule.default || TransportModule;

    // Create FluentBit sender
    const sender = fluent.createFluentSender(config.tag, {
      host: config.host,
      port: config.port,
      timeout: config.timeout ?? 3000,
      requireAckResponse: config.requireAckResponse ?? false,
      reconnectInterval: config.reconnectInterval ?? 1000,
    });

    // Create custom Winston transport wrapping fluent-logger
    class FluentBitTransport extends Transport {
      constructor(opts: winston.transport.TransportStreamOptions) {
        super(opts);
      }

      log(info: Record<string, unknown>, callback: () => void) {
        setImmediate(() => {
          this.emit('logged', info);
        });

        const { level, message, timestamp, ...meta } = info;

        sender.emit('logs', {
          level,
          message,
          timestamp: timestamp || new Date().toISOString(),
          ...meta,
        });

        callback();
      }

      close() {
        sender.end('end', {}, () => {
          // Sender closed
        });
      }
    }

     
    return new FluentBitTransport({ level }) as any;
  } catch (_error) {
    console.warn(
      '[LoggerService] fluent-logger not installed. FluentBit transport disabled.',
      'Run: npm install fluent-logger',
    );
    return null;
  }
}

/**
 * Create OpenSearch transport for Winston
 * Requires: npm install winston-elasticsearch @elastic/elasticsearch
 */
export async function createOpenSearchTransport(
  config: OpenSearchConfig,
  level: string,
): Promise<winston.transport | null> {
  if (!config.enabled) return null;

  try {
    // Dynamic import
    const { ElasticsearchTransport } = await import('winston-elasticsearch');
    const { Client } = await import('@opensearch-project/opensearch');

    // Create OpenSearch client
    const clientOpts: Record<string, unknown> = {
      node: config.node,
    };

    if (config.username && config.password) {
      clientOpts.auth = {
        username: config.username,
        password: config.password,
      };
    }

    if (config.ssl) {
      clientOpts.ssl = config.ssl;
    }

    const client = new Client(clientOpts);

    // Custom transformer to format log data
    const transformer = (logData: Record<string, unknown>) => {
      const { message, level, timestamp, ...meta } = logData;
      return {
        '@timestamp': timestamp || new Date().toISOString(),
        message,
        level,
        severity: level,
        fields: meta,
      };
    };

     
    return new ElasticsearchTransport({
      level,
      client: client as any,
      indexPrefix: config.index,
      indexSuffixPattern: config.indexSuffixPattern || 'YYYY.MM.DD',
      transformer: transformer as any,
      flushInterval: config.flushInterval ?? 2000,
      bufferLimit: config.bufferLimit ?? 100,
      ensureIndexTemplate: true,
      indexTemplate: {
        index_patterns: [`${config.index}-*`],
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          'index.refresh_interval': '5s',
        },
        mappings: {
          properties: {
            '@timestamp': { type: 'date' },
            message: { type: 'text' },
            level: { type: 'keyword' },
            severity: { type: 'keyword' },
            traceId: { type: 'keyword' },
            spanId: { type: 'keyword' },
            requestId: { type: 'keyword' },
            tenantId: { type: 'keyword' },
            userId: { type: 'keyword' },
            context: { type: 'keyword' },
            fields: { type: 'object', enabled: true },
          },
        },
      },
    });
  } catch (_error) {
    console.warn(
      '[LoggerService] winston-elasticsearch or @opensearch-project/opensearch not installed.',
      'OpenSearch transport disabled.',
      'Run: npm install winston-elasticsearch @opensearch-project/opensearch',
    );
    return null;
  }
}

/**
 * Create all configured transports
 */
export async function createTransports(
  config: LoggerConfig,
): Promise<winston.transport[]> {
  const transports: winston.transport[] = [];

  // Console transport (always added if enabled)
  if (config.console.enabled) {
    transports.push(createConsoleTransport(config.console, config.level));
  }

  // OpenTelemetry transport
  if (config.otel.enabled) {
    transports.push(createOtelTransport());
  }

  // File transport (daily rotation)
  const fileTransport = await createFileTransport(config.file, config.level);
  if (fileTransport) {
    transports.push(fileTransport);
  }

  // Loki transport
  const lokiTransport = await createLokiTransport(config.loki, config.level);
  if (lokiTransport) {
    transports.push(lokiTransport);
  }

  // FluentBit transport
  const fluentBitTransport = await createFluentBitTransport(
    config.fluentBit,
    config.level,
  );
  if (fluentBitTransport) {
    transports.push(fluentBitTransport);
  }

  // OpenSearch transport
  const openSearchTransport = await createOpenSearchTransport(
    config.openSearch,
    config.level,
  );
  if (openSearchTransport) {
    transports.push(openSearchTransport);
  }

  return transports;
}
