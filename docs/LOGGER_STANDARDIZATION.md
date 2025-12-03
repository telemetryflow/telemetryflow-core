# Logger Standardization - TelemetryFlow Core

All logger calls have been standardized to use the `[${MODULE_NAME}]` prefix format.

## Standard Format

```typescript
const MODULE_NAME = 'ServiceName';

export class ServiceName {
  private readonly logger = new Logger(MODULE_NAME);

  someMethod() {
    this.logger.log(`[${MODULE_NAME}] Operation successful`);
    this.logger.error(`[${MODULE_NAME}] Operation failed: ${error.message}`);
    this.logger.warn(`[${MODULE_NAME}] Warning message`);
    this.logger.debug(`[${MODULE_NAME}] Debug information`);
  }
}
```

## Standardized Modules

### Core Services

1. **ClickHouseService** ✅
   - `src/shared/clickhouse/clickhouse.service.ts`
   - All log, error, and debug calls standardized

2. **HttpLoggingInterceptor** ✅
   - `src/logger/http-logging.interceptor.ts`
   - HTTP request/response logging standardized

3. **AuditService** ✅
   - `src/modules/audit/audit.service.ts`
   - Audit logging standardized

### IAM Module

4. **IAM Handlers** ✅
   - `src/modules/iam/application/handlers/*.ts`
   - All handler logger calls standardized
   - Examples:
     - AssignRoleToUser.handler.ts
     - RevokeRoleFromUser.handler.ts
     - UpdateRole.handler.ts

5. **IAM Event Processors** ✅
   - `src/modules/iam/infrastructure/messaging/*.ts`
   - `src/modules/iam/infrastructure/processors/*.ts`
   - Event processing logs standardized

## Benefits

### 1. Consistent Log Format

All logs now follow the same pattern:
```
[ModuleName] Message content
```

### 2. Easy Filtering

Filter logs by module in production:
```bash
# Filter by module
grep "\[ClickHouseService\]" logs/app.log

# Filter errors by module
grep "\[AuditService\].*ERROR" logs/error.log
```

### 3. Better Debugging

Clear module identification helps trace issues:
```
[ClickHouseService] Failed to insert log: Connection timeout
[HttpLoggingInterceptor] ✗ Request failed: POST /api/users - 500
[AuditService] ✓ Audit log created successfully
```

### 4. ClickHouse Integration

Logs sent to ClickHouse include module name in attributes:
```sql
SELECT timestamp, body, log_attributes['module']
FROM logs
WHERE log_attributes['module'] = 'ClickHouseService'
ORDER BY timestamp DESC;
```

## Log Levels

### Standard Usage

- **log**: Normal operations, successful actions
  ```typescript
  this.logger.log(`[${MODULE_NAME}] User created successfully`);
  ```

- **error**: Errors and exceptions
  ```typescript
  this.logger.error(`[${MODULE_NAME}] Failed to save: ${error.message}`, error.stack);
  ```

- **warn**: Warnings and potential issues
  ```typescript
  this.logger.warn(`[${MODULE_NAME}] Cache miss, fetching from database`);
  ```

- **debug**: Detailed debugging information
  ```typescript
  this.logger.debug(`[${MODULE_NAME}] Processing ${items.length} items`);
  ```

## Examples

### Before Standardization

```typescript
// Inconsistent formats
this.logger.log('User created');
this.logger.error(`Failed to insert log: ${error.message}`);
this.logger.log(`[HTTP] Request completed`);
this.logger.error(`[Audit] ✗ Failed to create audit log`);
```

### After Standardization

```typescript
const MODULE_NAME = 'UserService';

// Consistent format
this.logger.log(`[${MODULE_NAME}] User created`);
this.logger.error(`[${MODULE_NAME}] Failed to insert log: ${error.message}`);
this.logger.log(`[${MODULE_NAME}] Request completed`);
this.logger.error(`[${MODULE_NAME}] Failed to create audit log`);
```

## Adding New Modules

When creating new services/modules:

1. **Add MODULE_NAME constant**:
   ```typescript
   const MODULE_NAME = 'NewService';
   ```

2. **Initialize logger**:
   ```typescript
   private readonly logger = new Logger(MODULE_NAME);
   ```

3. **Use standardized format**:
   ```typescript
   this.logger.log(`[${MODULE_NAME}] Message`);
   ```

## Verification

Check if a file follows the standard:

```bash
# Should find MODULE_NAME constant
grep "const MODULE_NAME" src/path/to/file.ts

# Should find standardized log calls
grep "\[${MODULE_NAME}\]" src/path/to/file.ts
```

## Migration Script

For bulk updates:

```bash
# Add MODULE_NAME to a file
sed -i '' '/^import.*$/a\
const MODULE_NAME = '"'ServiceName'"';
' file.ts

# Replace old format with new
sed -i '' 's/\[OldName\]/\[${MODULE_NAME}\]/g' file.ts
```

## Related Documentation

- [WINSTON_LOGGER.md](./WINSTON_LOGGER.md) - Winston logger configuration
- [CLICKHOUSE_LOGGING.md](./CLICKHOUSE_LOGGING.md) - ClickHouse log storage
- [OBSERVABILITY.md](./OBSERVABILITY.md) - Observability features

---

**Status**: ✅ Complete
**Modules Standardized**: 9+
**Last Updated**: 2025-12-03
