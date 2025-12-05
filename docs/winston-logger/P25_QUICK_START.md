# P25 Winston Logging - Quick Start Guide

**Date**: December 5, 2025  
**Status**: ✅ Ready to Use

## 🚀 Quick Start (5 minutes)

### 1. Basic Usage (No Changes Needed)

Your existing code works as-is:

```typescript
@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async createUser(dto: CreateUserDto) {
    this.logger.log('Creating user', 'UserService');
    // Your code here
  }
}
```

### 2. Use @Log() Decorator (Recommended)

Add automatic logging to any method:

```typescript
import { Log } from '@/logger';

@Injectable()
export class UserService {
  @Log({ level: 'info' })
  async createUser(dto: CreateUserDto) {
    // Automatically logs entry, exit, duration, errors
    return this.userRepository.save(dto);
  }
}
```

**Output**:
```
→ createUser
← createUser (145ms)
```

### 3. Access Request Context

Get current request information anywhere:

```typescript
import { RequestContextManager } from '@/logger';

const requestId = RequestContextManager.getRequestId();
const tenantId = RequestContextManager.getTenantId();
const userId = RequestContextManager.getUserId();
```

### 4. Enrich Logs

Add structured metadata:

```typescript
import { LogEnrichment } from '@/logger';

this.logger.info(
  'User created',
  LogEnrichment.withRequestContext({
    action: 'user.create',
    userId: user.id,
  })
);
```

**Output**:
```json
{
  "level": "info",
  "message": "User created",
  "requestId": "req_abc123",
  "tenantId": "tenant_xyz",
  "userId": "user_123",
  "action": "user.create",
  "traceId": "...",
  "spanId": "..."
}
```

## 📚 Common Patterns

### Pattern 1: Service with Decorator

```typescript
@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  @Log({ level: 'info', includeArgs: true })
  async createUser(dto: CreateUserDto) {
    return this.userRepository.save(dto);
  }

  @Log({ level: 'warn' })
  async deleteUser(id: string) {
    return this.userRepository.delete(id);
  }
}
```

### Pattern 2: Manual Logging with Context

```typescript
@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async createUser(dto: CreateUserDto) {
    this.logger.info(
      'Creating user',
      LogEnrichment.withRequestContext({
        action: 'user.create',
        email: dto.email,
      })
    );

    const user = await this.userRepository.save(dto);

    this.logger.info(
      'User created',
      LogEnrichment.withRequestContext({
        action: 'user.created',
        userId: user.id,
      })
    );

    return user;
  }
}
```

### Pattern 3: Error Logging

```typescript
@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async createUser(dto: CreateUserDto) {
    try {
      return await this.userRepository.save(dto);
    } catch (error) {
      this.logger.error(
        'Failed to create user',
        error,
        LogEnrichment.withRequestContext({
          action: 'user.create.failed',
          email: dto.email,
        })
      );
      throw error;
    }
  }
}
```

### Pattern 4: Performance Tracking

```typescript
@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async createUser(dto: CreateUserDto) {
    const startTime = Date.now();

    const user = await this.userRepository.save(dto);

    const duration = Date.now() - startTime;
    this.logger.info(
      'User created',
      LogEnrichment.withRequestContext({
        action: 'user.created',
        userId: user.id,
        duration,
      })
    );

    return user;
  }
}
```

## 🎯 Best Practices

### DO ✅

1. **Use @Log() decorator** for automatic logging
2. **Use LogEnrichment** for structured metadata
3. **Log business events** (user.created, order.placed)
4. **Include relevant IDs** (userId, orderId, etc.)
5. **Use appropriate log levels** (info for events, warn for issues, error for failures)

### DON'T ❌

1. **Don't log sensitive data** (passwords, tokens, credit cards)
2. **Don't log in loops** (use sampling or aggregate)
3. **Don't use console.log** (use LoggerService)
4. **Don't log entire objects** (extract relevant fields)
5. **Don't ignore errors** (always log with context)

## 🔍 Debugging

### View Logs with Context

All logs automatically include:
- `requestId` - Correlate logs across services
- `traceId` - Link to distributed traces
- `tenantId` - Multi-tenant isolation
- `userId` - User activity tracking

### Find Logs by Request ID

```bash
# In logs
grep "req_abc123" logs/application.log

# In ClickHouse
SELECT * FROM logs WHERE requestId = 'req_abc123'

# In Jaeger
# Search by traceId (automatically linked)
```

## 📊 Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `error` | Failures, exceptions | Database connection failed |
| `warn` | Degraded state, retries | API rate limit approaching |
| `info` | Business events | User created, Order placed |
| `debug` | Detailed flow | Query executed, Cache hit |
| `verbose` | Everything | Variable values, Loop iterations |

## 🚦 Environment Configuration

```bash
# .env
LOGGER_TYPE=winston  # Use Winston (recommended)
LOG_LEVEL=info       # Set log level
OTEL_ENABLED=true    # Enable OTEL export
```

## 🔗 Related Documentation

- [P25_IMPLEMENTATION_SUMMARY.md](./P25_IMPLEMENTATION_SUMMARY.md) - Full implementation details
- [P25_WINSTON_IMPACT_ANALYSIS.md](./P25_WINSTON_IMPACT_ANALYSIS.md) - Impact analysis
- [LOGGER_MODULE_COMPARISON.md](./LOGGER_MODULE_COMPARISON.md) - Platform vs Core comparison

---

**Quick Tip**: Start with @Log() decorator, then add enrichment as needed! 🎯
