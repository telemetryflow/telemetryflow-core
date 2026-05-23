import { config } from "dotenv";
import { NodeSDK } from "@opentelemetry/sdk-node";

config();

const MODULE_NAME = "OTELTracing";

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  BatchLogRecordProcessor,
  ConsoleLogRecordExporter,
} from "@opentelemetry/sdk-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { SpanStatusCode } from "@opentelemetry/api";
import type { IncomingMessage, ServerResponse } from "http";

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]:
    process.env.OTEL_SERVICE_NAME || "telemetryflow-core",
  [ATTR_SERVICE_VERSION]: process.env.npm_package_version || "2.0.0",
});

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

const traceExporter = endpoint
  ? new OTLPTraceExporter({ url: endpoint })
  : new ConsoleSpanExporter();

const metricReader = new PeriodicExportingMetricReader({
  exporter: endpoint
    ? new OTLPMetricExporter({ url: endpoint })
    : new ConsoleMetricExporter(),
  exportIntervalMillis: 60000,
});

const logProcessor = new BatchLogRecordProcessor(
  endpoint
    ? new OTLPLogExporter({ url: endpoint })
    : new ConsoleLogRecordExporter(),
);

export const otelSDK = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  logRecordProcessor: logProcessor,
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook: (req: IncomingMessage) => {
          const url = req.url || "";
          return url.startsWith("/health");
        },
        requestHook: (span, request) => {
          const req = request as any;
          const route = req.route?.path || req.url || "";
          if (route && req.method) {
            span.updateName(`${req.method} ${route}`);
          }
        },
        responseHook: (span, response) => {
          const res = response as ServerResponse;
          const statusCode = res.statusCode;
          if (statusCode && statusCode >= 200 && statusCode < 400) {
            span.setStatus({ code: SpanStatusCode.OK });
          }
        },
      },
    }),
  ],
});

export function startTracing() {
  const otelEnabled = process.env.OTEL_ENABLED !== "false";

  if (otelEnabled) {
    otelSDK.start();
    console.log(`[${MODULE_NAME}] ✓ OpenTelemetry SDK started`);
    console.log(
      `[${MODULE_NAME}] ✓ Service: ${process.env.OTEL_SERVICE_NAME || "telemetryflow-core"}`,
    );
    console.log(`[${MODULE_NAME}] ✓ Endpoint: ${endpoint || "console"}`);
  } else {
    console.log(
      `[${MODULE_NAME}] ✗ OpenTelemetry disabled (OTEL_ENABLED=false)`,
    );
  }
}

export function stopTracing() {
  const otelEnabled = process.env.OTEL_ENABLED !== "false";

  if (otelEnabled) {
    return otelSDK.shutdown();
  }
}
