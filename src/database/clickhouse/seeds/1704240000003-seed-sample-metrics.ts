import { ClickHouseClient } from '@clickhouse/client';
import { createConnection } from 'typeorm';

export async function seed(client: ClickHouseClient, database: string): Promise<void> {
  console.log('📊 Seeding sample metrics...');

  // Get IDs from PostgreSQL
  const pgConnection = await createConnection({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USERNAME || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'telemetryflow_db',
  });

  const [org] = await pgConnection.query(`SELECT organization_id FROM organizations WHERE code = 'DEVOPSCORNER' LIMIT 1`);
  const [workspace] = await pgConnection.query(`SELECT workspace_id FROM workspaces WHERE code = 'TELEMETRYFLOW-POC' LIMIT 1`);
  const [tenant] = await pgConnection.query(`SELECT tenant_id FROM tenants WHERE code = 'DEVOPSCORNER' LIMIT 1`);
  
  await pgConnection.close();

  const organization_id = org?.organization_id || '';
  const workspace_id = workspace?.workspace_id || '';
  const tenant_id = tenant?.tenant_id || '';

  const now = Date.now();
  const metrics = [];

  // Generate sample metrics for the last hour
  for (let i = 0; i < 60; i++) {
    const timestamp = new Date(now - i * 60 * 1000);

    metrics.push({
      timestamp: timestamp.toISOString().replace('T', ' ').replace('Z', ''),
      metric_name: 'system.cpu.usage',
      metric_type: 'gauge',
      value: 20 + Math.random() * 60,
      service_name: 'telemetryflow-core',
      organization_id,
      workspace_id,
      tenant_id,
      resource_attributes: {},
      metric_attributes: {},
      unit: 'percent',
    });

    metrics.push({
      timestamp: timestamp.toISOString().replace('T', ' ').replace('Z', ''),
      metric_name: 'system.memory.usage',
      metric_type: 'gauge',
      value: 512 + Math.random() * 512,
      service_name: 'telemetryflow-core',
      organization_id,
      workspace_id,
      tenant_id,
      resource_attributes: {},
      metric_attributes: {},
      unit: 'MB',
    });

    metrics.push({
      timestamp: timestamp.toISOString().replace('T', ' ').replace('Z', ''),
      metric_name: 'http.server.requests',
      metric_type: 'counter',
      value: Math.floor(Math.random() * 100),
      service_name: 'telemetryflow-core',
      organization_id,
      workspace_id,
      tenant_id,
      resource_attributes: {},
      metric_attributes: {},
      unit: 'requests',
    });

    metrics.push({
      timestamp: timestamp.toISOString().replace('T', ' ').replace('Z', ''),
      metric_name: 'http.server.duration',
      metric_type: 'histogram',
      value: 50 + Math.random() * 200,
      service_name: 'telemetryflow-core',
      organization_id,
      workspace_id,
      tenant_id,
      resource_attributes: {},
      metric_attributes: {},
      unit: 'ms',
    });
  }

  const batchSize = 100;
  for (let i = 0; i < metrics.length; i += batchSize) {
    const batch = metrics.slice(i, i + batchSize);
    await client.insert({
      table: `${database}.metrics`,
      values: batch,
      format: 'JSONEachRow',
    });
  }

  console.log(`   ✅ Seeded ${metrics.length} sample metrics`);
}
