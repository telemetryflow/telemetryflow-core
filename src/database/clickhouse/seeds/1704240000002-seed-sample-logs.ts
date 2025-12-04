import { ClickHouseClient } from '@clickhouse/client';

export async function seed(client: ClickHouseClient, database: string): Promise<void> {
  console.log('📊 Seeding sample logs...');

  const sampleLogs = [
    {
      severity_text: 'INFO',
      body: 'Application started successfully',
      service_name: 'telemetryflow-core',
      hours_ago: 1,
    },
    {
      severity_text: 'INFO',
      body: 'Database connection established',
      service_name: 'telemetryflow-core',
      hours_ago: 1,
    },
    {
      severity_text: 'DEBUG',
      body: 'User authentication attempt',
      service_name: 'telemetryflow-core',
      minutes_ago: 45,
    },
    {
      severity_text: 'INFO',
      body: 'User logged in successfully',
      service_name: 'telemetryflow-core',
      minutes_ago: 45,
    },
    {
      severity_text: 'WARN',
      body: 'Rate limit approaching threshold',
      service_name: 'telemetryflow-core',
      minutes_ago: 30,
    },
    {
      severity_text: 'ERROR',
      body: 'Failed to connect to external service',
      service_name: 'telemetryflow-core',
      minutes_ago: 20,
    },
    {
      severity_text: 'INFO',
      body: 'Cache hit for user profile',
      service_name: 'telemetryflow-core',
      minutes_ago: 15,
    },
    {
      severity_text: 'DEBUG',
      body: 'Query executed successfully',
      service_name: 'telemetryflow-core',
      minutes_ago: 10,
    },
    {
      severity_text: 'WARN',
      body: 'Slow query detected',
      service_name: 'telemetryflow-core',
      minutes_ago: 5,
    },
    {
      severity_text: 'INFO',
      body: 'Health check passed',
      service_name: 'telemetryflow-core',
      minutes_ago: 1,
    },
  ];

  for (const log of sampleLogs) {
    const now = new Date();
    const timestamp = log.hours_ago
      ? new Date(now.getTime() - log.hours_ago * 60 * 60 * 1000)
      : new Date(now.getTime() - (log.minutes_ago || 0) * 60 * 1000);

    await client.insert({
      table: `${database}.logs`,
      values: [{
        timestamp: timestamp.toISOString().replace('T', ' ').replace('Z', ''),
        severity_text: log.severity_text,
        body: log.body,
        service_name: log.service_name,
        trace_id: '',
        span_id: '',
        trace_flags: 0,
        severity_number: 0,
        organization_id: '',
        workspace_id: '',
        tenant_id: '',
        resource_attributes: {},
        scope_name: '',
        scope_version: '',
        log_attributes: {},
      }],
      format: 'JSONEachRow',
    });
  }

  console.log(`   ✅ Seeded ${sampleLogs.length} sample logs`);
}
