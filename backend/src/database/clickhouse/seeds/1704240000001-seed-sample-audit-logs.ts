import { ClickHouseClient } from "@clickhouse/client";
import { DataSource } from "typeorm";
import { randomInt } from "crypto";

export async function seed(
  client: ClickHouseClient,
  database: string,
): Promise<void> {
  console.log("📊 Seeding sample audit logs (30-day bulk)...");

  // ── Lookup PostgreSQL IDs ──────────────────────────────────────────────────
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
  const users = await pgDataSource.query(
    `SELECT user_id, email, first_name, last_name FROM users WHERE email LIKE '%@telemetryflow.id' ORDER BY email LIMIT 10`,
  );

  await pgDataSource.destroy();

  const organization_id = org?.organization_id || "org-devopscorner";
  const workspace_id = workspace?.workspace_id || "ws-telemetryflow-poc";
  const tenant_id = tenant?.tenant_id || "tn-devopscorner";

  // ── User pool ──────────────────────────────────────────────────────────────
  interface SeedUser { user_id: string; email: string; first_name: string; last_name: string; }
  const userPool: SeedUser[] = (users.length > 0 ? users : [
    { user_id: "u-001", email: "superadmin.telemetryflow@telemetryflow.id", first_name: "Super", last_name: "Administrator" },
    { user_id: "u-002", email: "administrator.telemetryflow@telemetryflow.id", first_name: "Admin", last_name: "TelemetryFlow" },
    { user_id: "u-003", email: "developer.telemetryflow@telemetryflow.id", first_name: "Developer", last_name: "TelemetryFlow" },
    { user_id: "u-004", email: "viewer.telemetryflow@telemetryflow.id", first_name: "Viewer", last_name: "TelemetryFlow" },
    { user_id: "u-005", email: "demo.telemetryflow@telemetryflow.id", first_name: "Demo", last_name: "TelemetryFlow" },
  ]) as SeedUser[];

  // ── Constants ──────────────────────────────────────────────────────────────
  const regions = [
    "ap-southeast-3",  // Jakarta (primary — most traffic)
    "ap-southeast-3",
    "ap-southeast-3",
    "ap-southeast-1",  // Singapore
    "ap-southeast-1",
    "ap-east-1",       // Asia Pacific East
    "eu-west-1",       // Europe
    "us-east-1",       // North America
    "me-south-1",      // Middle East
  ];
  const ips = [
    "192.168.1.100", "192.168.1.101", "192.168.1.102",
    "10.0.0.50", "10.0.0.51", "172.16.0.25",
    "203.0.113.42", "198.51.100.1",
  ];
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  ];
  const dataResources = ["users", "dashboard", "alert", "agent", "cluster", "api_key", "workspace", "tenant", "report"];
  const dataActions = ["create", "read", "update", "delete", "export"];
  const authzActions = ["access_granted", "access_denied", "permission_check", "role_assigned"];
  const systemActions = ["config_change", "migration_run", "cache_clear", "backup_start"];

  // ── Helpers ────────────────────────────────────────────────────────────────
  const pick = <T>(arr: T[]): T => arr[randomInt(arr.length)];
  const rand = (min: number, max: number) => randomInt(min, max + 1);
  const fmt = (d: Date) => d.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");

  // ── Generate events ────────────────────────────────────────────────────────
  const now = Date.now();
  const allLogs: Record<string, unknown>[] = [];

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    // More events in recent 7 days to make timeseries charts visually rich
    const eventsPerDay = dayOffset <= 7 ? 28 : 10;
    const dayBase = now - dayOffset * 86400000;

    for (let i = 0; i < eventsPerDay; i++) {
      const hourOffset = rand(0, 23);
      const minuteOffset = rand(0, 59);
      const ts = new Date(dayBase - hourOffset * 3600000 - minuteOffset * 60000);
      const user = pick(userPool);
      const region = pick(regions);

      // Distribute event types: AUTH 45%, DATA 25%, AUTHZ 20%, SYSTEM 10%
      const roll = randomInt(0, 1_000_000) / 1_000_000;

      if (roll < 0.12) {
        // AUTH - register (new user registration, spread across regions)
        allLogs.push({
          timestamp: fmt(ts),
          user_id: user.user_id,
          user_email: `newuser.${dayOffset}.${i}@telemetryflow.id`,
          user_first_name: "New",
          user_last_name: `User${dayOffset}${i}`,
          event_type: "AUTH",
          action: "register",
          resource: "auth",
          result: "SUCCESS",
          error_message: "",
          ip_address: pick(ips),
          user_agent: pick(userAgents),
          metadata: JSON.stringify({ method: "email", referrer: "signup_page" }),
          tenant_id,
          workspace_id,
          organization_id,
          region_id: region,
          session_id: `session-reg-${dayOffset}-${i}`,
          duration_ms: rand(200, 800),
        });
      } else if (roll < 0.38) {
        // AUTH - login SUCCESS
        allLogs.push({
          timestamp: fmt(ts),
          user_id: user.user_id,
          user_email: user.email,
          user_first_name: user.first_name,
          user_last_name: user.last_name,
          event_type: "AUTH",
          action: "login",
          resource: "auth",
          result: "SUCCESS",
          error_message: "",
          ip_address: pick(ips),
          user_agent: pick(userAgents),
          metadata: JSON.stringify({ method: "password" }),
          tenant_id,
          workspace_id,
          organization_id,
          region_id: region,
          session_id: `session-${user.user_id}-${dayOffset}-${i}`,
          duration_ms: rand(80, 350),
        });
      } else if (roll < 0.47) {
        // AUTH - login FAILURE
        allLogs.push({
          timestamp: fmt(ts),
          user_id: "",
          user_email: `unknown${rand(1, 99)}@external.com`,
          user_first_name: "",
          user_last_name: "",
          event_type: "AUTH",
          action: "login",
          resource: "auth",
          result: "FAILURE",
          error_message: "Invalid credentials",
          ip_address: pick(["203.0.113.1", "198.51.100.42", "192.0.2.100"]),
          user_agent: pick(["curl/7.68.0", "python-requests/2.28.0", pick(userAgents)]),
          metadata: JSON.stringify({ attempts: rand(1, 5) }),
          tenant_id: "",
          workspace_id: "",
          organization_id: "",
          region_id: "",
          session_id: `session-fail-${dayOffset}-${i}`,
          duration_ms: rand(10, 80),
        });
      } else if (roll < 0.67) {
        // DATA events
        const action = pick(dataActions);
        const resource = pick(dataResources);
        allLogs.push({
          timestamp: fmt(ts),
          user_id: user.user_id,
          user_email: user.email,
          user_first_name: user.first_name,
          user_last_name: user.last_name,
          event_type: "DATA",
          action,
          resource,
          result: Math.random() < 0.92 ? "SUCCESS" : "FAILURE",
          error_message: "",
          ip_address: pick(ips),
          user_agent: pick(userAgents),
          metadata: JSON.stringify({ resourceId: `${resource}-${rand(1, 1000)}` }),
          tenant_id,
          workspace_id,
          organization_id,
          region_id: region,
          session_id: `session-${user.user_id}-${dayOffset}-${i}`,
          duration_ms: rand(50, 500),
        });
      } else if (roll < 0.87) {
        // AUTHZ events
        const action = pick(authzActions);
        const denied = action === "access_denied";
        allLogs.push({
          timestamp: fmt(ts),
          user_id: user.user_id,
          user_email: user.email,
          user_first_name: user.first_name,
          user_last_name: user.last_name,
          event_type: "AUTHZ",
          action,
          resource: pick(dataResources),
          result: denied ? "DENIED" : "SUCCESS",
          error_message: denied ? "Insufficient permissions" : "",
          ip_address: pick(ips),
          user_agent: pick(userAgents),
          metadata: JSON.stringify({ permission: `${pick(dataResources)}:${pick(["read","write","delete"])}` }),
          tenant_id,
          workspace_id,
          organization_id,
          region_id: region,
          session_id: `session-${user.user_id}-${dayOffset}-${i}`,
          duration_ms: rand(5, 50),
        });
      } else {
        // SYSTEM events
        allLogs.push({
          timestamp: fmt(ts),
          user_id: user.user_id,
          user_email: user.email,
          user_first_name: user.first_name,
          user_last_name: user.last_name,
          event_type: "SYSTEM",
          action: pick(systemActions),
          resource: "system",
          result: "SUCCESS",
          error_message: "",
          ip_address: "127.0.0.1",
          user_agent: "telemetryflow-backend/1.0",
          metadata: JSON.stringify({ component: pick(["auth", "cache", "queue", "scheduler"]) }),
          tenant_id,
          workspace_id,
          organization_id,
          region_id: "",
          session_id: `session-system-${dayOffset}-${i}`,
          duration_ms: rand(10, 200),
        });
      }
    }
  }

  // ── Batch insert ───────────────────────────────────────────────────────────
  const BATCH = 100;
  for (let i = 0; i < allLogs.length; i += BATCH) {
    await client.insert({
      table: `${database}.audit_logs`,
      values: allLogs.slice(i, i + BATCH),
      format: "JSONEachRow",
    });
  }

  console.log(`   ✅ Seeded ${allLogs.length} audit logs (30-day history)`);
}
