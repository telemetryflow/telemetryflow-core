import { ClickHouseClient } from "@clickhouse/client";
import { DataSource } from "typeorm";

export async function seed(
  client: ClickHouseClient,
  database: string,
): Promise<void> {
  console.log("📊 Seeding sample logs...");

  // Get IDs from PostgreSQL
  const pgDataSource = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USERNAME || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "telemetryflow_db",
  });

  await pgDataSource.initialize();

  const [org] = await pgDataSource.query(
    `SELECT organization_id FROM organizations WHERE code = 'DEVOPSCORNER' LIMIT 1`,
  );
  const [workspace] = await pgDataSource.query(
    `SELECT workspace_id FROM workspaces WHERE code = 'TELEMETRYFLOW-POC' LIMIT 1`,
  );
  const [tenant] = await pgDataSource.query(
    `SELECT tenant_id FROM tenants WHERE code = 'DEVOPSCORNER' LIMIT 1`,
  );

  await pgDataSource.destroy();

  const organization_id = org?.organization_id || "";
  const workspace_id = workspace?.workspace_id || "";
  const tenant_id = tenant?.tenant_id || "";

  // Query existing trace_ids from ClickHouse to correlate logs with traces
  let traceIds: string[] = [];
  try {
    const result = await client.query({
      query: `SELECT DISTINCT trace_id FROM ${database}.traces ORDER BY timestamp DESC LIMIT 10`,
      format: "JSONEachRow",
    });
    const rows = await result.json<{ trace_id: string }>();
    traceIds = rows.map((r) => r.trace_id).filter((id) => id.length > 0);
  } catch {
    console.log(
      "   ⚠ No existing traces found, logs will have empty trace_id",
    );
  }

  const logs: Array<Record<string, unknown>> = [];
  const now = new Date();

  // General application logs (no trace correlation)
  const generalLogs = [
    { severity: "INFO", body: "Application started successfully", minutes_ago: 60 },
    { severity: "INFO", body: "Database connection established", minutes_ago: 60 },
    { severity: "INFO", body: "ClickHouse connection initialized", minutes_ago: 59 },
    { severity: "INFO", body: "Redis connection established", minutes_ago: 59 },
    { severity: "WARN", body: "Rate limit approaching threshold", minutes_ago: 30 },
    { severity: "INFO", body: "Health check passed", minutes_ago: 1 },
  ];

  for (const log of generalLogs) {
    const ts = new Date(now.getTime() - log.minutes_ago * 60 * 1000);
    logs.push(
      makeLogRow(ts, log.severity, log.body, "", organization_id, workspace_id, tenant_id),
    );
  }

  // Trace-correlated logs (5-8 entries per trace)
  for (let i = 0; i < traceIds.length; i++) {
    const traceId = traceIds[i];
    const baseTime = new Date(now.getTime() - i * 5 * 60 * 1000);
    const isError = i % 5 === 0;

    const entries = [
      { severity: "DEBUG", body: "Incoming request: GET /api/users", offsetMs: 0 },
      { severity: "INFO", body: "Authentication validated for request", offsetMs: 2 },
      { severity: "DEBUG", body: "Cache lookup for user list", offsetMs: 5 },
      { severity: "INFO", body: "Database query executed: SELECT * FROM users", offsetMs: 15 },
      { severity: "INFO", body: "Response serialization completed", offsetMs: 80 },
      ...(isError
        ? [
            { severity: "ERROR", body: "Connection timeout to database", offsetMs: 50 },
            { severity: "WARN", body: "Retry attempt 1/3 for database query", offsetMs: 55 },
            { severity: "ERROR", body: "Request failed with status 500", offsetMs: 95 },
          ]
        : [
            { severity: "INFO", body: "Request completed successfully with status 200", offsetMs: 100 },
          ]),
    ];

    for (const entry of entries) {
      const ts = new Date(baseTime.getTime() + entry.offsetMs);
      logs.push(
        makeLogRow(
          ts,
          entry.severity,
          entry.body,
          traceId,
          organization_id,
          workspace_id,
          tenant_id,
        ),
      );
    }
  }

  if (logs.length > 0) {
    await client.insert({
      table: `${database}.logs`,
      values: logs,
      format: "JSONEachRow",
    });
  }

  console.log(
    `   ✅ Seeded ${logs.length} sample logs (${generalLogs.length} general + ${logs.length - generalLogs.length} trace-correlated for ${traceIds.length} traces)`,
  );
}

function makeLogRow(
  ts: Date,
  severity: string,
  body: string,
  traceId: string,
  orgId: string,
  wsId: string,
  tenantId: string,
): Record<string, unknown> {
  const formatted = ts.toISOString().replace("T", " ").replace("Z", "");
  return {
    timestamp: formatted,
    observed_timestamp: formatted,
    severity_text: severity,
    severity_number: getSeverityNumber(severity),
    body,
    service_name: "telemetryflow-platform",
    trace_id: traceId,
    span_id: "",
    trace_flags: traceId ? 1 : 0,
    organization_id: orgId,
    workspace_id: wsId,
    tenant_id: tenantId,
    resource_attributes: {},
    scope_name: "TelemetryFlow",
    scope_version: "",
    log_attributes: traceId
      ? { "code.function": "handleRequest", "http.method": "GET", "http.url": "/api/users" }
      : {},
  };
}

function getSeverityNumber(level: string): number {
  const map: Record<string, number> = { ERROR: 17, WARN: 13, INFO: 9, DEBUG: 5 };
  return map[level] || 9;
}
