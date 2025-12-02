-- ClickHouse Audit Logs Sample Data
-- TelemetryFlow Core - Audit Module

USE ${CLICKHOUSE_DB:telemetryflow_db};

-- Insert sample audit logs
INSERT INTO audit_logs (
    user_id, user_email, user_first_name, user_last_name,
    event_type, action, resource, result,
    error_message, ip_address, user_agent,
    metadata, tenant_id, workspace_id, organization_id,
    session_id, duration_ms
) VALUES
-- Successful authentication events
('550e8400-e29b-41d4-a716-446655440001', 'superadmin.telemetryflow@telemetryflow.id', 'Super', 'Admin', 'AUTH', 'login', 'user', 'SUCCESS', '', '192.168.1.100', 'Mozilla/5.0', '{"method":"password"}', 'tenant-001', 'ws-001', 'org-001', 'sess-001', 150),
('550e8400-e29b-41d4-a716-446655440002', 'administrator.telemetryflow@telemetryflow.id', 'Admin', 'User', 'AUTH', 'login', 'user', 'SUCCESS', '', '192.168.1.101', 'Mozilla/5.0', '{"method":"password"}', 'tenant-001', 'ws-001', 'org-001', 'sess-002', 120),
('550e8400-e29b-41d4-a716-446655440003', 'developer.telemetryflow@telemetryflow.id', 'Developer', 'User', 'AUTH', 'login', 'user', 'SUCCESS', '', '192.168.1.102', 'Mozilla/5.0', '{"method":"password"}', 'tenant-001', 'ws-002', 'org-001', 'sess-003', 130),

-- Failed authentication events
('', 'unknown@example.com', '', '', 'AUTH', 'login', 'user', 'FAILURE', 'Invalid credentials', '192.168.1.200', 'Mozilla/5.0', '{"method":"password"}', '', '', '', 'sess-004', 80),
('', 'hacker@example.com', '', '', 'AUTH', 'login', 'user', 'FAILURE', 'Account locked', '10.0.0.50', 'curl/7.68.0', '{"method":"password"}', '', '', '', 'sess-005', 50),

-- Authorization events
('550e8400-e29b-41d4-a716-446655440001', 'superadmin.telemetryflow@telemetryflow.id', 'Super', 'Admin', 'AUTHZ', 'create', 'role', 'SUCCESS', '', '192.168.1.100', 'Mozilla/5.0', '{"role":"developer"}', 'tenant-001', 'ws-001', 'org-001', 'sess-001', 200),
('550e8400-e29b-41d4-a716-446655440003', 'developer.telemetryflow@telemetryflow.id', 'Developer', 'User', 'AUTHZ', 'delete', 'user', 'DENIED', 'Insufficient permissions', '192.168.1.102', 'Mozilla/5.0', '{"target_user":"user-123"}', 'tenant-001', 'ws-002', 'org-001', 'sess-003', 100),

-- Data operations
('550e8400-e29b-41d4-a716-446655440002', 'administrator.telemetryflow@telemetryflow.id', 'Admin', 'User', 'DATA', 'create', 'workspace', 'SUCCESS', '', '192.168.1.101', 'Mozilla/5.0', '{"workspace":"new-project"}', 'tenant-001', 'ws-001', 'org-001', 'sess-002', 250),
('550e8400-e29b-41d4-a716-446655440003', 'developer.telemetryflow@telemetryflow.id', 'Developer', 'User', 'DATA', 'update', 'organization', 'SUCCESS', '', '192.168.1.102', 'Mozilla/5.0', '{"field":"name"}', 'tenant-001', 'ws-002', 'org-001', 'sess-003', 180),
('550e8400-e29b-41d4-a716-446655440003', 'developer.telemetryflow@telemetryflow.id', 'Developer', 'User', 'DATA', 'read', 'user', 'SUCCESS', '', '192.168.1.102', 'Mozilla/5.0', '{"query":"list"}', 'tenant-001', 'ws-002', 'org-001', 'sess-003', 90),

-- System events
('550e8400-e29b-41d4-a716-446655440001', 'superadmin.telemetryflow@telemetryflow.id', 'Super', 'Admin', 'SYSTEM', 'backup', 'database', 'SUCCESS', '', '192.168.1.100', 'Mozilla/5.0', '{"type":"full"}', 'tenant-001', 'ws-001', 'org-001', 'sess-001', 5000),
('550e8400-e29b-41d4-a716-446655440001', 'superadmin.telemetryflow@telemetryflow.id', 'Super', 'Admin', 'SYSTEM', 'config_change', 'settings', 'SUCCESS', '', '192.168.1.100', 'Mozilla/5.0', '{"setting":"max_connections"}', 'tenant-001', 'ws-001', 'org-001', 'sess-001', 150);
