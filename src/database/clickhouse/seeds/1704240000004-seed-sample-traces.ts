import { ClickHouseClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';
import { createConnection } from 'typeorm';

export async function seed(client: ClickHouseClient, database: string): Promise<void> {
  console.log('🔍 Seeding sample traces...');

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
  const traces = [];

  for (let i = 0; i < 10; i++) {
    const traceId = randomUUID().replace(/-/g, '');
    const timestamp = new Date(now - i * 5 * 60 * 1000);
    const isError = i % 5 === 0;

    const rootSpanId = randomUUID().replace(/-/g, '').substring(0, 16);
    traces.push({
      timestamp: timestamp.toISOString().replace('T', ' ').replace('Z', ''),
      trace_id: traceId,
      span_id: rootSpanId,
      parent_span_id: '',
      span_name: 'GET /api/users',
      span_kind: 'SERVER',
      service_name: 'telemetryflow-core',
      status_code: isError ? 'ERROR' : 'OK',
      status_message: isError ? 'Internal Server Error' : '',
      duration_ns: Math.floor((100 + Math.random() * 400) * 1000000),
      organization_id,
      workspace_id,
      tenant_id,
      resource_attributes: {},
      span_attributes: {},
      events: '',
      links: '',
    });

    const dbSpanId = randomUUID().replace(/-/g, '').substring(0, 16);
    traces.push({
      timestamp: new Date(timestamp.getTime() + 10).toISOString().replace('T', ' ').replace('Z', ''),
      trace_id: traceId,
      span_id: dbSpanId,
      parent_span_id: rootSpanId,
      span_name: 'SELECT users',
      span_kind: 'CLIENT',
      service_name: 'telemetryflow-core',
      status_code: isError ? 'ERROR' : 'OK',
      status_message: isError ? 'Connection timeout' : '',
      duration_ns: Math.floor((20 + Math.random() * 80) * 1000000),
      organization_id,
      workspace_id,
      tenant_id,
      resource_attributes: {},
      span_attributes: {},
      events: '',
      links: '',
    });

    const cacheSpanId = randomUUID().replace(/-/g, '').substring(0, 16);
    traces.push({
      timestamp: new Date(timestamp.getTime() + 5).toISOString().replace('T', ' ').replace('Z', ''),
      trace_id: traceId,
      span_id: cacheSpanId,
      parent_span_id: rootSpanId,
      span_name: 'cache.get',
      span_kind: 'CLIENT',
      service_name: 'telemetryflow-core',
      status_code: 'OK',
      status_message: '',
      duration_ns: Math.floor((1 + Math.random() * 5) * 1000000),
      organization_id,
      workspace_id,
      tenant_id,
      resource_attributes: {},
      span_attributes: {},
      events: '',
      links: '',
    });
  }

  await client.insert({
    table: `${database}.traces`,
    values: traces,
    format: 'JSONEachRow',
  });

  console.log(`   ✅ Seeded ${traces.length} sample traces (${Math.floor(traces.length / 3)} complete traces)`);
}
