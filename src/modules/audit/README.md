# Audit Module

Minimal audit logging module for TelemetryFlow Core.

## Overview

The Audit Module provides basic audit logging capabilities for security and compliance tracking. This is a lightweight implementation that logs audit events through the Winston logger.

## Features

- **Event Types**: AUTH, AUTHZ, DATA, SYSTEM
- **Event Results**: SUCCESS, FAILURE, DENIED
- **Structured Logging**: All audit events are logged with context
- **Convenience Methods**: Pre-configured methods for common audit scenarios

## Usage

### Basic Logging

```typescript
import { AuditService, AuditEventType, AuditEventResult } from './modules/audit';

constructor(private readonly auditService: AuditService) {}

// Log an audit event
await this.auditService.log({
  userId: user.id,
  userEmail: user.email,
  eventType: AuditEventType.AUTH,
  action: 'login',
  result: AuditEventResult.SUCCESS,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### Convenience Methods

```typescript
// Authentication events
await this.auditService.logAuth('login', AuditEventResult.SUCCESS, {
  userId: user.id,
  userEmail: user.email,
  ipAddress: req.ip,
});

// Authorization events
await this.auditService.logAuthz('access_resource', AuditEventResult.DENIED, {
  userId: user.id,
  resource: '/api/admin',
});

// Data modification events
await this.auditService.logData('create_user', AuditEventResult.SUCCESS, {
  userId: admin.id,
  resource: 'users',
  metadata: { targetUserId: newUser.id },
});

// System events
await this.auditService.logSystem('startup', AuditEventResult.SUCCESS);
```

## Event Types

### AUTH (Authentication)
- `login` - User login attempts
- `logout` - User logout
- `token_refresh` - JWT token refresh
- `password_reset` - Password reset requests

### AUTHZ (Authorization)
- `access_resource` - Resource access attempts
- `permission_check` - Permission verification
- `role_check` - Role verification

### DATA (Data Operations)
- `create_*` - Entity creation
- `update_*` - Entity updates
- `delete_*` - Entity deletion
- `read_*` - Sensitive data access

### SYSTEM (System Events)
- `startup` - Application startup
- `shutdown` - Application shutdown
- `config_change` - Configuration changes
- `error` - System errors

## Event Results

- **SUCCESS**: Operation completed successfully
- **FAILURE**: Operation failed (technical error)
- **DENIED**: Operation denied (authorization failure)

## ClickHouse Configuration

For high-volume audit logging, ClickHouse configuration files are available in `config/clickhouse/`:

- `config.xml` - Server configuration optimized for time-series data
- `users.xml` - User accounts and access control

These files are ready for future ClickHouse integration when audit volume requires it.

## Future Enhancements

When audit volume grows, consider:

1. **ClickHouse Integration**: Use the provided configuration for high-volume storage
2. **Query API**: Add endpoints for audit log queries
3. **Analytics**: Implement suspicious activity detection
4. **Retention Policies**: Automated TTL-based cleanup
5. **Export**: Audit log export functionality

## Comparison with Platform

| Feature | Core | Platform |
|---------|------|----------|
| **Storage** | Winston Logger | ClickHouse |
| **Queries** | ❌ | ✅ |
| **Analytics** | ❌ | ✅ |
| **Volume** | Low-Medium | High |
| **Retention** | Manual | Automatic (TTL) |

## Migration Path

To upgrade to full ClickHouse-based audit logging:

1. Install ClickHouse client: `pnpm add @clickhouse/client`
2. Copy audit services from TelemetryFlow Platform
3. Update `audit.module.ts` to include ClickHouse service
4. Deploy ClickHouse using provided configuration
5. Run ClickHouse schema migrations

## Reference

Based on TelemetryFlow Platform audit module with minimal implementation for Core.
