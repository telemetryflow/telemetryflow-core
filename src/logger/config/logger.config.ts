/**
 * P25: Winston Logging Standardization
 * Logger Configuration Loader
 *
 * Loads logger configuration from environment variables
 */

import {
  LoggerConfig,
  LoggerType,
  LogLevel,
} from '../interfaces/logger-config.interface';

/**
 * Parse boolean from environment variable
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse integer from environment variable
 */
function parseInt(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Load logger configuration from environment variables
 */
export function loadLoggerConfig(): LoggerConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';

  return {
    // Logger type selection (nestjs or winston)
    type: (process.env.LOGGER_TYPE as LoggerType) || 'nestjs',

    // Log level
    level: (process.env.LOG_LEVEL as LogLevel) || 'info',

    // Default context
    defaultContext: process.env.LOG_DEFAULT_CONTEXT || 'TelemetryFlow',

    // Console transport
    console: {
      enabled: true, // Always enabled
      prettyPrint: parseBoolean(process.env.LOG_PRETTY_PRINT, isDevelopment),
      colorize: parseBoolean(process.env.LOG_COLORIZE, isDevelopment),
    },

    // OpenTelemetry transport
    otel: {
      enabled: parseBoolean(
        process.env.OTEL_LOGS_ENABLED,
        !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
          !!process.env.OTEL_COLLECTOR_ENDPOINT,
      ),
    },

    // File transport (daily rotation)
    file: {
      enabled: parseBoolean(process.env.LOG_FILE_ENABLED, !isDevelopment),
      dirname: process.env.LOG_FILE_DIRNAME || 'logs',
      filename: process.env.LOG_FILE_FILENAME || 'app-%DATE%.log',
      datePattern: process.env.LOG_FILE_DATE_PATTERN || 'YYYY-MM-DD',
      zippedArchive: parseBoolean(process.env.LOG_FILE_ZIPPED, true),
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      json: parseBoolean(process.env.LOG_FILE_JSON, true),
    },

    // Loki transport
    loki: {
      enabled: parseBoolean(process.env.LOKI_ENABLED, false),
      host: process.env.LOKI_HOST || 'http://loki:3100',
      labels: {
        app: process.env.LOKI_LABELS_APP || 'telemetryflow',
        env: process.env.LOKI_LABELS_ENV || nodeEnv,
      },
      json: true,
      batching: true,
      interval: parseInt(process.env.LOKI_BATCH_INTERVAL, 5),
      timeout: parseInt(process.env.LOKI_TIMEOUT, 30000),
      basicAuth: process.env.LOKI_USERNAME
        ? {
            username: process.env.LOKI_USERNAME,
            password: process.env.LOKI_PASSWORD || '',
          }
        : undefined,
    },

    // FluentBit transport
    fluentBit: {
      enabled: parseBoolean(process.env.FLUENTBIT_ENABLED, false),
      host: process.env.FLUENTBIT_HOST || 'fluentbit',
      port: parseInt(process.env.FLUENTBIT_PORT, 24224),
      tag: process.env.FLUENTBIT_TAG || 'telemetryflow.logs',
      timeout: parseInt(process.env.FLUENTBIT_TIMEOUT, 3000),
      requireAckResponse: parseBoolean(
        process.env.FLUENTBIT_REQUIRE_ACK,
        false,
      ),
      reconnectInterval: parseInt(
        process.env.FLUENTBIT_RECONNECT_INTERVAL,
        1000,
      ),
    },

    // OpenSearch transport
    openSearch: {
      enabled: parseBoolean(process.env.OPENSEARCH_ENABLED, false),
      node: process.env.OPENSEARCH_NODE || 'http://opensearch:9200',
      username: process.env.OPENSEARCH_USERNAME,
      password: process.env.OPENSEARCH_PASSWORD,
      index: process.env.OPENSEARCH_INDEX || 'telemetryflow-logs',
      indexSuffixPattern: process.env.OPENSEARCH_INDEX_SUFFIX || 'YYYY.MM.DD',
      flushInterval: parseInt(process.env.OPENSEARCH_FLUSH_INTERVAL, 2000),
      bufferLimit: parseInt(process.env.OPENSEARCH_BUFFER_LIMIT, 100),
      ssl: {
        rejectUnauthorized: parseBoolean(
          process.env.OPENSEARCH_SSL_VERIFY,
          false,
        ),
      },
    },
  };
}

/**
 * Get a summary of enabled transports for logging
 */
export function getEnabledTransportsSummary(config: LoggerConfig): string[] {
  const transports: string[] = [];

  if (config.type === 'nestjs') {
    transports.push('NestJS Logger (Console)');
    return transports;
  }

  // Winston transports
  if (config.console.enabled) {
    transports.push(
      `Console (pretty: ${config.console.prettyPrint}, colorize: ${config.console.colorize})`,
    );
  }

  if (config.otel.enabled) {
    transports.push('OpenTelemetry Collector');
  }

  if (config.file.enabled) {
    transports.push(`File (${config.file.dirname}/${config.file.filename})`);
  }

  if (config.loki.enabled) {
    transports.push(`Loki (${config.loki.host})`);
  }

  if (config.fluentBit.enabled) {
    transports.push(`FluentBit (${config.fluentBit.host}:${config.fluentBit.port})`);
  }

  if (config.openSearch.enabled) {
    transports.push(`OpenSearch (${config.openSearch.node})`);
  }

  return transports;
}
