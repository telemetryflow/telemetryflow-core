/**
 * ClickHouse Migrations Index
 * 
 * Auto-exports all migration modules for programmatic access
 */

export * as CreateAuditLogsTable from './1704240000001-CreateAuditLogsTable';
export * as CreateLogsTable from './1704240000002-CreateLogsTable';
export * as CreateMetricsTable from './1704240000003-CreateMetricsTable';
export * as CreateTracesTable from './1704240000004-CreateTracesTable';

// Migration metadata
export const migrations = [
  { id: '1704240000001', name: 'CreateAuditLogsTable', description: 'Create audit_logs table', tables: ['audit_logs'] },
  { id: '1704240000002', name: 'CreateLogsTable', description: 'Create logs table', tables: ['logs'] },
  { id: '1704240000003', name: 'CreateMetricsTable', description: 'Create metrics table', tables: ['metrics'] },
  { id: '1704240000004', name: 'CreateTracesTable', description: 'Create traces table', tables: ['traces'] },
];
