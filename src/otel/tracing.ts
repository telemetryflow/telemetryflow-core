import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'telemetryflow-core',
  [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
});

const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  ? new OTLPTraceExporter({
      url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
    })
  : undefined;

export const otelSDK = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

export function startTracing() {
  if (process.env.OTEL_ENABLED === 'true') {
    otelSDK.start();
    console.log('✓ OpenTelemetry tracing started');
  }
}

export function stopTracing() {
  if (process.env.OTEL_ENABLED === 'true') {
    return otelSDK.shutdown();
  }
}
