export const workspacesSeed = [
  {
    workspace_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    name: 'DevOpsCorner Workspace',
    code: 'ws-devopscorner',
    description: 'DevOpsCorner workspace',
    isActive: true,
    datasource_config: { environment: 'production' },
    organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  },
  {
    workspace_id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    name: 'TelemetryFlow Workspace',
    code: 'ws-telemetryflow',
    description: 'TelemetryFlow workspace',
    isActive: true,
    datasource_config: { environment: 'production' },
    organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  },
  {
    workspace_id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    name: 'Demo Workspace',
    code: 'ws-demo',
    description: 'Demo workspace (auto-cleanup every 6 hours)',
    isActive: true,
    datasource_config: { environment: 'demo', autoCleanup: true, cleanupInterval: '6h' },
    organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  },
];
