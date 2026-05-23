/**
 * Vite Mock Server Plugin
 * Integrates the mock API server with Vite's dev server
 */

import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// In-memory storage
const storage = {
  metrics: new Map(),
  logs: new Map(),
  traces: new Map(),
  exemplars: new Map(),
  alerts: new Map(),
  alertRules: new Map(),
  correlations: new Map(),
};

// Utility functions
function generateId(length = 16): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function now(): number {
  return Date.now();
}

function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryString = url.split('?')[1];
  if (queryString) {
    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    });
  }
  return params;
}

async function parseBody<T>(req: IncomingMessage): Promise<T | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf-8');
        resolve(body ? JSON.parse(body) : null);
      } catch {
        resolve(null);
      }
    });
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function success<T>(data: T, extra?: Record<string, unknown>) {
  return { status: 'success', data, ...extra };
}

function error(message: string) {
  return { status: 'error', data: null, message, error: message };
}

// Generate mock time series data
function generateTimeSeries(start: number, end: number, name: string, baseValue = 100) {
  const data: Array<[number, number]> = [];
  const step = Math.max(Math.floor((end - start) / 60), 60000);
  for (let t = start; t <= end; t += step) {
    const variance = Math.random() * baseValue * 0.3;
    const spike = Math.random() > 0.95 ? baseValue * 0.5 : 0;
    data.push([t, baseValue + variance + spike]);
  }
  return [{ name, data }];
}

// Generate mock log records
function generateLogs(start: number, end: number, count: number) {
  const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  const services = ['api-gateway', 'user-service', 'order-service', 'payment-service'];
  const messages = [
    'Request received',
    'Processing request',
    'Database query executed',
    'Response sent',
    'Connection established',
    'Cache miss',
    'Authentication successful',
    'Validation error',
    'Timeout occurred',
    'Retry attempt',
  ];

  const logs = [];
  for (let i = 0; i < count; i++) {
    const timestamp = start + Math.random() * (end - start);
    logs.push({
      id: generateId(),
      timestamp,
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      service: services[Math.floor(Math.random() * services.length)],
      traceId: Math.random() > 0.5 ? generateId(32) : undefined,
      spanId: Math.random() > 0.5 ? generateId(16) : undefined,
      attributes: {},
    });
  }
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

// Generate mock trace summaries
function generateTraceSummaries(start: number, end: number, count: number) {
  const services = ['api-gateway', 'user-service', 'order-service', 'payment-service'];
  const operations = ['GET /api/users', 'POST /api/orders', 'GET /api/products', 'PUT /api/cart'];

  const traces = [];
  for (let i = 0; i < count; i++) {
    const startTime = start + Math.random() * (end - start);
    const duration = Math.floor(Math.random() * 500) + 10;
    traces.push({
      traceId: generateId(32),
      rootService: services[Math.floor(Math.random() * services.length)],
      rootOperation: operations[Math.floor(Math.random() * operations.length)],
      startTime,
      duration,
      spanCount: Math.floor(Math.random() * 10) + 1,
      errorCount: Math.random() > 0.9 ? 1 : 0,
      services: [services[Math.floor(Math.random() * services.length)]],
    });
  }
  return traces.sort((a, b) => b.startTime - a.startTime);
}

// Generate mock exemplars
function generateExemplars(start: number, end: number, count: number) {
  const metrics = [
    'http_request_duration_seconds',
    'http_requests_total',
    'process_cpu_seconds_total',
  ];

  const exemplars = [];
  for (let i = 0; i < count; i++) {
    const timestamp = start + Math.random() * (end - start);
    exemplars.push({
      id: generateId(),
      timestamp,
      metricName: metrics[Math.floor(Math.random() * metrics.length)],
      value: Math.random() * 2,
      traceId: generateId(32),
      spanId: generateId(16),
      labels: { service: 'api-gateway', method: 'GET' },
    });
  }
  return exemplars.sort((a, b) => b.timestamp - a.timestamp);
}

// Generate mock alerts
function generateAlerts() {
  return [
    {
      id: generateId(),
      name: 'HighErrorRate',
      severity: 'critical',
      state: 'firing',
      message: 'Error rate exceeded 5%',
      service: 'api-gateway',
      startTime: now() - 300000,
      labels: { alertname: 'HighErrorRate' },
      annotations: { summary: 'High error rate detected' },
    },
    {
      id: generateId(),
      name: 'HighLatency',
      severity: 'warning',
      state: 'pending',
      message: 'P99 latency above threshold',
      service: 'payment-service',
      startTime: now() - 600000,
      labels: { alertname: 'HighLatency' },
      annotations: { summary: 'Latency spike detected' },
    },
  ];
}

// Generate mock alert rules
function generateAlertRules() {
  return [
    {
      id: generateId(),
      name: 'HighErrorRate',
      query: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.05',
      duration: '5m',
      severity: 'critical',
      enabled: true,
      labels: { team: 'backend' },
      annotations: { summary: 'High error rate detected' },
      createdAt: now() - 86400000,
      updatedAt: now() - 86400000,
    },
    {
      id: generateId(),
      name: 'HighLatency',
      query: 'histogram_quantile(0.99, http_request_duration_seconds_bucket) > 1',
      duration: '10m',
      severity: 'warning',
      enabled: true,
      labels: { team: 'backend' },
      annotations: { summary: 'High latency detected' },
      createdAt: now() - 86400000,
      updatedAt: now() - 86400000,
    },
  ];
}

// Request handler
async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '/';
  const method = req.method || 'GET';

  // Only handle /v2 routes
  if (!url.startsWith('/v2/')) {
    return false;
  }

  // Handle preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  const params = parseQueryParams(url);
  const cleanUrl = url.split('?')[0];

  try {
    // Health check
    if (cleanUrl === '/v2/health') {
      sendJson(res, 200, success({ status: 'ok', timestamp: now() }));
      return true;
    }

    // Status (collector status)
    if (cleanUrl === '/v2/status') {
      sendJson(res, 200, success({
        connected: true,
        metrics: { received: 15432, processed: 15430, errors: 2 },
        logs: { received: 8721, processed: 8720, errors: 1 },
        traces: { received: 3456, processed: 3456, errors: 0 },
      }));
      return true;
    }

    // Stats
    if (cleanUrl === '/v2/stats') {
      sendJson(res, 200, success({
        metrics: storage.metrics.size,
        logs: storage.logs.size,
        traces: storage.traces.size,
        exemplars: storage.exemplars.size,
        alerts: storage.alerts.size,
        alertRules: storage.alertRules.size,
        correlations: storage.correlations.size,
      }));
      return true;
    }

    // Metrics routes
    if (cleanUrl === '/v2/metrics' && method === 'GET') {
      const start = params.start ? parseInt(params.start) : now() - 3600000;
      const end = params.end ? parseInt(params.end) : now();
      const data = generateTimeSeries(start, end, 'http_requests_total');
      sendJson(res, 200, success(data));
      return true;
    }

    if (cleanUrl === '/v2/metrics/names') {
      sendJson(res, 200, success([
        'http_requests_total',
        'http_request_duration_seconds',
        'process_cpu_seconds_total',
        'process_resident_memory_bytes',
        'go_goroutines',
      ]));
      return true;
    }

    if (cleanUrl === '/v2/metrics/query' && method === 'POST') {
      const body = await parseBody<{ query: string; start?: number; end?: number }>(req);
      const start = body?.start || now() - 3600000;
      const end = body?.end || now();
      const data = generateTimeSeries(start, end, body?.query || 'http_requests_total');
      sendJson(res, 200, success(data));
      return true;
    }

    if (cleanUrl === '/v2/metrics' && method === 'POST') {
      const body = await parseBody<{ name: string; value: number }>(req);
      if (!body?.name || body?.value === undefined) {
        sendJson(res, 400, error('Missing name or value'));
        return true;
      }
      const metric = { id: generateId(), ...body, timestamp: now() };
      storage.metrics.set(metric.id, metric);
      sendJson(res, 201, success(metric));
      return true;
    }

    // Logs routes
    if (cleanUrl === '/v2/logs' && method === 'GET') {
      const start = params.start ? parseInt(params.start) : now() - 3600000;
      const end = params.end ? parseInt(params.end) : now();
      const limit = params.limit ? parseInt(params.limit) : 100;
      const logs = generateLogs(start, end, limit);
      sendJson(res, 200, success(logs, { total: logs.length }));
      return true;
    }

    if (cleanUrl === '/v2/logs/services') {
      sendJson(res, 200, success(['api-gateway', 'user-service', 'order-service', 'payment-service']));
      return true;
    }

    if (cleanUrl === '/v2/logs/query' && method === 'POST') {
      const body = await parseBody<{ start?: number; end?: number; limit?: number }>(req);
      const start = body?.start || now() - 3600000;
      const end = body?.end || now();
      const limit = body?.limit || 100;
      const logs = generateLogs(start, end, limit);
      sendJson(res, 200, success(logs, { total: logs.length }));
      return true;
    }

    if (cleanUrl === '/v2/logs' && method === 'POST') {
      const body = await parseBody<{ level: string; message: string; service: string }>(req);
      if (!body?.level || !body?.message || !body?.service) {
        sendJson(res, 400, error('Missing required fields'));
        return true;
      }
      const log = { id: generateId(), timestamp: now(), ...body, attributes: {} };
      storage.logs.set(log.id, log);
      sendJson(res, 201, success(log));
      return true;
    }

    // Traces routes
    if (cleanUrl === '/v2/traces' && method === 'GET') {
      const start = params.start ? parseInt(params.start) : now() - 3600000;
      const end = params.end ? parseInt(params.end) : now();
      const limit = params.limit ? parseInt(params.limit) : 50;
      const traces = generateTraceSummaries(start, end, limit);
      sendJson(res, 200, success(traces, { total: traces.length }));
      return true;
    }

    if (cleanUrl === '/v2/traces/services') {
      sendJson(res, 200, success(['api-gateway', 'user-service', 'order-service', 'payment-service']));
      return true;
    }

    if (cleanUrl === '/v2/traces/query' && method === 'POST') {
      const body = await parseBody<{ start?: number; end?: number; limit?: number }>(req);
      const start = body?.start || now() - 3600000;
      const end = body?.end || now();
      const limit = body?.limit || 50;
      const traces = generateTraceSummaries(start, end, limit);
      sendJson(res, 200, success(traces, { total: traces.length }));
      return true;
    }

    if (cleanUrl.match(/^\/v2\/traces\/[a-f0-9]+$/) && method === 'GET') {
      const traceId = cleanUrl.split('/')[3];
      const trace = {
        traceId,
        startTime: now() - 60000,
        duration: 245,
        spanCount: 5,
        errorCount: 0,
        services: ['api-gateway', 'user-service'],
        spans: [
          {
            spanId: generateId(16),
            traceId,
            name: 'GET /api/users',
            serviceName: 'api-gateway',
            kind: 'server',
            startTime: now() - 60000,
            endTime: now() - 59755,
            duration: 245,
            status: 'ok',
            attributes: {},
            events: [],
          },
        ],
      };
      sendJson(res, 200, success(trace));
      return true;
    }

    if (cleanUrl === '/v2/traces' && method === 'POST') {
      const body = await parseBody<{ spans: Array<{ name: string; serviceName: string }> }>(req);
      if (!body?.spans || !Array.isArray(body.spans)) {
        sendJson(res, 400, error('Missing spans array'));
        return true;
      }
      const traceId = generateId(32);
      const trace = {
        id: generateId(),
        traceId,
        startTime: now(),
        endTime: now() + 100,
        duration: 100,
        services: [...new Set(body.spans.map((s) => s.serviceName))],
        errorCount: 0,
        spans: body.spans.map((s) => ({
          spanId: generateId(16),
          traceId,
          ...s,
          kind: 'internal',
          startTime: now(),
          endTime: now() + 100,
          duration: 100,
          status: 'ok',
          attributes: {},
          events: [],
        })),
      };
      storage.traces.set(trace.id, trace);
      sendJson(res, 201, success(trace));
      return true;
    }

    // Exemplars routes
    if (cleanUrl === '/v2/exemplars' && method === 'GET') {
      const start = params.start ? parseInt(params.start) : now() - 3600000;
      const end = params.end ? parseInt(params.end) : now();
      const limit = params.limit ? parseInt(params.limit) : 50;
      const exemplars = generateExemplars(start, end, limit);
      sendJson(res, 200, success(exemplars, { total: exemplars.length }));
      return true;
    }

    if (cleanUrl === '/v2/exemplars/query' && method === 'POST') {
      const body = await parseBody<{ start?: number; end?: number; limit?: number }>(req);
      const start = body?.start || now() - 3600000;
      const end = body?.end || now();
      const limit = body?.limit || 50;
      const exemplars = generateExemplars(start, end, limit);
      sendJson(res, 200, success(exemplars, { total: exemplars.length }));
      return true;
    }

    if (cleanUrl === '/v2/exemplars' && method === 'POST') {
      const body = await parseBody<{ metricName: string; value: number; traceId: string; spanId: string }>(req);
      if (!body?.metricName || body?.value === undefined || !body?.traceId || !body?.spanId) {
        sendJson(res, 400, error('Missing required fields'));
        return true;
      }
      const exemplar = { id: generateId(), timestamp: now(), ...body, labels: {} };
      storage.exemplars.set(exemplar.id, exemplar);
      sendJson(res, 201, success(exemplar));
      return true;
    }

    // Correlations routes
    if (cleanUrl === '/v2/correlations' && method === 'GET') {
      const events = [
        { type: 'metric', time: now() - 60000, description: 'Error rate spike', traceId: null, severity: 'warning' },
        { type: 'log', time: now() - 120000, description: 'Connection timeout', traceId: generateId(32), severity: 'error' },
        { type: 'trace', time: now() - 180000, description: 'Slow query detected', traceId: generateId(32), severity: 'warning' },
      ];
      sendJson(res, 200, success(events, { total: events.length }));
      return true;
    }

    if (cleanUrl === '/v2/correlations' && method === 'POST') {
      const body = await parseBody<{ type: string; sourceId: string; targetId: string }>(req);
      if (!body?.type || !body?.sourceId || !body?.targetId) {
        sendJson(res, 400, error('Missing required fields'));
        return true;
      }
      const correlation = { id: generateId(), timestamp: now(), ...body, confidence: 1.0, metadata: {} };
      storage.correlations.set(correlation.id, correlation);
      sendJson(res, 201, success(correlation));
      return true;
    }

    // Alerts routes
    if (cleanUrl === '/v2/alerts' && method === 'GET') {
      const alerts = generateAlerts();
      sendJson(res, 200, success(alerts, { total: alerts.length }));
      return true;
    }

    if (cleanUrl === '/v2/alerts' && method === 'POST') {
      const body = await parseBody<{ name: string; severity: string; message: string; service: string }>(req);
      if (!body?.name || !body?.severity || !body?.message || !body?.service) {
        sendJson(res, 400, error('Missing required fields'));
        return true;
      }
      const alert = {
        id: generateId(),
        startTime: now(),
        state: 'firing',
        ...body,
        labels: {},
        annotations: {},
      };
      storage.alerts.set(alert.id, alert);
      sendJson(res, 201, success(alert));
      return true;
    }

    // Alert rules routes
    if (cleanUrl === '/v2/alerts/rules' && method === 'GET') {
      const rules = generateAlertRules();
      sendJson(res, 200, success(rules, { total: rules.length }));
      return true;
    }

    if (cleanUrl === '/v2/alerts/rules' && method === 'POST') {
      const body = await parseBody<{ name: string; query: string; duration: string; severity: string }>(req);
      if (!body?.name || !body?.query || !body?.duration || !body?.severity) {
        sendJson(res, 400, error('Missing required fields'));
        return true;
      }
      const rule = {
        id: generateId(),
        enabled: true,
        createdAt: now(),
        updatedAt: now(),
        ...body,
        labels: {},
        annotations: {},
      };
      storage.alertRules.set(rule.id, rule);
      sendJson(res, 201, success(rule));
      return true;
    }

    // Not found for v2 routes
    sendJson(res, 404, error(`Route not found: ${method} ${url}`));
    return true;
  } catch (err) {
    console.error('Mock server error:', err);
    sendJson(res, 500, error('Internal server error'));
    return true;
  }
}

/**
 * Create Vite plugin for mock server
 */
export function mockServerPlugin(): Plugin {
  return {
    name: 'telemetryflow-mock-server',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleRequest(req, res);
        if (!handled) {
          next();
        }
      });

      console.log('\n  Mock API Server running at /v2/*');
      console.log('  Endpoints:');
      console.log('    GET/POST  /v2/metrics');
      console.log('    GET/POST  /v2/logs');
      console.log('    GET/POST  /v2/traces');
      console.log('    GET/POST  /v2/exemplars');
      console.log('    GET/POST  /v2/correlations');
      console.log('    GET/POST  /v2/alerts');
      console.log('    GET/POST  /v2/alerts/rules');
      console.log('    GET       /v2/health');
      console.log('    GET       /v2/stats\n');
    },
  };
}

export default mockServerPlugin;
