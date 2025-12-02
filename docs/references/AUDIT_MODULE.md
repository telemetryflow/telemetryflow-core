# Audit Module Implementation

## Overview

The Audit Module has been added to TelemetryFlow Core to provide basic audit logging capabilities. This is a minimal, lightweight implementation suitable for the Core's scope while maintaining compatibility with the Platform's audit infrastructure.

## What Was Added

### 1. ClickHouse Configuration (`config/clickhouse/`)

Copied from TelemetryFlow Platform for future ClickHouse integration:

```
config/clickhouse/
├── config.xml      # Main ClickHouse server configuration
├── users.xml       # User accounts and access control
└── README.md       # Configuration documentation
```

**Features**:
- Optimized for time-series telemetry data
- Automatic data partitioning and TTL management
- High-performance compression (LZ4)
- Query performance tuning for observability
- Prometheus metrics exporter on port 9363

**Security**: Default passwords must be changed in production!

### 2. Audit Module (`src/modules/audit/`)

Minimal audit logging implementation:

```
src/modules/audit/
├── audit.module.ts     # NestJS module definition
├── audit.service.ts    # Core audit service
├── index.ts            # Module exports
├── README.md           # Module documentation
├── application/        # Future: Commands/Queries
├── domain/             # Future: Domain models
├── infrastructure/     # Future: ClickHouse integration
└── presentation/       # Future: API controllers
```

### 3. Core Files

**audit.service.ts**:
- `AuditEventType`: AUTH, AUTHZ, DATA, SYSTEM
- `AuditEventResult`: SUCCESS, FAILURE, DENIED
- `CreateAuditLogOptions`: Audit log entry interface
- `AuditService`: Main service with logging methods

**audit.module.ts**:
- Exports `AuditService` for use in other modules
- Integrated into `AppModule`

## Usage Examples

### Basic Audit Logging

```typescript
import { AuditService, AuditEventType, AuditEventResult } from './modules/audit';

constructor(private readonly auditService: AuditService) {}

// Log authentication event
await this.auditService.log({
  userId: user.id,
  userEmail: user.email,
  eventType: AuditEventType.AUTH,
  action: 'login',
  result: AuditEventResult.SUCCESS,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  metadata: { sessionId: session.id },
});
```

### Convenience Methods

```typescript
// Authentication
await this.auditService.logAuth('login', AuditEventResult.SUCCESS, {
  userId: user.id,
  ipAddress: req.ip,
});

// Authorization
await this.auditService.logAuthz('access_denied', AuditEventResult.DENIED, {
  userId: user.id,
  resource: '/api/admin',
});

// Data operations
await this.auditService.logData('create_user', AuditEventResult.SUCCESS, {
  userId: admin.id,
  metadata: { targetUserId: newUser.id },
});

// System events
await this.auditService.logSystem('startup', AuditEventResult.SUCCESS);
```

## Integration Points

### IAM Module

The audit service can be integrated into IAM operations:

```typescript
// In authentication handler
await this.auditService.logAuth('login', AuditEventResult.SUCCESS, {
  userId: user.id.value,
  userEmail: user.email.value,
  ipAddress: request.ip,
});

// In authorization guard
await this.auditService.logAuthz('permission_check', AuditEventResult.DENIED, {
  userId: user.id,
  resource: request.url,
});
```

## Current Implementation

### Storage: Winston Logger

Currently, audit logs are written through Winston logger:
- ✅ Structured logging with context
- ✅ Multiple log levels (info, warn, error)
- ✅ Console and file output
- ✅ JSON formatting
- ❌ No querying capability
- ❌ No analytics
- ❌ Manual retention management

### Log Format

```
[Audit] ✓ [AUTH] login - SUCCESS
[Audit] ⚠ [AUTHZ] access_denied - DENIED
[Audit] ✗ Failed to create audit log
```

## Future Enhancements

### Phase 1: ClickHouse Integration

When audit volume grows, integrate ClickHouse:

1. **Install Dependencies**:
   ```bash
   pnpm add @clickhouse/client
   ```

2. **Copy Services from Platform**:
   - `audit-clickhouse.service.ts`
   - ClickHouse schema migrations
   - Query DTOs

3. **Update Module**:
   ```typescript
   @Module({
     providers: [
       AuditService,
       AuditClickHouseService,
       ClickHouseService,
     ],
   })
   ```

4. **Deploy ClickHouse**:
   ```yaml
   # docker-compose.yml
   clickhouse:
     image: clickhouse/clickhouse-server:latest
     volumes:
       - ./config/clickhouse/config.xml:/etc/clickhouse-server/config.xml
       - ./config/clickhouse/users.xml:/etc/clickhouse-server/users.xml
     ports:
       - "8123:8123"  # HTTP
       - "9000:9000"  # Native
   ```

### Phase 2: Query API

Add audit log query endpoints:

```typescript
@Controller('audit')
export class AuditController {
  @Get()
  async query(@Query() queryDto: AuditQueryDto) {
    return this.auditService.query(queryDto);
  }

  @Get('statistics')
  async getStatistics(@Query() statsDto: AuditStatsDto) {
    return this.auditService.getStatistics(statsDto);
  }

  @Get('user/:userId/activity')
  async getUserActivity(@Param('userId') userId: string) {
    return this.auditService.getUserActivity(userId);
  }
}
```

### Phase 3: Analytics

Implement suspicious activity detection:

```typescript
async detectSuspiciousActivity(userId: string): Promise<{
  isSuspicious: boolean;
  reasons: string[];
  details: any;
}> {
  // Check for:
  // - Multiple failed login attempts
  // - Access from multiple IPs
  // - Unusual access patterns
  // - Permission denied events
}
```

## Comparison: Core vs Platform

| Feature | Core | Platform |
|---------|------|----------|
| **Storage** | Winston Logger | ClickHouse |
| **Volume** | Low-Medium | High (millions/day) |
| **Queries** | ❌ | ✅ Full SQL |
| **Analytics** | ❌ | ✅ Suspicious activity detection |
| **Retention** | Manual | Automatic (TTL 90 days) |
| **Performance** | N/A | Optimized for time-series |
| **API** | ❌ | ✅ REST endpoints |
| **Statistics** | ❌ | ✅ Real-time stats |
| **Export** | ❌ | ✅ CSV/JSON export |

## Configuration

### Environment Variables

```env
# Future ClickHouse configuration
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=telemetry
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=
```

### ClickHouse Settings

Key settings in `config/clickhouse/config.xml`:

- **HTTP Port**: 8123
- **Native Port**: 9000
- **Prometheus Metrics**: 9363
- **Max Memory**: 10GB per query
- **Max Concurrent Queries**: 100
- **Background Pool Size**: 16
- **Compression**: LZ4
- **TTL**: 90 days (configured per table)

## Security Considerations

### Current Implementation

- ✅ Audit logs written to secure log files
- ✅ Sensitive data not logged (passwords, tokens)
- ✅ IP addresses and user agents tracked
- ✅ Error handling prevents audit failures from blocking operations

### Future ClickHouse Implementation

- ⚠️ Change default ClickHouse passwords
- ⚠️ Restrict network access (users.xml)
- ⚠️ Use password hashing (SHA256)
- ⚠️ Enable TLS for production
- ⚠️ Configure proper user quotas
- ⚠️ Implement access control per database

## Testing

### Unit Tests

```typescript
describe('AuditService', () => {
  it('should log authentication events', async () => {
    await auditService.logAuth('login', AuditEventResult.SUCCESS, {
      userId: 'user-123',
    });
    // Verify logger was called
  });

  it('should handle logging failures gracefully', async () => {
    // Should not throw even if logging fails
    await expect(
      auditService.log({ /* invalid data */ })
    ).resolves.not.toThrow();
  });
});
```

### Integration Tests

```typescript
describe('Audit Integration', () => {
  it('should audit user login', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'password' });

    // Verify audit log was created
    expect(response.status).toBe(200);
    // Check logs for audit entry
  });
});
```

## Migration Path

### From Core to Platform

If you need full audit capabilities:

1. **Copy Platform Audit Module**:
   ```bash
   cp -r platform/backend/src/modules/audit/* core/src/modules/audit/
   ```

2. **Install Dependencies**:
   ```bash
   pnpm add @clickhouse/client
   ```

3. **Update Configuration**:
   - Add ClickHouse to docker-compose.yml
   - Configure environment variables
   - Run ClickHouse migrations

4. **Update Module Imports**:
   ```typescript
   import { AuditModule } from './modules/audit';
   // Now includes full ClickHouse functionality
   ```

## Files Modified

### New Files

- `config/clickhouse/config.xml`
- `config/clickhouse/users.xml`
- `config/clickhouse/README.md`
- `src/modules/audit/audit.module.ts`
- `src/modules/audit/audit.service.ts`
- `src/modules/audit/index.ts`
- `src/modules/audit/README.md`
- `docs/AUDIT_MODULE.md` (this file)

### Modified Files

- `src/app.module.ts` - Added AuditModule import
- `config/README.md` - Added ClickHouse section

## Summary

The Audit Module provides a foundation for audit logging in TelemetryFlow Core:

✅ **Minimal Implementation**: Lightweight, suitable for Core's scope
✅ **Future-Ready**: ClickHouse configuration ready for scaling
✅ **Compatible**: Matches Platform's audit event structure
✅ **Integrated**: Available throughout the application
✅ **Documented**: Comprehensive documentation and examples

The module can be used immediately for basic audit logging and easily upgraded to full ClickHouse-based storage when needed.

## References

- TelemetryFlow Platform: `/backend/src/modules/audit/`
- ClickHouse Documentation: https://clickhouse.com/docs
- Audit Logging Best Practices: OWASP Logging Cheat Sheet
