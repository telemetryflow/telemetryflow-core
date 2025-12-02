import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { ConsoleMetricExporter, PeriodicExportingMetricReader, MeterProvider } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor, ConsoleLogRecordExporter } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'telemetryflow-core',
  [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
});

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

const traceExporter = endpoint
  ? new OTLPTraceExporter({ url: `${endpoint}/v1/traces` })
  : new ConsoleSpanExporter();

const metricReader = new PeriodicExportingMetricReader({
  exporter: endpoint
    ? new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` })
    : new ConsoleMetricExporter(),
  exportIntervalMillis: 60000,
});

const logProcessor = new BatchLogRecordProcessor(
  endpoint
    ? new OTLPLogExporter({ url: `${endpoint}/v1/logs` })
    : new ConsoleLogRecordExporter()
);

export const otelSDK = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  logRecordProcessor: logProcessor,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

export function startTracing() {
  if (process.env.OTEL_ENABLED === 'true') {
    otelSDK.start();
    console.log('[OTEL] ✓ OpenTelemetry SDK started');
    console.log(`[OTEL] ✓ Service: ${process.env.OTEL_SERVICE_NAME || 'telemetryflow-core'}`);
    console.log(`[OTEL] ✓ Endpoint: ${endpoint || 'console'}`);
    console.log('[OTEL] ✓ Exporting: traces, metrics, logs');
  }
}

export function stopTracing() {
  if (process.env.OTEL_ENABLED === 'true') {
    return otelSDK.shutdown();
  }
}

