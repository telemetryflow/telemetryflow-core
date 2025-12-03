import { config } from 'dotenv';
import { NodeSDK } from '@opentelemetry/sdk-node';

// Load .env file before anything else
config();

const MODULE_NAME = 'OTELTracing';

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
      '@opentelemetry/instrumentation-http': {
        requestHook: (span, request) => {
          // Add route to span name
          const req = request as any;
          const route = req.route?.path || req.url || '';
          if (route && req.method) {
            span.updateName(`${req.method} ${route}`);
          }
        },
      },
    }),
  ],
});

export function startTracing() {
  const otelEnabled = process.env.OTEL_ENABLED !== 'false';
  
  if (otelEnabled) {
    otelSDK.start();
    console.log(`[${MODULE_NAME}] ✓ OpenTelemetry SDK started`);
    console.log(`[${MODULE_NAME}] ✓ Service: ${process.env.OTEL_SERVICE_NAME || 'telemetryflow-core'}`);
    console.log(`[${MODULE_NAME}] ✓ Endpoint: ${endpoint || 'console'}`);
    console.log(`[${MODULE_NAME}] ✓ Exporting: traces, metrics, logs`);
  } else {
    console.log(`[${MODULE_NAME}] ✗ OpenTelemetry disabled (OTEL_ENABLED=false)`);
  }
}

export function stopTracing() {
  const otelEnabled = process.env.OTEL_ENABLED !== 'false';
  
  if (otelEnabled) {
    return otelSDK.shutdown();
  }
}

