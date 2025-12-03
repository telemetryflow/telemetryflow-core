-- Sample Audit Logs for Testing
-- TelemetryFlow Core - Audit Module

USE ${CLICKHOUSE_DB};

INSERT INTO audit_logs (
    timestamp, user_id, user_email, user_first_name, user_last_name,
    event_type, action, resource, result, error_message,
    ip_address, user_agent, metadata,
    tenant_id, workspace_id, organization_id, session_id, duration_ms
) VALUES
(now() - INTERVAL 1 HOUR, 'user-123', 'superadmin.telemetryflow@telemetryflow.id', 'Super', 'Administrator', 'AUTH', 'login', 'auth', 'SUCCESS', '', '192.168.1.100', 'Mozilla/5.0', '{"method":"password"}', 'tenant-1', 'workspace-1', 'org-1', 'session-1', 150),
(now() - INTERVAL 2 HOUR, 'user-456', 'developer.telemetryflow@telemetryflow.id', 'Developer', 'TelemetryFlow', 'AUTH', 'login', 'auth', 'SUCCESS', '', '192.168.1.101', 'Mozilla/5.0', '{"method":"password"}', 'tenant-1', 'workspace-1', 'org-1', 'session-2', 120),
(now() - INTERVAL 30 MINUTE, 'user-123', 'superadmin.telemetryflow@telemetryflow.id', 'Super', 'Administrator', 'DATA', 'create', 'users', 'SUCCESS', '', '192.168.1.100', 'Mozilla/5.0', '{"userId":"new-user-1","email":"newuser@example.com"}', 'tenant-1', 'workspace-1', 'org-1', 'session-1', 250),
(now() - INTERVAL 45 MINUTE, 'user-123', 'superadmin.telemetryflow@telemetryflow.id', 'Super', 'Administrator', 'DATA', 'update', 'roles', 'SUCCESS', '', '192.168.1.100', 'Mozilla/5.0', '{"roleId":"role-1","changes":["permissions"]}', 'tenant-1', 'workspace-1', 'org-1', 'session-1', 180),
(now() - INTERVAL 3 HOUR, 'unknown', 'hacker@example.com', '', '', 'AUTH', 'login', 'auth', 'FAILURE', 'Invalid credentials', '203.0.113.1', 'curl/7.68.0', '{"attempts":3}', '', '', '', 'session-fail-1', 50),
(now() - INTERVAL 20 MINUTE, 'user-456', 'developer.telemetryflow@telemetryflow.id', 'Developer', 'TelemetryFlow', 'AUTHZ', 'delete', 'users', 'DENIED', 'Insufficient permissions', '192.168.1.101', 'Mozilla/5.0', '{"required":"users:delete"}', 'tenant-1', 'workspace-1', 'org-1', 'session-2', 10),
(now() - INTERVAL 10 MINUTE, 'user-123', 'superadmin.telemetryflow@telemetryflow.id', 'Super', 'Administrator', 'DATA', 'create', 'organizations', 'SUCCESS', '', '192.168.1.100', 'Mozilla/5.0', '{"orgId":"org-2","name":"New Org"}', 'tenant-1', 'workspace-1', 'org-1', 'session-1', 320),
(now() - INTERVAL 5 MINUTE, 'user-789', 'viewer.telemetryflow@telemetryflow.id', 'Viewer', 'TelemetryFlow', 'DATA', 'read', 'users', 'SUCCESS', '', '192.168.1.102', 'Mozilla/5.0', '{"count":25}', 'tenant-1', 'workspace-1', 'org-1', 'session-3', 45),
(now() - INTERVAL 15 MINUTE, 'user-456', 'developer.telemetryflow@telemetryflow.id', 'Developer', 'TelemetryFlow', 'DATA', 'update', 'workspaces', 'SUCCESS', '', '192.168.1.101', 'Mozilla/5.0', '{"workspaceId":"ws-1","field":"description"}', 'tenant-1', 'workspace-1', 'org-1', 'session-2', 95),
(now() - INTERVAL 4 HOUR, 'user-123', 'superadmin.telemetryflow@telemetryflow.id', 'Super', 'Administrator', 'SYSTEM', 'configure', 'settings', 'SUCCESS', '', '192.168.1.100', 'Mozilla/5.0', '{"setting":"max_users","value":"100"}', 'tenant-1', 'workspace-1', 'org-1', 'session-1', 200);
